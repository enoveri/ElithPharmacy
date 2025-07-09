-- ============================================================================
-- FIX CORRUPTED TAX CALCULATIONS IN SALES TABLE
-- Issue: Tax was calculated as (subtotal * 18) instead of (subtotal * 0.18)
-- This script fixes historical sales data with corrupted tax calculations
-- ============================================================================

-- STEP 1: BACKUP AND ANALYSIS
-- First, let's see the current state of corrupted data
SELECT 
    'BEFORE FIX - Corrupted Sales Analysis' as report_type,
    COUNT(*) as total_sales_with_tax,
    COUNT(CASE WHEN tax = subtotal * 18 THEN 1 END) as exact_18x_corruption,
    COUNT(CASE WHEN tax > subtotal * 0.50 THEN 1 END) as likely_corrupted,
    COUNT(CASE WHEN tax BETWEEN subtotal * 0.15 AND subtotal * 0.20 THEN 1 END) as likely_correct,
    ROUND(AVG(tax / subtotal * 100), 2) as avg_tax_percentage
FROM sales 
WHERE tax > 0 AND subtotal > 0;

-- Show examples of corrupted data
SELECT 
    id,
    transaction_number,
    date,
    subtotal,
    tax,
    total_amount,
    ROUND((tax / subtotal * 100), 2) as tax_percentage,
    CASE 
        WHEN tax = subtotal * 18 THEN 'EXACT 18x CORRUPTION'
        WHEN tax > subtotal * 0.50 THEN 'LIKELY CORRUPTED'
        WHEN tax BETWEEN subtotal * 0.15 AND subtotal * 0.20 THEN 'LOOKS CORRECT'
        ELSE 'UNCLEAR'
    END as status
FROM sales 
WHERE tax > 0 AND subtotal > 0
ORDER BY (tax / subtotal) DESC
LIMIT 10;

-- ============================================================================
-- STEP 2: CREATE BACKUP TABLE (RECOMMENDED)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales_backup_before_tax_fix AS 
SELECT * FROM sales WHERE tax > 0;

SELECT 'Backup created with ' || COUNT(*) || ' records' as backup_status
FROM sales_backup_before_tax_fix;

-- ============================================================================
-- STEP 3: FIX CORRUPTED TAX CALCULATIONS
-- ============================================================================

-- Fix sales where tax = subtotal * 18 (exact corruption)
UPDATE sales 
SET 
    tax = ROUND(subtotal * 0.18, 2),
    total_amount = subtotal + ROUND(subtotal * 0.18, 2) - discount,
    updated_at = NOW()
WHERE 
    tax = subtotal * 18 
    AND subtotal > 0
    AND status = 'completed';

-- Get count of exact fixes
SELECT 'Fixed exact 18x corruption: ' || ROW_COUNT() || ' records' as fix_status;

-- Fix sales where tax is unreasonably high (> 50% of subtotal)
-- This catches cases where the multiplier might have been different
UPDATE sales 
SET 
    tax = ROUND(subtotal * 0.18, 2),
    total_amount = subtotal + ROUND(subtotal * 0.18, 2) - discount,
    updated_at = NOW()
WHERE 
    tax > subtotal * 0.50 
    AND subtotal > 0
    AND status = 'completed'
    AND tax != ROUND(subtotal * 0.18, 2); -- Don't update already correct ones

-- Get count of additional fixes
SELECT 'Fixed additional high tax records: ' || ROW_COUNT() || ' records' as additional_fixes;

-- ============================================================================
-- STEP 4: VERIFICATION AND RESULTS
-- ============================================================================

-- Check the results after fix
SELECT 
    'AFTER FIX - Sales Analysis' as report_type,
    COUNT(*) as total_sales_with_tax,
    COUNT(CASE WHEN tax = subtotal * 18 THEN 1 END) as remaining_18x_corruption,
    COUNT(CASE WHEN tax > subtotal * 0.50 THEN 1 END) as remaining_high_tax,
    COUNT(CASE WHEN tax BETWEEN subtotal * 0.15 AND subtotal * 0.20 THEN 1 END) as correct_tax_range,
    ROUND(AVG(tax / subtotal * 100), 2) as avg_tax_percentage_after_fix
FROM sales 
WHERE tax > 0 AND subtotal > 0;

-- Show sample of fixed records
SELECT 
    id,
    transaction_number,
    date,
    subtotal,
    tax,
    total_amount,
    ROUND((tax / subtotal * 100), 2) as tax_percentage_after_fix
FROM sales 
WHERE tax > 0 AND subtotal > 0
ORDER BY id ASC
LIMIT 10;

-- Compare before and after for specific problematic records
SELECT 
    s.id,
    s.transaction_number,
    'BEFORE' as status,
    b.subtotal,
    b.tax as old_tax,
    b.total_amount as old_total,
    ROUND((b.tax / b.subtotal * 100), 2) as old_tax_percentage
FROM sales s
JOIN sales_backup_before_tax_fix b ON s.id = b.id
WHERE b.tax = b.subtotal * 18
UNION ALL
SELECT 
    s.id,
    s.transaction_number,
    'AFTER' as status,
    s.subtotal,
    s.tax as new_tax,
    s.total_amount as new_total,
    ROUND((s.tax / s.subtotal * 100), 2) as new_tax_percentage
FROM sales s
JOIN sales_backup_before_tax_fix b ON s.id = b.id
WHERE b.tax = b.subtotal * 18
ORDER BY id, status;

-- ============================================================================
-- STEP 5: IMPACT SUMMARY
-- ============================================================================

-- Calculate the financial impact of the fix
SELECT 
    'FINANCIAL IMPACT SUMMARY' as report_type,
    COUNT(*) as fixed_records,
    SUM(b.tax - s.tax) as total_tax_reduction,
    SUM(b.total_amount - s.total_amount) as total_amount_reduction,
    ROUND(AVG(b.tax - s.tax), 2) as avg_tax_reduction_per_sale,
    MIN(b.tax - s.tax) as min_tax_reduction,
    MAX(b.tax - s.tax) as max_tax_reduction
FROM sales s
JOIN sales_backup_before_tax_fix b ON s.id = b.id
WHERE b.tax != s.tax;

-- ============================================================================
-- OPTIONAL: SET ALL TAX TO ZERO (if client wants completely tax-free records)
-- ============================================================================

-- Uncomment the following section if you want to remove ALL tax from historical records
-- This will make the database match the tax-free frontend experience

/*
-- Set all historical tax to zero and adjust totals
UPDATE sales 
SET 
    tax = 0,
    total_amount = subtotal - discount,
    updated_at = NOW()
WHERE 
    tax > 0 
    AND status = 'completed';

SELECT 'Set all tax to zero for ' || ROW_COUNT() || ' records' as zero_tax_status;

-- Verify zero tax update
SELECT 
    'ZERO TAX VERIFICATION' as report_type,
    COUNT(*) as total_sales,
    COUNT(CASE WHEN tax = 0 THEN 1 END) as zero_tax_sales,
    COUNT(CASE WHEN tax > 0 THEN 1 END) as remaining_tax_sales,
    SUM(tax) as total_tax_in_system
FROM sales;
*/

-- ============================================================================
-- COMPLETION SUMMARY
-- ============================================================================

SELECT 
    '=== TAX FIX COMPLETED ===' as status,
    (SELECT COUNT(*) FROM sales_backup_before_tax_fix) as original_records_backed_up,
    (SELECT COUNT(*) FROM sales WHERE tax BETWEEN subtotal * 0.15 AND subtotal * 0.20 AND subtotal > 0) as records_with_correct_tax,
    (SELECT COUNT(*) FROM sales WHERE tax > subtotal * 0.50 AND subtotal > 0) as remaining_suspicious_records,
    CURRENT_TIMESTAMP as fix_completed_at; 