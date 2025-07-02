import { supabase } from '../lib/supabase';

/**
 * Create Admin User Utility
 * Creates an admin user with the specified credentials
 */
export const createAdminUser = async (email, password, fullName = 'Admin User') => {
  try {
    console.log('🔄 [CreateAdminUser] Starting admin user creation...');
    console.log('📧 Email:', email);
    console.log('👤 Full Name:', fullName);

    // Step 1: Create user in Supabase Auth
    console.log('🔄 [CreateAdminUser] Creating user in Supabase Auth...');
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
      console.error('❌ [CreateAdminUser] Auth error:', authError);
      throw new Error(`Auth creation failed: ${authError.message}`);
    }

    console.log('✅ [CreateAdminUser] User created in Auth:', authData.user?.id);

    // Step 2: Create admin_users record
    console.log('🔄 [CreateAdminUser] Creating admin_users record...');
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
      console.error('❌ [CreateAdminUser] Admin user record error:', adminUserError);
      throw new Error(`Admin user record creation failed: ${adminUserError.message}`);
    }

    console.log('✅ [CreateAdminUser] Admin user record created successfully');

    // Step 3: Verify the user was created
    console.log('🔄 [CreateAdminUser] Verifying user creation...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();

    if (verifyError) {
      console.error('❌ [CreateAdminUser] Verification error:', verifyError);
      throw new Error(`Verification failed: ${verifyError.message}`);
    }

    console.log('✅ [CreateAdminUser] User verification successful:', verifyData);

    return {
      success: true,
      data: {
        authUser: authData.user,
        adminUser: verifyData
      },
      message: `Admin user created successfully!\n\nEmail: ${email}\nPassword: ${password}\nRole: Admin\n\nYou can now log in to the application.`
    };

  } catch (error) {
    console.error('❌ [CreateAdminUser] Error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Check if admin user already exists
 */
export const checkAdminUserExists = async (email) => {
  try {
    console.log('🔍 [CreateAdminUser] Checking if admin user exists:', email);
    
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ [CreateAdminUser] Error checking user:', error);
      throw error;
    }

    const exists = !!data;
    console.log('✅ [CreateAdminUser] User exists check:', exists);
    
    return {
      success: true,
      exists: exists,
      data: data
    };

  } catch (error) {
    console.error('❌ [CreateAdminUser] Error checking user existence:', error);
    return {
      success: false,
      error: error.message,
      exists: false,
      data: null
    };
  }
};

/**
 * Create the default admin user (admin@elith.com)
 */
export const createDefaultAdminUser = async () => {
  const email = 'admin@elith.com';
  const password = 'admin';
  const fullName = 'System Administrator';

  // First check if user already exists
  const checkResult = await checkAdminUserExists(email);
  
  if (checkResult.success && checkResult.exists) {
    console.log('⚠️ [CreateAdminUser] Admin user already exists:', email);
    return {
      success: false,
      error: 'Admin user already exists',
      data: checkResult.data
    };
  }

  // Create the admin user
  return await createAdminUser(email, password, fullName);
};

export default {
  createAdminUser,
  checkAdminUserExists,
  createDefaultAdminUser
}; 