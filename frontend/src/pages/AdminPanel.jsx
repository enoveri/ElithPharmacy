import React, { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiUserPlus, 
  FiEdit3, 
  FiTrash2, 
  FiKey, 
  FiSearch, 
  FiFilter, 
  FiRefreshCw,
  FiShield,
  FiX,
  FiEye,
  FiEyeOff,
  FiMail,
  FiUser,
  FiPhone,
  FiBriefcase,
  FiSave
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * Enhanced Admin Panel - Single Page with Components
 * Simplified version that includes all admin functionality in one place
 */
const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  // Form state for creating/editing users
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user',
    phone: '',
    position: '',
    is_active: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    console.log('🔄 [AdminPanel] useEffect triggered - user:', user);
    console.log('🔄 [AdminPanel] User object details:', JSON.stringify(user, null, 2));
    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);// Check if current user is admin
  const checkAdminAccess = async () => {
    try {
      console.log('🔍 [AdminPanel] Starting checkAdminAccess...');
      console.log('🔍 [AdminPanel] Current user state:', user);
      
      if (!user) {
        console.log('❌ [AdminPanel] No user found, setting isAdmin to false');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      console.log('🔍 [AdminPanel] Checking admin access for user email:', user.email);

      // Also check current session to make sure we're authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔍 [AdminPanel] Current session:', session);
      console.log('🔍 [AdminPanel] Session error:', sessionError);

      if (!session) {
        console.log('❌ [AdminPanel] No active session found');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check against admin_users table instead of profiles
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('role, email, is_active')
        .eq('email', user.email)
        .eq('is_active', true)
        .single();

      console.log('🔍 [AdminPanel] Admin user query result:', adminUser);
      console.log('🔍 [AdminPanel] Admin user query error:', error);

      if (error) {
        console.error('❌ [AdminPanel] Error checking admin access:', error);
        setIsAdmin(false);
      } else if (adminUser?.role === 'admin') {
        console.log('✅ [AdminPanel] User confirmed as admin:', adminUser);
        setIsAdmin(true);
      } else {
        console.log('❌ [AdminPanel] User is not an admin or inactive. Found:', adminUser);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('❌ [AdminPanel] Unexpected error checking admin access:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 [AdminPanel] Fetching users...');
      
      // Get users from admin_users table instead of profiles
      const { data: adminUsers, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (adminError) {
        console.error('❌ [AdminPanel] Error fetching admin users:', adminError);
        throw adminError;
      }

      console.log('✅ [AdminPanel] Fetched admin users:', adminUsers);
      setUsers(adminUsers || []);
      
      // Calculate stats
      const userStats = {
        total: adminUsers?.length || 0,
        active: adminUsers?.filter(u => u.is_active).length || 0,
        inactive: adminUsers?.filter(u => !u.is_active).length || 0,        byRole: {
          admin: adminUsers?.filter(u => u.role === 'admin').length || 0,
          manager: adminUsers?.filter(u => u.role === 'manager').length || 0,
          user: adminUsers?.filter(u => u.role === 'user').length || 0,
        },
        recentSignIns: adminUsers?.filter(u => {
          if (!u.last_sign_in_at) return false;
          const lastSignIn = new Date(u.last_sign_in_at);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return lastSignIn > sevenDaysAgo;        }).length || 0,
      };
      
      console.log('📊 [AdminPanel] User stats calculated:', userStats);
      setStats(userStats);
    } catch (error) {
      console.error('❌ [AdminPanel] Error fetching users:', error);
      setError('Failed to fetch users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      console.log('🔄 [AdminPanel] Creating new user:', formData.email);

      // Step 1: Check if email already exists in admin_users table
      const { data: existingUser, error: checkError } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', formData.email)
        .single();

      if (existingUser) {
        throw new Error('A user with this email already exists in the system');
      }      // Step 2: Create user using regular signup (this will work with anon key)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          },
          emailRedirectTo: undefined, // Don't send confirmation email for admin-created users
        }
      });

      if (authError) {
        console.error('❌ [AdminPanel] Error creating auth user:', authError);
        throw authError;
      }

      console.log('✅ [AdminPanel] Auth user created:', authData.user);

      // Step 3: Create admin_users record
      const adminUserData = {
        id: authData.user.id,
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone || null,
        position: formData.position || null,
        is_active: formData.is_active,
        created_at: new Date().toISOString(),
      };

      const { error: adminUserError } = await supabase
        .from('admin_users')
        .insert(adminUserData);

      if (adminUserError) {
        console.error('❌ [AdminPanel] Error creating admin user record:', adminUserError);
        throw adminUserError;
      }

      console.log('✅ [AdminPanel] Admin user record created successfully');      // Reset form and close modal
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'user',
        phone: '',
        position: '',
        is_active: true,
      });
      setShowCreateModal(false);
      
      // Refresh users list
      await fetchUsers();
      
      alert('User created successfully! The user will need to confirm their email before logging in, or you can manually confirm them in Supabase.');    } catch (error) {
      console.error('Error creating user:', error);
      let errorMessage = 'Failed to create user';
      
      if (error.message.includes('User already registered')) {
        errorMessage = 'A user with this email already exists';
      } else if (error.message.includes('duplicate key value violates unique constraint')) {
        errorMessage = 'A user with this email already exists in the system';
      } else if (error.message.includes('admin_users_pkey')) {
        errorMessage = 'This email is already registered. Please use a different email address.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address';
      } else if (error.message.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters long';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };  const handleDeleteUser = async (userId, userEmail) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // First delete from admin_users table
      const { error: adminDeleteError } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', userId);

      if (adminDeleteError) {
        throw adminDeleteError;
      }

      // Note: We can't delete from auth.users with anon key, but deleting from admin_users
      // effectively removes their access to the admin panel
      console.log('✅ [AdminPanel] User removed from admin panel');
      
      await fetchUsers();
      alert('User removed from admin panel successfully! Note: The user account still exists in Supabase Auth but can no longer access the admin panel.');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + error.message);
    }
  };
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      console.log('🔄 [AdminPanel] Updating user:', selectedUser.id);

      // Update admin_users table
      const updateData = {
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone,
        position: formData.position,
        is_active: formData.is_active,
      };

      const { error: adminUserError } = await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', selectedUser.id);

      if (adminUserError) {
        console.error('❌ [AdminPanel] Error updating admin user record:', adminUserError);
        throw adminUserError;
      }

      // Note: We can't update passwords with anon key
      if (formData.password && formData.password.trim() !== '') {
        setError('Password update is not available with current permissions. User can reset their password using the "Forgot Password" option on the login page.');
        // Don't throw error, just warn
      }

      console.log('✅ [AdminPanel] User updated successfully');      // Reset form and close modal
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'user',
        phone: '',
        position: '',
        is_active: true,
      });
      setShowEditModal(false);
      setSelectedUser(null);
      
      // Refresh users list
      await fetchUsers();
      
      alert('User updated successfully!' + (formData.password ? ' Note: Password was not updated - user can reset it via login page.' : ''));
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user');
    } finally {
      setFormLoading(false);
    }
  };
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.position?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <FiRefreshCw className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <FiShield className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Please Log In</h2>
          <p className="text-gray-600">You need to be logged in to access the admin panel.</p>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <FiShield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have administrator privileges.</p>
          <p className="text-sm text-gray-500">Current user: {user.email}</p>        </div>
      </div>
    );
  }

  // Main admin panel
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 w-full">
      {/* Full-width Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-gray-600 text-lg mt-1">User Management System</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {user.email}
                </div>
                <div className="text-xs text-gray-500">
                  Administrator
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-xl flex items-center justify-center shadow-sm">
                <FiShield className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with full width */}      <div className="px-6 lg:px-8 py-8 max-w-none">
        {/* Enhanced Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/70 backdrop-blur-sm border border-blue-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FiUsers className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 h-1 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-full rounded-full"></div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm border border-green-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-600 mb-1">Active Users</p>
                  <p className="text-3xl font-bold text-green-900">{stats.active}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FiUsers className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 h-1 bg-green-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm border border-amber-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-600 mb-1">Admins</p>
                  <p className="text-3xl font-bold text-amber-900">{stats.byRole.admin}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <FiShield className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="mt-4 h-1 bg-amber-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.byRole.admin / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm border border-purple-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-600 mb-1">Recent Logins</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.recentSignIns}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FiUsers className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 h-1 bg-purple-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.recentSignIns / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Controls */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 p-6 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Enhanced Search */}
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                />
              </div>

              {/* Enhanced Role Filter */}
              <div className="relative">
                <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-12 pr-8 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none cursor-pointer transition-all duration-200"                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>

            {/* Enhanced Actions */}
            <div className="flex gap-3">
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white hover:shadow-md disabled:opacity-50 transition-all duration-200"
              >
                <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="font-medium text-gray-700">Refresh</span>
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-xl hover:from-teal-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
              >
                <FiUserPlus className="h-4 w-4" />
                Add User
              </button>
            </div>
          </div>
        </div>        {/* Enhanced Error Message */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <FiX className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Enhanced Users Table */}
        <div className="bg-white/70 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiUsers className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No users found</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">Get started by creating your first user to manage your pharmacy team.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-xl hover:from-teal-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
              >
                <FiUserPlus className="h-4 w-4 inline mr-2" />
                Add User
              </button>
            </div>
          ) : (            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Last Sign In
                    </th>
                    <th className="px-8 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-teal-100 to-emerald-100 flex items-center justify-center shadow-sm">
                              <FiUser className="h-6 w-6 text-teal-600" />
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {user.full_name || 'Unnamed User'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.phone && (
                              <div className="text-xs text-gray-400 mt-1">{user.phone}</div>
                            )}
                          </div>                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="space-y-2">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                          {user.position && (
                            <div className="text-xs text-gray-500">{user.position}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            user.is_active ? 'bg-green-400' : 'bg-red-400'
                          }`}></div>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-500">
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : 'Never'
                        }
                      </td>                      <td className="px-8 py-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setFormData({
                                email: user.email,
                                password: '',
                                full_name: user.full_name || '',
                                role: user.role,
                                phone: user.phone || '',
                                position: user.position || '',
                                is_active: user.is_active,
                              });
                              setShowEditModal(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                            title="Edit User"
                          >
                            <FiEdit3 className="h-4 w-4" />
                          </button>                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-150"
                            title="Delete User"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Enhanced Create User Modal */}
      {showCreateModal && (        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-2xl border-0 animate-in fade-in duration-200">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Create New User</h2>
                  <p className="text-teal-100 text-sm mt-1">Add a new team member to your pharmacy</p>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)} 
                  className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-150"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="p-8 space-y-6">              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <FiX className="h-4 w-4 text-red-600" />
                    </div>
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Personal Information Section */}
              <div className="space-y-6">
                <div className="border-l-4 border-teal-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Personal Information</h3>
                  <p className="text-gray-500 text-sm">Basic details about the user</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Full Name *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        required
                        placeholder="Enter full name"
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Email Address *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiMail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        placeholder="Enter email address"
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Password *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiKey className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        minLength={6}
                        placeholder="Enter password (min 6 characters)"
                        className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 text-gray-900 placeholder-gray-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        {showPassword ? 
                          <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" /> : 
                          <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        }
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 ml-1">Password should be at least 6 characters long</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiPhone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Role & Position Section */}
              <div className="space-y-6">
                <div className="border-l-4 border-emerald-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Role & Position</h3>
                  <p className="text-gray-500 text-sm">Define user permissions and job role</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">System Role *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiShield className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        required
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 text-gray-900 appearance-none cursor-pointer"
                      >
                        <option value="user">User</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Job Position</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiBriefcase className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        value={formData.position}
                        onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 text-gray-900 appearance-none cursor-pointer"
                      >
                        <option value="">Select Position</option>
                        <option value="Senior Pharmacist">Senior Pharmacist</option>
                        <option value="Pharmacist">Pharmacist</option>
                        <option value="Pharmacy Technician">Pharmacy Technician</option>
                        <option value="Pharmacy Assistant">Pharmacy Assistant</option>
                        <option value="Store Manager">Store Manager</option>
                        <option value="Assistant Manager">Assistant Manager</option>
                        <option value="Cashier">Cashier</option>
                        <option value="Sales Associate">Sales Associate</option>
                        <option value="Inventory Specialist">Inventory Specialist</option>
                        <option value="Customer Service Representative">Customer Service Representative</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Status Section */}
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Account Status</h3>
                  <p className="text-gray-500 text-sm">Configure user access permissions</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="w-5 h-5 text-teal-600 bg-white border-2 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                    />
                    <label htmlFor="is_active" className="ml-4">
                      <span className="text-base font-semibold text-gray-900">Active User Account</span>
                      <p className="text-sm text-gray-500 mt-1">User can log in and access the system</p>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={formLoading}
                  className="px-8 py-3 border border-gray-300 rounded-2xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl hover:from-teal-600 hover:to-emerald-600 shadow-lg hover:shadow-xl disabled:opacity-50 transition-all duration-200 font-medium min-w-[140px] justify-center"
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiSave className="h-5 w-5" />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>      )}

      {/* Enhanced Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Edit User</h2>              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  setFormData({
                    email: '',
                    password: '',
                    full_name: '',
                    role: 'user',
                    phone: '',
                    position: '',
                    is_active: true,
                  });
                }} 
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <FiX className="h-4 w-4 text-red-600" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    required
                    placeholder="Enter full name"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    placeholder="Enter email address"
                    disabled
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed after account creation</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <FiKey className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    minLength={6}
                    placeholder="Leave empty to keep current password"
                    className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-150"
                  >
                    {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>                <p className="text-xs text-gray-500 mt-1">Password updates are not available. Users can reset their password on the login page.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                <div className="relative">
                  <FiBriefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 appearance-none cursor-pointer"
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50/50"
                  />
                </div>
              </div>              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                <div className="relative">
                  <FiBriefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 appearance-none cursor-pointer"
                  >
                    <option value="">Select Position</option>
                    <option value="Senior Pharmacist">Senior Pharmacist</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Pharmacy Technician">Pharmacy Technician</option>
                    <option value="Pharmacy Assistant">Pharmacy Assistant</option>
                    <option value="Store Manager">Store Manager</option>
                    <option value="Assistant Manager">Assistant Manager</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Sales Associate">Sales Associate</option>
                    <option value="Inventory Specialist">Inventory Specialist</option>
                    <option value="Customer Service Representative">Customer Service Representative</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                />
                <label htmlFor="edit_is_active" className="ml-3 text-sm font-semibold text-gray-700">
                  Active user (can log in)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <button
                  type="button"                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    setFormData({
                      email: '',
                      password: '',
                      full_name: '',
                      role: 'user',
                      phone: '',
                      position: '',
                      is_active: true,
                    });
                  }}
                  disabled={formLoading}
                  className="px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl disabled:opacity-50 transition-all duration-200 font-medium"
                >                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiSave className="h-4 w-4" />
                      Update User                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default AdminPanel;
