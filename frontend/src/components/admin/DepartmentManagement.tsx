// components/admin/DepartmentManagement.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Department {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  manager?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  employeeCount: number;
  status: 'active' | 'inactive';
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
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

export default function DepartmentManagement() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDept, setShowAddDept] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager: ''
  });

  // Get the base API URL from environment or use default
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // FIX: Correct endpoints without double /api
      const endpoints = [
        `${API_BASE_URL}/api/departments`,
        `${API_BASE_URL}/departments`,
        '/api/departments',
        'http://localhost:5000/api/departments'
      ];

      let response = null;
      let data = null;
      let successfulEndpoint = '';

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log('Trying departments endpoint:', endpoint);
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
        throw new Error(`Failed to fetch departments. All endpoints failed. Last status: ${response?.status}`);
      }

      if (data && data.success) {
        setDepartments(data.departments || []);
//addToast(`Loaded ${data.departments?.length || 0} departments from ${successfulEndpoint}`, 'success');
      } else {
        throw new Error(data?.message || 'Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      addToast('Failed to load departments. Please check if the server is running on port 5000.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }

      // FIX: Correct user endpoints for managers
      const endpoints = [
        `${API_BASE_URL}/api/users?role=manager&status=active`,
        `${API_BASE_URL}/users?role=manager&status=active`,
        '/api/users?role=manager&status=active',
        'http://localhost:5000/api/users?role=manager&status=active'
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
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      addToast('Department name is required', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // FIX: Correct department endpoints
      const baseEndpoints = [
        `${API_BASE_URL}/api/departments`,
        `${API_BASE_URL}/departments`,
        '/api/departments',
        'http://localhost:5000/api/departments'
      ];

      const url = editingDept 
        ? baseEndpoints.map(endpoint => `${endpoint}/${editingDept._id}`)
        : baseEndpoints;

      const method = editingDept ? 'PUT' : 'POST';

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
            body: JSON.stringify(formData),
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
        throw new Error(data?.message || `Failed to ${editingDept ? 'update' : 'create'} department`);
      }

      if (!data.success) {
        throw new Error(data.message || `Failed to ${editingDept ? 'update' : 'create'} department`);
      }

      addToast(`Department ${editingDept ? 'updated' : 'created'} successfully`, 'success');
      setShowAddDept(false);
      setEditingDept(null);
      setFormData({ name: '', description: '', manager: '' });
      fetchDepartments();
      
    } catch (error) {
      console.error('Error saving department:', error);
      addToast(error instanceof Error ? error.message : 'Failed to save department', 'error');
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDept(department);
    setFormData({
      name: department.name,
      description: department.description || '',
      manager: department.manager?._id || ''
    });
    setShowAddDept(true);
  };

  const handleDelete = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // FIX: Correct delete endpoints
      const endpoints = [
        `${API_BASE_URL}/api/departments/${departmentId}`,
        `${API_BASE_URL}/departments/${departmentId}`,
        `/api/departments/${departmentId}`,
        `http://localhost:5000/api/departments/${departmentId}`
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
        throw new Error(data?.message || 'Failed to delete department');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete department');
      }

      addToast('Department deleted successfully', 'success');
      fetchDepartments();
      
    } catch (error) {
      console.error('Error deleting department:', error);
      addToast(error instanceof Error ? error.message : 'Failed to delete department', 'error');
    }
  };

  const handleStatusToggle = async (department: Department) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const newStatus = department.status === 'active' ? 'inactive' : 'active';
      
      // FIX: Correct update endpoints
      const endpoints = [
        `${API_BASE_URL}/api/departments/${department._id}`,
        `${API_BASE_URL}/departments/${department._id}`,
        `/api/departments/${department._id}`,
        `http://localhost:5000/api/departments/${department._id}`
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
        throw new Error(data?.message || 'Failed to update department status');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to update department status');
      }

      addToast(`Department ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchDepartments();
      
    } catch (error) {
      console.error('Error updating department status:', error);
      addToast(error instanceof Error ? error.message : 'Failed to update department status', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', manager: '' });
    setEditingDept(null);
    setShowAddDept(false);
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
            <h2 className="text-2xl font-bold text-gray-900">Department Management</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading departments...</span>
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
            <h2 className="text-2xl font-bold text-gray-900">Department Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage departments and assign managers
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchDepartments}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>           
            <button
              onClick={() => setShowAddDept(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center space-x-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Department</span>
            </button>
          </div>
        </div>

        {/* Quick Fix Instructions */}
        {departments.length === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">Troubleshooting Steps</h4>
            <div className="text-xs text-red-700 space-y-1">
              <p>1. Make sure your backend is running: <code>cd backend && npm run dev</code></p>
              <p>2. Check if backend responds: <a href="http://localhost:5000/api/auth/me" target="_blank" className="underline">http://localhost:5000/api/auth/me</a></p>
              <p>3. Verify your department routes exist in backend</p>
              <p>4. Check browser console for detailed errors</p>
              <p>5. Ensure you have proper admin permissions</p>
            </div>
          </div>
        )}

        {/* Add/Edit Department Modal */}
        {showAddDept && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingDept ? 'Edit Department' : 'Add New Department'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter department name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter department description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manager
                  </label>
                  <select
                    value={formData.manager}
                    onChange={(e) => setFormData(prev => ({ ...prev, manager: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select a manager</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    {editingDept ? 'Update Department' : 'Create Department'}
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

        {/* Departments Grid */}
        {departments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first department.</p>
            <button
              onClick={() => setShowAddDept(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Department
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {departments.map((dept) => (
              <div key={dept._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-gray-900">{dept.name}</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleStatusToggle(dept)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        dept.status === 'active' 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {dept.status}
                    </button>
                  </div>
                </div>
                
                {dept.description && (
                  <p className="text-sm text-gray-600 mb-3">{dept.description}</p>
                )}
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Manager:</span>
                    <span className="font-medium">
                      {dept.manager 
                        ? `${dept.manager.firstName} ${dept.manager.lastName}`
                        : 'Not assigned'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Employees:</span>
                    <span className="font-medium">{dept.employeeCount}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(dept)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(dept._id)}
                    className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={dept.employeeCount > 0}
                    title={dept.employeeCount > 0 ? 'Cannot delete department with employees' : ''}
                  >
                    Delete
                  </button>
                </div>
                
                {dept.employeeCount > 0 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {dept.employeeCount} employee(s) in this department
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}