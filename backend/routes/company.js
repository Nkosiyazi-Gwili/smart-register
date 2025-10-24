// routes/companies.js
const express = require('express');
const Company = require('../models/Company');
const { auth, requireRole } = require('../middleware/auth'); // Use existing middleware
const router = express.Router();

// Get company settings - Only admin can access
router.get('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const company = await Company.findById(req.user.company);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    res.json({
      success: true,
      company
    });
    
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company settings'
    });
  }
});

// Update company settings - Only admin can access
router.put('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const {
      name,
      address,
      latitude,
      longitude,
      radius,
      contactEmail,
      contactPhone,
      workingHours,
      settings
    } = req.body;
    
    const company = await Company.findById(req.user.company);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Update fields
    if (name) company.name = name;
    if (address) company.address = address;
    if (latitude !== undefined) company.latitude = latitude;
    if (longitude !== undefined) company.longitude = longitude;
    if (radius !== undefined) company.radius = radius;
    if (contactEmail) company.contactEmail = contactEmail;
    if (contactPhone) company.contactPhone = contactPhone;
    if (workingHours) company.workingHours = workingHours;
    if (settings) company.settings = { ...company.settings, ...settings };
    
    await company.save();
    
    res.json({
      success: true,
      message: 'Company settings updated successfully',
      company
    });
    
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company settings'
    });
  }
});

module.exports = router;