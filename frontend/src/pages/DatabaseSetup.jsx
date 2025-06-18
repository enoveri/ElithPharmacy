import React, { useState } from 'react';
import { 
  setupNotifications, 
  checkNotificationsTable, 
  createSampleNotifications,
  testNotifications 
} from '../lib/setup';

const DatabaseSetup = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (result) => {
    setResults(prev => [...prev, { ...result, timestamp: new Date().toLocaleTimeString() }]);
  };

  const handleSetupNotifications = async () => {
    setLoading(true);
    addResult({ type: 'info', message: 'Starting notifications setup...' });
    
    try {
      const result = await setupNotifications();
      
      if (result.success) {
        addResult({ type: 'success', message: result.message });
      } else {
        addResult({ type: 'error', message: result.error });
        if (result.instructions) {
          addResult({ type: 'info', message: 'Instructions:', details: result.instructions });
        }
      }
    } catch (error) {
      addResult({ type: 'error', message: `Setup failed: ${error.message}` });
    }
    
    setLoading(false);
  };

  const handleCheckTable = async () => {
    setLoading(true);
    addResult({ type: 'info', message: 'Checking notifications table...' });
    
    try {
      const result = await checkNotificationsTable();
      
      if (result.exists) {
        addResult({ type: 'success', message: 'Notifications table exists and is accessible' });
      } else {
        addResult({ type: 'warning', message: `Notifications table issue: ${result.error}` });
      }
    } catch (error) {
      addResult({ type: 'error', message: `Check failed: ${error.message}` });
    }
    
    setLoading(false);
  };

  const handleTestNotifications = async () => {
    setLoading(true);
    addResult({ type: 'info', message: 'Testing notifications system...' });
    
    try {
      const result = await testNotifications();
      
      if (result.success) {
        addResult({ type: 'success', message: result.message });
      } else {
        addResult({ type: 'error', message: `Test failed: ${result.error}` });
      }
    } catch (error) {
      addResult({ type: 'error', message: `Test failed: ${error.message}` });
    }
    
    setLoading(false);
  };

  const handleCreateSamples = async () => {
    setLoading(true);
    addResult({ type: 'info', message: 'Creating sample notifications...' });
    
    try {
      const result = await createSampleNotifications();
      
      if (result.success) {
        addResult({ type: 'success', message: `Created ${result.data.length} sample notifications` });
      } else {
        addResult({ type: 'error', message: `Failed to create samples: ${result.error}` });
      }
    } catch (error) {
      addResult({ type: 'error', message: `Sample creation failed: ${error.message}` });
    }
    
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>Database Setup & Testing</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Use these tools to set up and test the notifications system for your Elith Pharmacy application.
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={handleCheckTable}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Check Table
          </button>
          
          <button
            onClick={handleSetupNotifications}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Setup Notifications
          </button>
          
          <button
            onClick={handleTestNotifications}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Test System
          </button>
          
          <button
            onClick={handleCreateSamples}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Create Samples
          </button>
          
          <button
            onClick={clearResults}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Clear Results
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div style={{ 
          backgroundColor: '#f9fafb', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '20px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>Results:</h3>
          
          {results.map((result, index) => (
            <div
              key={index}
              style={{
                marginBottom: '10px',
                padding: '10px',
                borderRadius: '5px',
                backgroundColor: result.type === 'success' ? '#d1fae5' :
                              result.type === 'error' ? '#fee2e2' :
                              result.type === 'warning' ? '#fef3c7' : '#dbeafe',
                border: `1px solid ${
                  result.type === 'success' ? '#10b981' :
                  result.type === 'error' ? '#ef4444' :
                  result.type === 'warning' ? '#f59e0b' : '#3b82f6'
                }`
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: result.details ? '10px' : 0
              }}>
                <span style={{ fontWeight: '500' }}>{result.message}</span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {result.timestamp}
                </span>
              </div>
              
              {result.details && (
                <pre style={{
                  backgroundColor: '#1f2937',
                  color: '#e5e7eb',
                  padding: '10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto',
                  margin: 0
                }}>
                  {result.details}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
      
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#6b7280'
        }}>
          Processing...
        </div>
      )}
    </div>
  );
};

export default DatabaseSetup;
