import React, { useState, useEffect } from 'react';
import { FiDatabase, FiCheckCircle, FiAlertTriangle, FiRefreshCw, FiCopy } from 'react-icons/fi';
import { setupDatabase } from '../../lib/db/setup';

const DatabaseSetup = () => {
  const [status, setStatus] = useState('checking');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    setLoading(true);
    setStatus('checking');
    
    try {
      const result = await setupDatabase.initializeDatabase();
      setResults(result);
      setStatus(result.success ? 'ready' : 'error');
    } catch (error) {
      setResults({ success: false, error: error.message });
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const copySQL = () => {
    const sql = `-- Create notifications table for Elith Pharmacy
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'normal',
  data JSONB DEFAULT NULL,
  action_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Users can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update notifications" ON notifications FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users can delete notifications" ON notifications FOR DELETE USING (user_id = auth.uid() OR user_id IS NULL);`;

    navigator.clipboard.writeText(sql).then(() => {
      alert('SQL copied to clipboard!');
    });
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <FiRefreshCw className="animate-spin text-blue-500" />;
      case 'ready':
        return <FiCheckCircle className="text-green-500" />;
      case 'error':
        return <FiAlertTriangle className="text-red-500" />;
      default:
        return <FiDatabase className="text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'checking':
        return 'Checking database setup...';
      case 'ready':
        return 'Database is ready! Notifications should work properly.';
      case 'error':
        return 'Database setup required. Please create the notifications table.';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <FiDatabase className="text-2xl text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Database Setup</h2>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          {getStatusIcon()}
          <span className="font-medium">{getStatusMessage()}</span>
          <button
            onClick={checkDatabase}
            disabled={loading}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Recheck
          </button>
        </div>
      </div>

      {status === 'error' && results?.instructions && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-bold text-red-800 mb-3">Setup Required</h3>
          <p className="text-red-700 mb-4">
            The notifications table doesn't exist in your Supabase database. Please follow these steps:
          </p>
          
          <ol className="list-decimal list-inside text-red-700 mb-4 space-y-2">
            {results.instructions.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>

          <div className="mt-4">
            <button
              onClick={copySQL}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <FiCopy />
              Copy SQL to Clipboard
            </button>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-bold text-green-800 mb-2">✅ Database Ready!</h3>
          <p className="text-green-700">
            All required tables exist. The notification system should work properly now.
            You can close this setup page and return to using the application.
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-2">📋 Manual Setup Instructions</h3>
        <p className="text-blue-700 mb-3">
          If you prefer to set up the database manually, follow these steps:
        </p>
        <ol className="list-decimal list-inside text-blue-700 space-y-1">
          <li>Open your Supabase dashboard</li>
          <li>Navigate to "SQL Editor"</li>
          <li>Click "Copy SQL" above and paste it into the editor</li>
          <li>Run the SQL script</li>
          <li>Return here and click "Recheck"</li>
        </ol>
      </div>
    </div>
  );
};

export default DatabaseSetup;
