-- Enhanced Import Database Script
-- This script provides additional functionality for robust CSV import handling

-- Create a function to parse various date formats from CSV imports
CREATE OR REPLACE FUNCTION parse_import_date(date_string TEXT)
RETURNS DATE AS $$
DECLARE
    parsed_date DATE;
BEGIN
    -- Return NULL for empty strings
    IF date_string IS NULL OR TRIM(date_string) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Try different date formats commonly found in CSV files
    BEGIN
        -- Try ISO format first (YYYY-MM-DD)
        parsed_date := date_string::DATE;
        RETURN parsed_date;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        -- Try MM/DD/YYYY format
        parsed_date := TO_DATE(date_string, 'MM/DD/YYYY');
        RETURN parsed_date;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        -- Try DD/MM/YYYY format
        parsed_date := TO_DATE(date_string, 'DD/MM/YYYY');
        RETURN parsed_date;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        -- Try Mon DD YYYY format (e.g., "Jun 01 2027")
        parsed_date := TO_DATE(SUBSTRING(date_string FROM 1 FOR 11), 'Mon DD YYYY');
        RETURN parsed_date;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        -- Try full timestamp format and extract date
        parsed_date := SUBSTRING(date_string FROM 1 FOR 10)::DATE;
        RETURN parsed_date;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- If all parsing attempts fail, return NULL
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean and validate product names
CREATE OR REPLACE FUNCTION clean_product_name(product_name TEXT)
RETURNS TEXT AS $$
BEGIN
    IF product_name IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Remove extra whitespace and normalize
    RETURN TRIM(REGEXP_REPLACE(product_name, '\s+', ' ', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Create a function to normalize category names
CREATE OR REPLACE FUNCTION normalize_category_name(category_name TEXT)
RETURNS TEXT AS $$
DECLARE
    normalized_name TEXT;
    category_mapping TEXT[][2];
    i INTEGER;
BEGIN
    IF category_name IS NULL OR TRIM(category_name) = '' THEN
        RETURN 'General';
    END IF;
    
    -- Clean the category name
    normalized_name := TRIM(INITCAP(category_name));
    
    -- Define category mappings for common variations
    category_mapping := ARRAY[
        ['Pain Relief', 'Pain Relief'],
        ['Painrelief', 'Pain Relief'],
        ['Pain', 'Pain Relief'],
        ['Analgesic', 'Pain Relief'],
        ['Antibiotics', 'Antibiotics'],
        ['Antibiotic', 'Antibiotics'],
        ['Anti-bacterial', 'Antibiotics'],
        ['Vitamins', 'Vitamins & Supplements'],
        ['Vitamin', 'Vitamins & Supplements'],
        ['Supplements', 'Vitamins & Supplements'],
        ['Supplement', 'Vitamins & Supplements'],
        ['Digestive', 'Digestive Health'],
        ['Digestion', 'Digestive Health'],
        ['Stomach', 'Digestive Health'],
        ['Cold', 'Cold & Flu'],
        ['Flu', 'Cold & Flu'],
        ['Cough', 'Cold & Flu'],
        ['Fever', 'Cold & Flu'],
        ['Skin', 'Skincare'],
        ['Skincare', 'Skincare'],
        ['Topical', 'Skincare'],
        ['Dermatology', 'Skincare'],
        ['Heart', 'Heart & Blood Pressure'],
        ['Cardiac', 'Heart & Blood Pressure'],
        ['Blood Pressure', 'Heart & Blood Pressure'],
        ['Hypertension', 'Heart & Blood Pressure'],
        ['Diabetes', 'Diabetes Care'],
        ['Diabetic', 'Diabetes Care'],
        ['Blood Sugar', 'Diabetes Care'],
        ['Eye', 'Eye Care'],
        ['Eyes', 'Eye Care'],
        ['Vision', 'Eye Care'],
        ['Respiratory', 'Respiratory'],
        ['Breathing', 'Respiratory'],
        ['Lung', 'Respiratory'],
        ['Asthma', 'Respiratory'],
        ['Women', 'Women''s Health'],
        ['Womens', 'Women''s Health'],
        ['Female', 'Women''s Health'],
        ['Men', 'Men''s Health'],
        ['Mens', 'Men''s Health'],
        ['Male', 'Men''s Health']
    ];
    
    -- Check for exact matches first
    FOR i IN 1..array_length(category_mapping, 1) LOOP
        IF UPPER(normalized_name) = UPPER(category_mapping[i][1]) THEN
            RETURN category_mapping[i][2];
        END IF;
    END LOOP;
    
    -- Check for partial matches
    FOR i IN 1..array_length(category_mapping, 1) LOOP
        IF POSITION(UPPER(category_mapping[i][1]) IN UPPER(normalized_name)) > 0 THEN
            RETURN category_mapping[i][2];
        END IF;
    END LOOP;
    
    -- Return the cleaned name if no mapping found
    RETURN normalized_name;
END;
$$ LANGUAGE plpgsql;

-- Create an enhanced import function that handles your CSV format
CREATE OR REPLACE FUNCTION import_supplier_inventory(
    p_facility_name TEXT,
    p_product TEXT,
    p_tags TEXT DEFAULT NULL,
    p_volume TEXT DEFAULT NULL,
    p_retail_price TEXT DEFAULT '0',
    p_cost_price TEXT DEFAULT '0',
    p_in_stock TEXT DEFAULT '0',
    p_availability TEXT DEFAULT 'Unknown',
    p_earliest_expiry TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_product_id UUID;
    v_clean_product_name TEXT;
    v_category TEXT;
    v_retail_price NUMERIC;
    v_cost_price NUMERIC;
    v_quantity INTEGER;
    v_expiry_date DATE;
    v_result JSON;
BEGIN
    -- Clean and validate inputs
    v_clean_product_name := clean_product_name(p_product);
    
    IF v_clean_product_name IS NULL OR v_clean_product_name = '' THEN
        RETURN json_build_object(
            'action', 'error',
            'error', 'Product name is required'
        );
    END IF;
    
    -- Normalize category from tags
    v_category := normalize_category_name(p_tags);
    
    -- Parse numeric values safely
    BEGIN
        v_retail_price := CASE 
            WHEN p_retail_price ~ '^[0-9]+\.?[0-9]*$' THEN p_retail_price::NUMERIC
            ELSE 0
        END;
    EXCEPTION WHEN OTHERS THEN
        v_retail_price := 0;
    END;
    
    BEGIN
        v_cost_price := CASE 
            WHEN p_cost_price ~ '^[0-9]+\.?[0-9]*$' THEN p_cost_price::NUMERIC
            ELSE 0
        END;
    EXCEPTION WHEN OTHERS THEN
        v_cost_price := 0;
    END;
    
    BEGIN
        v_quantity := CASE 
            WHEN p_in_stock ~ '^[0-9]+$' THEN p_in_stock::INTEGER
            ELSE 0
        END;
    EXCEPTION WHEN OTHERS THEN
        v_quantity := 0;
    END;
    
    -- Parse expiry date
    v_expiry_date := parse_import_date(p_earliest_expiry);
    
    -- Use the standard import function
    SELECT import_product_with_category(
        v_clean_product_name,
        v_category,
        v_retail_price,
        v_cost_price,
        v_quantity,
        p_facility_name, -- Use facility name as manufacturer
        p_volume,
        '', -- batch number
        v_expiry_date
    ) INTO v_result;
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'action', 'error',
        'product_name', p_product,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Create a view for import statistics
CREATE OR REPLACE VIEW import_statistics AS
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN quantity > 0 THEN 1 END) as products_in_stock,
    COUNT(CASE WHEN quantity = 0 THEN 1 END) as products_out_of_stock,
    COUNT(CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND expiry_date IS NOT NULL THEN 1 END) as products_expiring_soon,
    COUNT(DISTINCT category) as total_categories,
    SUM(quantity * COALESCE(cost_price, 0)) as total_inventory_value,
    AVG(price) as average_retail_price,
    MAX(last_restock_date) as last_import_date
FROM products;

-- Create indexes for better import performance
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products (updated_at);

-- Create a table to track import sessions
CREATE TABLE IF NOT EXISTS import_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT,
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    categories_created INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'in_progress',
    error_log TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on import_sessions
ALTER TABLE import_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for import_sessions
CREATE POLICY import_sessions_select_policy ON import_sessions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY import_sessions_insert_policy ON import_sessions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY import_sessions_update_policy ON import_sessions
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON import_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION parse_import_date TO authenticated;
GRANT EXECUTE ON FUNCTION clean_product_name TO authenticated;
GRANT EXECUTE ON FUNCTION normalize_category_name TO authenticated;
GRANT EXECUTE ON FUNCTION import_supplier_inventory TO authenticated;
GRANT SELECT ON import_statistics TO authenticated;

COMMIT; 