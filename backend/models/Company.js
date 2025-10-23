const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  radius: { type: Number, default: 100, min: 50, max: 1000 } // meters
}, { _id: true });

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  website: { type: String },
  locations: [locationSchema],
  settings: {
    shiftStart: { type: String, default: "09:00" },
    shiftEnd: { type: String, default: "17:00" },
    gracePeriod: { type: Number, default: 15 }, // minutes
    autoApproveLeave: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true 
});

// Index for better query performance
companySchema.index({ email: 1 });
companySchema.index({ isActive: 1 });

module.exports = mongoose.model('Company', companySchema);