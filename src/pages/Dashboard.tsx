import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to DJC Manager</h1>
      <p className="text-gray-600">
        Manage your electrical product compliance declarations efficiently.
      </p>
    </div>
  );
}

export default Dashboard;