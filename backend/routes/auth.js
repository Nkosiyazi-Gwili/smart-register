// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // ADD THIS IMPORT
const User = require('../models/User');
const { loginValidation } = require('../middleware/validation');

const router = express.Router();

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 ===== LOGIN ATTEMPT =====');
    console.log('📧 Email received:', email);
    console.log('🔑 Password received length:', password?.length);
    console.log('🌐 Request origin:', req.get('origin'));
    console.log('📱 User agent:', req.get('user-agent'));

    // Find user
    console.log('🔍 Searching for user in database...');
    const user = await User.findOne({ email })
      .populate('company')
      .populate('department');

    if (!user) {
      console.log('❌ USER NOT FOUND');
      return res.status(400).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    console.log('✅ USER FOUND:', {
      id: user._id,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      status: user.status,
      company: user.company?.name,
      department: user.department?.name
    });

    // Check password
    console.log('🔑 Comparing passwords...');
    console.log('   Input password:', password);
    console.log('   Stored hash:', user.password?.substring(0, 25) + '...');
    
    const isMatch = await user.comparePassword(password);
    console.log('🔑 Password comparison result:', isMatch);

    if (!isMatch) {
      console.log('❌ PASSWORD MISMATCH');
      return res.status(400).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    console.log('✅ PASSWORD MATCHED');

    // Check if user is active
    if (user.status !== 'active') {
      console.log('❌ ACCOUNT INACTIVE - Status:', user.status);
      return res.status(400).json({ 
        success: false,
        error: `Account is ${user.status}` 
      });
    }

    console.log('✅ ACCOUNT IS ACTIVE');

    // Generate token
    console.log('🎫 Generating JWT token...');
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-fallback-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    console.log('✅ TOKEN GENERATED');

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    console.log('📅 Last login updated');
    console.log('✅ LOGIN SUCCESSFUL');

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        company: user.company,
        position: user.position,
        phone: user.phone,
        leaveBalance: user.leaveBalance,
        status: user.status,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('💥 LOGIN ERROR:', error.message);
    console.error('💥 Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Server error during login' 
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'No token, authorization denied' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret-key-change-in-production');
    
    const user = await User.findById(decoded.userId)
      .populate('company')
      .populate('department')
      .select('-password');

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Token is not valid' 
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ 
        success: false,
        error: `Account is ${user.status}` 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        company: user.company,
        position: user.position,
        phone: user.phone,
        leaveBalance: user.leaveBalance,
        status: user.status,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token is not valid' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token has expired' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', (req, res) => {
  // Since JWT is stateless, logout is handled client-side by removing the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;