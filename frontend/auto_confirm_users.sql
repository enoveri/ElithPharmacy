-- Auto-confirm function for admin-created users
-- This function can be called from the admin panel to confirm user emails

CREATE OR REPLACE FUNCTION confirm_user_email(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user's email_confirmed_at timestamp
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE email = user_email 
    AND email_confirmed_at IS NULL;
    
  -- Log the confirmation
  RAISE NOTICE 'Email confirmed for user: %', user_email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION confirm_user_email(text) TO authenticated;

-- Optional: Auto-confirm all users in admin_users table
-- Uncomment the following lines if you want to auto-confirm all existing admin users

/*
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email IN (
  SELECT email FROM admin_users WHERE is_active = true
) 
AND email_confirmed_at IS NULL;
*/
