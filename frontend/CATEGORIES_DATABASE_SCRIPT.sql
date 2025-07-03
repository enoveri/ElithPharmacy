-- ============================================
-- CATEGORIES TABLE SETUP FOR ELITH PHARMACY
-- ============================================
-- Copy and paste this entire script into your Supabase SQL Editor

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies to allow authenticated users full access
CREATE POLICY "Allow all operations for authenticated users" ON categories
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Insert default pharmacy categories
INSERT INTO categories (name, description) VALUES
    ('Pain Relief', 'Analgesics, painkillers, and anti-inflammatory medications'),
    ('Antibiotics', 'Antimicrobial medications for treating bacterial infections'),
    ('Vitamins & Supplements', 'Nutritional supplements, vitamins, and minerals'),
    ('Cold & Flu', 'Medications for treating cold, flu, and respiratory symptoms'),
    ('Digestive Health', 'Medications for stomach, digestion, and gastrointestinal issues'),
    ('Heart & Blood Pressure', 'Cardiovascular medications and blood pressure treatments'),
    ('Diabetes Care', 'Diabetes medications, insulin, and blood sugar management'),
    ('Skin Care', 'Topical treatments, creams, and dermatological products'),
    ('Eye Care', 'Ophthalmic solutions, eye drops, and vision care products'),
    ('Mental Health', 'Antidepressants, anxiety medications, and psychiatric drugs'),
    ('First Aid', 'Emergency medications, wound care, and first aid supplies'),
    ('Allergy & Asthma', 'Antihistamines, inhalers, and allergy treatments'),
    ('Other', 'Miscellaneous medications and healthcare products')
ON CONFLICT (name) DO NOTHING;

-- 6. Grant permissions to authenticated users
GRANT ALL ON categories TO authenticated;

-- 7. Verify setup
SELECT 'Categories table setup completed successfully!' as message;
SELECT COUNT(*) as total_categories FROM categories;
SELECT name FROM categories ORDER BY name; 