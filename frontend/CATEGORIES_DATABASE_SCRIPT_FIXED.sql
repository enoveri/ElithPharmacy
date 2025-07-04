-- ============================================
-- CATEGORIES TABLE SETUP FOR ELITH PHARMACY (FIXED)
-- ============================================
-- Copy and paste this entire script into your Supabase SQL Editor

-- 1. First, let's check what exists and create/modify the table properly
DO $$
BEGIN
    -- Check if categories table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories') THEN
        -- Table exists, let's add missing columns if they don't exist
        
        -- Add status column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'status') THEN
            ALTER TABLE categories ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        END IF;
        
        -- Add description column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'description') THEN
            ALTER TABLE categories ADD COLUMN description TEXT;
        END IF;
        
        -- Add created_at column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'created_at') THEN
            ALTER TABLE categories ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        -- Add updated_at column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'updated_at') THEN
            ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
    ELSE
        -- Table doesn't exist, create it
        CREATE TABLE categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 2. Now add the check constraint for status (only if it doesn't already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'categories' AND constraint_name = 'categories_status_check'
    ) THEN
        ALTER TABLE categories ADD CONSTRAINT categories_status_check 
        CHECK (status IN ('active', 'inactive', 'archived'));
    END IF;
END $$;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);

-- 4. Enable Row Level Security (RLS) if not already enabled
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist and create new ones
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON categories;
DROP POLICY IF EXISTS "Users can view active categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can create categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON categories;

-- Create a simple policy that allows all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON categories
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Insert default pharmacy categories (will skip if they already exist)
INSERT INTO categories (name, description, status) VALUES
    ('Pain Relief', 'Analgesics, painkillers, and anti-inflammatory medications', 'active'),
    ('Antibiotics', 'Antimicrobial medications for treating bacterial infections', 'active'),
    ('Vitamins & Supplements', 'Nutritional supplements, vitamins, and minerals', 'active'),
    ('Cold & Flu', 'Medications for treating cold, flu, and respiratory symptoms', 'active'),
    ('Digestive Health', 'Medications for stomach, digestion, and gastrointestinal issues', 'active'),
    ('Heart & Blood Pressure', 'Cardiovascular medications and blood pressure treatments', 'active'),
    ('Diabetes Care', 'Diabetes medications, insulin, and blood sugar management', 'active'),
    ('Skin Care', 'Topical treatments, creams, and dermatological products', 'active'),
    ('Eye Care', 'Ophthalmic solutions, eye drops, and vision care products', 'active'),
    ('Mental Health', 'Antidepressants, anxiety medications, and psychiatric drugs', 'active'),
    ('First Aid', 'Emergency medications, wound care, and first aid supplies', 'active'),
    ('Allergy & Asthma', 'Antihistamines, inhalers, and allergy treatments', 'active'),
    ('Other', 'Miscellaneous medications and healthcare products', 'active')
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    status = COALESCE(EXCLUDED.status, categories.status);

-- 7. Grant permissions to authenticated users
GRANT ALL ON categories TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. Verify setup
SELECT 'Categories table setup completed successfully!' as message;
SELECT COUNT(*) as total_categories FROM categories;
SELECT name, status FROM categories ORDER BY name; 