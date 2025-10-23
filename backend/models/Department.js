const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 500 },
  company: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true 
  },
  manager: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true 
});

// Compound index for unique department names per company
departmentSchema.index({ name: 1, company: 1 }, { unique: true });
departmentSchema.index({ company: 1, isActive: 1 });

module.exports = mongoose.model('Department', departmentSchema);