// routes/leave.js
const express = require('express');
const Leave = require('../models/Leave');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { leaveValidation } = require('../middleware/validation'); // Use express-validator version
const { sendEmail } = require('../config/email');

const router = express.Router();

// @desc    Apply for leave
// @route   POST /api/leave/apply
// @access  Private
router.post('/apply', auth, leaveValidation, async (req, res) => {
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
        error: 'You already have a leave application for this period' 
      });
    }

    // Check leave balance
    const duration = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    if (user.leaveBalance[leaveType] < duration) {
      return res.status(400).json({ 
        error: `Insufficient ${leaveType} leave balance. Available: ${user.leaveBalance[leaveType]} days, Required: ${duration} days` 
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
    await leave.populate('user', 'firstName lastName email department');
    await leave.populate('user.department', 'name manager');

    // Notify manager
    if (leave.user.department?.manager) {
      const manager = await User.findById(leave.user.department.manager);
      if (manager) {
        await sendEmail(
          manager.email,
          'New Leave Application Requires Approval',
          `
            <h2>New Leave Application</h2>
            <p><strong>Employee:</strong> ${leave.user.firstName} ${leave.user.lastName}</p>
            <p><strong>Type:</strong> ${leaveType}</p>
            <p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>Please review and take appropriate action.</p>
          `
        );
      }
    }

    res.status(201).json({
      success: true,
      leave,
      message: 'Leave application submitted successfully'
    });
  } catch (error) {
    console.error('Leave application error:', error);
    res.status(500).json({ error: 'Server error during leave application' });
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

    const total = await Leave.countDocuments(query);

    res.json({
      success: true,
      leaves,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get all leaves for admin
// @route   GET /api/leave
// @access  Private (Admin)
router.get('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { company: req.user.company };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const leaveApplications = await Leave.find(query)
      .populate('user', 'firstName lastName employeeId department')
      .populate('user.department', 'name')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Leave.countDocuments(query);

    res.json({
      success: true,
      leaveApplications,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get pending leaves for approval (Managers/Admin)
// @route   GET /api/leave/pending
// @access  Private (Admin/Manager)
router.get('/pending', auth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 20, department } = req.query;

    let userQuery = { company: user.company };
    
    // If manager, only show leaves from their department
    if (user.role === 'manager' && user.department) {
      userQuery.department = user.department;
    } else if (department) {
      userQuery.department = department;
    }

    const usersInScope = await User.find(userQuery).select('_id');
    const userIds = usersInScope.map(u => u._id);

    const leaves = await Leave.find({ 
      user: { $in: userIds },
      status: 'pending'
    })
      .populate('user', 'firstName lastName employeeId department')
      .populate('user.department', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Leave.countDocuments({ 
      user: { $in: userIds },
      status: 'pending'
    });

    res.json({
      success: true,
      leaves,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get pending leaves error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Approve leave
// @route   PUT /api/leave/:id/approve
// @access  Private (Admin/Manager)
router.put('/:id/approve', auth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const user = req.user;

    const leave = await Leave.findById(req.params.id)
      .populate('user', 'firstName lastName email leaveBalance');

    if (!leave) {
      return res.status(404).json({ error: 'Leave not found' });
    }

    // Check if user has permission to approve this leave
    if (user.role === 'manager') {
      const employee = await User.findById(leave.user).populate('department');
      if (employee.department.manager?.toString() !== user._id.toString()) {
        return res.status(403).json({ error: 'You can only approve leaves from your department' });
      }
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Leave has already been processed' });
    }

    leave.status = 'approved';
    leave.approvedBy = user._id;
    leave.approvedAt = new Date();
    
    await leave.save();

    // Update leave balance if approved
    const duration = leave.duration;
    const userToUpdate = await User.findById(leave.user);
    userToUpdate.leaveBalance[leave.leaveType] -= duration;
    await userToUpdate.save();

    // Notify employee
    await sendEmail(
      leave.user.email,
      'Leave Application Approved',
      `
        <h2>Leave Application Approved</h2>
        <p>Your leave application has been <strong>approved</strong>.</p>
        <p><strong>Type:</strong> ${leave.leaveType}</p>
        <p><strong>Period:</strong> ${leave.startDate.toLocaleDateString()} - ${leave.endDate.toLocaleDateString()}</p>
        <p><strong>Total Days:</strong> ${duration}</p>
        <p>If you have any questions, please contact HR.</p>
      `
    );

    res.json({
      success: true,
      leave,
      message: 'Leave approved successfully'
    });
  } catch (error) {
    console.error('Leave approve error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Reject leave
// @route   PUT /api/leave/:id/reject
// @access  Private (Admin/Manager)
router.put('/:id/reject', auth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const user = req.user;

    const leave = await Leave.findById(req.params.id)
      .populate('user', 'firstName lastName email');

    if (!leave) {
      return res.status(404).json({ error: 'Leave not found' });
    }

    // Check if user has permission to reject this leave
    if (user.role === 'manager') {
      const employee = await User.findById(leave.user).populate('department');
      if (employee.department.manager?.toString() !== user._id.toString()) {
        return res.status(403).json({ error: 'You can only reject leaves from your department' });
      }
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Leave has already been processed' });
    }

    leave.status = 'rejected';
    leave.approvedBy = user._id;
    leave.approvedAt = new Date();
    leave.rejectionReason = rejectionReason;
    
    await leave.save();

    // Notify employee
    await sendEmail(
      leave.user.email,
      'Leave Application Rejected',
      `
        <h2>Leave Application Rejected</h2>
        <p>Your leave application has been <strong>rejected</strong>.</p>
        <p><strong>Type:</strong> ${leave.leaveType}</p>
        <p><strong>Period:</strong> ${leave.startDate.toLocaleDateString()} - ${leave.endDate.toLocaleDateString()}</p>
        <p><strong>Reason for rejection:</strong> ${rejectionReason}</p>
        <p>If you have any questions, please contact HR.</p>
      `
    );

    res.json({
      success: true,
      leave,
      message: 'Leave rejected successfully'
    });
  } catch (error) {
    console.error('Leave reject error:', error);
    res.status(500).json({ error: 'Server error' });
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
      return res.status(404).json({ error: 'Leave not found' });
    }

    if (leave.user.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'You can only cancel your own leaves' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending leaves can be cancelled' });
    }

    leave.status = 'cancelled';
    await leave.save();

    res.json({
      success: true,
      message: 'Leave application cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;