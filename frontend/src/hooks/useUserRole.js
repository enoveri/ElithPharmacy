import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase/index.js';

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

        // Check admin_users table for role information
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('role, is_active')
          .eq('email', user.email)
          .eq('is_active', true)
          .single();

        if (adminError) {
          // Check if user exists but is inactive
          const { data: inactiveUser } = await supabase
            .from('admin_users')
            .select('role, is_active')
            .eq('email', user.email)
            .single();

          if (inactiveUser && !inactiveUser.is_active) {
            setUserRole('inactive');
            setIsAdmin(false);
          } else {
            setUserRole('unauthorized');
            setIsAdmin(false);
          }
        } else if (adminUser) {
          setUserRole(adminUser.role);
          
          // Check if user is admin - only check database role, no hardcoded emails
          const adminStatus = adminUser.role === 'admin';
          
          setIsAdmin(adminStatus);
        } else {
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