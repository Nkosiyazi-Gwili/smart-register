// models/Company.js
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  address: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  radius: {
    type: Number,
    required: true,
    default: 50, // meters
    min: 1,
    max: 1000
  },
  contactEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  workingHours: {
    start: { type: String, default: '09:00' }, // HH:mm format
    end: { type: String, default: '17:00' }
  },
  settings: {
    requireSelfie: { type: Boolean, default: true },
    requireLocation: { type: Boolean, default: true },
    autoApproveAttendance: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);