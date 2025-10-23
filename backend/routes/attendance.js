const express = require('express');
const Attendance = require('../models/Attendance');
const Company = require('../models/Company');
const { auth, requireRole } = require('../middleware/auth');
const { attendanceValidation } = require('../middleware/validation');

const router = express.Router();

// @desc    Clock in
// @route   POST /api/attendance/clock-in
// @access  Private
router.post('/clock-in', auth, attendanceValidation, async (req, res) => {
  try {
    const { latitude, longitude, selfie, notes } = req.body;
    const user = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already clocked in today
    const existingAttendance = await Attendance.findOne({
      user: user._id,
      date: today
    });

    if (existingAttendance?.clockIn?.time) {
      return res.status(400).json({ error: 'Already clocked in today' });
    }

    // Verify location
    const company = await Company.findById(user.company);
    const isWithinLocation = await verifyLocation(
      latitude, 
      longitude, 
      company.locations
    );

    if (!isWithinLocation) {
      return res.status(400).json({ 
        error: 'You are not within designated work location. Please move to your workplace to clock in.' 
      });
    }

    // TODO: Implement facial recognition verification
    const faceVerified = await verifyFace(selfie, user.faceEmbedding);

    const attendanceData = {
      user: user._id,
      company: user.company,
      date: today,
      clockIn: {
        time: new Date(),
        location: { latitude, longitude },
        selfie,
        verified: faceVerified,
        ipAddress: req.ip
      },
      status: 'present',
      notes
    };

    // Check if late
    const currentTime = new Date();
    const shiftStart = new Date();
    const [hours, minutes] = user.shift.start.split(':');
    shiftStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (currentTime > shiftStart) {
      attendanceData.status = 'late';
      const lateMinutes = Math.floor((currentTime - shiftStart) / (1000 * 60));
      attendanceData.lateReason = `Late by ${lateMinutes} minutes`;
    }

    const attendance = await Attendance.findOneAndUpdate(
      { user: user._id, date: today },
      attendanceData,
      { upsert: true, new: true, runValidators: true }
    ).populate('user', 'firstName lastName employeeId');

    // Emit real-time event
    const io = req.app.get('io');
    io.to(user.company.toString()).emit('attendance-update', {
      type: 'clock-in',
      attendance,
      userId: user._id
    });

    res.json({
      success: true,
      attendance,
      message: faceVerified ? 'Clock in successful' : 'Clock in pending face verification'
    });
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ error: 'Server error during clock in' });
  }
});

// @desc    Clock out
// @route   POST /api/attendance/clock-out
// @access  Private
router.post('/clock-out', auth, attendanceValidation, async (req, res) => {
  try {
    const { latitude, longitude, selfie, notes } = req.body;
    const user = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: user._id,
      date: today
    });

    if (!attendance) {
      return res.status(400).json({ error: 'Please clock in first' });
    }

    if (attendance.clockOut?.time) {
      return res.status(400).json({ error: 'Already clocked out today' });
    }

    attendance.clockOut = {
      time: new Date(),
      location: { latitude, longitude },
      selfie,
      ipAddress: req.ip
    };
    attendance.notes = notes || attendance.notes;

    await attendance.save();

    // Emit real-time event
    const io = req.app.get('io');
    io.to(user.company.toString()).emit('attendance-update', {
      type: 'clock-out',
      attendance,
      userId: user._id
    });

    res.json({
      success: true,
      attendance,
      message: 'Clock out successful'
    });
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ error: 'Server error during clock out' });
  }
});

// @desc    Get today's attendance
// @route   GET /api/attendance/today
// @access  Private
router.get('/today', auth, async (req, res) => {
  try {
    const user = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: user._id,
      date: today
    });

    res.json({
      success: true,
      attendance: attendance || null
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get user attendance history
// @route   GET /api/attendance/history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 30, startDate, endDate } = req.query;

    const query = { user: user._id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'firstName lastName employeeId');

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get company attendance (Admin/Manager only)
// @route   GET /api/attendance/company
// @access  Private (Admin/Manager)
router.get('/company', auth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const user = req.user;
    const { date, department, page = 1, limit = 50 } = req.query;
    
    const query = { company: user.company };
    
    if (date) {
      query.date = new Date(date);
    }
    
    if (department) {
      const usersInDept = await User.find({ department }).select('_id');
      query.user = { $in: usersInDept.map(u => u._id) };
    }

    const attendance = await Attendance.find(query)
      .populate('user', 'firstName lastName employeeId department')
      .populate('user.department', 'name')
      .sort({ date: -1, 'clockIn.time': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get company attendance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to verify location
async function verifyLocation(lat, lng, companyLocations) {
  for (const location of companyLocations) {
    const distance = calculateDistance(
      lat, 
      lng, 
      location.coordinates.latitude, 
      location.coordinates.longitude
    );
    
    if (distance <= location.radius) {
      return true;
    }
  }
  return false;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// TODO: Implement facial recognition
async function verifyFace(selfieImage, storedEmbedding) {
  // Integrate with facial recognition service
  // For now, return true for development
  return true;
}

module.exports = router;