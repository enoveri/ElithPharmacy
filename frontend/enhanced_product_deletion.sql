-- Enhanced Product Deletion System with Cascade and Archive Support
-- Execute these scripts in your Supabase SQL Editor

-- =================================================================
-- 1. SCHEMA ENHANCEMENTS
-- =================================================================

-- Add archive support columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'discontinued')),
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_reason TEXT;

-- Add archive support columns to sales table  
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded', 'archived')),
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_reason TEXT;

-- Add archive support columns to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'inactive')),
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_reason TEXT;

-- Create index for performance on status fields
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status) WHERE status IN ('completed', 'pending');
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status) WHERE status = 'active';

-- =================================================================
-- 2. CASCADE DELETE FUNCTIONS
-- =================================================================

-- Function to get product dependencies
CREATE OR REPLACE FUNCTION get_product_dependencies(product_id_param INTEGER)
RETURNS JSON AS $$
DECLARE
    result JSON;
    sale_items_count INTEGER;
    sales_count INTEGER;
    purchase_items_count INTEGER;
    recent_sales_count INTEGER;
    total_quantity_sold INTEGER;
    total_revenue DECIMAL(10,2);
BEGIN
    -- Get sale items count
    SELECT COUNT(*) INTO sale_items_count
    FROM sale_items 
    WHERE product_id = product_id_param;
    
    -- Get unique sales count
    SELECT COUNT(DISTINCT sale_id) INTO sales_count
    FROM sale_items 
    WHERE product_id = product_id_param;
    
    -- Get purchase items count (if table exists)
    SELECT COUNT(*) INTO purchase_items_count
    FROM purchase_items 
    WHERE product_id = product_id_param;
    
    -- Get recent sales (last 30 days)
    SELECT COUNT(DISTINCT s.id) INTO recent_sales_count
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    WHERE si.product_id = product_id_param
    AND s.created_at >= NOW() - INTERVAL '30 days';
    
    -- Get total quantity sold
    SELECT COALESCE(SUM(quantity), 0) INTO total_quantity_sold
    FROM sale_items
    WHERE product_id = product_id_param;
    
    -- Get total revenue from this product
    SELECT COALESCE(SUM(si.quantity * si.price), 0) INTO total_revenue
    FROM sale_items si
    WHERE si.product_id = product_id_param;
    
    -- Build result JSON
    result := json_build_object(
        'product_id', product_id_param,
        'sale_items_count', sale_items_count,
        'sales_count', sales_count,
        'purchase_items_count', purchase_items_count,
        'recent_sales_count', recent_sales_count,
        'total_quantity_sold', total_quantity_sold,
        'total_revenue', total_revenue,
        'has_dependencies', (sale_items_count > 0 OR purchase_items_count > 0)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to cascade delete product with related data
CREATE OR REPLACE FUNCTION cascade_delete_product(product_id_param INTEGER)
RETURNS JSON AS $$
DECLARE
    product_record products%ROWTYPE;
    affected_sales INTEGER;
    affected_sale_items INTEGER;
    result JSON;
BEGIN
    -- Get product details
    SELECT * INTO product_record FROM products WHERE id = product_id_param;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Product not found');
    END IF;
    
    -- Count affected records before deletion
    SELECT COUNT(DISTINCT sale_id) INTO affected_sales
    FROM sale_items WHERE product_id = product_id_param;
    
    SELECT COUNT(*) INTO affected_sale_items
    FROM sale_items WHERE product_id = product_id_param;
    
    -- Delete sale items for this product
    DELETE FROM sale_items WHERE product_id = product_id_param;
    
    -- Delete orphaned sales (sales with no remaining items)
    DELETE FROM sales s 
    WHERE NOT EXISTS (
        SELECT 1 FROM sale_items si WHERE si.sale_id = s.id
    );
    
    -- Delete the product
    DELETE FROM products WHERE id = product_id_param;
    
    -- Build result
    result := json_build_object(
        'success', true,
        'deleted_product', row_to_json(product_record),
        'affected_sales', affected_sales,
        'affected_sale_items', affected_sale_items
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to archive product with related data
CREATE OR REPLACE FUNCTION archive_product_cascade(
    product_id_param INTEGER,
    archive_reason_param TEXT DEFAULT 'Manual archive',
    archive_related_sales BOOLEAN DEFAULT true
)
RETURNS JSON AS $$
DECLARE
    product_record products%ROWTYPE;
    affected_sales INTEGER := 0;
    result JSON;
BEGIN
    -- Get product details
    SELECT * INTO product_record FROM products WHERE id = product_id_param;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Product not found');
    END IF;
    
    -- Archive the product
    UPDATE products 
    SET status = 'archived',
        archived_at = NOW(),
        archived_reason = archive_reason_param
    WHERE id = product_id_param;
    
    -- Archive related sales if requested
    IF archive_related_sales THEN
        UPDATE sales 
        SET status = 'archived',
            archived_at = NOW(),
            archived_reason = 'Product ' || product_id_param || ' archived'
        WHERE id IN (
            SELECT DISTINCT sale_id 
            FROM sale_items 
            WHERE product_id = product_id_param
        );
        
        GET DIAGNOSTICS affected_sales = ROW_COUNT;
    END IF;
    
    -- Build result
    result := json_build_object(
        'success', true,
        'archived_product', row_to_json(product_record),
        'affected_sales', affected_sales
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- 3. BULK OPERATIONS FUNCTIONS
-- =================================================================

-- Function for bulk product operations
CREATE OR REPLACE FUNCTION bulk_product_operation(
    product_ids INTEGER[],
    operation_type VARCHAR(20), -- 'delete' or 'archive'
    archive_reason_param TEXT DEFAULT 'Bulk operation',
    archive_related_sales BOOLEAN DEFAULT true
)
RETURNS JSON AS $$
DECLARE
    product_id INTEGER;
    operation_result JSON;
    successful_ops JSON[] := '{}';
    failed_ops JSON[] := '{}';
    total_processed INTEGER := 0;
    successful_count INTEGER := 0;
    failed_count INTEGER := 0;
BEGIN
    -- Process each product
    FOREACH product_id IN ARRAY product_ids
    LOOP
        total_processed := total_processed + 1;
        
        BEGIN
            IF operation_type = 'archive' THEN
                operation_result := archive_product_cascade(
                    product_id, 
                    archive_reason_param, 
                    archive_related_sales
                );
            ELSIF operation_type = 'delete' THEN
                operation_result := cascade_delete_product(product_id);
            ELSE
                operation_result := json_build_object('success', false, 'error', 'Invalid operation type');
            END IF;
            
            IF (operation_result->>'success')::boolean THEN
                successful_ops := successful_ops || json_build_object(
                    'product_id', product_id,
                    'operation', operation_type,
                    'result', operation_result
                );
                successful_count := successful_count + 1;
            ELSE
                failed_ops := failed_ops || json_build_object(
                    'product_id', product_id,
                    'operation', operation_type,
                    'error', operation_result->>'error'
                );
                failed_count := failed_count + 1;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            failed_ops := failed_ops || json_build_object(
                'product_id', product_id,
                'operation', operation_type,
                'error', SQLERRM
            );
            failed_count := failed_count + 1;
        END;
    END LOOP;
    
    -- Return summary
    RETURN json_build_object(
        'success', (failed_count = 0),
        'total_processed', total_processed,
        'successful_count', successful_count,
        'failed_count', failed_count,
        'successful_operations', array_to_json(successful_ops),
        'failed_operations', array_to_json(failed_ops)
    );
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- 4. TRIGGERS FOR AUDIT LOGGING
-- =================================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS product_deletion_audit (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    product_name VARCHAR(255),
    operation_type VARCHAR(20), -- 'delete', 'archive', 'restore'
    operation_reason TEXT,
    affected_sales INTEGER DEFAULT 0,
    affected_sale_items INTEGER DEFAULT 0,
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    operation_data JSON
);

-- Function to log product operations
CREATE OR REPLACE FUNCTION log_product_operation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO product_deletion_audit (
            product_id, product_name, operation_type, 
            operation_reason, performed_by, operation_data
        ) VALUES (
            OLD.id, OLD.name, 'delete', 
            'Cascade delete', auth.uid(), row_to_json(OLD)
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'archived' AND OLD.status != 'archived' THEN
            INSERT INTO product_deletion_audit (
                product_id, product_name, operation_type,
                operation_reason, performed_by, operation_data
            ) VALUES (
                NEW.id, NEW.name, 'archive',
                NEW.archived_reason, auth.uid(), 
                json_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
            );
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS product_operation_audit ON products;
CREATE TRIGGER product_operation_audit
    AFTER UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION log_product_operation();

-- =================================================================
-- 5. ROW LEVEL SECURITY UPDATES
-- =================================================================

-- Update RLS policies to exclude archived items from normal queries
-- (Only if you want archived items hidden by default)

-- Products: Hide archived products in normal queries
DROP POLICY IF EXISTS "Users can view active products" ON products;
CREATE POLICY "Users can view active products" ON products
    FOR SELECT USING (
        status != 'archived' OR 
        auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE '%admin%')
    );

-- Allow admins to see all products including archived
DROP POLICY IF EXISTS "Admins can view all products" ON products;
CREATE POLICY "Admins can view all products" ON products
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE '%admin%')
    );

-- =================================================================
-- 6. HELPER VIEWS
-- =================================================================

-- View for active products only
CREATE OR REPLACE VIEW active_products AS
SELECT * FROM products 
WHERE status = 'active' OR status IS NULL;

-- View for archived products
CREATE OR REPLACE VIEW archived_products AS
SELECT * FROM products 
WHERE status = 'archived';

-- View for product deletion audit with user details
CREATE OR REPLACE VIEW product_deletion_audit_view AS
SELECT 
    pda.*,
    au.email as performed_by_email,
    au.raw_user_meta_data->>'first_name' as performer_first_name,
    au.raw_user_meta_data->>'last_name' as performer_last_name
FROM product_deletion_audit pda
LEFT JOIN auth.users au ON pda.performed_by = au.id
ORDER BY pda.performed_at DESC;

-- =================================================================
-- 7. CLEANUP AND MAINTENANCE FUNCTIONS  
-- =================================================================

-- Function to restore archived product
CREATE OR REPLACE FUNCTION restore_archived_product(product_id_param INTEGER)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    UPDATE products 
    SET status = 'active',
        archived_at = NULL,
        archived_reason = NULL
    WHERE id = product_id_param AND status = 'archived';
    
    IF FOUND THEN
        -- Log the restore operation
        INSERT INTO product_deletion_audit (
            product_id, operation_type, operation_reason, 
            performed_by
        ) VALUES (
            product_id_param, 'restore', 'Manual restore',
            auth.uid()
        );
        
        result := json_build_object('success', true, 'message', 'Product restored successfully');
    ELSE
        result := json_build_object('success', false, 'error', 'Product not found or not archived');
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to permanently delete old archived products
CREATE OR REPLACE FUNCTION cleanup_old_archived_products(days_old INTEGER DEFAULT 365)
RETURNS JSON AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM products 
    WHERE status = 'archived' 
    AND archived_at < NOW() - (days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'deleted_count', deleted_count,
        'message', 'Cleanup completed successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- 8. EXAMPLE USAGE
-- =================================================================

/*
-- Get product dependencies before deletion
SELECT get_product_dependencies(1);

-- Archive a product with related sales
SELECT archive_product_cascade(1, 'Product discontinued', true);

-- Delete a product with cascade
SELECT cascade_delete_product(1);

-- Bulk archive multiple products
SELECT bulk_product_operation(
    ARRAY[1,2,3], 
    'archive', 
    'Bulk archive operation',
    true
);

-- Restore an archived product
SELECT restore_archived_product(1);

-- View deletion audit log
SELECT * FROM product_deletion_audit_view LIMIT 10;

-- Cleanup old archived products (older than 1 year)
SELECT cleanup_old_archived_products(365);
*/

-- =================================================================
-- GRANTS AND PERMISSIONS
-- =================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_product_dependencies(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cascade_delete_product(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_product_cascade(INTEGER, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_product_operation(INTEGER[], VARCHAR(20), TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_archived_product(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_archived_products(INTEGER) TO authenticated;

-- Grant access to audit tables (read-only for most users)
GRANT SELECT ON product_deletion_audit TO authenticated;
GRANT SELECT ON product_deletion_audit_view TO authenticated;
GRANT SELECT ON active_products TO authenticated;
GRANT SELECT ON archived_products TO authenticated; 