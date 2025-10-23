const express = require('express');
const Company = require('../models/Company');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// @desc    Get company details
// @route   GET /api/company
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.user.company);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({
      success: true,
      company
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update company settings
// @route   PUT /api/company/settings
// @access  Private (Admin)
router.put('/settings', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { settings } = req.body;
    
    const company = await Company.findByIdAndUpdate(
      req.user.company,
      { settings },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      company,
      message: 'Company settings updated successfully'
    });
  } catch (error) {
    console.error('Update company settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Add company location
// @route   POST /api/company/locations
// @access  Private (Admin)
router.post('/locations', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { name, address, latitude, longitude, radius } = req.body;
    
    const company = await Company.findById(req.user.company);
    
    company.locations.push({
      name,
      address,
      coordinates: { latitude, longitude },
      radius: radius || 100
    });

    await company.save();

    res.json({
      success: true,
      company,
      message: 'Location added successfully'
    });
  } catch (error) {
    console.error('Add location error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;