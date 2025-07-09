import React from 'react';
import styles from '././custom_css/Custom.module.css';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiLogOut, FiAlertCircle } from 'react-icons/fi';
import { useState, useEffect } from 'react';

const AuthStatus = () => {
  const { user, loading, logout, authError } = useAuth();
  const [showAuthError, setShowAuthError] = useState(false);

  
  useEffect(() => {
    if (authError) {
      setShowAuthError(true);
      
      const timer = setTimeout(() => {
        setShowAuthError(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [authError]);

  const handleLogout = async () => {
    try {
      await logout();
      console.log('✅ [AuthStatus] Logout successful');
    } catch (error) {
      console.error('❌ [AuthStatus] Logout error:', error);
    }
  };

  
  if (loading) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg shadow-lg z-50">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
          <span className="text-sm font-medium">Checking auth...</span>
        </div>
      </div>
    );
  }

  
  if (showAuthError && !user) {
    return (
      <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
        <div className="flex items-center gap-2">
          <FiAlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Not authenticated, please try again</span>
        </div>
      </div>
    );
  }

  
  if (!user) {
    return null;
  }

  
  return (
    <div className={`${styles.authStatusBadge} fixed top-3.5 right-65 z-50`}>
      <div className="relative group">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium cursor-pointer">
          {user.email.charAt(0).toUpperCase()}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        
        
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-200">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm font-medium text-gray-700">
                {user.email}
              </div>
            </div>
            <div className="border-t border-gray-200 mt-2 pt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-100 p-2 rounded transition-colors"
              >
                <FiLogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthStatus;
