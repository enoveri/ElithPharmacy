# Email Notification System Setup Guide

## Overview
The Elith Pharmacy Management System now includes an automated email notification system that sends welcome emails to newly created users. The system is designed to work entirely within the frontend and Supabase database, with proper logging for debugging.

## Setup Instructions

### 1. Run the SQL Script in Supabase
Execute the `supabase_email_setup.sql` script in your Supabase SQL editor:

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase_email_setup.sql`
4. Click "Run" to execute the script

This will create:
- `email_logs` table - tracks all email sending attempts
- `email_templates` table - stores customizable email templates
- `email_queue` table - queues emails to be sent
- Database triggers to automatically queue welcome emails
- Helper functions for email processing

### 2. Verify Database Setup
After running the script, verify the setup by checking:

```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('email_logs', 'email_templates', 'email_queue');

-- Check if templates were inserted
SELECT template_type, subject_template FROM email_templates;
```

### 3. Test the System

#### Frontend Testing
1. Navigate to the Admin Panel (`/admin`)
2. You'll see the new "Email Notifications" panel
3. Click "Test System" to verify database connectivity
4. Create a new user - this will automatically queue a welcome email
5. Click "Process Emails" to simulate sending the queued emails

#### Debug Information
The system includes extensive logging. Check the browser console for:
- `📧 [EmailService]` - Email service operations
- `🔄 [AdminPanel]` - Admin panel user creation
- `✅` - Success messages
- `❌` - Error messages
- `⚠️` - Warning messages

## How It Works

### 1. Automatic Email Queuing
When a new user is created in the Admin Panel:
1. User record is inserted into `admin_users` table
2. Database trigger automatically inserts a record into `email_queue`
3. Frontend displays success message indicating email was queued

### 2. Email Processing
The system provides a manual email processing interface:
1. "Refresh" button loads pending emails and statistics
2. "Process Emails" button simulates sending queued emails
3. Processed emails are moved to `email_logs` with status tracking

### 3. Email Templates
Templates are stored in the database and support placeholder replacement:
- `{{full_name}}` - User's full name
- `{{email}}` - User's email address
- `{{role}}` - User's role
- `{{created_at}}` - Account creation timestamp

## Features

### Email Notification Panel
Located in the Admin Panel, provides:
- List of pending emails with details
- Email statistics and status tracking
- System testing functionality
- Manual email processing controls

### Database Functions
- `get_pending_emails(limit)` - Fetch emails to be sent
- `mark_email_sent(id, success, error)` - Update email status
- `get_email_template(type)` - Retrieve email templates

### Logging and Monitoring
- Comprehensive console logging for debugging
- Email status tracking (queued, sent, failed)
- Statistics view for monitoring email activity
- Error tracking with detailed messages

## Troubleshooting

### Common Issues

#### No Emails in Queue
- Verify the database trigger is working
- Check console for user creation errors
- Ensure `admin_users` table exists and is accessible

#### Email Processing Fails
- Check browser console for detailed error messages
- Verify database functions exist and are accessible
- Check Supabase RLS policies allow access to email tables

#### Template Issues
- Verify email templates exist in database
- Check template syntax for proper placeholder format
- Ensure templates are marked as active

### Debug Queries

```sql
-- Check pending emails
SELECT * FROM email_queue WHERE status = 'queued';

-- Check email logs
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;

-- View email statistics
SELECT * FROM email_stats;

-- Check user creation trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_queue_welcome_email';
```

## Future Enhancements

The current implementation provides a foundation for:
1. **Real Email Sending**: Integration with actual email service (SMTP, SendGrid, etc.)
2. **Background Processing**: Automated email processing via cron jobs
3. **Template Management**: Admin interface for editing email templates
4. **Notification Types**: Additional email types (password reset, account updates)
5. **Scheduling**: Delayed or scheduled email sending

## Integration Notes

### Backend Team Handoff
When the backend team implements actual email sending:
1. Replace the simulated email processing with real SMTP/API calls
2. Add environment variables for email service configuration
3. Implement proper error handling and retry logic
4. Add email delivery tracking and bounce handling

### Frontend Extension
To extend the email system:
1. Add new email types to the `email_templates` table
2. Create corresponding frontend triggers
3. Update the EmailNotificationPanel for new email types
4. Add template management interface for admins

## Security Considerations

1. **RLS Policies**: Email tables have Row Level Security enabled
2. **Admin Access**: Only admin users can access email management features
3. **Data Protection**: User emails and personal data are handled securely
4. **Audit Trail**: All email activities are logged for compliance

## Support

For issues or questions:
1. Check browser console for detailed error messages
2. Verify database setup using the provided SQL queries
3. Review the EmailService logs for operation details
4. Test system connectivity using the "Test System" button
