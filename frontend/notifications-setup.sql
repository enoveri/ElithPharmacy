-- Elith Pharmacy Notification System - Production Database Setup
-- Run this SQL in your Supabase SQL Editor for production deployment

-- =====================================
-- NOTIFICATION TABLE ENHANCEMENTS
-- =====================================

-- Add any missing columns to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS action_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Users can view own and system notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- Policy 1: Users can view their own notifications and system-wide notifications
CREATE POLICY "Users can view own and system notifications" 
ON public.notifications 
FOR SELECT 
USING (
  user_id IS NULL OR  -- System-wide notifications
  user_id = auth.uid() -- User's own notifications
);

-- Policy 2: Authenticated users can insert notifications
CREATE POLICY "Authenticated users can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND
  (user_id IS NULL OR user_id = auth.uid())
);

-- Policy 3: Users can update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update own notifications" 
ON public.notifications 
FOR UPDATE 
USING (
  user_id IS NULL OR  -- System notifications can be updated by any authenticated user
  user_id = auth.uid()  -- Users can update their own notifications
)
WITH CHECK (
  user_id IS NULL OR
  user_id = auth.uid()
);

-- Policy 4: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" 
ON public.notifications 
FOR DELETE 
USING (
  user_id IS NULL OR  -- System notifications can be deleted by any authenticated user
  user_id = auth.uid()  -- Users can delete their own notifications
);

-- =====================================
-- NOTIFICATION FUNCTIONS
-- =====================================

-- Enhanced function to create stock notifications with user awareness
CREATE OR REPLACE FUNCTION create_stock_notification_for_users()
RETURNS void AS $$
DECLARE
    notification_data RECORD;
    user_record RECORD;
BEGIN
    -- Create notifications for out of stock products
    FOR notification_data IN
        SELECT 
            id,
            name,
            quantity,
            min_stock_level
        FROM products 
        WHERE quantity = 0 
            AND status = 'active'
            AND NOT EXISTS (                SELECT 1 FROM notifications 
                WHERE type = 'error' 
                    AND title = 'Out of Stock Alert'
                    AND data->>'productId' = products.id::text
                    AND created_at > NOW() - INTERVAL '24 hours'
            )
    LOOP
        -- Create notification for each admin user or as system notification
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            priority,
            data,
            action_url
        ) VALUES (
            NULL, -- System-wide notification
            'error',
            'Out of Stock Alert',
            notification_data.name || ' is completely out of stock!',
            'high',
            json_build_object(
                'productId', notification_data.id, 
                'currentStock', notification_data.quantity,
                'productName', notification_data.name
            ),
            '/inventory/view/' || notification_data.id
        );
    END LOOP;

    -- Create notifications for low stock products
    FOR notification_data IN
        SELECT 
            id,
            name,
            quantity,
            min_stock_level
        FROM products 
        WHERE quantity > 0 
            AND quantity <= min_stock_level 
            AND status = 'active'
            AND NOT EXISTS (                SELECT 1 FROM notifications 
                WHERE type = 'warning' 
                    AND title = 'Low Stock Alert'
                    AND data->>'productId' = products.id::text
                    AND created_at > NOW() - INTERVAL '24 hours'
            )
    LOOP
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            priority,
            data,
            action_url
        ) VALUES (
            NULL, -- System-wide notification
            'warning',
            'Low Stock Alert',
            notification_data.name || ' is running low (' || notification_data.quantity || ' left, minimum: ' || notification_data.min_stock_level || ')',
            'high',
            json_build_object(
                'productId', notification_data.id, 
                'currentStock', notification_data.quantity,
                'minStock', notification_data.min_stock_level,
                'productName', notification_data.name
            ),
            '/inventory/view/' || notification_data.id
        );
    END LOOP;

    -- Create notifications for expiring products
    FOR notification_data IN
        SELECT 
            id,
            name,
            expiry_date,
            quantity,
            (expiry_date - CURRENT_DATE) as days_to_expiry
        FROM products 
        WHERE expiry_date IS NOT NULL 
            AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
            AND expiry_date > CURRENT_DATE
            AND quantity > 0
            AND status = 'active'
            AND NOT EXISTS (                SELECT 1 FROM notifications 
                WHERE type = 'warning' 
                    AND title = 'Product Expiring Soon'
                    AND data->>'productId' = products.id::text
                    AND created_at > NOW() - INTERVAL '7 days'
            )
    LOOP
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            priority,
            data,
            action_url
        ) VALUES (
            NULL, -- System-wide notification
            'warning',
            'Product Expiring Soon',
            notification_data.name || ' expires in ' || notification_data.days_to_expiry || ' days (' || TO_CHAR(notification_data.expiry_date, 'DD/MM/YYYY') || ')',
            'medium',
            json_build_object(
                'productId', notification_data.id, 
                'expiryDate', notification_data.expiry_date,
                'daysToExpiry', notification_data.days_to_expiry,
                'productName', notification_data.name
            ),
            '/inventory/view/' || notification_data.id
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the old function with the new enhanced one
DROP FUNCTION IF EXISTS check_and_create_stock_notifications();
CREATE OR REPLACE FUNCTION check_and_create_stock_notifications()
RETURNS void AS $$
BEGIN
    PERFORM create_stock_notification_for_users();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- AUTOMATIC NOTIFICATION TRIGGERS
-- =====================================

-- Function to automatically create sale notifications
CREATE OR REPLACE FUNCTION create_sale_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for high-value sales
    IF NEW.total_amount >= 1000 THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            priority,
            data,
            action_url
        ) VALUES (
            NULL,
            'info',
            'High Value Sale',
            'High value sale completed: $' || NEW.total_amount::text || ' for customer ' || COALESCE(NEW.customer_name, 'Walk-in'),
            'medium',
            json_build_object(
                'saleId', NEW.id,
                'amount', NEW.total_amount,
                'customerName', NEW.customer_name
            ),
            '/sales/view/' || NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sale notifications
DROP TRIGGER IF EXISTS trigger_sale_notification ON sales;
CREATE TRIGGER trigger_sale_notification
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION create_sale_notification();

-- Function to automatically create product update notifications
CREATE OR REPLACE FUNCTION create_product_update_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if stock level changed significantly
    IF OLD.quantity != NEW.quantity THEN
        -- If stock went from above minimum to below minimum
        IF OLD.quantity > OLD.min_stock_level AND NEW.quantity <= NEW.min_stock_level THEN
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                priority,
                data,
                action_url
            ) VALUES (
                NULL,
                'warning',
                'Stock Level Critical',
                NEW.name || ' stock level dropped to ' || NEW.quantity || ' (minimum: ' || NEW.min_stock_level || ')',
                'high',
                json_build_object(
                    'productId', NEW.id,
                    'oldQuantity', OLD.quantity,
                    'newQuantity', NEW.quantity,
                    'minStock', NEW.min_stock_level,
                    'productName', NEW.name
                ),
                '/inventory/view/' || NEW.id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product update notifications
DROP TRIGGER IF EXISTS trigger_product_update_notification ON products;
CREATE TRIGGER trigger_product_update_notification
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION create_product_update_notification();

-- =====================================
-- NOTIFICATION CLEANUP
-- =====================================

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM notifications 
        WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
        AND is_read = true  -- Only delete read notifications
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- SCHEDULED OPERATIONS
-- =====================================

-- Create a function for periodic notification maintenance
CREATE OR REPLACE FUNCTION run_notification_maintenance()
RETURNS void AS $$
BEGIN
    -- Run stock checks
    PERFORM check_and_create_stock_notifications();
    
    -- Clean up old notifications (older than 30 days and read)
    PERFORM cleanup_old_notifications(30);
    
    -- Log maintenance run
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        priority,
        expires_at
    ) VALUES (
        NULL,
        'info',
        'System Maintenance',
        'Notification system maintenance completed at ' || NOW()::text,
        'low',
        NOW() + INTERVAL '1 hour'  -- Auto-expire after 1 hour
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- USER MANAGEMENT INTEGRATION
-- =====================================

-- Function to create welcome notification for new users
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        priority,
        data
    ) VALUES (
        NEW.id,
        'success',
        'Welcome to Elith Pharmacy',
        'Welcome! Your account has been set up successfully. Explore the dashboard to get started.',
        'low',
        json_build_object(
            'isWelcome', true,
            'userEmail', NEW.email
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for welcome notifications (if auth.users table exists)
-- Note: Uncomment the following lines if you want welcome notifications
-- DROP TRIGGER IF EXISTS trigger_welcome_notification ON auth.users;
-- CREATE TRIGGER trigger_welcome_notification
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION create_welcome_notification();

-- =====================================
-- GRANTS AND PERMISSIONS
-- =====================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_create_stock_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION run_notification_maintenance() TO authenticated;

-- =====================================
-- SUCCESS MESSAGE
-- =====================================

-- Create a success notification to confirm setup
INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    priority,
    data
) VALUES (
    NULL,
    'success',
    'Notification System Setup Complete',
    'The comprehensive notification system has been successfully configured with RLS policies, automated triggers, and maintenance procedures.',
    'medium',
    json_build_object(
        'setupComplete', true,
        'timestamp', NOW(),
        'features', ARRAY[
            'Row Level Security enabled',
            'Automated stock notifications',
            'Sale notification triggers', 
            'Product update alerts',
            'Automatic cleanup',
            'User-specific notifications'
        ]
    )
);

SELECT 'Notification system setup completed successfully! 🎉' as message;
