-- ============================================
-- SIMPLE CATEGORIES TABLE SETUP - NO ON CONFLICT
-- ============================================
-- Copy and paste this entire script into your Supabase SQL Editor

-- 1. Add missing columns to existing categories table (safe approach)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create basic indexes
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);

-- 3. Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 4. Drop any existing policies and create a simple one
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON categories;
DROP POLICY IF EXISTS "Users can view active categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can create categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON categories;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON categories;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON categories;

CREATE POLICY "categories_policy" ON categories FOR ALL USING (auth.role() = 'authenticated');

-- 5. Insert categories one by one (checking existence first)
INSERT INTO categories (name, description, status) 
SELECT 'Pain Relief', 'Analgesics, painkillers, and anti-inflammatory medications', 'active'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pain Relief');

INSERT INTO categories (name, description, status) 
SELECT 'Antibiotics', 'Antimicrobial medications for treating bacterial infections', 'active'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Antibiotics');

INSERT INTO categories (name, description, status) 
SELECT 'Vitamins & Supplements', 'Nutritional supplements, vitamins, and minerals', 'active'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Vitamins & Supplements');

INSERT INTO categories (name, description, status) 
SELECT 'Cold & Flu', 'Medications for treating cold, flu, and respiratory symptoms', 'active'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Cold & Flu');

INSERT INTO categories (name, description, status) 
SELECT 'Digestive Health', 'Medications for stomach, digestion, and gastrointestinal issues', 'active'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Digestive Health');

INSERT INTO categories (name, description, status) 
SELECT 'Heart & Blood Pressure', 'Cardiovascular medications and blood pressure treatments', 'active'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Heart & Blood Pressure');

INSERT INTO categories (name, description, status) 
SELECT 'Diabetes Care', 'Diabetes medications, insulin, and blood sugar management', 'active'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Diabetes Care');

INSERT INTO categories (name, description, status) 
SELECT 'Skin Care', 'Topical treatments, creams, and dermatological products', 'active'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Skin Care');

INSERT INTO categories (name, description, status) 
SELECT 'Eye Care', 'Ophthalmic solutions, eye drops, and vision care products', 'active'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Eye Care');

INSERT INTO categories (name, description, status) 
SELECT 'Mental Health', 'Antidepressants, anxiety medications, and psychiatric drugs', 'active'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Mental Health');

INSERT INTO categories (name, description, status) 
SELECT 'First Aid', 'Emergency medications, wound care, and first aid supplies', 'active'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'First Aid');

INSERT INTO categories (name, description, status) 
SELECT 'Allergy & Asthma', 'Antihistamines, inhalers, and allergy treatments', 'active'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Allergy & Asthma');

INSERT INTO categories (name, description, status) 
SELECT 'Other', 'Miscellaneous medications and healthcare products', 'active'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Other');

-- 6. Grant permissions
GRANT ALL ON categories TO authenticated;

-- 7. Verify setup
SELECT 'Categories setup completed!' as message;
SELECT COUNT(*) as total_categories FROM categories;
SELECT name FROM categories ORDER BY name; 