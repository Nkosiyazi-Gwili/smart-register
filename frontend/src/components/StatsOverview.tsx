'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

interface Stats {
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  averageHours: number;
  leaveBalance: {
    sick: number;
    vacation: number;
    personal: number;
  };
  recentAttendance: any[];
}

export default function StatsOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // In a real app, you would have an endpoint for stats
      // For now, we'll simulate with mock data
      const mockStats: Stats = {
        totalPresent: 18,
        totalLate: 2,
        totalAbsent: 1,
        averageHours: 8.2,
        leaveBalance: user?.leaveBalance || {
          sick: 12,
          vacation: 21,
          personal: 5
        },
        recentAttendance: [
          { date: '2024-01-15', status: 'present', hours: 8.5 },
          { date: '2024-01-14', status: 'present', hours: 7.8 },
          { date: '2024-01-13', status: 'late', hours: 7.5 },
          { date: '2024-01-12', status: 'present', hours: 8.0 },
          { date: '2024-01-11', status: 'absent', hours: 0 },
        ]
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
        <div className="bg-gray-200 h-64 rounded-lg"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Present Days */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Present Days</p>
              <p className="text-2xl font-bold text-green-900">{stats.totalPresent}</p>
            </div>
          </div>
        </div>

        {/* Late Days */}
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Late Days</p>
              <p className="text-2xl font-bold text-orange-900">{stats.totalLate}</p>
            </div>
          </div>
        </div>

        {/* Average Hours */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Avg. Hours/Day</p>
              <p className="text-2xl font-bold text-blue-900">{stats.averageHours}</p>
            </div>
          </div>
        </div>

        {/* Absent Days */}
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Absent Days</p>
              <p className="text-2xl font-bold text-red-900">{stats.totalAbsent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Balance */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Leave Balance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">Sick Leave</span>
              <span className="text-2xl font-bold text-green-900">{stats.leaveBalance.sick}</span>
            </div>
            <p className="text-xs text-green-600 mt-1">Days remaining</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">Vacation Leave</span>
              <span className="text-2xl font-bold text-blue-900">{stats.leaveBalance.vacation}</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">Days remaining</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-800">Personal Leave</span>
              <span className="text-2xl font-bold text-purple-900">{stats.leaveBalance.personal}</span>
            </div>
            <p className="text-xs text-purple-600 mt-1">Days remaining</p>
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Attendance</h3>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentAttendance.map((record, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.status === 'present' ? 'bg-green-100 text-green-800' :
                      record.status === 'late' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.hours > 0 ? `${record.hours}h` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}