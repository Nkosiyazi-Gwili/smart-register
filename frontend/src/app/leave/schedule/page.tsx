// app/leave/schedule/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface LeaveSchedule {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    employeeId: string;
    department: {
      name: string;
    };
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  totalDays: number;
}

export default function LeaveSchedulePage() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'month' | 'quarter'>('month');
  const [leaves, setLeaves] = useState<LeaveSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveSchedule();
  }, [timeframe]);

  const fetchLeaveSchedule = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const endpoint = user?.role === 'employee' 
        ? `/api/leave/schedule?timeframe=${timeframe}`
        : `/api/leave/team-schedule?timeframe=${timeframe}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaves(data.leaves || []);
      }
    } catch (error) {
      console.error('Error fetching leave schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getLeaveTypeColor = (type: string) => {
    const colors = {
      sick: 'bg-blue-100 text-blue-800',
      vacation: 'bg-green-100 text-green-800',
      personal: 'bg-purple-100 text-purple-800',
      maternity: 'bg-pink-100 text-pink-800',
      paternity: 'bg-teal-100 text-teal-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.role === 'employee' ? 'My Leave Schedule' : 'Team Leave Schedule'}
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.role === 'employee' 
                  ? 'View your approved and pending leave dates' 
                  : 'Monitor team leave schedules and availability'
                }
              </p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setTimeframe('month')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  timeframe === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeframe('quarter')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  timeframe === 'quarter'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                This Quarter
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {user?.role !== 'employee' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaves.map((leave) => (
                    <tr key={leave._id} className="hover:bg-gray-50">
                      {user?.role !== 'employee' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {leave.user.firstName} {leave.user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {leave.user.employeeId} • {leave.user.department.name}
                            </p>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLeaveTypeColor(leave.leaveType)}`}>
                          {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.totalDays} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {leaves.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No leave schedules found for the selected period.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}