'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AttendanceClock from './AttendanceClock';
import LeaveApplication from './LeaveApplication';
import StatsOverview from './StatsOverview';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'attendance', name: 'Attendance', icon: '⏰' },
    { id: 'leave', name: 'Leave Management', icon: '🏖️' },
  ];

  if (user.role !== 'employee') {
    tabs.push({ id: 'reports', name: 'Reports', icon: '📈' });
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'attendance':
        return <AttendanceClock />;
      case 'leave':
        return <LeaveApplication />;
      case 'reports':
        return user.role !== 'employee' ? (
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Reports Dashboard</h2>
            <p className="text-gray-600">Advanced analytics and reports will be displayed here.</p>
          </div>
        ) : null;
      default:
        return <StatsOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Smart Register</h1>
                <p className="text-sm text-gray-600">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  Welcome, {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-gray-600 capitalize">
                  {user.role} • {user.department?.name}
                </p>
              </div>
              <div className="relative">
                <button
                  onClick={logout}
                  className="btn-secondary text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}