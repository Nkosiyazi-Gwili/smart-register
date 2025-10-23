const express = require('express');
const User = require('../models/User');
const Department = require('../models/Department');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin/Manager)
router.get('/', auth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 20, department, role, isActive } = req.query;

    const query = { company: user.company };
    
    if (department) {
      query.department = department;
    }
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Managers can only see users in their department
    if (user.role === 'manager' && user.department) {
      query.department = user.department;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('department', 'name')
      .sort({ firstName: 1, lastName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('company')
      .populate('department')
      .populate('department.manager', 'firstName lastName');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone },
      { new: true, runValidators: true }
    ).select('-password')
     .populate('company')
     .populate('department');

    res.json({
      success: true,
      user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Create user (Admin only)
// @route   POST /api/users
// @access  Private (Admin)
router.post('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { 
      employeeId, 
      email, 
      password, 
      firstName, 
      lastName, 
      role, 
      department, 
      position,
      phone 
    } = req.body;

    // Check if department belongs to company
    const dept = await Department.findOne({ 
      _id: department, 
      company: req.user.company 
    });
    
    if (!dept) {
      return res.status(400).json({ error: 'Invalid department' });
    }

    const user = new User({
      employeeId,
      email,
      password: password || 'defaultPassword123',
      firstName,
      lastName,
      role: role || 'employee',
      department,
      company: req.user.company,
      position,
      phone
    });

    await user.save();
    
    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      user: userResponse,
      message: 'User created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;