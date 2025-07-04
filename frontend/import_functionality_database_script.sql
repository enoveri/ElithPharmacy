-- Import Functionality Database Script
-- This script ensures the database is properly set up for the import functionality

-- Ensure categories table exists and is properly structured
DO $$
BEGIN
    -- Check if categories table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories') THEN
        CREATE TABLE categories (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
        
        -- Add unique constraint on name
        ALTER TABLE categories ADD CONSTRAINT categories_name_unique UNIQUE (name);
        
        -- Add index for performance
        CREATE INDEX idx_categories_name_lower ON categories (LOWER(name));
        CREATE INDEX idx_categories_status ON categories (status);
    END IF;
END
$$;

-- Ensure products table has all necessary columns for import
DO $$
BEGIN
    -- Add volume column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'volume'
    ) THEN
        ALTER TABLE products ADD COLUMN volume VARCHAR(100);
    END IF;
    
    -- Add manufacturer column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'manufacturer'
    ) THEN
        ALTER TABLE products ADD COLUMN manufacturer VARCHAR(255);
    END IF;
    
    -- Add batch_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'batch_number'
    ) THEN
        ALTER TABLE products ADD COLUMN batch_number VARCHAR(100);
    END IF;
    
    -- Add expiry_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'expiry_date'
    ) THEN
        ALTER TABLE products ADD COLUMN expiry_date DATE;
    END IF;
    
    -- Add last_restock_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'last_restock_date'
    ) THEN
        ALTER TABLE products ADD COLUMN last_restock_date TIMESTAMPTZ;
    END IF;
END
$$;

-- Add indexes for better performance during imports and searches
CREATE INDEX IF NOT EXISTS idx_products_name_lower ON products (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_products_category_lower ON products (LOWER(category));
CREATE INDEX IF NOT EXISTS idx_products_manufacturer_lower ON products (LOWER(manufacturer));
CREATE INDEX IF NOT EXISTS idx_products_batch_number ON products (batch_number);
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON products (expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_last_restock_date ON products (last_restock_date);

-- Ensure RLS policies exist for categories table
DO $$
BEGIN
    -- Enable RLS on categories if not already enabled
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE tablename = 'categories' AND rowsecurity = true
    ) THEN
        ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Create RLS policies for categories if they don't exist
DO $$
BEGIN
    -- Policy for authenticated users to read categories
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'categories' AND policyname = 'categories_select_policy'
    ) THEN
        CREATE POLICY categories_select_policy ON categories
            FOR SELECT TO authenticated USING (true);
    END IF;
    
    -- Policy for authenticated users to insert categories
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'categories' AND policyname = 'categories_insert_policy'
    ) THEN
        CREATE POLICY categories_insert_policy ON categories
            FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    
    -- Policy for authenticated users to update categories
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'categories' AND policyname = 'categories_update_policy'
    ) THEN
        CREATE POLICY categories_update_policy ON categories
            FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- Insert default categories if the table is empty
INSERT INTO categories (name, description, status)
SELECT * FROM (VALUES
    ('Pain Relief', 'Medications for pain management', 'active'),
    ('Antibiotics', 'Antibiotic medications', 'active'),
    ('Vitamins & Supplements', 'Vitamins and dietary supplements', 'active'),
    ('Digestive Health', 'Medications for digestive issues', 'active'),
    ('Cold & Flu', 'Medications for cold and flu symptoms', 'active'),
    ('Skincare', 'Topical treatments and skincare products', 'active'),
    ('Heart & Blood Pressure', 'Cardiovascular medications', 'active'),
    ('Diabetes Care', 'Medications and supplies for diabetes', 'active'),
    ('Eye Care', 'Eye drops and vision care products', 'active'),
    ('Respiratory', 'Medications for breathing and lung health', 'active'),
    ('Women\'s Health', 'Medications specific to women\'s health', 'active'),
    ('Men\'s Health', 'Medications specific to men\'s health', 'active'),
    ('General', 'General medications and supplies', 'active')
) AS default_categories(name, description, status)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- Create or update the updated_at trigger for categories
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS categories_updated_at_trigger ON categories;
CREATE TRIGGER categories_updated_at_trigger
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();

-- Create a function to handle product imports with better error handling
CREATE OR REPLACE FUNCTION import_product_with_category(
    p_name TEXT,
    p_category TEXT DEFAULT 'General',
    p_price NUMERIC DEFAULT 0,
    p_cost_price NUMERIC DEFAULT 0,
    p_quantity INTEGER DEFAULT 0,
    p_manufacturer TEXT DEFAULT '',
    p_volume TEXT DEFAULT '',
    p_batch_number TEXT DEFAULT '',
    p_expiry_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_product_id UUID;
    v_category_exists BOOLEAN;
    v_result JSON;
BEGIN
    -- Check if category exists, create if not
    SELECT EXISTS(SELECT 1 FROM categories WHERE LOWER(name) = LOWER(p_category)) INTO v_category_exists;
    
    IF NOT v_category_exists AND p_category IS NOT NULL AND p_category != '' THEN
        INSERT INTO categories (name, description, status)
        VALUES (p_category, 'Auto-created from import', 'active')
        ON CONFLICT (name) DO NOTHING;
    END IF;
    
    -- Check if product exists by name
    SELECT id INTO v_product_id
    FROM products
    WHERE LOWER(name) = LOWER(p_name);
    
    IF v_product_id IS NOT NULL THEN
        -- Update existing product
        UPDATE products SET
            quantity = COALESCE(quantity, 0) + COALESCE(p_quantity, 0),
            price = CASE WHEN p_price > 0 THEN p_price ELSE price END,
            cost_price = CASE WHEN p_cost_price > 0 THEN p_cost_price ELSE cost_price END,
            category = CASE WHEN p_category IS NOT NULL AND p_category != '' THEN p_category ELSE category END,
            manufacturer = CASE WHEN p_manufacturer IS NOT NULL AND p_manufacturer != '' THEN p_manufacturer ELSE manufacturer END,
            volume = CASE WHEN p_volume IS NOT NULL AND p_volume != '' THEN p_volume ELSE volume END,
            batch_number = CASE WHEN p_batch_number IS NOT NULL AND p_batch_number != '' THEN p_batch_number ELSE batch_number END,
            expiry_date = CASE WHEN p_expiry_date IS NOT NULL THEN p_expiry_date ELSE expiry_date END,
            last_restock_date = now(),
            updated_at = now()
        WHERE id = v_product_id;
        
        v_result := json_build_object(
            'action', 'updated',
            'product_id', v_product_id,
            'product_name', p_name
        );
    ELSE
        -- Create new product
        INSERT INTO products (
            name, category, price, cost_price, quantity,
            manufacturer, volume, batch_number, expiry_date,
            last_restock_date, created_at, updated_at
        )
        VALUES (
            p_name,
            COALESCE(p_category, 'General'),
            COALESCE(p_price, 0),
            COALESCE(p_cost_price, 0),
            COALESCE(p_quantity, 0),
            COALESCE(p_manufacturer, ''),
            COALESCE(p_volume, ''),
            COALESCE(p_batch_number, ''),
            p_expiry_date,
            now(),
            now(),
            now()
        )
        RETURNING id INTO v_product_id;
        
        v_result := json_build_object(
            'action', 'created',
            'product_id', v_product_id,
            'product_name', p_name
        );
    END IF;
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'action', 'error',
        'product_name', p_name,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON categories TO authenticated;
GRANT EXECUTE ON FUNCTION import_product_with_category TO authenticated;

COMMIT; 