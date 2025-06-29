// Database setup utility for Elith Pharmacy
// This file contains functions to set up the database tables if they don't exist

import { supabase } from './index.js';

export const setupDatabase = {
  // Check if notifications table exists
  checkNotificationsTable: async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message?.includes('relation "notifications" does not exist')) {
          console.warn('⚠️ [Setup] Notifications table does not exist');
          return { exists: false, error: error.message };
        }
        throw error;
      }
      
      console.log('✅ [Setup] Notifications table exists');
      return { exists: true, error: null };
    } catch (error) {
      console.error('❌ [Setup] Error checking notifications table:', error);
      return { exists: false, error: error.message };
    }
  },

  // Create notifications table (requires admin privileges)
  createNotificationsTable: async () => {
    try {
      console.log('🔄 [Setup] Creating notifications table...');
      
      // Note: This requires admin privileges in Supabase
      // For security reasons, table creation should be done through Supabase SQL editor
      const sql = `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL DEFAULT 'info',
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          priority VARCHAR(20) DEFAULT 'normal',
          data JSONB DEFAULT NULL,
          action_url VARCHAR(500) DEFAULT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        throw error;
      }
      
      console.log('✅ [Setup] Notifications table created successfully');
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ [Setup] Error creating notifications table:', error);
      console.error('📋 [Setup] Please create the table manually using the SQL script in src/lib/sql/create_notifications_table.sql');
      return { success: false, error: error.message };
    }
  },

  // Initialize database - check and create tables if needed
  initializeDatabase: async () => {
    try {
      console.log('🚀 [Setup] Initializing database...');
      
      // Check notifications table
      const notificationsCheck = await setupDatabase.checkNotificationsTable();
      
      if (!notificationsCheck.exists) {
        console.warn('⚠️ [Setup] Notifications table missing. Please run the SQL script manually.');
        console.warn('📋 [Setup] SQL script location: src/lib/sql/create_notifications_table.sql');
        console.warn('📋 [Setup] Copy the SQL and run it in your Supabase SQL editor.');
        
        return {
          success: false,
          error: 'Notifications table does not exist',
          instructions: {
            action: 'Run SQL script manually',
            location: 'src/lib/sql/create_notifications_table.sql',
            steps: [
              '1. Open your Supabase dashboard',
              '2. Go to SQL Editor',
              '3. Copy and run the SQL script from src/lib/sql/create_notifications_table.sql',
              '4. Refresh the application'
            ]
          }
        };
      }
      
      console.log('✅ [Setup] Database initialization complete');
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ [Setup] Error initializing database:', error);
      return { success: false, error: error.message };
    }
  },

  // Test database connection and basic operations
  testDatabase: async () => {
    try {
      console.log('🧪 [Setup] Testing database connection...');
      
      // Test basic connection
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      console.log('✅ [Setup] Database connection successful');
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ [Setup] Database connection failed:', error);
      return { success: false, error: error.message };
    }
  }
};

export default setupDatabase;
