# 🚨 Email System Debugging Guide

## Issue Identified
You're receiving Supabase's default confirmation emails instead of the custom welcome emails with credentials.

## Root Causes:
1. **Supabase Auto-Confirmation Emails** - Supabase sends default emails on `signUp()`
2. **Email Service Not Triggered** - Custom email service might not be executing
3. **Database Schema Mismatch** - Missing `email_confirmed` column

## Immediate Fixes Needed:

### 1. Run Updated SQL Script
Execute the updated `supabase_email_setup.sql` which now includes:
```sql
-- Add missing column
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false;
```

### 2. Disable Supabase Default Emails
In your **Supabase Dashboard**:
1. Go to **Authentication** → **Settings**
2. **Turn OFF** "Enable email confirmations"
3. **Turn OFF** "Enable email invitations" 
4. Save settings

### 3. Test the Custom Email System

#### Step 1: Check Database Setup
Run this in Supabase SQL Editor:
```sql
-- Check if email tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'email_%';

-- Check email templates
SELECT template_type, subject_template FROM email_templates;

-- Check if admin_users has email_confirmed column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
AND column_name = 'email_confirmed';
```

#### Step 2: Test User Creation
1. Open browser developer tools (F12)
2. Go to Console tab
3. Create a new user in admin panel
4. Watch for email service logs starting with `[EmailService]`

#### Step 3: Check Email Queue
After creating a user, run in Supabase SQL:
```sql
-- Check if email was queued
SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 5;

-- Check email logs
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 5;
```

## Expected Behavior After Fixes:

### ✅ What Should Happen:
1. Admin creates user → NO default Supabase email
2. Custom email system triggers → Email preview popup appears
3. User receives branded email with:
   - ✅ Email address
   - ✅ Password
   - ✅ Login link
   - ✅ Role information

### ❌ What Should NOT Happen:
- No "Verify Your Account" emails
- No "You've Been Invited" emails
- No generic Supabase confirmation emails

## Debug Steps:

### 1. Browser Console Logs
Look for these messages:
```
🚀 [EmailService] Sending welcome email immediately for: user@email.com
📧 [EmailService] FALLBACK: Email content generated for: user@email.com
✅ [EmailService] Email preview generated successfully (fallback mode)
```

### 2. Database Verification
```sql
-- Should show queued/sent emails
SELECT 
    eq.recipient_email,
    eq.email_type,
    eq.status,
    eq.template_data->>'temp_password' as password,
    eq.created_at
FROM email_queue eq 
ORDER BY eq.created_at DESC;
```

### 3. Test Email Content
The email preview popup should contain:
- Subject: "Welcome to Elith Pharmacy - Your Account is Ready!"
- Password field showing the generated password
- Login button linking to your site

## If Still Not Working:

### Option A: Manual Email Test
Add this test button to admin panel:
```javascript
const testEmail = async () => {
  const result = await emailService.sendWelcomeEmailNow({
    id: 'test-id',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'admin'
  }, 'test123password');
  
  console.log('Test result:', result);
};
```

### Option B: Check Supabase Auth Settings
1. **Auth** → **Settings** → **Auth Providers**
2. Make sure **Email** provider is configured
3. Check **Site URL** is set to your localhost
4. Verify **Redirect URLs** include your domain

### Option C: Alternative Signup Method
Instead of `signUp()`, use admin API:
```javascript
// This requires service role key (backend only)
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'user@example.com',
  password: 'password123',
  email_confirm: true // Skip verification
});
```

## Next Steps:
1. ✅ Run updated SQL script
2. ✅ Disable Supabase email confirmations
3. ✅ Test user creation with browser console open
4. ✅ Check for email preview popup
5. ✅ Verify database has email records

Let me know what you see in the browser console when you create a user!
