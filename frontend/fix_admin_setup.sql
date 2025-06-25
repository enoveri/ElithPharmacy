-- Fix admin_users table for initial setup
-- This script addresses compatibility issues and allows first admin creation

-- 1. Temporarily disable RLS to allow initial admin creation
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- 2. Fix notifications table RLS issues (if notifications table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON public.notifications TO authenticated;
        GRANT ALL ON public.notifications TO anon;
    END IF;
END
$$;

-- 3. Ensure admin_users table has proper permissions
GRANT ALL ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO anon;
GRANT ALL ON public.admin_users TO service_role;

-- 4. Update the default role to 'admin' for easier setup
ALTER TABLE public.admin_users ALTER COLUMN role SET DEFAULT 'admin';

-- 5. Show current table structure
SELECT 'Admin users table is ready for setup!' as status;

-- Note: After creating your first admin user, you can re-enable RLS if needed:
-- ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
