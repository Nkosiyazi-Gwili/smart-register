const express = require('express');
const Department = require('../models/Department');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all departments
// @route   GET /api/department
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const departments = await Department.find({ 
      company: req.user.company,
      isActive: true 
    }).populate('manager', 'firstName lastName email');

    res.json({
      success: true,
      departments
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Create department
// @route   POST /api/department
// @access  Private (Admin)
router.post('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { name, description, manager } = req.body;

    const department = new Department({
      name,
      description,
      company: req.user.company,
      manager
    });

    await department.save();
    await department.populate('manager', 'firstName lastName email');

    res.status(201).json({
      success: true,
      department,
      message: 'Department created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Department name already exists' });
    }
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update department
// @route   PUT /api/department/:id
// @access  Private (Admin)
router.put('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { name, description, manager, isActive } = req.body;

    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      { name, description, manager, isActive },
      { new: true, runValidators: true }
    ).populate('manager', 'firstName lastName email');

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({
      success: true,
      department,
      message: 'Department updated successfully'
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;