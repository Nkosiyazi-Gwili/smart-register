// models/Department.js
const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  employeeCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Update employee count when users are added/removed
departmentSchema.methods.updateEmployeeCount = async function() {
  const User = mongoose.model('User');
  const count = await User.countDocuments({ 
    department: this._id, 
    status: 'active' 
  });
  this.employeeCount = count;
  await this.save();
};

module.exports = mongoose.model('Department', departmentSchema);