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
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useIsMobile } from "../hooks/useIsMobile";
import "../styles/mobile.css";

/**
 * Enhanced Admin Panel - Single Page with Components
 * Simplified version that includes all admin functionality in one place
 */
const EnhancedAdminPanel = () => {
  // Mobile detection hook
  const isMobile = useIsMobile();
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
    console.log("🔄 [AdminPanel] useEffect triggered - user:", user);
    console.log(
      "🔄 [AdminPanel] User object details:",
      JSON.stringify(user, null, 2)
    );
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
      console.log("🔍 [AdminPanel] Starting checkAdminAccess...");
      console.log("🔍 [AdminPanel] Current user state:", user);

      if (!user) {
        console.log("❌ [AdminPanel] No user found, setting isAdmin to false");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      console.log(
        "🔍 [AdminPanel] Checking admin access for user email:",
        user.email
      );

      // Also check current session to make sure we're authenticated
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      console.log("🔍 [AdminPanel] Current session:", session);
      console.log("🔍 [AdminPanel] Session error:", sessionError);

      if (!session) {
        console.log("❌ [AdminPanel] No active session found");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check against admin_users table instead of profiles
      const { data: adminUser, error } = await supabase
        .from("admin_users")
        .select("role, email, is_active")
        .eq("email", user.email)
        .eq("is_active", true)
        .single();

      console.log("🔍 [AdminPanel] Admin user query result:", adminUser);
      console.log("🔍 [AdminPanel] Admin user query error:", error);

      if (error || !adminUser) {
        console.log("❌ [AdminPanel] User is not an admin or error occurred");
        setIsAdmin(false);
      } else {
        console.log("✅ [AdminPanel] User is admin with role:", adminUser.role);
        setIsAdmin(true);
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log("🔄 [AdminPanel] Fetching users from admin_users table...");

      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ [AdminPanel] Error fetching users:", error);
        throw error;
      }

      console.log("✅ [AdminPanel] Fetched users:", data);
      setUsers(data || []);

      // Calculate stats
      const stats = {
        total: data?.length || 0,
        active: data?.filter((u) => u.is_active)?.length || 0,
        byRole: {
          admin: data?.filter((u) => u.role === "admin")?.length || 0,
          manager: data?.filter((u) => u.role === "manager")?.length || 0,
          pharmacist: data?.filter((u) => u.role === "pharmacist")?.length || 0,
          staff: data?.filter((u) => u.role === "staff")?.length || 0,
        },
        recentSignIns:
          data?.filter(
            (u) =>
              u.last_sign_in_at &&
              new Date(u.last_sign_in_at) >
                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          )?.length || 0,
      };

      console.log("📊 [AdminPanel] Calculated stats:", stats);
      setStats(stats);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users: " + error.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      console.log("🔄 [AdminPanel] Creating new user:", formData.email);

      // Step 1: Create user using regular signup (this will work with anon key)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          },
          emailRedirectTo: undefined, // Don't send confirmation email for admin-created users
        },
      });

      if (authError) {
        console.error("❌ [AdminPanel] Error creating auth user:", authError);
        throw authError;
      }

      console.log("✅ [AdminPanel] Auth user created:", authData.user);

      // Step 2: Create admin_users record
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
        .from("admin_users")
        .insert(adminUserData);

      if (adminUserError) {
        console.error(
          "❌ [AdminPanel] Error creating admin user record:",
          adminUserError
        );
        throw adminUserError;
      }

      console.log("✅ [AdminPanel] Admin user record created successfully");

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

      alert(
        "User created successfully! The user will need to confirm their email before logging in, or you can manually confirm them in Supabase."
      );
    } catch (error) {
      console.error("Error creating user:", error);
      let errorMessage = "Failed to create user";

      if (error.message.includes("User already registered")) {
        errorMessage = "A user with this email already exists";
      } else if (error.message.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address";
      } else if (error.message.includes("Password")) {
        errorMessage = "Password must be at least 6 characters long";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
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
      // First delete from admin_users table
      const { error: adminDeleteError } = await supabase
        .from("admin_users")
        .delete()
        .eq("id", userId);

      if (adminDeleteError) {
        throw adminDeleteError;
      }

      // Note: We can't delete from auth.users with anon key, but deleting from admin_users
      // effectively removes their access to the admin panel
      console.log("✅ [AdminPanel] User removed from admin panel");

      await fetchUsers();
      alert(
        "User removed from admin panel successfully! Note: The user account still exists in Supabase Auth but can no longer access the admin panel."
      );
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user: " + error.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      console.log("🔄 [AdminPanel] Updating user:", selectedUser.id);

      // Update admin_users table
      const updateData = {
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone,
        position: formData.position,
        is_active: formData.is_active,
      };

      const { error: adminUserError } = await supabase
        .from("admin_users")
        .update(updateData)
        .eq("id", selectedUser.id);

      if (adminUserError) {
        console.error(
          "❌ [AdminPanel] Error updating admin user record:",
          adminUserError
        );
        throw adminUserError;
      }

      // Note: We can't update passwords with anon key
      if (formData.password && formData.password.trim() !== "") {
        setError(
          'Password update is not available with current permissions. User can reset their password using the "Forgot Password" option on the login page.'
        );
        // Don't throw error, just warn
      }

      console.log("✅ [AdminPanel] User updated successfully");

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
      setShowEditModal(false);
      setSelectedUser(null);

      // Refresh users list
      await fetchUsers();

      alert(
        "User updated successfully!" +
          (formData.password
            ? " Note: Password was not updated - user can reset it via login page."
            : "")
      );
    } catch (error) {
      console.error("Error updating user:", error);
      setError(error.message || "Failed to update user");
    } finally {
      setFormLoading(false);
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
      className={isMobile ? "mobile-container" : ""}
      style={
        isMobile
          ? {}
          : {
              padding: "24px",
              backgroundColor: "var(--color-bg-main)",
              minHeight: "100vh",
            }
      }
    >
      {/* Header Section */}
      <div
        className={isMobile ? "mobile-card" : ""}
        style={
          isMobile
            ? { marginBottom: "16px" }
            : {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "32px",
              }
        }
      >
        <div>
          <h1
            style={{
              fontSize: isMobile ? "24px" : "28px",
              fontWeight: "bold",
              color: isMobile ? "white" : "var(--color-text-primary)",
              margin: "0 0 8px 0",
              textShadow: isMobile ? "0 2px 4px rgba(0, 0, 0, 0.1)" : "none",
            }}
          >
            Admin Panel
          </h1>
          <p
            style={{
              color: isMobile ? "rgba(255, 255, 255, 0.8)" : "#6b7280",
              margin: 0,
            }}
          >
            User Management System
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: isMobile ? "white" : "#1f2937",
              }}
            >
              {user.email}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: isMobile ? "rgba(255, 255, 255, 0.7)" : "#6b7280",
              }}
            >
              Administrator
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(250px, 1fr))",
            gap: isMobile ? "16px" : "24px",
            marginBottom: isMobile ? "16px" : "32px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#dbeafe",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "12px",
                }}
              >
                <FiUsers color="#3b82f6" size={24} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Total Users
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#1f2937",
                  }}
                >
                  {stats.total}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#d1fae5",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "12px",
                }}
              >
                <FiUsers color="#10b981" size={24} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Active Users
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#1f2937",
                  }}
                >
                  {stats.active}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#fef3c7",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "12px",
                }}
              >
                <FiShield color="#f59e0b" size={24} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>Admins</div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#1f2937",
                  }}
                >
                  {stats.byRole.admin}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#e0e7ff",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "12px",
                }}
              >
                <FiUsers color="#6366f1" size={24} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Recent Logins
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#1f2937",
                  }}
                >
                  {stats.recentSignIns}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Controls */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                margin: 0,
              }}
            >
              User Management
            </h2>

            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              <FiUserPlus size={16} />
              Add User
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* Enhanced Search */}
            <div style={{ position: "relative", minWidth: "300px", flex: 1 }}>
              <FiSearch
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                }}
                size={16}
              />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  paddingLeft: "40px",
                  paddingRight: "12px",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#10b981";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(16, 185, 129, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Enhanced Role Filter */}
            <div style={{ position: "relative" }}>
              <FiFilter
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                }}
                size={16}
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  paddingLeft: "40px",
                  paddingRight: "12px",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                  outline: "none",
                  backgroundColor: "white",
                }}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            <button
              onClick={fetchUsers}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                opacity: loading ? 0.5 : 1,
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
      </div>

      {/* Enhanced Error Message */}
      {error && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <FiX color="#dc2626" size={20} />
          <p style={{ color: "#991b1b", margin: 0, fontSize: "14px" }}>
            {error}
          </p>
        </div>
      )}

      {/* Enhanced Users Table */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        {filteredUsers.length === 0 ? (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#f3f4f6",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px auto",
              }}
            >
              <FiUsers color="#9ca3af" size={40} />
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
                margin: "0 0 12px 0",
              }}
            >
              No users found
            </h3>
            <p
              style={{
                color: "#6b7280",
                margin: "0 0 32px 0",
                maxWidth: "400px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Get started by creating your first user to manage your pharmacy
              team.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              <FiUserPlus size={16} />
              Add User
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    User
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Role
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Last Sign In
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "right",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom:
                        index < filteredUsers.length - 1
                          ? "1px solid #f3f4f6"
                          : "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td style={{ padding: "20px 24px", whiteSpace: "nowrap" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                        }}
                      >
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            backgroundColor: "#e0f2fe",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <FiUser color="#0891b2" size={20} />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#1f2937",
                              marginBottom: "2px",
                            }}
                          >
                            {user.full_name || "Unnamed User"}
                          </div>
                          <div style={{ fontSize: "14px", color: "#6b7280" }}>
                            {user.email}
                          </div>
                          {user.phone && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#9ca3af",
                                marginTop: "2px",
                              }}
                            >
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "20px 24px", whiteSpace: "nowrap" }}>
                      <div>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "4px 12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            borderRadius: "999px",
                            backgroundColor:
                              user.role === "admin"
                                ? "#fef2f2"
                                : user.role === "manager"
                                  ? "#eff6ff"
                                  : user.role === "pharmacist"
                                    ? "#f0fdf4"
                                    : "#f9fafb",
                            color:
                              user.role === "admin"
                                ? "#991b1b"
                                : user.role === "manager"
                                  ? "#1e40af"
                                  : user.role === "pharmacist"
                                    ? "#166534"
                                    : "#374151",
                          }}
                        >
                          {user.role}
                        </span>
                        {user.position && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginTop: "4px",
                            }}
                          >
                            {user.position}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "20px 24px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          borderRadius: "999px",
                          backgroundColor: user.is_active
                            ? "#f0fdf4"
                            : "#fef2f2",
                          color: user.is_active ? "#166534" : "#991b1b",
                        }}
                      >
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: user.is_active
                              ? "#22c55e"
                              : "#ef4444",
                            marginRight: "6px",
                          }}
                        ></div>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "20px 24px",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td
                      style={{
                        padding: "20px 24px",
                        whiteSpace: "nowrap",
                        textAlign: "right",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setFormData({
                              email: user.email,
                              password: "",
                              full_name: user.full_name || "",
                              role: user.role,
                              phone: user.phone || "",
                              position: user.position || "",
                              is_active: user.is_active,
                            });
                            setShowEditModal(true);
                          }}
                          style={{
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#3b82f6",
                            backgroundColor: "transparent",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#eff6ff";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "transparent";
                          }}
                          title="Edit User"
                        >
                          <FiEdit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          style={{
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#dc2626",
                            backgroundColor: "transparent",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#fef2f2";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "transparent";
                          }}
                          title="Delete User"
                        >
                          <FiTrash2 size={14} />
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
      {showCreateModal && (
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 ${isMobile ? "p-2" : "p-4"}`}
        >
          <div
            className={`bg-white/95 backdrop-blur-sm rounded-3xl ${isMobile ? "w-full max-w-none mx-2 max-h-[95vh]" : "max-w-lg w-full max-h-[90vh]"} overflow-y-auto shadow-2xl border border-white/20`}
          >
            <div
              className={`flex items-center justify-between ${isMobile ? "p-5" : "p-7"} border-b border-gray-100/80`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                  <FiUserPlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2
                    className={`${isMobile ? "text-lg" : "text-xl"} font-bold text-gray-900`}
                  >
                    Create New User
                  </h2>
                  <p className="text-sm text-gray-600">
                    Add a new team member to the system
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateUser}
              className={`${isMobile ? "p-5" : "p-7"} space-y-6`}
            >
              {error && (
                <div className="bg-red-50/90 backdrop-blur-sm border border-red-200/60 rounded-2xl p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                      <FiX className="h-3 w-3 text-red-600" />
                    </div>
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-semibold text-gray-700 ${isMobile ? "mb-3" : "mb-2"}`}
                  >
                    Full Name *
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
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
                      placeholder="Enter full name"
                      className={`w-full pl-12 pr-4 ${isMobile ? "py-4 text-base" : "py-3.5"} border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold text-gray-700 ${isMobile ? "mb-3" : "mb-2"}`}
                  >
                    Email Address *
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                      placeholder="Enter email address"
                      className={`w-full pl-12 pr-4 ${isMobile ? "py-4 text-base" : "py-3.5"} border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold text-gray-700 ${isMobile ? "mb-3" : "mb-2"}`}
                  >
                    Password *
                  </label>
                  <div className="relative">
                    <FiKey className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
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
                      placeholder="Enter password (min 6 characters)"
                      className={`w-full pl-12 pr-12 ${isMobile ? "py-4 text-base" : "py-3.5"} border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-100"
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-4 w-4" />
                      ) : (
                        <FiEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                    <FiShield className="h-3 w-3" />
                    <span>Password should be at least 6 characters long</span>
                  </p>
                </div>

                <div
                  className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-2 gap-4"}`}
                >
                  <div>
                    <label
                      className={`block text-sm font-semibold text-gray-700 ${isMobile ? "mb-3" : "mb-2"}`}
                    >
                      Role *
                    </label>
                    <div className="relative">
                      <FiBriefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <select
                        value={formData.role}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            role: e.target.value,
                          }))
                        }
                        required
                        className={`w-full pl-12 pr-4 ${isMobile ? "py-4 text-base" : "py-3.5"} border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70 appearance-none cursor-pointer`}
                      >
                        <option value="staff">Staff</option>
                        <option value="pharmacist">Pharmacist</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold text-gray-700 ${isMobile ? "mb-3" : "mb-2"}`}
                    >
                      Phone
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="Enter phone number"
                        className={`w-full pl-12 pr-4 ${isMobile ? "py-4 text-base" : "py-3.5"} border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold text-gray-700 ${isMobile ? "mb-3" : "mb-2"}`}
                  >
                    Position
                  </label>
                  <div className="relative">
                    <FiBriefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          position: e.target.value,
                        }))
                      }
                      placeholder="e.g., Senior Pharmacist, Store Manager"
                      className={`w-full pl-12 pr-4 ${isMobile ? "py-4 text-base" : "py-3.5"} border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70`}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50/70 rounded-xl border border-gray-100">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 text-teal-600 bg-white border-2 border-gray-300 rounded-lg focus:ring-teal-500 focus:ring-2 transition-all duration-200"
                  />
                  <label
                    htmlFor="is_active"
                    className="text-sm font-semibold text-gray-700 cursor-pointer"
                  >
                    Active user (can log in and access the system)
                  </label>
                </div>
              </div>

              <div
                className={`flex ${isMobile ? "flex-col space-y-3" : "justify-end space-x-3"} pt-6 border-t border-gray-100/50`}
              >
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={formLoading}
                  className={`${isMobile ? "w-full py-4 text-base" : "px-8 py-3"} border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all duration-200 font-medium flex items-center justify-center space-x-2`}
                >
                  <FiX className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={`flex items-center justify-center gap-2 ${isMobile ? "w-full py-4 text-base" : "px-8 py-3"} bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-600 hover:to-emerald-600 shadow-lg hover:shadow-xl disabled:opacity-50 transition-all duration-200 font-medium`}
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="h-4 w-4" />
                      <span>Create User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Edit User Modal */}
      {showEditModal && selectedUser && (
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 ${isMobile ? "p-2" : "p-4"}`}
        >
          <div
            className={`bg-white/95 backdrop-blur-sm rounded-3xl ${isMobile ? "w-full max-w-none mx-2 max-h-[95vh]" : "max-w-lg w-full max-h-[90vh]"} overflow-y-auto shadow-2xl border border-white/20`}
          >
            <div
              className={`flex items-center justify-between ${isMobile ? "p-5" : "p-7"} border-b border-gray-100/80`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                  <FiEdit3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2
                    className={`${isMobile ? "text-lg" : "text-xl"} font-bold text-gray-900`}
                  >
                    Edit User
                  </h2>
                  <p className="text-sm text-gray-600">
                    Update user information and permissions
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  setFormData({
                    email: "",
                    password: "",
                    full_name: "",
                    role: "staff",
                    phone: "",
                    position: "",
                    is_active: true,
                  });
                }}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateUser}
              className={`${isMobile ? "p-5" : "p-7"} space-y-6`}
            >
              {error && (
                <div className="bg-red-50/90 backdrop-blur-sm border border-red-200/60 rounded-2xl p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                      <FiX className="h-3 w-3 text-red-600" />
                    </div>
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-semibold text-gray-700 ${isMobile ? "mb-3" : "mb-2"}`}
                  >
                    Full Name *
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
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
                      placeholder="Enter full name"
                      className={`w-full pl-12 pr-4 ${isMobile ? "py-4 text-base" : "py-3.5"} border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold text-gray-700 ${isMobile ? "mb-3" : "mb-2"}`}
                  >
                    Email Address *
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                      placeholder="Enter email address"
                      disabled
                      className={`w-full pl-12 pr-4 ${isMobile ? "py-4 text-base" : "py-3.5"} border border-gray-200 rounded-xl bg-gray-100/70 text-gray-500 cursor-not-allowed`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                    <FiShield className="h-3 w-3" />
                    <span>Email cannot be changed after user creation</span>
                  </p>
                </div>

                <div
                  className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-2 gap-4"}`}
                >
                  <div>
                    <label
                      className={`block text-sm font-semibold text-gray-700 ${isMobile ? "mb-3" : "mb-2"}`}
                    >
                      Role *
                    </label>
                    <div className="relative">
                      <FiBriefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <select
                        value={formData.role}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            role: e.target.value,
                          }))
                        }
                        required
                        className={`w-full pl-12 pr-4 ${isMobile ? "py-4 text-base" : "py-3.5"} border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70 appearance-none cursor-pointer`}
                      >
                        <option value="staff">Staff</option>
                        <option value="pharmacist">Pharmacist</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold text-gray-700 ${isMobile ? "mb-3" : "mb-2"}`}
                    >
                      Phone
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="Enter phone number"
                        className={`w-full pl-12 pr-4 ${isMobile ? "py-4 text-base" : "py-3.5"} border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold text-gray-700 ${isMobile ? "mb-3" : "mb-2"}`}
                  >
                    Position
                  </label>
                  <div className="relative">
                    <FiBriefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          position: e.target.value,
                        }))
                      }
                      placeholder="e.g., Senior Pharmacist, Store Manager"
                      className={`w-full pl-12 pr-4 ${isMobile ? "py-4 text-base" : "py-3.5"} border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70`}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50/70 rounded-xl border border-gray-100">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 text-teal-600 bg-white border-2 border-gray-300 rounded-lg focus:ring-teal-500 focus:ring-2 transition-all duration-200"
                  />
                  <label
                    htmlFor="edit_is_active"
                    className="text-sm font-semibold text-gray-700 cursor-pointer"
                  >
                    Active user (can log in and access the system)
                  </label>
                </div>
              </div>

              <div
                className={`flex ${isMobile ? "flex-col space-y-3" : "justify-end space-x-3"} pt-6 border-t border-gray-100/50`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    setFormData({
                      email: "",
                      password: "",
                      full_name: "",
                      role: "staff",
                      phone: "",
                      position: "",
                      is_active: true,
                    });
                  }}
                  disabled={formLoading}
                  className={`${isMobile ? "w-full py-4 text-base" : "px-8 py-3"} border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all duration-200 font-medium flex items-center justify-center space-x-2`}
                >
                  <FiX className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={`flex items-center justify-center gap-2 ${isMobile ? "w-full py-4 text-base" : "px-8 py-3"} bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl disabled:opacity-50 transition-all duration-200 font-medium`}
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="h-4 w-4" />
                      <span>Update User</span>
                    </>
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
