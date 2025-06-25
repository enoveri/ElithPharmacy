// Database setup utilities
import { supabase } from './supabase';
import { dataService } from '../services';

// SQL to create notifications table
const createNotificationsTableSQL = `
  CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    action_url VARCHAR(500),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
  CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
  CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

  -- Enable RLS (Row Level Security)
  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

  -- Create policies for notifications
  CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

  CREATE POLICY "Users can insert their own notifications" ON notifications
    FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

  CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

  CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (user_id = auth.uid() OR user_id IS NULL);
`;

// Check if notifications table exists
export const checkNotificationsTable = async () => {
  try {
    console.log('🔍 [Setup] Checking if notifications table exists...');
    
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ [Setup] Notifications table does not exist');
        return { exists: false, error: 'Table does not exist' };
      }
      console.error('❌ [Setup] Error checking notifications table:', error);
      return { exists: false, error: error.message };
    }
    
    console.log('✅ [Setup] Notifications table exists');
    return { exists: true };
  } catch (error) {
    console.error('❌ [Setup] Error in checkNotificationsTable:', error);
    return { exists: false, error: error.message };
  }
};

// Create notifications table
export const createNotificationsTable = async () => {
  try {
    console.log('🔧 [Setup] Creating notifications table...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: createNotificationsTableSQL
    });
    
    if (error) {
      console.error('❌ [Setup] Error creating notifications table:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ [Setup] Notifications table created successfully');
    return { success: true, data };
  } catch (error) {
    console.error('❌ [Setup] Error in createNotificationsTable:', error);
    return { success: false, error: error.message };
  }
};

// Test notifications functionality
export const testNotifications = async () => {
  try {
    console.log('🧪 [Setup] Testing notifications functionality...');
    
    // Test creating a notification
    const testNotification = {
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      priority: 'normal'
    };
    
    const createResult = await dataService.notifications.create(testNotification);
    if (!createResult.success) {
      throw new Error(`Failed to create test notification: ${createResult.error?.message}`);
    }
    
    console.log('✅ [Setup] Test notification created:', createResult.data);
    
    // Test fetching notifications
    const notifications = await dataService.notifications.getAll();
    console.log('✅ [Setup] Fetched notifications:', notifications);
    
    // Clean up test notification
    if (createResult.data?.id) {
      await dataService.notifications.delete(createResult.data.id);
      console.log('🗑️ [Setup] Test notification cleaned up');
    }
    
    return { success: true, message: 'Notifications system is working correctly' };
  } catch (error) {
    console.error('❌ [Setup] Error testing notifications:', error);
    return { success: false, error: error.message };
  }
};

// Setup notifications system
export const setupNotifications = async () => {
  try {
    console.log('🚀 [Setup] Setting up notifications system...');
    
    // Check if table exists
    const tableCheck = await checkNotificationsTable();
    
    if (!tableCheck.exists) {
      // Try to create the table
      const createResult = await createNotificationsTable();
      if (!createResult.success) {
        return {
          success: false,
          error: `Failed to create notifications table: ${createResult.error}`,
          instructions: `
Please run this SQL in your Supabase SQL editor:

${createNotificationsTableSQL}
          `
        };
      }
    }
    
    // Test the system
    const testResult = await testNotifications();
    if (!testResult.success) {
      return {
        success: false,
        error: `Notifications table exists but system test failed: ${testResult.error}`,
        instructions: 'Please check your Supabase RLS policies and permissions.'
      };
    }
    
    console.log('🎉 [Setup] Notifications system setup complete!');
    return {
      success: true,
      message: 'Notifications system is ready to use!'
    };
  } catch (error) {
    console.error('❌ [Setup] Error in setupNotifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create sample notifications for testing
export const createSampleNotifications = async () => {
  try {
    console.log('📝 [Setup] Creating sample notifications...');
    
    const sampleNotifications = [
      {
        type: 'warning',
        title: 'Low Stock Alert',
        message: 'Several products are running low on stock.',
        priority: 'high',
        action_url: '/inventory'
      },
      {
        type: 'error',
        title: 'Out of Stock',
        message: 'Some products are completely out of stock.',
        priority: 'high',
        action_url: '/inventory'
      },
      {
        type: 'info',
        title: 'Daily Report',
        message: 'Your daily sales report is ready.',
        priority: 'normal',
        action_url: '/reports'
      }
    ];
    
    const results = [];
    for (const notification of sampleNotifications) {
      const result = await dataService.notifications.create(notification);
      results.push(result);
    }
    
    console.log('✅ [Setup] Sample notifications created:', results);
    return { success: true, data: results };
    
  } catch (error) {
    console.error('❌ [Setup] Error creating sample notifications:', error);
    return { success: false, error: error.message };
  }
};
