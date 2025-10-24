// components/Dashboard.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from './Header';
import AttendanceClock from './AttendanceClock';
import LeaveApplication from './LeaveApplication';
import StatsOverview from './StatsOverview';
import Reports from './Reports';
import UserManagement from './admin/UserManagement';
import CompanySettings from './admin/CompanySettings';
import DepartmentManagement from './admin/DepartmentManagement';
import LeaveManagement from './admin/LeaveManagement';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  // Base tabs for all users (employees)
  const employeeTabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'attendance', name: 'Attendance', icon: '⏰' },
    { id: 'leave', name: 'My Leave', icon: '🏖️' },
  ];

  // Manager tabs - can manage team leaves
  const managerTabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'attendance', name: 'Attendance', icon: '⏰' },
    { id: 'leave', name: 'My Leave', icon: '🏖️' },
    { id: 'leave-management', name: 'Team Leaves', icon: '📋' },
    { id: 'reports', name: 'Reports', icon: '📈' },
  ];

  // Admin tabs - full access
  const adminTabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'attendance', name: 'Attendance', icon: '⏰' },
    { id: 'leave', name: 'My Leave', icon: '🏖️' },
    { id: 'leave-management', name: 'All Leaves', icon: '📋' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'departments', name: 'Departments', icon: '🏢' },
    { id: 'reports', name: 'Reports', icon: '📈' },
    { id: 'company', name: 'Company', icon: '⚙️' },
  ];

  const getTabs = () => {
    switch (user.role) {
      case 'admin':
        return adminTabs;
      case 'manager':
        return managerTabs;
      default:
        return employeeTabs;
    }
  };

  const tabs = getTabs();

  const renderContent = () => {
    switch (activeTab) {
      case 'attendance':
        return <AttendanceClock />;
      case 'leave':
        return <LeaveApplication />;
      case 'leave-management':
        if (user.role === 'admin' || user.role === 'manager') {
          return <LeaveManagement />;
        }
        return null;
      case 'reports':
        if (user.role === 'admin' || user.role === 'manager') {
          return <Reports />;
        }
        return null;
      case 'users':
        return user.role === 'admin' ? <UserManagement /> : null;
      case 'departments':
        return user.role === 'admin' ? <DepartmentManagement /> : null;
      case 'company':
        return user.role === 'admin' ? <CompanySettings /> : null;
      default:
        return <StatsOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 safe-area-inset">
      <Header />
      
      {/* Bottom Navigation - Mobile First */}
      <nav className="bg-white border-t fixed bottom-0 left-0 right-0 safe-area-inset-bottom z-40">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium transition-colors min-w-20 ${
                activeTab === tab.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-lg mb-1">{tab.icon}</span>
              <span className="truncate">{tab.name}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-20 pt-4 px-4 safe-area-inset-bottom">
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}