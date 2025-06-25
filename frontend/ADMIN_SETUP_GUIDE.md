# Admin Setup Guide

## Database Setup Required

Before you can create admin users, you need to set up the database tables in Supabase.

### Step 1: Create Admin Users Table

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `create_admin_users_table.sql`

### Step 2: Fix Notifications Table

1. In the same SQL Editor, run the SQL script from `fix_notifications_table.sql`
2. This will fix the RLS (Row Level Security) issues with notifications

### Step 3: Create First Admin User

1. Navigate to `/admin-setup` in your browser
2. Fill out the admin user creation form
3. This will create your first admin user

### Step 4: Access Admin Panel

1. After creating the admin user, log in at `/login`
2. Navigate to `/admin` to access the admin panel

## Alternative: Manual Admin Creation

If the setup page doesn't work due to RLS policies, you can manually create an admin user:

### In Supabase Auth:
1. Go to Authentication > Users
2. Create a new user with email and password

### In Supabase Database:
1. Go to Table Editor > admin_users
2. Insert a new row:
   ```
   id: [copy the user ID from Auth]
   email: [same email as auth user]
   full_name: [admin's full name]
   role: admin
   is_active: true
   ```

## Troubleshooting

### RLS Policy Issues
If you get RLS policy errors, temporarily disable RLS:
```sql
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
```

### Notification System Errors
The notification system requires:
1. notifications table to exist
2. RLS to be disabled or proper policies set
3. Proper user authentication

### Access Control
- Only users with `role = 'admin'` can access `/admin`
- Admin users are stored in the `admin_users` table
- Authentication is handled by Supabase Auth
