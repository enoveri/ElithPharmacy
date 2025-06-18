import React from 'react';
import DatabaseSetup from '../components/setup/DatabaseSetup';

const Setup = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Elith Pharmacy Setup
          </h1>
          <p className="text-gray-600">
            Configure your database and ensure all required tables exist
          </p>
        </div>
        
        <DatabaseSetup />
      </div>
    </div>
  );
};

export default Setup;
