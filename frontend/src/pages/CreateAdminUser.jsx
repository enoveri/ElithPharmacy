import React, { useState } from 'react';
import { createDefaultAdminUser, checkAdminUserExists } from '../utils/createAdminUser';

const CreateAdminUser = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCreateAdmin = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔄 [CreateAdminUser] Starting admin user creation...');
      
      const response = await createDefaultAdminUser();
      
      if (response.success) {
        setResult(response);
        console.log('✅ [CreateAdminUser] Admin user created successfully:', response);
      } else {
        setError(response.error);
        console.error('❌ [CreateAdminUser] Failed to create admin user:', response.error);
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ [CreateAdminUser] Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUser = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await checkAdminUserExists('admin@elith.com');
      setResult(response);
      console.log('🔍 [CreateAdminUser] User check result:', response);
    } catch (err) {
      setError(err.message);
      console.error('❌ [CreateAdminUser] Error checking user:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Admin User</h1>
          <p className="text-gray-600">Development utility to create admin user</p>
        </div>

        <div className="space-y-6">
          {/* Admin User Details */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Admin User Details</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Email:</strong> admin@elith.com</div>
              <div><strong>Password:</strong> admin</div>
              <div><strong>Role:</strong> Admin</div>
              <div><strong>Full Name:</strong> System Administrator</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCreateAdmin}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating Admin User...' : 'Create Admin User'}
            </button>

            <button
              onClick={handleCheckUser}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Checking...' : 'Check if User Exists'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">Error</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Success/Result Display */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">
                {result.success ? 'Success' : 'Result'}
              </h4>
              {result.success ? (
                <div className="space-y-2 text-sm">
                  <p className="text-green-700">{result.message}</p>
                  {result.data && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-green-800 font-medium">
                        Technical Details
                      </summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <p className="text-green-700">{result.error}</p>
                  {result.data && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-green-800 font-medium">
                        Existing User Details
                      </summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Instructions</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Click "Create Admin User" to create the admin account</li>
              <li>• Use "Check if User Exists" to verify current status</li>
              <li>• After creation, you can log in with the credentials above</li>
              <li>• This page should only be used during development</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAdminUser; 