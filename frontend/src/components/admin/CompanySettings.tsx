// components/admin/CompanySettings.tsx
'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function CompanySettings() {
  const { user, updateUser } = useAuth();
  const [companyData, setCompanyData] = useState({
    name: user?.company?.name || '',
    address: user?.company?.address || '',
    latitude: user?.company?.latitude || 0,
    longitude: user?.company?.longitude || 0,
    radius: user?.company?.radius || 50
  });

  const handleSave = () => {
    // In real app, make API call to update company settings
    if (user) {
      updateUser({
        company: {
          ...user.company,
          ...companyData
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Company Settings</h2>
      
      <div className="grid gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Company Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={companyData.name}
                onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={companyData.address}
                onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Location Settings</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={companyData.latitude}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={companyData.longitude}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-in Radius (meters)
              </label>
              <input
                type="number"
                value={companyData.radius}
                onChange={(e) => setCompanyData(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                className="w-full p-3 border border-gray-300 rounded-lg"
                min="1"
                max="1000"
              />
              <p className="text-sm text-gray-500 mt-1">
                Employees must be within this radius to check in/out
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}