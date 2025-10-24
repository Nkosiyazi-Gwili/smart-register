// models/Attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['in', 'out'],
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  location: {
    address: String,
    latitude: Number,
    longitude: Number
  },
  selfie: {
    type: String // Base64 encoded image or URL
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ user: 1, timestamp: 1 });
attendanceSchema.index({ company: 1, timestamp: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);