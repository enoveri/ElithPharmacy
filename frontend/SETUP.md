# Elith Pharmacy - Frontend Setup Guide

This is a complete frontend application for the Elith Pharmacy Management System. It connects directly to Supabase and is designed to be deployed on Vercel without needing a separate backend.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A Supabase account and project set up
- Environment variables configured

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

## 🛠️ Supabase Setup

### Required Tables

The application requires a `notifications` table to work properly. Run the following SQL in your Supabase SQL Editor:

```sql
-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(10) DEFAULT 'medium',
  is_read BOOLEAN DEFAULT false,
  data JSONB,
  action_url VARCHAR(500),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on notifications
CREATE POLICY "Allow all operations on notifications" ON public.notifications
  FOR ALL USING (true);
```

### Environment Variables

Make sure your `.env.local` file contains:

```bash
# Supabase configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# App configuration
VITE_APP_NAME="Elith Pharmacy"
VITE_APP_VERSION=0.1.0
VITE_USE_MOCK_DATA=false
```

## 🔧 Features

- ✅ **Inventory Management**: Add, edit, view, and manage products
- ✅ **Point of Sale (POS)**: Complete sales transactions
- ✅ **Customer Management**: Manage customer information and sales history
- ✅ **Sales History**: View and manage sales transactions
- ✅ **Notifications**: Automatic low stock and expiry alerts
- ✅ **Reports**: Sales and inventory reports
- ✅ **Refunds**: Handle product returns
- ✅ **Purchases**: Track product purchases

## 🚀 Deployment on Vercel

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Add your environment variables in Vercel's dashboard
4. Deploy!

The application is configured to work seamlessly with Vercel's deployment process.

## 🔔 Notifications System

The application includes an automatic notification system that:
- Alerts when products are running low on stock
- Warns about expired or expiring products
- Provides real-time updates in the header notification bell

To test notifications, you can use the "Debug Notifications" button in the header to manually create test notifications.

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── lib/           # Database helpers and utilities
├── services/      # Data services
├── store/         # Zustand state management
├── utils/         # Utility functions
└── routes/        # Application routing
```

## 🐛 Troubleshooting

### No Notifications Showing
1. Ensure the notifications table exists in Supabase (run the SQL above)
2. Check the browser console for any errors
3. Use the "Debug Notifications" button to create test notifications

### Database Connection Issues
1. Verify your Supabase URL and key in `.env.local`
2. Check that your Supabase project is active
3. Ensure RLS policies are correctly configured

## 🔒 Security

The application uses Row Level Security (RLS) policies to ensure data security. All database operations go through Supabase's secure APIs.

## 📞 Support

If you encounter any issues, check the browser console for error messages and ensure all required tables exist in your Supabase database.
