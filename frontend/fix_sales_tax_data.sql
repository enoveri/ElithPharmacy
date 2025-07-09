-- Fix corrupted tax calculations in sales table
-- The bug: tax was calculated as subtotal * 18 instead of subtotal * 0.18

-- First, let's identify corrupted sales (where tax is more than 50% of subtotal)
-- Normal 18% tax should never exceed 18% of subtotal
SELECT 
  id,
  transaction_number,
  subtotal,
  tax,
  total_amount,
  (tax / subtotal * 100) as tax_percentage,
  CASE 
    WHEN tax = subtotal * 18 THEN 'CORRUPTED: tax = subtotal * 18'
    WHEN tax = subtotal * 0.18 THEN 'CORRECT: tax = subtotal * 0.18'
    WHEN tax > subtotal * 0.50 THEN 'LIKELY CORRUPTED: tax > 50% of subtotal'
    ELSE 'POSSIBLY CORRECT'
  END as analysis
FROM sales 
WHERE tax > 0
ORDER BY tax_percentage DESC;

-- Fix corrupted sales where tax = subtotal * 18 (should be subtotal * 0.18)
UPDATE sales 
SET 
  tax = ROUND(subtotal * 0.18, 2),
  total_amount = subtotal + ROUND(subtotal * 0.18, 2) + discount,
  updated_at = NOW()
WHERE 
  tax = subtotal * 18 
  AND status = 'completed';

-- Alternative fix for any sales where tax is unreasonably high (> 50% of subtotal)
-- This catches edge cases where the multiplication factor might have varied
UPDATE sales 
SET 
  tax = ROUND(subtotal * 0.18, 2),
  total_amount = subtotal + ROUND(subtotal * 0.18, 2) + discount,
  updated_at = NOW()
WHERE 
  tax > subtotal * 0.50 
  AND status = 'completed'
  AND tax != ROUND(subtotal * 0.18, 2); -- Don't update already correct ones

-- Verify the fixes
SELECT 
  id,
  transaction_number,
  subtotal,
  tax,
  total_amount,
  (tax / subtotal * 100) as tax_percentage_after_fix
FROM sales 
WHERE tax > 0
ORDER BY tax_percentage_after_fix DESC
LIMIT 10;

-- Summary of changes
SELECT 
  COUNT(*) as total_sales,
  COUNT(CASE WHEN tax > subtotal * 0.50 THEN 1 END) as remaining_corrupted,
  COUNT(CASE WHEN tax BETWEEN subtotal * 0.15 AND subtotal * 0.20 THEN 1 END) as likely_correct_tax,
  AVG(tax / subtotal * 100) as avg_tax_percentage
FROM sales 
WHERE tax > 0 AND status = 'completed'; 