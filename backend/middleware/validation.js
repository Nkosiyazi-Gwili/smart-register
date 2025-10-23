const { body, validationResult } = require('express-validator');

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

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  handleValidationErrors
];

const attendanceValidation = [
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  handleValidationErrors
];

const leaveValidation = [
  body('type').isIn(['sick', 'vacation', 'personal', 'maternity', 'paternity']),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('reason').isLength({ min: 10, max: 500 }),
  handleValidationErrors
];

module.exports = {
  loginValidation,
  attendanceValidation,
  leaveValidation,
  handleValidationErrors
};