-- SQL Script to manually confirm admin user emails
-- Run this in your Supabase SQL Editor

-- Update auth.users to confirm email for admin users
-- Note: confirmed_at is a generated column, so we only update email_confirmed_at
UPDATE auth.users 
SET 
  email_confirmed_at = NOW()
WHERE 
  email IN (
    SELECT email 
    FROM admin_users 
    WHERE role = 'admin'
  )
  AND email_confirmed_at IS NULL;

-- Verify the update
SELECT 
  au.email,
  au.email_confirmed_at,
  au.confirmed_at,
  adu.role,
  adu.full_name
FROM auth.users au
JOIN admin_users adu ON au.email = adu.email
WHERE adu.role = 'admin';
