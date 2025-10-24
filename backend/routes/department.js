// routes/departments.js
const express = require('express');
const Department = require('../models/Department');
const User = require('../models/User');
const { adminAuth, managerAuth } = require('../middleware/auth');
const router = express.Router();

// Get all departments
router.get('/', managerAuth, async (req, res) => {
  try {
    const departments = await Department.find({ company: req.user.company })
      .populate('manager')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      departments
    });
    
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments'
    });
  }
});

// Get department by ID
router.get('/:id', managerAuth, async (req, res) => {
  try {
    const department = await Department.findOne({
      _id: req.params.id,
      company: req.user.company
    }).populate('manager');
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    res.json({
      success: true,
      department
    });
    
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department'
    });
  }
});

// Create department (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, description, manager } = req.body;
    
    // Check if department already exists
    const existingDept = await Department.findOne({ 
      name, 
      company: req.user.company 
    });
    
    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists'
      });
    }
    
    // Verify manager exists and belongs to same company
    if (manager) {
      const managerUser = await User.findOne({
        _id: manager,
        company: req.user.company
      });
      
      if (!managerUser) {
        return res.status(400).json({
          success: false,
          message: 'Manager not found'
        });
      }
    }
    
    const department = new Department({
      name,
      description,
      manager,
      company: req.user.company
    });
    
    await department.save();
    
    const populatedDept = await Department.findById(department._id)
      .populate('manager');
    
    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department: populatedDept
    });
    
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating department'
    });
  }
});

// Update department (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, manager, status } = req.body;
    
    const department = await Department.findOne({
      _id: req.params.id,
      company: req.user.company
    });
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    // Check name uniqueness
    if (name && name !== department.name) {
      const existingDept = await Department.findOne({ 
        name, 
        company: req.user.company,
        _id: { $ne: req.params.id }
      });
      
      if (existingDept) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name already exists'
        });
      }
      department.name = name;
    }
    
    if (description !== undefined) department.description = description;
    if (status) department.status = status;
    
    // Update manager
    if (manager) {
      const managerUser = await User.findOne({
        _id: manager,
        company: req.user.company
      });
      
      if (!managerUser) {
        return res.status(400).json({
          success: false,
          message: 'Manager not found'
        });
      }
      department.manager = manager;
    }
    
    await department.save();
    
    const populatedDept = await Department.findById(department._id)
      .populate('manager');
    
    res.json({
      success: true,
      message: 'Department updated successfully',
      department: populatedDept
    });
    
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating department'
    });
  }
});

// Delete department (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const department = await Department.findOne({
      _id: req.params.id,
      company: req.user.company
    });
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    // Check if department has users
    const userCount = await User.countDocuments({ 
      department: req.params.id,
      status: 'active'
    });
    
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with active users'
      });
    }
    
    await Department.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting department'
    });
  }
});

module.exports = router;