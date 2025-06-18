-- Notifications table for storing user notifications
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    data JSONB, -- Additional data for the notification
    action_url VARCHAR(500), -- URL to navigate when notification is clicked
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
-- Users can only see their own notifications (or global notifications where user_id is NULL)
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can only insert their own notifications
CREATE POLICY "Users can insert own notifications" ON notifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can only update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can only delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Create a function to automatically clean up old notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS VOID AS $$
BEGIN
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND is_read = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample notifications for testing
INSERT INTO notifications (type, title, message, priority, data) VALUES
('success', 'Welcome to Elith Pharmacy', 'Your pharmacy management system is ready to use!', 'normal', '{"welcome": true}'),
('info', 'System Update', 'New features have been added to improve your experience.', 'low', '{"version": "1.0.1"}'),
('warning', 'Low Stock Alert', 'Some products are running low on stock. Please reorder soon.', 'high', '{"products": ["Paracetamol", "Vitamin C"]}');

-- Create a function to create automatic low stock notifications
CREATE OR REPLACE FUNCTION create_low_stock_notification(product_name TEXT, current_stock INTEGER, min_stock INTEGER, product_id BIGINT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO notifications (type, title, message, priority, data, action_url)
    VALUES (
        'warning',
        'Low Stock Alert',
        format('%s is running low (%s left, minimum: %s)', product_name, current_stock, min_stock),
        CASE WHEN current_stock <= (min_stock * 0.5) THEN 'critical' ELSE 'high' END,
        json_build_object('productId', product_id, 'currentStock', current_stock, 'minStock', min_stock),
        format('/inventory/%s', product_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to create sale notifications
CREATE OR REPLACE FUNCTION create_sale_notification(transaction_number TEXT, total_amount DECIMAL, customer_name TEXT DEFAULT NULL, sale_id BIGINT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    customer_text TEXT;
BEGIN
    customer_text := COALESCE(customer_name, 'Walk-in Customer');
    
    INSERT INTO notifications (type, title, message, priority, data, action_url)
    VALUES (
        'success',
        'Sale Completed',
        format('Sale #%s completed for %s - ₦%s', transaction_number, customer_text, total_amount),
        'normal',
        json_build_object('saleId', sale_id, 'amount', total_amount, 'transactionNumber', transaction_number),
        CASE WHEN sale_id IS NOT NULL THEN format('/sales/%s', sale_id) ELSE '/sales' END
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to create expiry notifications
CREATE OR REPLACE FUNCTION create_expiry_notification(product_name TEXT, expiry_date DATE, product_id BIGINT)
RETURNS VOID AS $$
DECLARE
    days_until_expiry INTEGER;
    priority_level TEXT;
BEGIN
    days_until_expiry := expiry_date - CURRENT_DATE;
    
    priority_level := CASE 
        WHEN days_until_expiry <= 7 THEN 'critical'
        WHEN days_until_expiry <= 30 THEN 'high'
        ELSE 'normal'
    END;
    
    INSERT INTO notifications (type, title, message, priority, data, action_url)
    VALUES (
        'warning',
        'Product Expiry Alert',
        format('%s expires in %s days (%s)', product_name, days_until_expiry, expiry_date),
        priority_level,
        json_build_object('productId', product_id, 'expiryDate', expiry_date, 'daysUntilExpiry', days_until_expiry),
        format('/inventory/%s', product_id)
    );
END;
$$ LANGUAGE plpgsql;
