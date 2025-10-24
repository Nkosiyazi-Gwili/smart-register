// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debug log
    
    const user = await User.findById(decoded.userId)
      .populate('company')
      .populate('department');
    
    if (!user) {
      console.log('User not found for ID:', decoded.userId); // Debug log
      return res.status(401).json({ error: 'Token is not valid' });
    }

    // Debug log the user status
    console.log('User auth status check:', {
      userId: user._id,
      email: user.email,
      status: user.status,
      statusType: typeof user.status
    });

    // Check if status exists and is not 'active'
    if (user.status && user.status !== 'active') {
      console.log('User account not active, status:', user.status); // Debug log
      return res.status(401).json({ 
        error: `Account is ${user.status}`,
        status: user.status 
      });
    }

    // If status doesn't exist or is 'active', allow access
    console.log('Auth successful for user:', user.email); // Debug log
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token is not valid' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    
    res.status(401).json({ error: 'Authentication failed' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { auth, requireRole };