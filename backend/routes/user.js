// routes/users.js
const express = require('express');
const User = require('../models/User');
const Department = require('../models/Department');
const { auth, requireRole } = require('../middleware/auth'); // Use existing middleware
const router = express.Router();

// Get all users (Admin/Manager only)
router.get('/', auth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { page = 1, limit = 10, department, role, status } = req.query;
    
    const filter = { company: req.user.company };
    if (department) filter.department = department;
    if (role) filter.role = role;
    if (status) filter.status = status;
    
    // Managers can only see users in their department
    if (req.user.role === 'manager') {
      filter.department = req.user.department;
    }
    
    const users = await User.find(filter)
      .populate('department')
      .populate('company')
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// Get user by ID
router.get('/:id', auth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('department')
      .populate('company')
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if manager has access to this user
    if (req.user.role === 'manager' && 
        user.department._id.toString() !== req.user.department.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

// Create user (Admin only)
router.post('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      department,
      position,
      phone,
      leaveBalance
    } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Check if department exists
    const dept = await Department.findById(department);
    if (!dept) {
      return res.status(400).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    const user = new User({
      email,
      password: password || 'defaultPassword123',
      firstName,
      lastName,
      role: role || 'employee',
      department,
      company: req.user.company,
      position,
      phone,
      leaveBalance: leaveBalance || {
        sick: 12,
        vacation: 15,
        personal: 5
      }
    });
    
    await user.save();
    
    // Update department employee count
    await dept.updateEmployeeCount();
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: dept,
        company: user.company,
        position: user.position,
        phone: user.phone,
        leaveBalance: user.leaveBalance
      }
    });
    
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

// Update user
router.put('/:id', auth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      role,
      department,
      position,
      phone,
      status,
      leaveBalance
    } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check permissions
    if (req.user.role === 'manager') {
      if (user.department.toString() !== req.user.department.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      // Managers can't change role or department
      delete req.body.role;
      delete req.body.department;
    }
    
    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role && req.user.role === 'admin') user.role = role;
    if (department && req.user.role === 'admin') {
      user.department = department;
    }
    if (position) user.position = position;
    if (phone) user.phone = phone;
    if (status) user.status = status;
    if (leaveBalance) user.leaveBalance = leaveBalance;
    
    await user.save();
    
    // Update department counts if department changed
    if (department && req.user.role === 'admin') {
      const oldDept = await Department.findById(user.department);
      const newDept = await Department.findById(department);
      if (oldDept) await oldDept.updateEmployeeCount();
      if (newDept) await newDept.updateEmployeeCount();
    }
    
    const updatedUser = await User.findById(user._id)
      .populate('department')
      .populate('company')
      .select('-password');
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// Delete user (Admin only)
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    // Update department employee count
    const dept = await Department.findById(user.department);
    if (dept) {
      await dept.updateEmployeeCount();
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

module.exports = router;