#!/usr/bin/env node

/**
 * Create Admin User Script
 * 
 * This script creates an admin user with the following credentials:
 * - Email: admin@elith.com
 * - Password: admin1234
 * - Role: admin
 * 
 * Usage: node create-admin-user.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Create admin user
 */
async function createAdminUser() {
  const email = 'admin@elith.com';
  const password = 'admin1234';
  const fullName = 'System Administrator';

  try {
    console.log('🔄 Creating admin user...');
    console.log('📧 Email:', email);
    console.log('👤 Full Name:', fullName);

    // Step 1: Create user in Supabase Auth
    console.log('🔄 Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          role: 'admin'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      throw new Error(`Auth creation failed: ${authError.message}`);
    }

    console.log('✅ User created in Auth:', authData.user?.id);

    // Step 2: Create admin_users record
    console.log('🔄 Creating admin_users record...');
    const adminUserData = {
      id: authData.user.id,
      email: email,
      full_name: fullName,
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString()
    };

    const { error: adminUserError } = await supabase
      .from('admin_users')
      .insert(adminUserData);

    if (adminUserError) {
      console.error('❌ Admin user record error:', adminUserError);
      throw new Error(`Admin user record creation failed: ${adminUserError.message}`);
    }

    console.log('✅ Admin user record created successfully');

    // Step 3: Verify the user was created
    console.log('🔄 Verifying user creation...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();

    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
      throw new Error(`Verification failed: ${verifyError.message}`);
    }

    console.log('✅ User verification successful:', verifyData);

    console.log('\n🎉 Admin user created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email: admin@elith.com');
    console.log('   Password: admin1234');
    console.log('   Role: Admin');
    console.log('\n🔗 You can now log in to the application at: http://localhost:5173/login');

    return {
      success: true,
      data: {
        authUser: authData.user,
        adminUser: verifyData
      }
    };

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if admin user already exists
 */
async function checkAdminUserExists() {
  const email = 'admin@elith.com';

  try {
    console.log('🔍 Checking if admin user exists:', email);
    
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error checking user:', error);
      throw error;
    }

    const exists = !!data;
    console.log('✅ User exists check:', exists);
    
    if (exists) {
      console.log('📋 Existing user details:', data);
    }
    
    return {
      success: true,
      exists: exists,
      data: data
    };

  } catch (error) {
    console.error('❌ Error checking user existence:', error);
    return {
      success: false,
      error: error.message,
      exists: false,
      data: null
    };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Elith Pharmacy - Admin User Creation Script');
  console.log('==============================================\n');

  // Check if user already exists
  const checkResult = await checkAdminUserExists();
  
  if (checkResult.success && checkResult.exists) {
    console.log('⚠️  Admin user already exists!');
    console.log('📧 Email: admin@elith.com');
    console.log('🔑 You can use the existing credentials to log in.');
    return;
  }

  // Create the admin user
  const result = await createAdminUser();
  
  if (result.success) {
    console.log('\n✅ Script completed successfully!');
  } else {
    console.log('\n❌ Script failed:', result.error);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
}); 