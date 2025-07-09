import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../hooks/useUserRole';
import { supabase } from '../lib/supabase/index.js';

const AdminRoleDebug = () => {
  const { user } = useAuth();
  const { userRole, isAdmin, loading, error } = useUserRole();
  const [adminData, setAdminData] = useState(null);
  const [adminError, setAdminError] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkAdminDirectly = async () => {
    if (!user?.email) return;
    
    setChecking(true);
    setAdminError(null);
    
    try {
      console.log('🔍 [Debug] Checking admin for email:', user.email);
      
      // Check admin_users table directly
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', user.email);

      if (error) {
        throw error;
      }

      console.log('📊 [Debug] Admin query result:', data);
      setAdminData(data);
      
      if (data && data.length > 0) {
        const adminUser = data[0];
        console.log('👤 [Debug] Found admin user:', {
          email: adminUser.email,
          role: adminUser.role,
          is_active: adminUser.is_active,
          id: adminUser.id
        });
      } else {
        console.log('❌ [Debug] No admin user found for email:', user.email);
      }
      
    } catch (error) {
      console.error('❌ [Debug] Error checking admin:', error);
      setAdminError(error.message);
    } finally {
      setChecking(false);
    }
  };

  const createMissingAdmin = async () => {
    if (!user?.email) return;
    
    setChecking(true);
    
    try {
      console.log('🔧 [Debug] Creating admin user for:', user.email);
      
      const adminUserData = {
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Admin User',
        role: 'admin',
        is_active: true,
        auth_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('admin_users')
        .insert(adminUserData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ [Debug] Admin user created:', data);
      setAdminData([data]);
      
      // Refresh the page to update hooks
      window.location.reload();
      
    } catch (error) {
      console.error('❌ [Debug] Error creating admin:', error);
      setAdminError(error.message);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      checkAdminDirectly();
    }
  }, [user?.email]);

  if (!user) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-bold text-lg mb-2">Admin Debug - No User</h3>
        <p>User is not logged in</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg space-y-4">
      <h3 className="font-bold text-lg mb-2">Admin Role Debug</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Auth User Info */}
        <div className="bg-white p-3 rounded">
          <h4 className="font-semibold mb-2">Auth User</h4>
          <div className="text-sm space-y-1">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Confirmed:</strong> {user.email_confirmed_at ? '✅' : '❌'}</p>
            <p><strong>Role in metadata:</strong> {user.user_metadata?.role || 'None'}</p>
          </div>
        </div>

        {/* User Role Hook */}
        <div className="bg-white p-3 rounded">
          <h4 className="font-semibold mb-2">User Role Hook</h4>
          <div className="text-sm space-y-1">
            <p><strong>Loading:</strong> {loading ? '⏳' : '✅'}</p>
            <p><strong>Role:</strong> {userRole || 'None'}</p>
            <p><strong>Is Admin:</strong> {isAdmin ? '✅' : '❌'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
          </div>
        </div>

        {/* Direct DB Check */}
        <div className="bg-white p-3 rounded">
          <h4 className="font-semibold mb-2">Direct DB Check</h4>
          <div className="text-sm space-y-1">
            <p><strong>Checking:</strong> {checking ? '⏳' : '✅'}</p>
            <p><strong>Error:</strong> {adminError || 'None'}</p>
            <p><strong>Records found:</strong> {adminData?.length || 0}</p>
            {adminData && adminData.length > 0 && (
              <div className="mt-2">
                <p><strong>First record:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>Role: {adminData[0].role}</li>
                  <li>Active: {adminData[0].is_active ? '✅' : '❌'}</li>
                  <li>Auth ID: {adminData[0].auth_id || 'None'}</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-3 rounded">
          <h4 className="font-semibold mb-2">Actions</h4>
          <div className="space-y-2">
            <button
              onClick={checkAdminDirectly}
              disabled={checking}
              className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
            >
              {checking ? 'Checking...' : 'Recheck Admin Status'}
            </button>
            
            {adminData && adminData.length === 0 && (
              <button
                onClick={createMissingAdmin}
                disabled={checking}
                className="w-full bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
              >
                {checking ? 'Creating...' : 'Create Admin Record'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Raw Data */}
      <div className="bg-white p-3 rounded">
        <h4 className="font-semibold mb-2">Raw Admin Data</h4>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(adminData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default AdminRoleDebug;
