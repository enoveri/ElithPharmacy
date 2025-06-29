# Admin Panel Setup Guide

## Overview

The Admin Panel allows administrators to create and manage user accounts for the Elith Pharmacy system. Users created through the admin panel are stored in Supabase's `auth.users` table and can log in using their credentials.

## Prerequisites

1. Supabase project set up and configured
2. Environment variables configured in `.env`
3. Database tables created (run the SQL files)

## Database Setup

### 1. Run the main database setup

Execute `frontend/database-setup.sql` in your Supabase SQL editor to create all tables including the new `profiles` table.

### 2. Ensure Supabase Admin API is enabled

The admin panel uses Supabase's Admin API to create users. Make sure your service role key is set in your environment variables.

## Environment Variables

Make sure you have these in your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Features

### Admin Panel (`/admin`)

- **Create Users**: Add new users with email, password, role, and profile information
- **Search & Filter**: Find users by name, email, or role
- **User Management**: View user details, last login, and status
- **Delete Users**: Remove users from the system
- **Role-based Access**: Support for admin, manager, pharmacist, and staff roles

### User Roles

- **Admin**: Full system access including user management
- **Manager**: Management-level access
- **Pharmacist**: Pharmacy-specific functions
- **Staff**: Basic system access

## How to Use

### 1. Access the Admin Panel

- Navigate to `/admin` in your application
- Must be signed in as an admin user

### 2. Create the First Admin User

Since you need an admin to create users, you'll need to create the first admin manually in Supabase:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Users
3. Click "Add user"
4. Enter email and password
5. In the user metadata, add: `{"role": "admin"}`
6. Confirm the user

### 3. Create Additional Users

1. Sign in with your admin account
2. Go to `/admin`
3. Click "Add User"
4. Fill in the user details:
   - Email (required)
   - Password (required)
   - Full Name
   - Role (admin/manager/pharmacist/staff)
   - Phone
   - Position
5. Click "Create User"

### 4. User Login

Users created through the admin panel can now:

1. Go to `/login`
2. Enter their email and password
3. Access the system based on their role

## Database Structure

### `auth.users` (Supabase built-in)

- Stores authentication credentials
- User metadata includes role information

### `profiles` (Custom table)

- Stores additional user profile information
- Links to auth.users via foreign key
- Contains role, phone, position, etc.

## Security Features

- Row Level Security (RLS) policies
- Admin-only user creation
- Secure password handling via Supabase
- Role-based access control

## Troubleshooting

### Cannot create users

- Check if service role key is configured
- Verify admin permissions
- Check browser console for errors

### Users cannot login

- Verify user was created successfully
- Check if email confirmation is required
- Ensure credentials are correct

### Admin panel not accessible

- Verify route is added to routing
- Check if user has admin role
- Ensure sidebar navigation includes admin link

## UI Design

The admin panel follows the same design system as the rest of the application:

- Purple gradient color scheme
- Modern card-based layout
- Responsive design for mobile/desktop
- Consistent typography and spacing
- Loading states and error handling

## Next Steps

After setting up the admin panel, you may want to:

1. Implement protected routes based on user roles
2. Add user edit functionality
3. Set up email confirmation flows
4. Add password reset functionality
5. Implement audit logging for user management actions
