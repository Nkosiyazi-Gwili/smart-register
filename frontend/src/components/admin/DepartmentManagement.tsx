// components/admin/DepartmentManagement.tsx
'use client';
import { useState } from 'react';

interface Department {
  id: string;
  name: string;
  manager: string;
  employeeCount: number;
  status: 'active' | 'inactive';
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: '1',
      name: 'Engineering',
      manager: 'Sarah Wilson',
      employeeCount: 24,
      status: 'active'
    },
    {
      id: '2',
      name: 'Sales',
      manager: 'Mike Johnson',
      employeeCount: 12,
      status: 'active'
    },
    {
      id: '3',
      name: 'Marketing',
      manager: 'Emily Chen',
      employeeCount: 8,
      status: 'active'
    }
  ]);

  const [showAddDept, setShowAddDept] = useState(false);
  const [newDept, setNewDept] = useState({
    name: '',
    manager: ''
  });

  const handleAddDepartment = () => {
    const department: Department = {
      id: Date.now().toString(),
      ...newDept,
      employeeCount: 0,
      status: 'active'
    };
    setDepartments(prev => [...prev, department]);
    setShowAddDept(false);
    setNewDept({ name: '', manager: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Department Management</h2>
        <button
          onClick={() => setShowAddDept(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          Add Department
        </button>
      </div>

      {/* Add Department Modal */}
      {showAddDept && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Department</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Department Name"
                value={newDept.name}
                onChange={(e) => setNewDept(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="Manager Name"
                value={newDept.manager}
                onChange={(e) => setNewDept(prev => ({ ...prev, manager: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={handleAddDepartment}
                className="flex-1 bg-blue-600 text-white py-2 rounded font-medium"
              >
                Add Department
              </button>
              <button
                onClick={() => setShowAddDept(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Departments Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <div key={dept.id} className="card">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{dept.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs ${
                dept.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {dept.status}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Manager: {dept.manager}</p>
              <p>Employees: {dept.employeeCount}</p>
            </div>
            <div className="flex space-x-2 mt-4">
              <button className="flex-1 bg-blue-600 text-white py-2 rounded text-sm font-medium">
                Edit
              </button>
              <button className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-medium">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}