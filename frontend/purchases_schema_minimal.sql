-- Purchase Management Schema (Minimal Version)
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

-- Success message
SELECT 'Purchase management schema created successfully!' as message; 