// components/admin/CompanySettings.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';

interface CompanyData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  contactEmail?: string;
  contactPhone?: string;
  workingHours?: {
    start: string;
    end: string;
  };
  settings?: {
    requireSelfie: boolean;
    requireLocation: boolean;
    autoApproveAttendance: boolean;
  };
}

// Default settings values
const defaultSettings = {
  requireSelfie: true,
  requireLocation: true,
  autoApproveAttendance: false
};

// Default working hours
const defaultWorkingHours = {
  start: '09:00',
  end: '17:00'
};

export default function CompanySettings() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    radius: 50,
    workingHours: defaultWorkingHours,
    settings: defaultSettings
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch company data on component mount
  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/companies', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch company data');
      }

      const data = await response.json();
      
      if (data.success && data.company) {
        setCompanyData({
          name: data.company.name || '',
          address: data.company.address || '',
          latitude: data.company.latitude || 0,
          longitude: data.company.longitude || 0,
          radius: data.company.radius || 50,
          contactEmail: data.company.contactEmail,
          contactPhone: data.company.contactPhone,
          workingHours: data.company.workingHours || defaultWorkingHours,
          settings: data.company.settings || defaultSettings
        });
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      addToast('Failed to load company settings', 'error');
      
      // Fallback to user data if available
      if (user?.company) {
        setCompanyData({
          name: user.company.name || '',
          address: user.company.address || '',
          latitude: user.company.latitude || 0,
          longitude: user.company.longitude || 0,
          radius: user.company.radius || 50,
          workingHours: user.company.workingHours || defaultWorkingHours,
          settings: user.company.settings || defaultSettings
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Safe update functions for settings
  const updateSettings = (key: keyof NonNullable<CompanyData['settings']>, value: boolean) => {
    setCompanyData(prev => ({
      ...prev,
      settings: {
        ...defaultSettings,
        ...prev.settings,
        [key]: value
      }
    }));
  };

  const updateWorkingHours = (key: 'start' | 'end', value: string) => {
    setCompanyData(prev => ({
      ...prev,
      workingHours: {
        ...defaultWorkingHours,
        ...prev.workingHours,
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      // Validate required fields
      if (!companyData.name.trim() || !companyData.address.trim()) {
        addToast('Company name and address are required', 'error');
        return;
      }

      if (companyData.radius < 1 || companyData.radius > 1000) {
        addToast('Radius must be between 1 and 1000 meters', 'error');
        return;
      }

      const response = await fetch('/api/companies', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update company settings');
      }

      // Update user context with new company data
      if (user) {
        updateUser({
          company: {
            ...user.company,
            ...companyData
          }
        });
      }

      addToast('Company settings updated successfully', 'success');
      
    } catch (error) {
      console.error('Error updating company settings:', error);
      addToast(error instanceof Error ? error.message : 'Failed to update company settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      addToast('Getting your current location...', 'info');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCompanyData(prev => ({
            ...prev,
            latitude: parseFloat(latitude.toFixed(6)),
            longitude: parseFloat(longitude.toFixed(6))
          }));
          addToast('Location updated successfully', 'success');
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Failed to get current location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          addToast(errorMessage, 'error');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      addToast('Geolocation is not supported by this browser', 'error');
    }
  };

  const handleTestLocation = () => {
    if (!companyData.latitude || !companyData.longitude) {
      addToast('Please set latitude and longitude first', 'warning');
      return;
    }

    // Open in Google Maps
    const mapsUrl = `https://www.google.com/maps?q=${companyData.latitude},${companyData.longitude}`;
    window.open(mapsUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Company Settings</h2>
        <div className="card">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading company settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Company Settings</h2>
        <button
          onClick={fetchCompanyData}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
      
      <div className="grid gap-6">
        {/* Company Information */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Company Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={companyData.name}
                onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                value={companyData.address}
                onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter company address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={companyData.contactEmail || ''}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contact@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={companyData.contactPhone || ''}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location Settings */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Location Settings</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleGetCurrentLocation}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Use Current Location</span>
              </button>
              <button
                onClick={handleTestLocation}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Test Location</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={companyData.latitude}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="40.7128"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={companyData.longitude}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="-74.0060"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-in Radius (meters) *
              </label>
              <input
                type="number"
                value={companyData.radius}
                onChange={(e) => setCompanyData(prev => ({ ...prev, radius: parseInt(e.target.value) || 50 }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="1000"
              />
              <p className="text-sm text-gray-500 mt-1">
                Employees must be within this radius ({companyData.radius}m) to check in/out
              </p>
            </div>

            {/* Current Coordinates Display */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Current Coordinates:</p>
              <p className="text-sm text-gray-600 font-mono">
                {companyData.latitude.toFixed(6)}, {companyData.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Working Hours</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={companyData.workingHours?.start || '09:00'}
                onChange={(e) => updateWorkingHours('start', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={companyData.workingHours?.end || '17:00'}
                onChange={(e) => updateWorkingHours('end', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Attendance Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={companyData.settings?.requireSelfie ?? true}
                onChange={(e) => updateSettings('requireSelfie', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Require selfie for check-in/out</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={companyData.settings?.requireLocation ?? true}
                onChange={(e) => updateSettings('requireLocation', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Require location verification</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={companyData.settings?.autoApproveAttendance ?? false}
                onChange={(e) => updateSettings('autoApproveAttendance', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Auto-approve attendance records</span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Settings</span>
          )}
        </button>
      </div>
    </div>
  );
}