# Elith Pharmacy Database Setup

## Issue with Notifications

If you see "No notifications" in the notification panel even when there are low stock or out of stock products, it's likely because the `notifications` table doesn't exist in your Supabase database yet.

## Quick Fix

### Option 1: Use the Setup Page
1. Navigate to `/setup` in your application (e.g., `http://localhost:5173/setup`)
2. The setup page will check if the notifications table exists
3. If it doesn't exist, follow the instructions to create it

### Option 2: Manual Setup
1. Open your Supabase dashboard
2. Go to "SQL Editor"
3. Copy and paste the SQL script from `src/lib/sql/create_notifications_table.sql`
4. Run the script
5. Refresh your application

### Option 3: Use Debug Button
1. In your application, click the notification bell in the header
2. Click the "Create Test Notifications" button
3. Check the browser console for error messages
4. If you see "NOTIFICATIONS TABLE DOES NOT EXIST", follow Option 1 or 2 above

## What the SQL Script Does

The script creates:
- A `notifications` table with all necessary columns
- Proper indexes for performance
- Row Level Security (RLS) policies
- Automatic timestamp updates
- Sample test data

## After Setup

Once the table is created:
1. The notification system will automatically check for low stock and expiring products
2. Notifications will appear in the header notification panel
3. You can click on notifications to navigate to the related products
4. The system will check for new notifications every 5 minutes

## Troubleshooting

If notifications still don't appear after creating the table:
1. Check the browser console for any errors
2. Make sure your products have proper `quantity` and `min_stock_level` fields
3. Try clicking the "Create Test Notifications" debug button
4. Verify that your Supabase RLS policies allow notification operations

## Cloud Deployment (Vercel)

Since you're deploying the frontend to Vercel and ignoring the backend folder:
- All database operations are handled by the frontend through Supabase
- The SQL script needs to be run directly in your Supabase dashboard
- No backend deployment is required for the notification system
- Make sure your `.env.local` has the correct Supabase credentials for production
