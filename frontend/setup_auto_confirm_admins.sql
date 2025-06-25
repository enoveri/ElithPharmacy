-- SQL Script to disable email confirmation for admin signups
-- This should be run in your Supabase SQL Editor
-- 
-- Note: This is a project-level setting that's usually configured in the Supabase Dashboard
-- under Authentication -> Settings -> Email Confirmation
-- 
-- If you want to handle this programmatically, you can create a database function
-- that automatically confirms admin users upon creation

-- Create a function to auto-confirm admin users
CREATE OR REPLACE FUNCTION auto_confirm_admin_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this user is being created as an admin
  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    NEW.email_confirmed_at = NOW();
    -- Note: confirmed_at is a generated column and will be set automatically
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-confirm admin users
DROP TRIGGER IF EXISTS auto_confirm_admin_trigger ON auth.users;
CREATE TRIGGER auto_confirm_admin_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_admin_users();

-- Verify the trigger was created
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'auto_confirm_admin_trigger';
