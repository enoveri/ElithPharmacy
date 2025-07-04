-- ============================================
-- CATEGORIES TABLE SETUP FOR ELITH PHARMACY (FINAL FIX)
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

-- 2. Add unique constraint to name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'categories' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%name%'
    ) THEN
        -- First remove any duplicate names if they exist
        DELETE FROM categories a USING categories b 
        WHERE a.id > b.id AND a.name = b.name;
        
        -- Now add the unique constraint
        ALTER TABLE categories ADD CONSTRAINT categories_name_unique UNIQUE (name);
    END IF;
END $$;

-- 3. Add the check constraint for status (only if it doesn't already exist)
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

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);

-- 5. Enable Row Level Security (RLS) if not already enabled
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist and create new ones
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON categories;
DROP POLICY IF EXISTS "Users can view active categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can create categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON categories;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON categories;

-- Create a simple policy that allows all operations for authenticated users
CREATE POLICY "Enable all for authenticated users" ON categories
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Insert default pharmacy categories using safe INSERT method
DO $$
DECLARE
    category_data RECORD;
    categories_to_insert TEXT[][] := ARRAY[
        ['Pain Relief', 'Analgesics, painkillers, and anti-inflammatory medications'],
        ['Antibiotics', 'Antimicrobial medications for treating bacterial infections'],
        ['Vitamins & Supplements', 'Nutritional supplements, vitamins, and minerals'],
        ['Cold & Flu', 'Medications for treating cold, flu, and respiratory symptoms'],
        ['Digestive Health', 'Medications for stomach, digestion, and gastrointestinal issues'],
        ['Heart & Blood Pressure', 'Cardiovascular medications and blood pressure treatments'],
        ['Diabetes Care', 'Diabetes medications, insulin, and blood sugar management'],
        ['Skin Care', 'Topical treatments, creams, and dermatological products'],
        ['Eye Care', 'Ophthalmic solutions, eye drops, and vision care products'],
        ['Mental Health', 'Antidepressants, anxiety medications, and psychiatric drugs'],
        ['First Aid', 'Emergency medications, wound care, and first aid supplies'],
        ['Allergy & Asthma', 'Antihistamines, inhalers, and allergy treatments'],
        ['Other', 'Miscellaneous medications and healthcare products']
    ];
BEGIN
    FOR i IN 1..array_length(categories_to_insert, 1) LOOP
        -- Check if category already exists
        IF NOT EXISTS (SELECT 1 FROM categories WHERE name = categories_to_insert[i][1]) THEN
            INSERT INTO categories (name, description, status) 
            VALUES (categories_to_insert[i][1], categories_to_insert[i][2], 'active');
        ELSE
            -- Update description if category exists but description is null
            UPDATE categories 
            SET description = categories_to_insert[i][2],
                status = COALESCE(status, 'active')
            WHERE name = categories_to_insert[i][1] AND description IS NULL;
        END IF;
    END LOOP;
END $$;

-- 8. Grant permissions to authenticated users
GRANT ALL ON categories TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 9. Verify setup
SELECT 'Categories table setup completed successfully!' as message;
SELECT COUNT(*) as total_categories FROM categories;
SELECT name, COALESCE(status, 'active') as status FROM categories ORDER BY name; 