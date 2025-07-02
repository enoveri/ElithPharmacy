# Admin User Setup Guide

This guide explains how to create an admin user for the Elith Pharmacy application.

## Admin User Credentials

The default admin user will be created with the following credentials:
- **Email**: `admin@elith.com`
- **Password**: `admin1234`
- **Role**: `admin`
- **Full Name**: `System Administrator`

## Methods to Create Admin User

### Method 1: Using the Web Interface

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the admin creation page:
   ```
   http://localhost:5173/create-admin
   ```

3. Click the "Create Admin User" button
4. The system will create the admin user and display the results

### Method 2: Using the Command Line Script

1. Make sure you have the required environment variables set in your `.env.local` file:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Run the admin creation script:
   ```bash
   npm run create-admin
   ```

3. The script will check if the user already exists and create it if needed

### Method 3: Using Browser Console

1. Start the development server and open the application
2. Open the browser console (F12)
3. Run the following command:
   ```javascript
   await window.debugPharmacy.createAdmin()
   ```

## Verification

After creating the admin user, you can verify it was created successfully by:

1. **Logging in**: Go to `http://localhost:5173/login` and use the credentials above
2. **Checking the database**: Use the "Check if User Exists" button on the create-admin page
3. **Using console**: Run `await window.debugPharmacy.users.checkUserStatus('admin@elith.com')` in the browser console

## Database Structure

The admin user is created in two places:

1. **Supabase Auth** (`auth.users` table):
   - User authentication credentials
   - Email and password
   - User metadata

2. **Admin Users Table** (`admin_users` table):
   - User ID (matches auth.users.id)
   - Email
   - Full name
   - Role (admin)
   - Active status
   - Creation timestamp

## Troubleshooting

### User Already Exists
If you see "Admin user already exists", the user has already been created. You can use the existing credentials to log in.

### Database Connection Issues
- Ensure your Supabase credentials are correct
- Check that the `admin_users` table exists in your database
- Verify that Row Level Security (RLS) policies allow the operations

### Authentication Issues
- Make sure the user was created in both Supabase Auth and the admin_users table
- Check that the user ID matches between both tables
- Verify that the user is marked as active

### Permission Issues
- Ensure your Supabase anon key has the necessary permissions
- Check that the admin_users table has the correct RLS policies

## Security Notes

⚠️ **Important Security Considerations:**

1. **Change Default Password**: After first login, change the default password
2. **Remove Development Routes**: Remove the `/create-admin` route in production
3. **Secure Environment Variables**: Keep your Supabase credentials secure
4. **Database Policies**: Set up proper RLS policies for production

## Production Deployment

Before deploying to production:

1. Remove or secure the `/create-admin` route
2. Set up proper RLS policies
3. Change the default admin password
4. Consider using a more secure password generation method
5. Implement proper user management through the admin panel

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Supabase configuration
3. Ensure the database tables are properly set up
4. Check the network tab for API errors 