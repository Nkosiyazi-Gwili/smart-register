// routes/leave.js
const express = require('express');
const Leave = require('../models/Leave');
const User = require('../models/User');
const { auth, adminAuth, managerAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Apply for leave
// @route   POST /api/leave
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, emergencyContact } = req.body;
    const user = req.user;

    // Check for overlapping leaves
    const overlappingLeaves = await Leave.findOverlappingLeaves(
      user._id, 
      new Date(startDate), 
      new Date(endDate)
    );

    if (overlappingLeaves.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'You already have a leave application for this period' 
      });
    }

    // Check leave balance
    const duration = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    if (user.leaveBalance[leaveType] < duration) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient ${leaveType} leave balance. Available: ${user.leaveBalance[leaveType]} days, Required: ${duration} days` 
      });
    }

    const leave = new Leave({
      user: user._id,
      company: user.company,
      leaveType,
      startDate,
      endDate,
      reason,
      emergencyContact
    });

    await leave.save();
    
    // Populate user details for response
    await leave.populate('user', 'firstName lastName employeeId department');
    await leave.populate('user.department', 'name');

    res.status(201).json({
      success: true,
      leave: {
        ...leave.toObject(),
        totalDays: leave.totalDays
      },
      message: 'Leave application submitted successfully'
    });
  } catch (error) {
    console.error('Leave application error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during leave application' 
    });
  }
});

// @desc    Get all leave applications (Admin/Manager)
// @route   GET /api/leave
// @access  Private (Admin/Manager)
router.get('/', managerAuth, async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 50, status, department } = req.query;

    let filter = { company: user.company };
    
    // Filter by status if provided
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // For managers, only show leaves from their department
    if (user.role === 'manager') {
      filter['user.department'] = user.department._id;
    } else if (department) {
      filter['user.department'] = department;
    }

    const leaveApplications = await Leave.find(filter)
      .populate('user', 'firstName lastName employeeId department')
      .populate('user.department', 'name')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Calculate virtual field for each leave
    const applicationsWithDays = leaveApplications.map(leave => ({
      ...leave.toObject(),
      totalDays: leave.totalDays
    }));

    const total = await Leave.countDocuments(filter);

    res.json({
      success: true,
      leaveApplications: applicationsWithDays,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get leave applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave applications'
    });
  }
});

// @desc    Get user's leave history
// @route   GET /api/leave/my-leaves
// @access  Private
router.get('/my-leaves', auth, async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 20, status, year } = req.query;

    const query = { user: user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (year) {
      query.startDate = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      };
    }

    const leaves = await Leave.find(query)
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Calculate virtual field for each leave
    const leavesWithDays = leaves.map(leave => ({
      ...leave.toObject(),
      totalDays: leave.totalDays
    }));

    const total = await Leave.countDocuments(query);

    res.json({
      success: true,
      leaves: leavesWithDays,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Approve leave application
// @route   PUT /api/leave/:id/approve
// @access  Private (Admin/Manager)
router.put('/:id/approve', managerAuth, async (req, res) => {
  try {
    const user = req.user;

    const leave = await Leave.findById(req.params.id)
      .populate('user', 'firstName lastName email leaveBalance department')
      .populate('user.department', 'name manager');

    if (!leave) {
      return res.status(404).json({ 
        success: false,
        message: 'Leave application not found' 
      });
    }

    // Check if user has permission to approve this leave
    if (user.role === 'manager') {
      if (leave.user.department.manager?.toString() !== user._id.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'You can only approve leaves from your department' 
        });
      }
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: 'Leave has already been processed' 
      });
    }

    leave.status = 'approved';
    leave.approvedBy = user._id;
    leave.approvedAt = new Date();
    
    await leave.save();

    // Update leave balance if approved
    const duration = leave.totalDays;
    const userToUpdate = await User.findById(leave.user._id);
    userToUpdate.leaveBalance[leave.leaveType] -= duration;
    await userToUpdate.save();

    res.json({
      success: true,
      leave: {
        ...leave.toObject(),
        totalDays: leave.totalDays
      },
      message: 'Leave application approved successfully'
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error approving leave application' 
    });
  }
});

// @desc    Reject leave application
// @route   PUT /api/leave/:id/reject
// @access  Private (Admin/Manager)
router.put('/:id/reject', managerAuth, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const user = req.user;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Rejection reason is required' 
      });
    }

    const leave = await Leave.findById(req.params.id)
      .populate('user', 'firstName lastName email department')
      .populate('user.department', 'name manager');

    if (!leave) {
      return res.status(404).json({ 
        success: false,
        message: 'Leave application not found' 
      });
    }

    // Check if user has permission to reject this leave
    if (user.role === 'manager') {
      if (leave.user.department.manager?.toString() !== user._id.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'You can only reject leaves from your department' 
        });
      }
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: 'Leave has already been processed' 
      });
    }

    leave.status = 'rejected';
    leave.approvedBy = user._id;
    leave.approvedAt = new Date();
    leave.rejectionReason = rejectionReason.trim();
    
    await leave.save();

    res.json({
      success: true,
      leave: {
        ...leave.toObject(),
        totalDays: leave.totalDays
      },
      message: 'Leave application rejected successfully'
    });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error rejecting leave application' 
    });
  }
});

// @desc    Cancel leave application
// @route   PUT /api/leave/:id/cancel
// @access  Private
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const user = req.user;
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ 
        success: false,
        message: 'Leave not found' 
      });
    }

    if (leave.user.toString() !== user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only cancel your own leaves' 
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: 'Only pending leaves can be cancelled' 
      });
    }

    leave.status = 'cancelled';
    await leave.save();

    res.json({
      success: true,
      message: 'Leave application cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @desc    Get leave statistics
// @route   GET /api/leave/stats
// @access  Private (Admin/Manager)
router.get('/stats', managerAuth, async (req, res) => {
  try {
    const user = req.user;
    
    let userFilter = { company: user.company };
    
    // For managers, only show stats from their department
    if (user.role === 'manager') {
      userFilter.department = user.department._id;
    }

    const usersInScope = await User.find(userFilter).select('_id');
    const userIds = usersInScope.map(u => u._id);

    const stats = await Leave.aggregate([
      {
        $match: {
          user: { $in: userIds }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      total: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.json({
      success: true,
      stats: formattedStats
    });
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave statistics'
    });
  }
});

module.exports = router;