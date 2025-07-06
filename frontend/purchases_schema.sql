-- Purchase Management Schema
-- This schema adds support for purchase tracking and stock receipts

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    contact VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    purchase_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_contact VARCHAR(255),
    supplier_email VARCHAR(255),
    supplier_phone VARCHAR(50),
    order_date DATE NOT NULL,
    delivery_date DATE,
    expected_delivery DATE,
    actual_delivery DATE,
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10,2) DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    notes TEXT,
    type VARCHAR(50) DEFAULT 'purchase',
    is_stock_receipt BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase items table
CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity_ordered INTEGER NOT NULL DEFAULT 0,
    quantity_received INTEGER NOT NULL DEFAULT 0,
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    batch_number VARCHAR(100),
    expiry_date DATE,
    manufacturer VARCHAR(255),
    volume VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_number ON purchases(purchase_number);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_name ON purchases(supplier_name);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_order_date ON purchases(order_date);
CREATE INDEX IF NOT EXISTS idx_purchases_is_stock_receipt ON purchases(is_stock_receipt);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- Add comments for documentation
COMMENT ON TABLE suppliers IS 'Suppliers/vendors for purchasing products';
COMMENT ON TABLE purchases IS 'Purchase orders and stock receipts';
COMMENT ON TABLE purchase_items IS 'Individual items in each purchase order';

COMMENT ON COLUMN purchases.type IS 'Type of purchase: purchase, stock_receipt, etc.';
COMMENT ON COLUMN purchases.is_stock_receipt IS 'Flag to identify stock receipts vs regular purchase orders';
COMMENT ON COLUMN purchases.status IS 'Status: pending, ordered, delivered, cancelled';

-- Enable Row Level Security (RLS) if needed
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (adjust based on your auth setup)
CREATE POLICY "Suppliers are viewable by authenticated users" ON suppliers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Suppliers are editable by authenticated users" ON suppliers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Purchases are viewable by authenticated users" ON purchases
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Purchases are editable by authenticated users" ON purchases
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Purchase items are viewable by authenticated users" ON purchase_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Purchase items are editable by authenticated users" ON purchase_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Sample data for testing (optional)
INSERT INTO suppliers (name, contact, email, phone, address) VALUES
    ('ABC Pharmaceuticals', 'John Smith', 'john@abcpharma.com', '+1234567890', '123 Medical Street, City'),
    ('Generic Labs Ltd', 'Jane Doe', 'jane@genericlabs.com', '+1234567891', '456 Science Ave, City'),
    ('MedSupply Corp', 'Bob Johnson', 'bob@medsupply.com', '+1234567892', '789 Health Blvd, City')
ON CONFLICT (name) DO NOTHING;

-- Success message
SELECT 'Purchase management schema created successfully!' as message; 