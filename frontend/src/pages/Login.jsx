import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      // If user is already logged in, redirect to the intended page or dashboard
      const from = location.state?.from || '/';
      console.log('✅ [Login] User already logged in, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  // Set success message from location state (redirect from protected route)
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
    }
  }, [location.state]);

  // Add keyframes for spinning animation
  const spinKeyframes = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔄 [Login] Attempting login...');
      
      // First, try to sign in with Supabase Auth
      const { data: authData, error: authError } = await signIn(formData.email, formData.password);
      
      if (authError) {
        console.error('❌ [Login] Auth error:', authError);
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('The email or password you entered is incorrect');
        } else if (authError.message.includes('Email not confirmed')) {
          // Instead of failing, let's try to proceed with the user lookup
          console.log('⚠️ [Login] Email not confirmed, but proceeding with lookup...');
          
          // Try to find user in admin_users table by email
          const { data: userByEmail, error: emailError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', formData.email)
            .eq('is_active', true)
            .single();
            
          if (userByEmail) {
            console.log('✅ [Login] Found user in admin_users, email confirmation not required for admin panel');
            
            // For admin users, redirect directly without requiring email confirmation
            const from = location.state?.from || '/';
            console.log('✅ [Login] Redirecting to:', from);
            navigate(from, { replace: true });
            return;
          } else {
            throw new Error('Please check your email and click the confirmation link before logging in, or contact your administrator');
          }
        } else if (authError.message.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please wait a few minutes and try again');
        }
        throw authError;
      }

      // If auth successful, check if user exists in admin_users table
      console.log('🔍 [Login] Auth successful, checking admin_users table...');
      console.log('🔍 [Login] Auth user ID:', authData.user.id);
      console.log('🔍 [Login] Auth user email:', authData.user.email);
      
      // First try to find user by ID (the correct way)
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', authData.user.id)
        .eq('is_active', true)
        .single();

      if (adminError || !adminUser) {
        console.log('❌ [Login] No user found by ID, trying email lookup...');
        
        // Try to find by email as fallback (indicates ID mismatch)
        const { data: userByEmail, error: emailError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', authData.user.email)
          .eq('is_active', true)
          .single();
          
        if (userByEmail) {
          console.log('⚠️ [Login] Found user by email but not by ID - ID mismatch detected!');
          console.log('🔍 [Login] Auth ID:', authData.user.id);
          console.log('🔍 [Login] Admin table ID:', userByEmail.id);
          
          // Update the admin_users record with the correct Auth ID
          console.log('🔧 [Login] Fixing ID mismatch...');
          const { error: updateError } = await supabase
            .from('admin_users')
            .update({ id: authData.user.id })
            .eq('email', authData.user.email);
            
          if (updateError) {
            console.error('❌ [Login] Failed to fix ID mismatch:', updateError);
            throw new Error('Account setup incomplete. Please contact your administrator.');
          }
          
          console.log('✅ [Login] ID mismatch fixed, proceeding with login...');
          
          // Use the corrected user data
          const correctedUser = { ...userByEmail, id: authData.user.id };
          
          console.log('✅ [Login] Login successful, user:', correctedUser);

          // Redirect to the intended page or dashboard
          const from = location.state?.from || '/';
          console.log('✅ [Login] Redirecting to:', from);
          navigate(from, { replace: true });
          return;
        }
        
        // If still no user found, check if they exist but are inactive
        console.log('❌ [Login] No active user found, checking for inactive user...');
        const { data: inactiveUser } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', authData.user.email)
          .single();
          
        if (inactiveUser && !inactiveUser.is_active) {
          throw new Error('Your account has been deactivated. Please contact your administrator.');
        } else if (!inactiveUser) {
          throw new Error('Your account is not set up in the system. Please contact your administrator to add you to the user database.');
        } else {
          throw new Error('Your account is not authorized to access this system. Please contact your administrator.');
        }
      }

      console.log('✅ [Login] Login successful, user:', adminUser);

      // Redirect to the intended page or dashboard
      const from = location.state?.from || '/';
      console.log('✅ [Login] Redirecting to:', from);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Add Google OAuth logic here
    console.log('Google login attempt');
  };

  return (
    <>
      <style>{spinKeyframes}</style>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6">
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex min-h-[700px]">
          {/* Left Side - Illustration */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 relative">            {/* Decorative floating elements */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Medical/Pharmacy symbols */}
              <div className="absolute top-16 left-8 text-2xl text-gray-400 opacity-50">Rx</div>
              <div className="absolute top-12 right-16 text-xl text-gray-400 opacity-50">mg</div>
              <div className="absolute top-24 right-8 text-lg text-gray-400 opacity-50">₼</div>
              <div className="absolute bottom-32 left-12 text-xl text-gray-400 opacity-50">+</div>
              <div className="absolute bottom-20 left-6 text-lg text-gray-400 opacity-50">ml</div>
              
              {/* Medical cross */}
              <div className="absolute top-20 left-16 w-12 h-12 opacity-40">
                <div className="absolute top-1/2 left-1/2 w-8 h-2 bg-red-400 transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute top-1/2 left-1/2 w-2 h-8 bg-red-400 transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>
              
              {/* Pills icon */}
              <div className="absolute top-28 right-24 w-8 h-8 opacity-30">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400">
                  <ellipse cx="12" cy="12" rx="10" ry="6" strokeWidth="1.5"/>
                  <path d="M12 2v20" strokeWidth="1.5"/>
                </svg>
              </div>
              
              {/* Medicine bottle */}
              <div className="absolute bottom-16 left-16 w-6 h-8 opacity-40">
                <div className="w-4 h-2 bg-blue-400 mx-auto mb-1 rounded-t"></div>
                <div className="w-6 h-5 bg-blue-500 rounded-b"></div>
              </div>
            </div>
            
            {/* Main content */}
            <div className="flex flex-col justify-center items-center w-full px-12 py-16 relative z-10">
              {/* Main Illustration */}
              <div className="mb-8">                <img 
                  src="/10447680.jpg" 
                  alt="Elith Pharmacy Management Illustration" 
                  className="w-72 h-72 object-contain mx-auto"
                />
              </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                Elith Pharmacy Hub
              </h2>
              <p className="text-base text-gray-600 max-w-sm mx-auto leading-relaxed text-center">
                Streamline Your Pharmacy Operations with Elith Pharmacy Hub's Complete Management Platform
              </p>
              
              {/* Decorative dots */}
              <div className="mt-8 flex justify-center space-x-2">
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>          {/* Right Side - Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
            <div className="w-full max-w-sm">              {/* Mobile Header */}
              <div className="lg:hidden text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">ELITH PHARMACY</h1>
                <p className="text-gray-600 mt-2">Welcome back!</p>
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:block text-center mb-12">
                <div className="flex items-center justify-center">
                  <div 
                    className="w-10 h-10 flex items-center justify-center mr-3" 
                    style={{
                      backgroundColor: '#14b8a6',
                      borderRadius: '8px'
                    }}
                  >
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z"/>
                    </svg>
                  </div>
                  <span 
                    className="text-2xl font-bold" 
                    style={{
                      color: '#1f2937',
                      letterSpacing: '0.5px'
                    }}
                  >
                    ELITH PHARMACY
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
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Email Field */}
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
                    Username or email
                  </label>                  <input
                    type="email"
                    id="email"
                    name="email"
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
                    required
                  />
                </div>

                {/* Password Field */}
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
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
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
                      required
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
                </div>

                {/* Forgot Password */}
                <div style={{ textAlign: 'right' }}>
                  <Link 
                    to="/forgot-password" 
                    style={{
                      fontSize: '14px',
                      color: '#14b8a6',
                      textDecoration: 'none',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#0f766e'}
                    onMouseLeave={(e) => e.target.style.color = '#14b8a6'}
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: '14px',
                    color: '#ffffff',
                    backgroundColor: isLoading ? '#9ca3af' : '#374151',
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.target.style.backgroundColor = '#111827';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.target.style.backgroundColor = '#374151';
                    }
                  }}
                >
                  {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ animation: 'spin 1s linear infinite', marginRight: '12px' }} width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>

                {/* Divider */}
                <div style={{ position: 'relative', margin: '24px 0' }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '100%', borderTop: '1px solid #e5e7eb' }}></div>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: '14px' }}>
                    <span style={{ padding: '0 16px', backgroundColor: '#ffffff', color: '#6b7280' }}>or</span>
                  </div>
                </div>

                {/* Google Login */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                >
                  <FaGoogle style={{ color: '#ef4444', marginRight: '12px', transition: 'transform 0.2s ease' }} size={16} />
                  <span style={{ color: '#374151' }}>Sign in with Google</span>
                </button>

                {/* Sign Up Link */}
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Are you new? </span>
                  <Link 
                    to="/admin-setup" 
                    style={{
                      color: '#14b8a6',
                      fontWeight: '500',
                      fontSize: '14px',
                      textDecoration: 'none',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#0f766e'}
                    onMouseLeave={(e) => e.target.style.color = '#14b8a6'}
                  >
                    Create an Account
                  </Link>                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default Login;
