const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
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
  type: { 
    type: String, 
    enum: ['sick', 'vacation', 'personal', 'maternity', 'paternity'],
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true, maxlength: 500 },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'cancelled'], 
    default: 'pending' 
  },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  approvedAt: { type: Date },
  rejectionReason: { type: String, maxlength: 200 },
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
    relationship: { type: String }
  },
  documents: [{ 
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { 
  timestamps: true 
});

// Indexes for better query performance
leaveSchema.index({ user: 1, createdAt: -1 });
leaveSchema.index({ company: 1, status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });
leaveSchema.index({ status: 1, createdAt: 1 });

// Virtual for calculating leave duration
leaveSchema.virtual('duration').get(function() {
  const ms = this.endDate - this.startDate;
  return Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1; // Include both start and end dates
});

// Method to check if leave overlaps with existing leaves
leaveSchema.statics.findOverlappingLeaves = async function(userId, startDate, endDate, excludeId = null) {
  const query = {
    user: userId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return await this.find(query);
};

// Pre-save validation to ensure endDate is after startDate
leaveSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);