const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { 
  getOrganizationUsers,
  createOrganizationUser,
  updateOrganizationUser,
  deleteOrganizationUser,
  getUserRoles
} = require('../controllers/userController');
const { authenticateJWT } = require('../middleware/auth');
const { requireOwner, requireOrganization } = require('../middleware/roleAuth');
const { validate } = require('../middleware/validation');

// Get user roles (this doesn't need owner role, just authentication)
router.get('/roles', authenticateJWT, getUserRoles);

// All other user management routes require authentication and owner role
router.use(authenticateJWT);
router.use(requireOwner);
router.use(requireOrganization);

// Get all users in organization
router.get('/', getOrganizationUsers);

// Create new user
router.post('/', 
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('role_id').optional().isInt({ min: 1, max: 3 }).withMessage('Invalid role ID'),
    validate
  ],
  createOrganizationUser
);

// Update user
router.put('/:id',
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('role_id').isInt({ min: 1, max: 3 }).withMessage('Invalid role ID'),
    validate
  ],
  updateOrganizationUser
);

// Delete user
router.delete('/:id',
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    validate
  ],
  deleteOrganizationUser
);

module.exports = router;