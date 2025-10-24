// routes/auth.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// Login
// routes/auth.js - Replace your login route with this
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 ===== LOGIN ATTEMPT =====');
    console.log('📧 Email received:', email);
    console.log('🔑 Password received length:', password ? password.length : 'none');
    console.log('🌐 Request origin:', req.headers.origin);
    console.log('📱 User agent:', req.headers['user-agent']);

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    console.log('🔍 Searching for user in database...');
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .populate('department')
      .populate('company');

    if (!user) {
      console.log('❌ USER NOT FOUND in database for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
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
    console.log('   Stored hash:', user.password.substring(0, 30) + '...');
    
    const isMatch = await user.comparePassword(password);
    console.log('🔑 Password comparison result:', isMatch);

    if (!isMatch) {
      console.log('❌ PASSWORD MISMATCH');
      console.log('   This means the password provided does not match the hash in database');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('✅ PASSWORD MATCHED');

    // Check if user is active
    if (user.status !== 'active') {
      console.log('❌ User account is not active. Status:', user.status);
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    console.log('✅ ACCOUNT IS ACTIVE');

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    console.log('🎉 LOGIN SUCCESSFUL for:', user.email);
    console.log('🔐 Token generated');
    console.log('===== LOGIN COMPLETE =====\n');

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
        leaveBalance: user.leaveBalance
      }
    });

  } catch (error) {
    console.error('💥 LOGIN ERROR:', error);
    console.error('💥 Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});
// Add this to your auth routes for quick testing
router.post('/test-simple', async (req, res) => {
  console.log('🧪 SIMPLE TEST ENDPOINT HIT');
  console.log('📧 Email received:', req.body.email);
  console.log('🔑 Password received:', req.body.password ? '***' : 'none');
  
  res.json({
    success: true,
    received: {
      email: req.body.email,
      passwordLength: req.body.password ? req.body.password.length : 0
    },
    message: 'Test endpoint working'
  });
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
      // The user is already attached to req by the auth middleware
      res.json({
        success: true,
        user: {
          id: req.user._id,
          employeeId: req.user.employeeId,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: req.user.role,
          department: req.user.department,
          company: req.user.company,
          position: req.user.position,
          phone: req.user.phone,
          leaveBalance: req.user.leaveBalance,
          status: req.user.status, // Make sure this is included
          lastLogin: req.user.lastLogin
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, position } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (position) user.position = position;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
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
        leaveBalance: user.leaveBalance
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

module.exports = router;