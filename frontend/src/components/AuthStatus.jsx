import React from 'react';
import styles from '././custom_css/Custom.module.css';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiLogOut } from 'react-icons/fi';
import { useState, useEffect } from 'react'

const AuthStatus = () => {
  const { user, loading, logout } = useAuth();

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

  if (!user) {
    return (
      <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow-lg z-50">
        <div className="flex items-center gap-2">
          <FiUser className="h-4 w-4" />
          <span className="text-sm font-medium">Not authenticated</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.authStatusBadge} fixed top-5 right-65 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg shadow-lg z-50 hover:scale-105 transition-transform duration-200`}>
      <div className="flex items-center gap-2">
        <FiUser className="h-4 w-4"/>
        <span className="text-sm font-medium">
          Logged in as: {user.email}
        </span>
        <button
          onClick={handleLogout}
          className="ml-2 p-1 hover:bg-green-200 rounded transition-colors"
          title="Logout"
        >
          <FiLogOut className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default AuthStatus; 