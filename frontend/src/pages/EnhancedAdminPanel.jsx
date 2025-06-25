import React, { useState, useEffect } from "react";
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
  FiSave,
  FiDownload,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

/**
 * Enhanced Admin Panel - Single Page with Components
 * Simplified version that includes all admin functionality in one place
 */
const EnhancedAdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Form state for creating/editing users
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "staff",
    phone: "",
    position: "",
    is_active: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Check if current user is admin
  const checkAdminAccess = async () => {
    try {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setIsAdmin(profile?.role === "admin");
    } catch (error) {
      console.error("Error checking admin access:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Get users from auth.users table
      const { data: authUsers, error: authError } =
        await supabase.auth.admin.listUsers();

      if (authError) throw authError;

      // Get additional profile data
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      // Combine auth users with profile data
      const combinedUsers = authUsers.users.map((authUser) => {
        const profile = profiles?.find((p) => p.id === authUser.id) || {};
        return {
          id: authUser.id,
          email: authUser.email,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          email_confirmed_at: authUser.email_confirmed_at,
          ...profile,
          full_name:
            profile.full_name || authUser.user_metadata?.full_name || "",
          role: profile.role || authUser.user_metadata?.role || "staff",
          phone: profile.phone || authUser.user_metadata?.phone || "",
          position: profile.position || authUser.user_metadata?.position || "",
          is_active: profile.is_active !== undefined ? profile.is_active : true,
        };
      });

      setUsers(combinedUsers);

      // Calculate stats
      const userStats = {
        total: combinedUsers.length,
        active: combinedUsers.filter((u) => u.is_active).length,
        inactive: combinedUsers.filter((u) => !u.is_active).length,
        byRole: {
          admin: combinedUsers.filter((u) => u.role === "admin").length,
          manager: combinedUsers.filter((u) => u.role === "manager").length,
          pharmacist: combinedUsers.filter((u) => u.role === "pharmacist")
            .length,
          staff: combinedUsers.filter((u) => u.role === "staff").length,
          viewer: combinedUsers.filter((u) => u.role === "viewer").length,
        },
        recentSignIns: combinedUsers.filter((u) => {
          if (!u.last_sign_in_at) return false;
          const lastSignIn = new Date(u.last_sign_in_at);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return lastSignIn > sevenDaysAgo;
        }).length,
      };

      setStats(userStats);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      // Create user in auth.users table
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true,
          user_metadata: {
            full_name: formData.full_name,
            role: formData.role,
            phone: formData.phone,
            position: formData.position,
          },
        });

      if (authError) throw authError;

      // Create profile record
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone,
        position: formData.position,
        is_active: formData.is_active,
        created_at: new Date().toISOString(),
      });

      if (profileError) {
        console.warn(
          "Profile creation failed, but user was created:",
          profileError
        );
      }

      // Reset form and close modal
      setFormData({
        email: "",
        password: "",
        full_name: "",
        role: "staff",
        phone: "",
        position: "",
        is_active: true,
      });
      setShowCreateModal(false);

      // Refresh users list
      await fetchUsers();

      alert("User created successfully!");
    } catch (error) {
      console.error("Error creating user:", error);
      setError(error.message || "Failed to create user");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (
      !confirm(
        `Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;

      // Also delete from profiles table
      await supabase.from("profiles").delete().eq("id", userId);

      await fetchUsers();
      alert("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user: " + error.message);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "pharmacist":
        return "bg-green-100 text-green-800";
      case "staff":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.position?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <FiShield className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600">
            Please log in to access the admin panel.
          </p>
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
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have administrator privileges.
          </p>
          <p className="text-sm text-gray-500">Current user: {user.email}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "280px",
          backgroundColor: "white",
          borderRight: "1px solid #e2e8f0",
          padding: "24px 0",
        }}
      >
        {/* Logo/Header */}
        <div style={{ padding: "0 24px", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#3b82f6",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiShield size={20} color="white" />
            </div>
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1e293b",
                }}
              >
                Admin Panel
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                User Management
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ padding: "0 16px" }}>
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "0 8px",
                marginBottom: "8px",
              }}
            >
              Personal
            </div>
            <div style={{ space: "4px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px",
                  borderRadius: "6px",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                <FiUser size={16} />
                <span style={{ fontSize: "14px" }}>Profile</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px",
                  borderRadius: "6px",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                <FiKey size={16} />
                <span style={{ fontSize: "14px" }}>Password</span>
              </div>
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "0 8px",
                marginBottom: "8px",
              }}
            >
              Company
            </div>
            <div style={{ space: "4px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px",
                  borderRadius: "6px",
                  backgroundColor: "#f1f5f9",
                  color: "#3b82f6",
                  cursor: "pointer",
                }}
              >
                <FiUsers size={16} />
                <span style={{ fontSize: "14px", fontWeight: "500" }}>
                  Team members
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            left: "24px",
            right: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              backgroundColor: "#3b82f6",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiUser size={16} color="white" />
          </div>
          <div>
            <div
              style={{ fontSize: "14px", fontWeight: "500", color: "#1e293b" }}
            >
              Administrator
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              {user.email}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "32px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: "600",
                  color: "#0f172a",
                  margin: "0 0 8px 0",
                }}
              >
                Team members
              </h1>
              <p style={{ color: "#64748b", margin: "0", fontSize: "16px" }}>
                Invite or manage your organisation's members.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <FiUserPlus size={16} />
              Add member
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "24px",
              marginBottom: "32px",
            }}
          >
            {[
              {
                label: "Total Users",
                value: stats.total,
                icon: FiUsers,
                color: "#3b82f6",
              },
              {
                label: "Active Users",
                value: stats.active,
                icon: FiUsers,
                color: "#10b981",
              },
              {
                label: "Admins",
                value: stats.byRole.admin,
                icon: FiShield,
                color: "#ef4444",
              },
              {
                label: "Recent Logins",
                value: stats.recentSignIns,
                icon: FiUsers,
                color: "#8b5cf6",
              },
            ].map((stat, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: `${stat.color}15`,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <stat.icon size={24} color={stat.color} />
                </div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#0f172a",
                    marginBottom: "4px",
                  }}
                >
                  {stat.value}
                </div>{" "}
                <div style={{ fontSize: "14px", color: "#64748b" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search and Filters */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #f1f5f9",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Search */}
            <div style={{ position: "relative", flex: "1", minWidth: "300px" }}>
              <FiSearch
                size={20}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 44px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: "#ffffff",
                }}
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: "12px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "#ffffff",
                minWidth: "140px",
              }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="staff">Staff</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchUsers}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 16px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
                color: "#475569",
              }}
            >
              <FiRefreshCw
                size={16}
                style={{
                  animation: loading ? "spin 1s linear infinite" : "none",
                }}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Team Table */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #f1f5f9",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "24px 24px 0 24px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#0f172a",
                margin: "0 0 16px 0",
              }}
            >
              Team
            </h3>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "12px",
                padding: "16px",
                margin: "0 24px 24px 24px",
              }}
            >
              <p style={{ color: "#dc2626", margin: "0" }}>{error}</p>
            </div>
          )}

          {filteredUsers.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <FiUsers size={48} color="#cbd5e1" />
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "500",
                    color: "#334155",
                  }}
                >
                  No users found
                </div>
                <div style={{ fontSize: "14px", color: "#64748b" }}>
                  Get started by creating your first user.
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 24px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    marginTop: "16px",
                  }}
                >
                  <FiUserPlus size={16} />
                  Add User
                </button>
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              {filteredUsers.map((user, index) => (
                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 24px",
                    borderBottom:
                      index < filteredUsers.length - 1
                        ? "1px solid #f1f5f9"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: "#f1f5f9",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#475569",
                      }}
                    >
                      {(user.full_name || user.email || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#0f172a",
                        }}
                      >
                        {user.full_name || "Unnamed User"}
                      </div>
                      <div style={{ fontSize: "13px", color: "#64748b" }}>
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "24px",
                    }}
                  >
                    {/* Status */}
                    <div style={{ minWidth: "80px" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          fontWeight: "500",
                          borderRadius: "4px",
                          backgroundColor: user.is_active
                            ? "#dcfce7"
                            : "#fef2f2",
                          color: user.is_active ? "#166534" : "#dc2626",
                        }}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Role Dropdown */}
                    <div style={{ minWidth: "120px" }}>
                      <select
                        value={user.role}
                        onChange={(e) => {
                          // Handle role change
                          console.log("Role change:", user.id, e.target.value);
                        }}
                        style={{
                          padding: "6px 8px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "13px",
                          backgroundColor: "white",
                          color: user.role === "admin" ? "#dc2626" : "#3b82f6",
                          width: "100%",
                        }}
                      >
                        <option value="staff">Staff</option>
                        <option value="pharmacist">Pharmacist</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {/* Actions */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        style={{
                          padding: "6px",
                          backgroundColor: "transparent",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ef4444",
                        }}
                        title="Delete User"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Create New User
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required
                    minLength={6}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, role: e.target.value }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="staff">Staff</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      position: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={formLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAdminPanel;
