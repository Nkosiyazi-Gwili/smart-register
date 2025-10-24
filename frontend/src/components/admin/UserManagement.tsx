// components/admin/UserManagement.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface User {
  _id: string;
  id?: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'employee';
  department: {
    _id: string;
    name: string;
  };
  position: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  leaveBalance?: {
    sick: number;
    vacation: number;
    personal: number;
  };
}

interface Department {
  _id: string;
  name: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  department: string;
  position: string;
  phone: string;
  password: string;
}

// Simple toast function
const useToast = () => {
  const addToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    console.log(`${type.toUpperCase()}: ${message}`);
    // You can replace this with your actual toast implementation
    alert(`${type.toUpperCase()}: ${message}`);
  };
  
  return { addToast };
};

export default function UserManagement() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'employee',
    department: '',
    position: '',
    phone: '',
    password: ''
  });

  // Get the base API URL from environment or use default
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // FIX: Correct endpoints without double /api
      const endpoints = [
        `${API_BASE_URL}/api/users`,
        `${API_BASE_URL}/users`,
        '/api/users',
        'http://localhost:5000/api/users'
      ];

      let response = null;
      let data = null;
      let successfulEndpoint = '';

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log('Trying users endpoint:', endpoint);
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
        throw new Error(`Failed to fetch users. All endpoints failed. Last status: ${response?.status}`);
      }

      if (data && data.success) {
        setUsers(data.users || []);
     //   addToast(`Loaded ${data.users?.length || 0} users from ${successfulEndpoint}`, 'success');
      } else {
        throw new Error(data?.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      addToast('Failed to load users. Please check if the server is running on port 5000.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }

      // FIX: Correct department endpoints
      const endpoints = [
        `${API_BASE_URL}/api/departments`,
        `${API_BASE_URL}/departments`,
        '/api/departments',
        'http://localhost:5000/api/departments'
      ];

      let response = null;
      let data = null;

      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
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

      if (response && response.ok && data && data.success) {
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      addToast('First name, last name, and email are required', 'error');
      return;
    }

    if (!editingUser && !formData.password) {
      addToast('Password is required for new users', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // FIX: Correct user endpoints
      const baseEndpoints = [
        `${API_BASE_URL}/api/users`,
        `${API_BASE_URL}/users`,
        '/api/users',
        'http://localhost:5000/api/users'
      ];

      const url = editingUser 
        ? baseEndpoints.map(endpoint => `${endpoint}/${editingUser._id}`)
        : baseEndpoints;

      const method = editingUser ? 'PUT' : 'POST';

      // Remove password field if editing and password is empty
      const submitData = { ...formData };
      if (editingUser && !submitData.password) {
        delete (submitData as Partial<FormData>).password;
      }

      let response = null;
      let data = null;

      // Try each endpoint
      for (const endpoint of Array.isArray(url) ? url : [url]) {
        try {
          response = await fetch(endpoint, {
            method,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(submitData),
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
        throw new Error(data?.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
      }

      if (!data.success) {
        throw new Error(data.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
      }

      addToast(`User ${editingUser ? 'updated' : 'created'} successfully`, 'success');
      setShowAddUser(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
      
    } catch (error) {
      console.error('Error saving user:', error);
      addToast(error instanceof Error ? error.message : 'Failed to save user', 'error');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department._id,
      position: user.position,
      phone: user.phone || '',
      password: '' // Don't pre-fill password
    });
    setShowAddUser(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // FIX: Correct delete endpoints
      const endpoints = [
        `${API_BASE_URL}/api/users/${userId}`,
        `${API_BASE_URL}/users/${userId}`,
        `/api/users/${userId}`,
        `http://localhost:5000/api/users/${userId}`
      ];

      let response = null;
      let data = null;

      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
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
        throw new Error(data?.message || 'Failed to delete user');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete user');
      }

      addToast('User deleted successfully', 'success');
      fetchUsers();
      
    } catch (error) {
      console.error('Error deleting user:', error);
      addToast(error instanceof Error ? error.message : 'Failed to delete user', 'error');
    }
  };

  const handleStatusToggle = async (user: User) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      
      // FIX: Correct update endpoints
      const endpoints = [
        `${API_BASE_URL}/api/users/${user._id}`,
        `${API_BASE_URL}/users/${user._id}`,
        `/api/users/${user._id}`,
        `http://localhost:5000/api/users/${user._id}`
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
            body: JSON.stringify({ status: newStatus }),
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
        throw new Error(data?.message || 'Failed to update user status');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to update user status');
      }

      addToast(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchUsers();
      
    } catch (error) {
      console.error('Error updating user status:', error);
      addToast(error instanceof Error ? error.message : 'Failed to update user status', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'employee',
      department: '',
      position: '',
      phone: '',
      password: ''
    });
    setEditingUser(null);
    setShowAddUser(false);
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
      addToast(`Backend connection: ${data.success ? 'SUCCESS' : 'FAILED'}`, data.success ? 'success' : 'error');
      return data.success;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      addToast('Backend connection: FAILED - Check if server is running on port 5000', 'error');
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading users...</span>
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
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage user accounts and permissions
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchUsers}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          
            <button
              onClick={() => setShowAddUser(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add User</span>
            </button>
          </div>
        </div>

       
        {/* Add/Edit User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="email@company.com"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter password"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        role: e.target.value as 'admin' | 'manager' | 'employee' 
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <select
                      required
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono">{user.employeeId}</td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{user.department?.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleStatusToggle(user)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          user.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                          user.status === 'inactive' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                          'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {user.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={user._id === user?._id}
                          title={user._id === user?._id ? 'Cannot delete your own account' : ''}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first user.</p>
              <button
                onClick={() => setShowAddUser(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create User
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}