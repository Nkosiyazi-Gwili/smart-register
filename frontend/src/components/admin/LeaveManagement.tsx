// components/admin/LeaveManagement.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface LeaveApplication {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department: {
      name: string;
    };
  };
  leaveType: 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedAt: string;
  approvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
  totalDays: number;
}

interface LeaveStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

// Simple toast function
const useToast = () => {
  const addToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    console.log(`${type.toUpperCase()}: ${message}`);
    // You can replace this with your actual toast implementation
    // alert(`${type.toUpperCase()}: ${message}`);
  };
  
  return { addToast };
};

export default function LeaveManagement() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LeaveStats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Get the base API URL from environment or use default
  // FIX: Remove the /api from base URL since it's already in the endpoint
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchLeaveApplications();
  }, []);

  useEffect(() => {
    filterApplications();
    calculateStats();
  }, [leaveApplications, selectedStatus]);

  const fetchLeaveApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // FIX: Correct endpoints without double /api
      const endpoints = [
        `${API_BASE_URL}/api/leave`,           // Direct backend
        `${API_BASE_URL}/leave`,               // Alternative backend
        '/api/leave',                          // Next.js API route (if exists)
        'http://localhost:5000/api/leave',     // Explicit backend
        'http://localhost:5000/leave'          // Alternative backend
      ];

      let response = null;
      let data = null;
      let successfulEndpoint = '';

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log('Trying endpoint:', endpoint);
          response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            data = await response.json();
            successfulEndpoint = endpoint;
            console.log('Success with endpoint:', endpoint, data);
            break;
          } else {
            console.log(`Endpoint ${endpoint} failed with status: ${response.status}`);
          }
        } catch (err) {
          console.log('Failed with endpoint:', endpoint, err);
          continue;
        }
      }

      if (!response || !response.ok) {
        throw new Error(`Failed to fetch leave applications. All endpoints failed. Last status: ${response?.status}`);
      }

      if (data && data.success) {
        // Handle different response structures
        let applications = [];
        
        if (data.leaveApplications) {
          applications = data.leaveApplications;
        } else if (data.leaves) {
          applications = data.leaves;
        } else if (Array.isArray(data)) {
          applications = data;
        } else {
          throw new Error('Unexpected response format');
        }

        // Map the backend response to frontend interface
        const mappedApplications = applications.map((app: any) => ({
          _id: app._id,
          user: {
            _id: app.user?._id || app.user,
            firstName: app.user?.firstName || 'Unknown',
            lastName: app.user?.lastName || 'User',
            employeeId: app.user?.employeeId || 'N/A',
            department: {
              name: app.user?.department?.name || app.department?.name || 'No Department'
            }
          },
          leaveType: app.leaveType || app.type,
          startDate: app.startDate,
          endDate: app.endDate,
          reason: app.reason,
          status: app.status,
          appliedAt: app.appliedAt || app.createdAt,
          approvedBy: app.approvedBy ? {
            _id: app.approvedBy._id,
            firstName: app.approvedBy.firstName,
            lastName: app.approvedBy.lastName
          } : undefined,
          approvedAt: app.approvedAt,
          rejectionReason: app.rejectionReason,
          totalDays: calculateTotalDays(app.startDate, app.endDate)
        }));
        
        setLeaveApplications(mappedApplications);
        // addToast(`Loaded ${mappedApplications.length} leave applications from ${successfulEndpoint}`, 'success');
      } else {
        throw new Error(data?.error || 'Failed to fetch leave applications');
      }
    } catch (error) {
      console.error('Error fetching leave applications:', error);
      addToast('Failed to load leave applications. Please check if the server is running on port 5000.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalDays = (startDate: string, endDate: string): number => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const timeDiff = end.getTime() - start.getTime();
      return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    } catch (error) {
      console.error('Error calculating total days:', error);
      return 0;
    }
  };

  const filterApplications = () => {
    if (selectedStatus === 'all') {
      setFilteredApplications(leaveApplications);
    } else {
      setFilteredApplications(leaveApplications.filter(app => app.status === selectedStatus));
    }
  };

  const calculateStats = () => {
    const stats = {
      pending: leaveApplications.filter(app => app.status === 'pending').length,
      approved: leaveApplications.filter(app => app.status === 'approved').length,
      rejected: leaveApplications.filter(app => app.status === 'rejected').length,
      total: leaveApplications.length
    };
    setStats(stats);
  };

  const handleApprove = async (leaveId: string) => {
    if (!confirm('Are you sure you want to approve this leave application?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // FIX: Correct approve endpoints
      const endpoints = [
        `${API_BASE_URL}/api/leave/${leaveId}/approve`,
        `${API_BASE_URL}/leave/${leaveId}/approve`,
        `/api/leave/${leaveId}/approve`,
        `http://localhost:5000/api/leave/${leaveId}/approve`
      ];

      let response = null;
      let data = null;

      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            data = await response.json();
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (!response || !response.ok) {
        throw new Error(data?.error || data?.message || 'Failed to approve leave application');
      }

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to approve leave application');
      }

      addToast('Leave application approved successfully', 'success');
      fetchLeaveApplications();
      
    } catch (error) {
      console.error('Error approving leave:', error);
      addToast(error instanceof Error ? error.message : 'Failed to approve leave application', 'error');
    }
  };

  const handleReject = async (leaveId: string, reason: string) => {
    if (!reason.trim()) {
      addToast('Please provide a rejection reason', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // FIX: Correct reject endpoints
      const endpoints = [
        `${API_BASE_URL}/api/leave/${leaveId}/reject`,
        `${API_BASE_URL}/leave/${leaveId}/reject`,
        `/api/leave/${leaveId}/reject`,
        `http://localhost:5000/api/leave/${leaveId}/reject`
      ];

      let response = null;
      let data = null;

      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              rejectionReason: reason 
            })
          });

          if (response.ok) {
            data = await response.json();
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (!response || !response.ok) {
        throw new Error(data?.error || data?.message || 'Failed to reject leave application');
      }

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to reject leave application');
      }

      addToast('Leave application rejected successfully', 'success');
      setShowRejectModal(false);
      setSelectedLeave(null);
      setRejectionReason('');
      fetchLeaveApplications();
      
    } catch (error) {
      console.error('Error rejecting leave:', error);
      addToast(error instanceof Error ? error.message : 'Failed to reject leave application', 'error');
    }
  };

  const openRejectModal = (leave: LeaveApplication) => {
    setSelectedLeave(leave);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedLeave(null);
    setRejectionReason('');
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (type) {
      case 'sick':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'vacation':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'personal':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'maternity':
        return `${baseClasses} bg-pink-100 text-pink-800`;
      case 'paternity':
        return `${baseClasses} bg-teal-100 text-teal-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Test if backend is running
  const testBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      console.log('Backend connection test:', data);
      return data.success;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading leave applications...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review and manage employee leave applications
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchLeaveApplications}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>           
          </div>
        </div>
    

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center border-l-4 border-yellow-500">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Leave Applications Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getLeaveTypeBadge(leave.leaveType)}>
                        {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-gray-900">{formatDate(leave.startDate)}</p>
                        <p className="text-sm text-gray-500">to {formatDate(leave.endDate)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {leave.totalDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(leave.status)}>
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(leave.appliedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {leave.status === 'pending' ? (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleApprove(leave._id)}
                            className="text-green-600 hover:text-green-900 font-medium transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(leave)}
                            className="text-red-600 hover:text-red-900 font-medium transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => setSelectedLeave(leave)}
                            className="text-blue-600 hover:text-blue-900 font-medium transition-colors"
                          >
                            View
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedLeave(leave)}
                          className="text-blue-600 hover:text-blue-900 font-medium transition-colors"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredApplications.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No leave applications found</h3>
                <p className="text-gray-500">
                  {selectedStatus === 'all' 
                    ? 'There are no leave applications to display.' 
                    : `No ${selectedStatus} leave applications found.`
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Leave Details Modal */}
        {selectedLeave && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-semibold">Leave Application Details</h3>
                <button
                  onClick={() => setSelectedLeave(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Employee Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                    <p className="text-sm text-gray-900">
                      {selectedLeave.user.firstName} {selectedLeave.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{selectedLeave.user.employeeId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <p className="text-sm text-gray-900">{selectedLeave.user.department.name}</p>
                  </div>
                </div>

                {/* Leave Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                    <span className={getLeaveTypeBadge(selectedLeave.leaveType)}>
                      {selectedLeave.leaveType.charAt(0).toUpperCase() + selectedLeave.leaveType.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <span className={getStatusBadge(selectedLeave.status)}>
                      {selectedLeave.status.charAt(0).toUpperCase() + selectedLeave.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedLeave.startDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedLeave.endDate)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Days</label>
                  <p className="text-sm text-gray-900">{selectedLeave.totalDays} days</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {selectedLeave.reason}
                  </p>
                </div>

                {/* Review Information */}
                {selectedLeave.status !== 'pending' && (
                  <div className="border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Review Information</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs text-gray-500 mb-2">Reviewed By</label>
                        <p className="text-sm text-gray-900">
                          {selectedLeave.approvedBy 
                            ? `${selectedLeave.approvedBy.firstName} ${selectedLeave.approvedBy.lastName}`
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-2">Reviewed At</label>
                        <p className="text-sm text-gray-900">
                          {selectedLeave.approvedAt ? formatDate(selectedLeave.approvedAt) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {selectedLeave.status === 'rejected' && selectedLeave.rejectionReason && (
                      <div className="mt-4">
                        <label className="block text-xs text-gray-500 mb-2">Rejection Reason</label>
                        <p className="text-sm text-gray-900 bg-red-50 p-4 rounded-lg border border-red-200">
                          {selectedLeave.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions for pending leaves */}
                {selectedLeave.status === 'pending' && (
                  <div className="flex space-x-4 pt-6 border-t">
                    <button
                      onClick={() => handleApprove(selectedLeave._id)}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLeave(null);
                        openRejectModal(selectedLeave);
                      }}
                      className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectModal && selectedLeave && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Reject Leave Application</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Rejecting leave application for <strong>{selectedLeave.user.firstName} {selectedLeave.user.lastName}</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Duration: {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Rejection *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Please provide a reason for rejecting this leave application..."
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => handleReject(selectedLeave._id, rejectionReason)}
                    disabled={!rejectionReason.trim()}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Reject Leave
                  </button>
                  <button
                    onClick={closeRejectModal}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}