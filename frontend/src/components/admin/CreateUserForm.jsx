import React, { useState } from "react";
import { supabase } from "../../lib/supabase";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "staff", label: "Staff" },
];

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const CreateUserForm = ({ open, onClose, onUserCreated, isMobile }) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "admin",
    phone: "",
    position: "",
    is_active: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!open) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
    setSuccess("");
  };

  const validate = () => {
    if (!formData.full_name) return "Full name is required";
    if (!formData.email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Invalid email address";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 6) return "Password must be at least 6 characters long";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setFormLoading(true);
    try {
      // Step 1: Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          },
        },
      });
      if (authError) throw authError;
      // Step 2: Create user in admin_users table
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
      if (adminUserError) throw adminUserError;
      setSuccess("User created successfully!");
      setFormData({
        full_name: "",
        email: "",
        password: "",
        role: "admin",
        phone: "",
        position: "",
        is_active: true,
      });
      if (onUserCreated) onUserCreated(adminUserData);
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to create user");
    } finally {
      setFormLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordStrengthText = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"][passwordStrength];
  const passwordStrengthColors = ["#f87171", "#fbbf24", "#facc15", "#34d399", "#059669"];

  // Styles
  const modalStyle = isMobile
    ? {
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
        zIndex: 1000,
        background: "rgba(30,41,59,0.25)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 0,
      }
    : {
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(30,41,59,0.25)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      };

  const formStyle = isMobile
    ? {
        background: "rgba(255,255,255,0.98)",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(30,41,59,0.18)",
        border: "1.5px solid #e5e7eb",
        width: "100%",
        maxWidth: 420,
        minHeight: 0,
        maxHeight: "90vh",
        padding: 20,
        paddingBottom: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontFamily: "inherit",
        overflowY: "auto",
        position: "relative",
      }
    : {
        background: "rgba(255,255,255,0.97)",
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(30,41,59,0.18)",
        border: "1.5px solid #e5e7eb",
        minWidth: 380,
        maxWidth: 420,
        width: "100%",
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        fontFamily: "inherit",
        maxHeight: "90vh",
        overflowY: "auto",
      };

  const labelStyle = {
    fontWeight: 600,
    fontSize: isMobile ? 16 : 15,
    color: "#374151",
    marginBottom: 4,
  };
  const inputStyle = {
    width: "100%",
    padding: isMobile ? "16px 14px" : "12px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    fontSize: isMobile ? 17 : 15,
    background: "#f9fafb",
    marginBottom: 8,
  };
  const buttonStyle = {
    padding: isMobile ? "16px 0" : "10px 28px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(90deg, #10b981 0%, #06b6d4 100%)",
    color: "#fff",
    fontWeight: 700,
    fontSize: isMobile ? 18 : 15,
    cursor: formLoading ? "not-allowed" : "pointer",
    boxShadow: "0 2px 8px rgba(16,185,129,0.10)",
    opacity: formLoading ? 0.7 : 1,
    transition: "background 0.2s, opacity 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: isMobile ? "100%" : undefined,
  };
  const cancelButtonStyle = {
    padding: isMobile ? "16px 0" : "10px 28px",
    borderRadius: 8,
    border: "1.5px solid #e5e7eb",
    background: "#fff",
    color: "#374151",
    fontWeight: 600,
    fontSize: isMobile ? 18 : 15,
    cursor: "pointer",
    transition: "background 0.2s, color 0.2s",
    marginRight: isMobile ? 0 : 2,
    width: isMobile ? "100%" : undefined,
  };

  return (
    <div style={modalStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={{ marginBottom: isMobile ? 4 : 8 }}>
          <div style={{ fontWeight: 700, fontSize: isMobile ? 24 : 22, color: "#22223b", marginBottom: 2 }}>Create New User</div>
          <div style={{ fontSize: isMobile ? 15 : 14, color: "#64748b", fontWeight: 500 }}>Add a new team member to the system</div>
        </div>
        {error && (
          <div style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 4 }}>{error}</div>
        )}
        {success && (
          <div style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 4 }}>{success}</div>
        )}
        <label style={labelStyle}>Full Name *</label>
        <input
          type="text"
          name="full_name"
          value={formData.full_name}
          onChange={handleInputChange}
          required
          placeholder="Enter full name"
          style={inputStyle}
        />
        <label style={labelStyle}>Email Address *</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          placeholder="Enter email address"
          style={inputStyle}
        />
        <label style={labelStyle}>Password *</label>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            placeholder="Create a password"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "#64748b",
              fontSize: isMobile ? 22 : 16,
              cursor: "pointer",
              padding: 0,
            }}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
        {formData.password && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: isMobile ? 120 : 90, height: 6, borderRadius: 4, background: "#e5e7eb", overflow: "hidden" }}>
              <div
                style={{
                  width: `${(passwordStrength / 4) * 100}%`,
                  height: 6,
                  borderRadius: 4,
                  background: passwordStrengthColors[passwordStrength],
                  transition: "width 0.3s, background 0.3s",
                }}
              ></div>
            </div>
            <span style={{ fontSize: 12, color: passwordStrengthColors[passwordStrength], fontWeight: 600 }}>{passwordStrengthText}</span>
          </div>
        )}
        <div style={{ display: "flex", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
              style={{
                ...inputStyle,
                appearance: "none",
                fontSize: isMobile ? 17 : 15,
              }}
            >
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter phone number"
              style={inputStyle}
            />
          </div>
        </div>
        <label style={labelStyle}>Position</label>
        <input
          type="text"
          name="position"
          value={formData.position}
          onChange={handleInputChange}
          placeholder="e.g. Senior Pharmacist, Store Manager"
          style={inputStyle}
        />
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleInputChange}
            style={{
              width: isMobile ? 22 : 18,
              height: isMobile ? 22 : 18,
              borderRadius: 5,
              border: "1.5px solid #e5e7eb",
              accentColor: "#10b981",
              marginRight: 10,
            }}
          />
          <label htmlFor="is_active" style={{ fontWeight: 700, color: "#22223b", fontSize: isMobile ? 17 : 15, cursor: "pointer" }}>Active user</label>
        </div>
        <div style={{ color: "#64748b", fontSize: isMobile ? 15 : 13, marginBottom: isMobile ? 24 : 18, marginLeft: 2 }}>Can log in and access the system</div>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "flex-end", gap: isMobile ? 12 : 10, marginTop: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={formLoading}
            style={cancelButtonStyle}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formLoading}
            style={buttonStyle}
          >
            {formLoading ? (
              <span>Creating...</span>
            ) : (
              <span>Create User</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUserForm;
