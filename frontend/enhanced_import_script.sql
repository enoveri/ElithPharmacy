-- Enhanced Import Database Script

CREATE OR REPLACE FUNCTION parse_import_date(date_string TEXT)
RETURNS DATE AS $$
DECLARE parsed_date DATE;
BEGIN
    IF date_string IS NULL OR TRIM(date_string) = '' THEN
        RETURN NULL;
    END IF;
    
    BEGIN
        parsed_date := date_string::DATE;
        RETURN parsed_date;
    EXCEPTION WHEN OTHERS THEN
        BEGIN
            parsed_date := TO_DATE(SUBSTRING(date_string FROM 1 FOR 11), 'Mon DD YYYY');
            RETURN parsed_date;
        EXCEPTION WHEN OTHERS THEN
            RETURN NULL;
        END;
    END;
END;
$$ LANGUAGE plpgsql; 