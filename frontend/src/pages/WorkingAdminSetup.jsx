import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUserShield } from 'react-icons/fa';
import { dbHelpers } from "../lib/db";
import { supabase } from "../lib/supabase";

const AdminSetup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasAdminUsers, setHasAdminUsers] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Add keyframes for spinning animation
  const spinKeyframes = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  // Check if admin users already exist
  useEffect(() => {
    const checkExistingAdmins = async () => {
      try {
        setCheckingAdmin(true);
        const result = await dbHelpers.getAdminUsers();
        if (result.success && result.data && result.data.length > 0) {
          setHasAdminUsers(true);
        }
      } catch (error) {
        console.error("Error checking admin users:", error);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkExistingAdmins();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
      setError("All fields are required");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      console.log("🔄 [AdminSetup] Creating admin user...");      // Create user in Supabase Auth with email confirmation disabled
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
          data: {
            full_name: formData.fullName,
            role: 'admin'
          }
        }
      });

      if (authError) {
        console.error("❌ [AdminSetup] Auth error:", authError);
        throw new Error(authError.message);
      }

      console.log("✅ [AdminSetup] User created in auth:", authData.user?.id);

      // If user needs email confirmation, let's try to manually confirm them
      if (authData.user && !authData.user.email_confirmed_at) {
        console.log("🔄 [AdminSetup] User needs email confirmation, attempting manual confirmation...");
        
        // For admin users, we'll update them as confirmed in the database
        // Note: This requires RLS to be disabled or proper policies
        try {
          const { error: confirmError } = await supabase
            .from('auth.users')
            .update({ 
              email_confirmed_at: new Date().toISOString(),
              confirmed_at: new Date().toISOString()
            })
            .eq('id', authData.user.id);
            
          if (confirmError) {
            console.warn("⚠️ [AdminSetup] Could not auto-confirm email:", confirmError);
          } else {
            console.log("✅ [AdminSetup] Email auto-confirmed for admin user");
          }
        } catch (confirmError) {
          console.warn("⚠️ [AdminSetup] Email confirmation attempt failed:", confirmError);
        }
      }

      // Create admin user record in database
      const adminUserData = {
        email: formData.email,
        full_name: formData.fullName,
        role: 'admin',
        is_active: true
      };

      const result = await dbHelpers.createAdminUser(adminUserData);

      if (result.success) {
        console.log("✅ [AdminSetup] Admin user created successfully");
        setSuccess("Admin user created successfully! Redirecting to login...");
        
        // Clear form
        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          fullName: "",
        });

        // Redirect to login after a short delay
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        throw new Error(result.error?.message || "Failed to create admin user");
      }

    } catch (error) {
      console.error("❌ [AdminSetup] Error:", error);
      setError(error.message || "Failed to create admin user");
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigate("/login");
  };

  if (checkingAdmin) {
    return (
      <>
        <style>{spinKeyframes}</style>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <div 
              className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"
              style={{ animation: 'spin 1s linear infinite' }}
            ></div>
            <p className="text-center mt-4 text-gray-600 font-medium">Checking system status...</p>
          </div>
        </div>
      </>
    );
  }

  if (hasAdminUsers) {
    return (
      <>
        <style>{spinKeyframes}</style>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <FaUserShield className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Admin Already Configured
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                The system already has admin users configured. Please use the login page to access the admin panel.
              </p>
              <button
                onClick={goToLogin}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#14b8a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0f9383'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#14b8a6'}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{spinKeyframes}</style>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6">
        <div className="w-full max-w-7xl bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex min-h-[700px]">
            {/* Left Side - Illustration */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 relative">
              {/* Decorative floating elements */}
              <div className="absolute inset-0 overflow-hidden">
                {/* Admin/Security symbols */}
                <div className="absolute top-16 left-8 text-2xl text-gray-400 opacity-50">🛡️</div>
                <div className="absolute top-12 right-16 text-xl text-gray-400 opacity-50">👤</div>
                <div className="absolute top-24 right-8 text-lg text-gray-400 opacity-50">🔐</div>
                <div className="absolute bottom-32 left-12 text-xl text-gray-400 opacity-50">⚡</div>
                <div className="absolute bottom-20 left-6 text-lg text-gray-400 opacity-50">🔑</div>
                
                {/* Security shield */}
                <div className="absolute top-20 left-16 w-12 h-12 opacity-40">
                  <FaUserShield className="w-full h-full text-blue-500" />
                </div>
              </div>
              
              {/* Main content */}
              <div className="flex flex-col justify-center items-center w-full px-12 py-16 relative z-10">
                {/* Main Illustration */}
                <div className="mb-8">
                  <img 
                    src="/3864729.jpg" 
                    alt="Admin Setup Illustration" 
                    className="w-72 h-72 object-contain mx-auto"
                  />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                  Admin Setup
                </h2>
                <p className="text-base text-gray-600 max-w-sm mx-auto leading-relaxed text-center">
                  Create the first administrator account to get started with Elith Pharmacy Management System
                </p>
                
                {/* Decorative dots */}
                <div className="mt-8 flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Right Side - Setup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
              <div className="w-full max-w-sm">
                {/* Mobile Header */}
                <div className="lg:hidden text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-800">ELITH PHARMACY</h1>
                  <p className="text-gray-600 mt-2">Admin Setup</p>
                </div>                {/* Desktop Header */}
                <div className="hidden lg:block text-center mb-12">
                  <div className="flex items-center justify-center">
                    <div 
                      className="w-10 h-10 flex items-center justify-center mr-3" 
                      style={{
                        backgroundColor: '#14b8a6',
                        borderRadius: '8px'
                      }}
                    >
                      <FaUserShield className="w-6 h-6 text-white" />
                    </div>
                    <span 
                      className="text-2xl font-bold" 
                      style={{
                        color: '#1f2937',
                        letterSpacing: '0.5px'
                      }}
                    >
                      ADMIN SETUP
                    </span>
                  </div>
                </div>

                {error && (
                  <div 
                    style={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ color: '#dc2626', marginRight: '8px' }}>⚠️</span>
                    <span style={{ color: '#991b1b', fontSize: '14px' }}>{error}</span>
                  </div>
                )}

                {success && (
                  <div 
                    style={{
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ color: '#16a34a', marginRight: '8px' }}>✅</span>
                    <span style={{ color: '#15803d', fontSize: '14px' }}>{success}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>                  {/* Full Name Field */}
                  <div>
                    <label 
                      htmlFor="fullName" 
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}
                    >
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: '#f9fafb',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.backgroundColor = '#f9fafb';
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>{/* Email Field */}
                  <div>
                    <label 
                      htmlFor="email" 
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="example@gmail.com"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: '#f9fafb',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.backgroundColor = '#f9fafb';
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>                  {/* Password Field */}
                  <div>
                    <label 
                      htmlFor="password" 
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}
                    >
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••••"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          paddingRight: '48px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          transition: 'all 0.2s ease',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.backgroundColor = '#ffffff';
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.backgroundColor = '#f9fafb';
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          padding: '4px',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#6b7280'}
                        onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                      >
                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </button>
                    </div>
                  </div>                  {/* Confirm Password Field */}
                  <div>
                    <label 
                      htmlFor="confirmPassword" 
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}
                    >
                      Confirm Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="••••••••••"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          paddingRight: '48px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          transition: 'all 0.2s ease',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.backgroundColor = '#ffffff';
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.backgroundColor = '#f9fafb';
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          padding: '4px',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#6b7280'}
                        onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                      >
                        {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </button>
                    </div>
                  </div>                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontWeight: '500',
                      fontSize: '14px',
                      color: '#ffffff',
                      backgroundColor: loading ? '#9ca3af' : '#374151',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.target.style.backgroundColor = '#111827';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.target.style.backgroundColor = '#374151';
                      }
                    }}
                  >
                    {loading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg style={{ animation: 'spin 1s linear infinite', marginRight: '12px' }} width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Admin...
                      </div>
                    ) : (
                      "Create Admin Account"
                    )}
                  </button>                  {/* Login Link */}
                  <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Already have an account? </span>
                    <button
                      type="button"
                      onClick={goToLogin}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#14b8a6',
                        fontWeight: '500',
                        fontSize: '14px',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#0f766e'}
                      onMouseLeave={(e) => e.target.style.color = '#14b8a6'}
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSetup;
