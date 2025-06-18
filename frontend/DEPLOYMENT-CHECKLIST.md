# Vercel Deployment Checklist

## ✅ Pre-deployment Checklist

### 1. Environment Setup
- [ ] `.env.local` configured with Supabase credentials
- [ ] `.env.example` created as template
- [ ] All environment variables start with `VITE_`

### 2. Build Configuration
- [ ] `vercel.json` configured with proper rewrites
- [ ] `vite.config.js` optimized for production
- [ ] Build passes: `npm run build`
- [ ] No ESLint errors: `npm run lint`

### 3. Database Setup
- [ ] Supabase project created
- [ ] Database schema applied (see `database-setup.sql`)
- [ ] Tables created: products, customers, sales, purchases, notifications
- [ ] Row Level Security configured (if needed)

### 4. Code Quality
- [ ] All mock data usage removed
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Safe field access (`.toFixed()` etc.)

### 5. Performance
- [ ] Code splitting configured
- [ ] Assets optimized
- [ ] Bundle size under reasonable limits
- [ ] Lazy loading implemented where needed

## 🚀 Deployment Steps

### Option 1: GitHub + Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import from GitHub
   - Select your repository
   - Configure environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_APP_NAME`
     - `VITE_APP_VERSION`
   - Deploy!

### Option 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login and Deploy**
   ```bash
   vercel login
   vercel --prod
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

## 🔧 Post-deployment

### 1. Test Basic Functionality
- [ ] App loads without errors
- [ ] Database connection works
- [ ] Login/authentication (if implemented)
- [ ] Navigation works
- [ ] Forms submit correctly

### 2. Test Key Features
- [ ] Dashboard displays data
- [ ] Add/edit/delete products
- [ ] POS system works
- [ ] Sales recording
- [ ] Customer management
- [ ] Reports generation

### 3. Test Notifications
- [ ] Notifications table exists
- [ ] Low stock alerts work
- [ ] Manual notification creation
- [ ] Notification display in header

### 4. Performance Check
- [ ] Page load speed acceptable
- [ ] Images/assets load correctly
- [ ] Mobile responsiveness
- [ ] Console errors check

## 🐛 Common Issues & Solutions

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working
- Ensure they start with `VITE_`
- Check Vercel dashboard settings
- Redeploy after adding variables

### Database Connection Issues
- Verify Supabase URL and key
- Check Supabase project status
- Ensure database tables exist

### 404 Errors on Routes
- Verify `vercel.json` has proper rewrites
- Check React Router configuration

## 📊 Performance Monitoring

After deployment, monitor:
- Core Web Vitals in Vercel Analytics
- Error rates in Vercel Function logs
- Database performance in Supabase dashboard
- User feedback and bug reports

## 🔄 Continuous Deployment

Set up automatic deployments:
1. Push to `main` branch triggers production deploy
2. Push to `develop` branch triggers preview deploy
3. Pull requests create preview deployments

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review browser console errors
3. Check Supabase logs
4. Verify environment variables
5. Test locally first: `npm run build && npm run preview`
