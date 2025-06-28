import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkUserRole = async () => {
      if (authLoading) {
        setLoading(true);
        return;
      }

      if (!user) {
        setUserRole(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🔍 [useUserRole] Checking role for user:', user.email);

        // Check admin_users table for role information
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('role, is_active')
          .eq('email', user.email)
          .eq('is_active', true)
          .single();

        if (adminError) {
          console.log('❌ [useUserRole] Error fetching admin user:', adminError);
          // Check if user exists but is inactive
          const { data: inactiveUser } = await supabase
            .from('admin_users')
            .select('role, is_active')
            .eq('email', user.email)
            .single();

          if (inactiveUser && !inactiveUser.is_active) {
            console.log('⚠️ [useUserRole] User account is inactive');
            setUserRole('inactive');
            setIsAdmin(false);
          } else {
            console.log('❌ [useUserRole] User not found in admin_users table');
            setUserRole('unauthorized');
            setIsAdmin(false);
          }
        } else if (adminUser) {
          console.log('✅ [useUserRole] Found user role:', adminUser.role);
          setUserRole(adminUser.role);
          
          // Check if user is admin
          const adminStatus = adminUser.role === 'admin' || 
                             user.email === 'admin@elithpharmacy.com' ||
                             user.user_metadata?.role === 'admin' ||
                             user.app_metadata?.role === 'admin';
          
          setIsAdmin(adminStatus);
          console.log('🔐 [useUserRole] Admin status:', adminStatus);
        } else {
          console.log('❌ [useUserRole] No admin user data found');
          setUserRole('unknown');
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('❌ [useUserRole] Error checking user role:', err);
        setError(err.message);
        setUserRole('error');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user, authLoading]);

  // Helper functions
  const hasPermission = (requiredRole) => {
    if (!userRole || userRole === 'inactive' || userRole === 'unauthorized') {
      return false;
    }

    const roleHierarchy = {
      'admin': 4,
      'manager': 3,
      'pharmacist': 2,
      'staff': 1,
      'user': 0
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  };

  const canAccessAdmin = () => {
    return isAdmin;
  };

  const canManageUsers = () => {
    return hasPermission('admin') || hasPermission('manager');
  };

  const canManageInventory = () => {
    return hasPermission('admin') || hasPermission('manager') || hasPermission('pharmacist');
  };

  const canProcessSales = () => {
    return hasPermission('admin') || hasPermission('manager') || hasPermission('pharmacist') || hasPermission('staff');
  };

  return {
    userRole,
    isAdmin,
    loading: loading || authLoading,
    error,
    hasPermission,
    canAccessAdmin,
    canManageUsers,
    canManageInventory,
    canProcessSales
  };
}; 