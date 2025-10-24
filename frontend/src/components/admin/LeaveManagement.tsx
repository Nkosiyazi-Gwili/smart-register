// components/admin/LeaveManagement.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';

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
  leaveType: 'sick' | 'vacation' | 'personal' | 'emergency';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reviewedAt?: string;
  rejectionReason?: string;
  totalDays: number;
}

interface LeaveStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

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
      
      const response = await fetch('/api/leave', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave applications');
      }

      const data = await response.json();
      
      if (data.success) {
        setLeaveApplications(data.leaveApplications || []);
      }
    } catch (error) {
      console.error('Error fetching leave applications:', error);
      addToast('Failed to load leave applications', 'error');
    } finally {
      setLoading(false);
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
      
      const response = await fetch(`/api/leave/${leaveId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to approve leave application');
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
      
      const response = await fetch(`/api/leave/${leaveId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to reject leave application');
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
      case 'emergency':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Leave Management</h2>
        <div className="card">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading leave applications...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Leave Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and manage employee leave applications
          </p>
        </div>
        <button
          onClick={fetchLeaveApplications}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="card text-center border-l-4 border-yellow-500">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="card text-center border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="card text-center border-l-4 border-red-500">
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
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
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredApplications.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">
                        {leave.user.firstName} {leave.user.lastName}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {leave.user.employeeId} • {leave.user.department.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={getLeaveTypeBadge(leave.leaveType)}>
                      {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <p className="text-gray-900">{formatDate(leave.startDate)}</p>
                      <p className="text-gray-500 text-xs">to {formatDate(leave.endDate)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className="font-medium text-gray-900">{leave.totalDays}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={getStatusBadge(leave.status)}>
                      {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(leave.appliedAt)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {leave.status === 'pending' ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(leave._id)}
                          className="text-green-600 hover:text-green-800 font-medium text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(leave)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => setSelectedLeave(leave)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          View
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedLeave(leave)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
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
            <div className="text-center py-8">
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
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Leave Application Details</h3>
              <button
                onClick={() => setSelectedLeave(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                  <p className="text-sm text-gray-900">
                    {selectedLeave.user.firstName} {selectedLeave.user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{selectedLeave.user.employeeId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <p className="text-sm text-gray-900">{selectedLeave.user.department.name}</p>
                </div>
              </div>

              {/* Leave Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                  <span className={getLeaveTypeBadge(selectedLeave.leaveType)}>
                    {selectedLeave.leaveType.charAt(0).toUpperCase() + selectedLeave.leaveType.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={getStatusBadge(selectedLeave.status)}>
                    {selectedLeave.status.charAt(0).toUpperCase() + selectedLeave.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedLeave.startDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedLeave.endDate)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Days</label>
                <p className="text-sm text-gray-900">{selectedLeave.totalDays} days</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedLeave.reason}
                </p>
              </div>

              {/* Review Information */}
              {selectedLeave.status !== 'pending' && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Review Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Reviewed By</label>
                      <p className="text-sm text-gray-900">
                        {selectedLeave.reviewedBy 
                          ? `${selectedLeave.reviewedBy.firstName} ${selectedLeave.reviewedBy.lastName}`
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Reviewed At</label>
                      <p className="text-sm text-gray-900">
                        {selectedLeave.reviewedAt ? formatDate(selectedLeave.reviewedAt) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {selectedLeave.status === 'rejected' && selectedLeave.rejectionReason && (
                    <div className="mt-2">
                      <label className="block text-xs text-gray-500 mb-1">Rejection Reason</label>
                      <p className="text-sm text-gray-900 bg-red-50 p-3 rounded-lg">
                        {selectedLeave.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions for pending leaves */}
              {selectedLeave.status === 'pending' && (
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(selectedLeave._id)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLeave(null);
                      openRejectModal(selectedLeave);
                    }}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please provide a reason for rejecting this leave application..."
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => handleReject(selectedLeave._id, rejectionReason)}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject Leave
                </button>
                <button
                  onClick={closeRejectModal}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}