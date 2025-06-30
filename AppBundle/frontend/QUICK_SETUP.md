# Database Setup Guide

## Quick Setup Instructions

### 1. Set up the Database Tables

1. Go to your Supabase dashboard: https://app.supabase.com
2. Open your project
3. Go to "SQL Editor" in the left sidebar
4. Copy and paste the content from `setup_admin_table.sql` (located in the frontend folder)
5. Click "Run" to execute the SQL

### 2. Access the Admin Setup

1. Make sure your development server is running:
   ```
   cd frontend
   npm run dev
   ```

2. Go to: http://localhost:5176/admin-setup

3. Create your first admin user by filling out the form

### 3. Login as Admin

1. After creating the admin user, you'll be redirected to the login page
2. Use the email and password you just created
3. Access the admin panel at: http://localhost:5176/admin

## Troubleshooting

### If you see "The requested module does not provide an export named 'default'" error:
- Stop the development server (Ctrl+C)
- Clear the browser cache
- Restart the server: `npm run dev`

### If you see RLS (Row Level Security) errors:
- Make sure you ran the SQL setup script in Supabase
- The script disables RLS for admin_users and notifications tables

### If the admin setup page shows "Admin Already Configured":
- This means admin users already exist in the database
- Use the login page instead: http://localhost:5176/login

## Database Tables Created

- `admin_users`: Stores admin user information
- Updated `notifications`: Fixed permissions for notification system

## Next Steps

After setup is complete:
1. Test the admin login
2. Create additional admin users through the admin panel
3. Test the notification system
4. Set up proper RLS policies for production (optional)
