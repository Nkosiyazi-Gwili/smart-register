// middleware/validation.js
const { body, validationResult } = require('express-validator');
const Joi = require('joi');

// Express-validator based validations
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// Login validation
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

// Attendance validation
const attendanceValidation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required (-90 to 90)'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required (-180 to 180)'),
  handleValidationErrors
];

// Leave validation using express-validator (recommended approach)
const leaveValidation = [
  body('leaveType')
    .isIn(['sick', 'vacation', 'personal', 'maternity', 'paternity'])
    .withMessage('Valid leave type is required'),
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Start date must be in the future');
      }
      return true;
    }),
  body('endDate')
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('reason')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  handleValidationErrors
];

// User creation/update validation
const userValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('firstName')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .trim(),
  body('lastName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .trim(),
  body('role')
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Valid role is required'),
  body('position')
    .isLength({ min: 2, max: 100 })
    .withMessage('Position must be between 2 and 100 characters')
    .trim(),
  handleValidationErrors
];

// Department validation
const departmentValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Department name must be between 2 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .trim(),
  handleValidationErrors
];

// Joi-based validation (alternative approach - choose one)
const leaveValidationJoi = (req, res, next) => {
  const schema = Joi.object({
    leaveType: Joi.string().valid('sick', 'vacation', 'personal', 'maternity', 'paternity').required(),
    startDate: Joi.date().iso().greater('now').required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    reason: Joi.string().min(10).max(500).required(),
    emergencyContact: Joi.object({
      name: Joi.string().optional(),
      phone: Joi.string().optional(),
      relationship: Joi.string().optional()
    }).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = {
  // Express-validator based (recommended)
  loginValidation,
  attendanceValidation,
  leaveValidation,
  userValidation,
  departmentValidation,
  handleValidationErrors,
  
  // Joi-based (alternative)
  leaveValidationJoi
};