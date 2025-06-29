# Elith Pharmacy Management System - Frontend

A modern pharmacy management system built with React, Vite, and Supabase.

## 🚀 Live Demo

Deploy this app to Vercel in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/elith-pharmacy)

## 📋 Features

- **Inventory Management**: Track products, stock levels, expiry dates
- **Point of Sale (POS)**: Process sales with receipt generation
- **Customer Management**: Maintain customer records and purchase history
- **Sales Analytics**: View detailed sales reports and analytics
- **Low Stock Alerts**: Automatic notifications for low stock items
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 6
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Icons**: React Icons
- **PDF Generation**: html2pdf.js
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Supabase account
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd elith-pharmacy/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the frontend directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_NAME=Elith Pharmacy
   VITE_APP_VERSION=1.0.0
   ```

4. **Set up Supabase database**
   
   Run the SQL script in your Supabase SQL editor:
   ```sql
   -- See database-setup.sql for the complete schema
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🌐 Deployment to Vercel

### Method 1: One-Click Deploy

1. Click the "Deploy with Vercel" button above
2. Connect your GitHub account
3. Set up environment variables in Vercel dashboard
4. Deploy!

### Method 2: Manual Deploy

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**
   
   In Vercel dashboard, add these environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_NAME`
   - `VITE_APP_VERSION`

### Method 3: GitHub Integration

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables
4. Deploy automatically on each push

## 🗄️ Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Run Database Schema**
   - Open Supabase SQL Editor
   - Copy and execute the SQL from `database-setup.sql`
   - This creates all necessary tables and relationships

3. **Enable Row Level Security (Optional)**
   - Set up authentication policies as needed
   - Configure user roles and permissions

## 📱 Usage

### Dashboard
- View key metrics and recent activity
- Monitor low stock alerts
- Access quick actions

### Inventory Management
- Add/edit/delete products
- Set minimum stock levels
- Track expiry dates
- Import/export product data

### Point of Sale
- Search products quickly
- Add to cart with custom quantities
- Process payments
- Generate receipts
- Customer lookup and creation

### Reports & Analytics
- Sales reports by date range
- Product performance metrics
- Customer analytics
- Inventory reports

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `VITE_APP_NAME` | Application name | No |
| `VITE_APP_VERSION` | Application version | No |

### Build Optimization

The app is configured for optimal production builds:
- Code splitting by vendor libraries
- Minification with Terser
- Asset optimization
- Lazy loading of components

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure variables start with `VITE_`
   - Restart development server after changes

2. **Supabase Connection Errors**
   - Verify URL and key are correct
   - Check Supabase project status
   - Ensure database tables exist

3. **Build Failures**
   - Check for ESLint errors: `npm run lint`
   - Clear cache: `rm -rf node_modules package-lock.json && npm install`

4. **Deployment Issues**
   - Verify all environment variables are set in Vercel
   - Check build logs for errors
   - Ensure correct Node.js version (18+)

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review Vercel deployment logs
3. Check Supabase logs for database issues
4. Open an issue in the repository

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- React team for the amazing framework
- Supabase for the backend-as-a-service
- Vercel for seamless deployment
- Tailwind CSS for utility-first styling
