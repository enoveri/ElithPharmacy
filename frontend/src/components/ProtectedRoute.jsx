import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase/index.js';
import { FiShield, FiLogIn } from 'react-icons/fi';

const ProtectedRoute = ({ children, requireAuth = true, adminOnly = false }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return;

    // If authentication is required and user is not logged in
    if (requireAuth && !user) {
      console.log('🔒 [ProtectedRoute] User not authenticated, redirecting to login');
      navigate('/login', { 
        state: { 
          from: location.pathname,
          message: 'Please log in to access this page'
        } 
      });
      return;
    }

    // If admin access is required, check user role
    if (adminOnly && user) {
      // Check if user is admin by looking up admin_users table
      const checkAdminAccess = async () => {
        try {
          // Check admin_users table for role information
          const { data: adminUser, error: adminError } = await supabase
            .from('admin_users')
            .select('role, is_active')
            .eq('email', user.email)
            .eq('is_active', true)
            .single();

          if (adminError || !adminUser) {
            console.log('🚫 [ProtectedRoute] User not found in admin_users or not active');
            navigate('/', { 
              state: { 
                message: 'You do not have admin privileges'
              } 
            });
            return;
          }

          // Check if user has admin role
          const isAdmin = adminUser.role === 'admin';
          
          if (!isAdmin) {
            console.log('🚫 [ProtectedRoute] User role is not admin:', adminUser.role);
            navigate('/', { 
              state: { 
                message: 'You do not have admin privileges'
              } 
            });
          }
        } catch (error) {
          console.error('❌ [ProtectedRoute] Error checking admin access:', error);
          navigate('/', { 
            state: { 
              message: 'Error checking admin privileges'
            } 
          });
        }
      };

      checkAdminAccess();
    }
  }, [user, loading, requireAuth, adminOnly, navigate, location]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message if not logged in
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <FiShield className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in to access this page.
          </p>
          <button
            onClick={() => navigate('/login', { 
              state: { from: location.pathname }
            })}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <FiLogIn className="h-5 w-5" />
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Render children if authentication is successful
  return children;
};

export default ProtectedRoute;
