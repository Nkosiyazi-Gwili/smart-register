const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  company: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true,
    index: true 
  },
  clockIn: {
    time: { type: Date },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String }
    },
    selfie: { type: String }, // URL to selfie image
    verified: { type: Boolean, default: false },
    ipAddress: { type: String }
  },
  clockOut: {
    time: { type: Date },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String }
    },
    selfie: { type: String },
    verified: { type: Boolean, default: false },
    ipAddress: { type: String }
  },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'late', 'half-day', 'holiday'], 
    default: 'absent' 
  },
  totalHours: { type: Number, default: 0 },
  breakTime: { type: Number, default: 0 }, // in minutes
  notes: { type: String, maxlength: 500 },
  lateReason: { type: String, maxlength: 200 }
}, { 
  timestamps: true 
});

// Compound index for unique attendance per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Index for querying by company and date range
attendanceSchema.index({ company: 1, date: 1 });
attendanceSchema.index({ user: 1, date: -1 });

// Virtual for calculating if attendance is complete
attendanceSchema.virtual('isComplete').get(function() {
  return !!(this.clockIn.time && this.clockOut.time);
});

// Method to calculate total hours
attendanceSchema.methods.calculateTotalHours = function() {
  if (this.clockIn.time && this.clockOut.time) {
    const ms = this.clockOut.time - this.clockIn.time;
    this.totalHours = (ms / (1000 * 60 * 60)) - (this.breakTime / 60);
  }
  return this.totalHours;
};

// Pre-save middleware to calculate total hours
attendanceSchema.pre('save', function(next) {
  if (this.clockIn.time && this.clockOut.time && this.isModified('clockOut')) {
    this.calculateTotalHours();
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);