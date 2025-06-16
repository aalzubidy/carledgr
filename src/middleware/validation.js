const { validationResult, body, param, query } = require('express-validator');
const { ValidationError } = require('./errorHandler');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    throw new ValidationError(errorMessages.join(', '));
  }
  
  next();
};

// Common validation rules
const rules = {
  // Organization validation
  organization: {
    create: [
      body('name').notEmpty().withMessage('Organization name is required'),
      body('email').optional().isEmail().withMessage('Valid email is required')
    ],
    update: [
      param('id').notEmpty().withMessage('Organization ID is required'),
      body('name').optional().notEmpty().withMessage('Organization name cannot be empty')
    ]
  },
  
  // User validation
  user: {
    create: [
      body('organization_id').notEmpty().withMessage('Organization ID is required'),
      body('email').notEmpty().isEmail().withMessage('Valid email is required'),
      body('password').notEmpty().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
      body('role').optional().isIn(['user', 'org_admin', 'admin']).withMessage('Invalid role specified')
    ],
    update: [
      param('id').notEmpty().withMessage('User ID is required'),
      body('email').optional().isEmail().withMessage('Valid email is required'),
      body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    login: [
      body('organization').notEmpty().withMessage('Organization is required'),
      body('email').notEmpty().isEmail().withMessage('Valid email is required'),
      body('password').notEmpty().withMessage('Password is required')
    ]
  },
  
  // Car validation
  car: {
    create: [
      body('vin').notEmpty().isLength({ min: 17, max: 17 }).withMessage('Valid VIN number is required (17 characters)'),
      body('make').notEmpty().withMessage('Make is required'),
      body('model').notEmpty().withMessage('Model is required'),
      body('year').notEmpty().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
      body('purchase_date').notEmpty().isDate().withMessage('Valid purchase date is required'),
      body('purchase_price').notEmpty().isNumeric().withMessage('Valid purchase price is required')
    ],
    update: [
      param('id').notEmpty().withMessage('Car ID is required'),
      body('status').optional().isIn(['in_stock', 'sold', 'pending']).withMessage('Invalid status specified')
    ],
    search: [
      query('make').optional(),
      query('model').optional(),
      query('year').optional().isInt().withMessage('Year must be a number'),
      query('vin').optional()
    ]
  },
  
  // Maintenance validation
  maintenance: {
    create: [
      body('car_id').notEmpty().withMessage('Car ID is required'),
      body('description').notEmpty().withMessage('Description is required'),
      body('cost').notEmpty().isNumeric().withMessage('Valid cost is required'),
      body('maintenance_date').notEmpty().isDate().withMessage('Valid maintenance date is required')
    ],
    update: [
      param('id').notEmpty().withMessage('Maintenance record ID is required'),
      body('description').optional().notEmpty().withMessage('Description cannot be empty'),
      body('cost').optional().isNumeric().withMessage('Valid cost is required')
    ]
  },
  
  // Report validation
  report: {
    generate: [
      query('start_date').optional().isDate().withMessage('Valid start date is required'),
      query('end_date').optional().isDate().withMessage('Valid end date is required'),
      query('category_id').optional().isUUID().withMessage('Valid category ID is required')
    ]
  }
};

module.exports = {
  validate,
  rules
}; 