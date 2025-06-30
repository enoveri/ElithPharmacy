import React, { useState, useEffect } from 'react';
import { FiMail, FiSend, FiRefreshCw, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import { emailService } from '../../lib/emailService';

const EmailNotificationPanel = () => {
  const [pendingEmails, setPendingEmails] = useState([]);
  const [emailStats, setEmailStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastProcessed, setLastProcessed] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadEmailData();
  }, []);

  const loadEmailData = async () => {
    setLoading(true);
    try {
      console.log('🔄 [EmailPanel] Loading email data...');
      
      // Load pending emails
      const pendingResult = await emailService.getPendingEmails(10);
      if (pendingResult.data) {
        setPendingEmails(pendingResult.data);
        console.log('✅ [EmailPanel] Loaded pending emails:', pendingResult.data.length);
      }

      // Load email stats
      const statsResult = await emailService.getEmailStats();
      if (statsResult.data) {
        setEmailStats(statsResult.data);
        console.log('✅ [EmailPanel] Loaded email stats:', statsResult.data.length);
      }

    } catch (error) {
      console.error('❌ [EmailPanel] Error loading email data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processEmails = async () => {
    setProcessing(true);
    try {
      console.log('⚙️ [EmailPanel] Processing pending emails...');
      
      const result = await emailService.processPendingEmails(5);
      
      console.log('✅ [EmailPanel] Email processing complete:', result);
      
      setLastProcessed({
        timestamp: new Date().toISOString(),
        processed: result.processed,
        errors: result.errors.length
      });

      // Reload data to show updated status
      await loadEmailData();

    } catch (error) {
      console.error('❌ [EmailPanel] Error processing emails:', error);
    } finally {
      setProcessing(false);
    }
  };

  const testEmailSystem = async () => {
    try {
      console.log('🧪 [EmailPanel] Testing email system...');
      
      const result = await emailService.testEmailSystem();
      setTestResult(result);
      
      console.log('🧪 [EmailPanel] Test result:', result);

    } catch (error) {
      console.error('❌ [EmailPanel] Error testing email system:', error);
      setTestResult({ success: false, message: error.message });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <FiCheck className="text-green-500" />;
      case 'failed': return <FiX className="text-red-500" />;
      case 'queued': return <FiMail className="text-blue-500" />;
      default: return <FiAlertCircle className="text-yellow-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FiMail className="text-2xl text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Email Notifications</h2>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={testEmailSystem}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <FiAlertCircle size={16} />
            <span>Test System</span>
          </button>
          
          <button
            onClick={loadEmailData}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={processEmails}
            disabled={processing || pendingEmails.length === 0}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <FiSend className={processing ? 'animate-pulse' : ''} size={16} />
            <span>{processing ? 'Processing...' : 'Process Emails'}</span>
          </button>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`mb-4 p-3 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center space-x-2">
            {testResult.success ? <FiCheck className="text-green-500" /> : <FiX className="text-red-500" />}
            <span className={testResult.success ? 'text-green-800' : 'text-red-800'}>
              {testResult.message}
            </span>
          </div>
        </div>
      )}

      {/* Last Processed Info */}
      {lastProcessed && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Last Processing:</strong> {formatDate(lastProcessed.timestamp)} - 
            Processed: {lastProcessed.processed}, Errors: {lastProcessed.errors}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Emails */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Pending Emails ({pendingEmails.length})
          </h3>
          
          {pendingEmails.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              <FiMail className="mx-auto text-4xl mb-2 opacity-50" />
              <p>No pending emails</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingEmails.map((email) => (
                <div key={email.id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FiMail className="text-blue-500" />
                      <span className="font-medium">{email.email_type}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Priority: {email.priority}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <div>To: {email.recipient_email}</div>
                    <div>Created: {formatDate(email.created_at)}</div>
                    {email.template_data?.full_name && (
                      <div>User: {email.template_data.full_name}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Statistics */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Email Statistics
          </h3>
          
          {emailStats.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              <FiAlertCircle className="mx-auto text-4xl mb-2 opacity-50" />
              <p>No email statistics available</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {emailStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(stat.status)}
                    <span className="text-sm font-medium capitalize">
                      {stat.email_type} - {stat.status}
                    </span>
                  </div>
                  
                  <div className="text-right text-sm">
                    <div className="font-bold">{stat.count}</div>
                    <div className="text-gray-500 text-xs">
                      {new Date(stat.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Debug Information</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>• Welcome emails are automatically queued when users are created</div>
          <div>• Use "Process Emails" to simulate sending queued emails</div>
          <div>• Check browser console for detailed logs</div>
          <div>• Email templates are stored in the database</div>
        </div>
      </div>
    </div>
  );
};

export default EmailNotificationPanel;
