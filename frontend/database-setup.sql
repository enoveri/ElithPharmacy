-- Elith Pharmacy Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) REFERENCES categories(name) ON UPDATE CASCADE,
    manufacturer VARCHAR(255),
    batch_number VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
    selling_price DECIMAL(10,2) CHECK (selling_price >= 0),
    min_stock_level INTEGER DEFAULT 10 CHECK (min_stock_level >= 0),
    max_stock_level INTEGER CHECK (max_stock_level >= min_stock_level),
    expiry_date DATE,
    barcode VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    medical_conditions TEXT,
    allergies TEXT,
    insurance_info TEXT,
    total_purchases DECIMAL(12,2) DEFAULT 0 CHECK (total_purchases >= 0),
    loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile', 'insurance', 'credit')),
    paid_by VARCHAR(100),
    discount DECIMAL(10,2) DEFAULT 0 CHECK (discount >= 0),
    tax DECIMAL(10,2) DEFAULT 0 CHECK (tax >= 0),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    notes TEXT,
    receipt_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),
    discount DECIMAL(10,2) DEFAULT 0 CHECK (discount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_contact VARCHAR(255),
    invoice_number VARCHAR(100),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
    delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_items table
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0),
    total_cost DECIMAL(12,2) NOT NULL CHECK (total_cost >= 0),
    expiry_date DATE,
    batch_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    action_url VARCHAR(500),
    user_id UUID, -- For user-specific notifications
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create refunds table
CREATE TABLE IF NOT EXISTS refunds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    refund_amount DECIMAL(12,2) NOT NULL CHECK (refund_amount >= 0),
    reason VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    processed_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create refund_items table
CREATE TABLE IF NOT EXISTS refund_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    refund_id UUID NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,
    sale_item_id UUID REFERENCES sale_items(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_refunds_sale_id ON refunds(sale_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, description) 
VALUES 
    ('Antibiotics', 'Antibiotic medications'),
    ('Pain Relief', 'Pain management medications'),
    ('Cold & Flu', 'Cold and flu treatments'),
    ('Vitamins', 'Vitamin supplements'),
    ('First Aid', 'First aid supplies'),
    ('Prescription', 'Prescription medications'),
    ('Over-the-Counter', 'Over-the-counter medications'),
    ('Personal Care', 'Personal care products'),
    ('Medical Devices', 'Medical devices and equipment')
ON CONFLICT (name) DO NOTHING;

-- Sample data (optional - remove in production)
INSERT INTO products (name, category, manufacturer, quantity, price, cost_price, selling_price, min_stock_level, expiry_date)
VALUES 
    ('Amoxicillin 250mg', 'Antibiotics', 'MediPharm', 1, 45.00, 35.00, 45.00, 5, '2026-12-31'),
    ('Paracetamol 500mg', 'Pain Relief', 'PharmaCorp', 25, 15.00, 10.00, 15.00, 10, '2025-08-15'),
    ('Cough Syrup 100ml', 'Cold & Flu', 'CureMed', 0, 28.00, 20.00, 28.00, 5, '2025-10-20'),
    ('Vitamin C 1000mg', 'Vitamins', 'HealthPlus', 30, 32.00, 25.00, 32.00, 15, '2026-06-30'),
    ('Ibuprofen 400mg', 'Pain Relief', 'MediPharm', 8, 22.00, 18.00, 22.00, 10, '2025-09-15'),
    ('Bandages Pack', 'First Aid', 'MedSupply', 12, 18.00, 12.00, 18.00, 5, NULL),
    ('Antiseptic Cream', 'First Aid', 'CureMed', 6, 25.00, 20.00, 25.00, 3, '2025-12-31'),
    ('Multivitamin Tablets', 'Vitamins', 'HealthPlus', 20, 45.00, 35.00, 45.00, 8, '2026-03-15'),
    ('Aspirin 75mg', 'Pain Relief', 'PharmaCorp', 15, 12.00, 8.00, 12.00, 10, '2025-11-30')
ON CONFLICT DO NOTHING;

-- Create a view for low stock products
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
    id,
    name,
    category,
    quantity,
    min_stock_level,
    (min_stock_level - quantity) as shortage,
    CASE 
        WHEN quantity = 0 THEN 'Out of Stock'
        WHEN quantity <= min_stock_level THEN 'Low Stock'
        ELSE 'In Stock'
    END as stock_status
FROM products
WHERE quantity <= min_stock_level
ORDER BY quantity ASC, min_stock_level DESC;

-- Create a view for expiring products
CREATE OR REPLACE VIEW expiring_products AS
SELECT 
    id,
    name,
    category,
    quantity,
    expiry_date,
    (expiry_date - CURRENT_DATE) as days_to_expiry
FROM products
WHERE expiry_date IS NOT NULL 
    AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    AND quantity > 0
ORDER BY expiry_date ASC;

-- Create a function to automatically create low stock notifications
CREATE OR REPLACE FUNCTION check_and_create_stock_notifications()
RETURNS void AS $$
BEGIN
    -- Create notifications for out of stock products
    INSERT INTO notifications (type, title, message, priority, data, action_url)
    SELECT 
        'error' as type,
        'Out of Stock Alert' as title,
        name || ' is completely out of stock!' as message,
        'high' as priority,
        json_build_object('productId', id, 'currentStock', quantity) as data,
        '/inventory/' || id as action_url
    FROM products 
    WHERE quantity = 0 
        AND status = 'active'
        AND NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE type = 'error' 
                AND title = 'Out of Stock Alert'
                AND message LIKE '%' || products.name || '%'
                AND created_at > NOW() - INTERVAL '24 hours'
        );

    -- Create notifications for low stock products
    INSERT INTO notifications (type, title, message, priority, data, action_url)
    SELECT 
        'warning' as type,
        'Low Stock Alert' as title,
        name || ' is running low (' || quantity || ' left, minimum: ' || min_stock_level || ')' as message,
        'high' as priority,
        json_build_object('productId', id, 'currentStock', quantity, 'minStock', min_stock_level) as data,
        '/inventory/' || id as action_url
    FROM products 
    WHERE quantity > 0 
        AND quantity <= min_stock_level 
        AND status = 'active'
        AND NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE type = 'warning' 
                AND title = 'Low Stock Alert'
                AND message LIKE '%' || products.name || '%'
                AND created_at > NOW() - INTERVAL '24 hours'
        );

    -- Create notifications for expiring products
    INSERT INTO notifications (type, title, message, priority, data, action_url)
    SELECT 
        'warning' as type,
        'Product Expiring Soon' as title,
        name || ' expires in ' || (expiry_date - CURRENT_DATE) || ' days (' || TO_CHAR(expiry_date, 'DD/MM/YYYY') || ')' as message,
        'medium' as priority,
        json_build_object('productId', id, 'expiryDate', expiry_date, 'daysToExpiry', (expiry_date - CURRENT_DATE)) as data,
        '/inventory/' || id as action_url
    FROM products 
    WHERE expiry_date IS NOT NULL 
        AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        AND expiry_date > CURRENT_DATE
        AND quantity > 0
        AND status = 'active'
        AND NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE type = 'warning' 
                AND title = 'Product Expiring Soon'
                AND message LIKE '%' || products.name || '%'
                AND created_at > NOW() - INTERVAL '7 days'
        );
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (optional - uncomment if needed)
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed for your authentication setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
SELECT 'Database setup completed successfully! All tables, indexes, and sample data have been created.' as message;
