import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });      if (error) {
        console.error('❌ [Login] Auth error:', error);
        
        // Handle specific error cases
        if (error.message === 'Email not confirmed') {
          setError('Account created but email not confirmed. For admin accounts, please contact your system administrator or check your Supabase email confirmation settings.');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.user) {
        console.log('✅ [Login] Login successful, user:', data.user.id);
        
        // Redirect to admin panel
        navigate('/admin');
      }
    } catch (error) {
      console.error('❌ [Login] Unexpected error:', error);
      setError('An unexpected error occurred. Please try again.');
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
