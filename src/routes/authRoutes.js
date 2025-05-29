const express = require('express');
const router = express.Router();
const { login, register, getOrganizations, getCurrentUser } = require('../controllers/authController');
const { authenticateJWT, isOrgAdminOrAdmin } = require('../middleware/auth');
const { validate, rules } = require('../middleware/validation');

// Public routes
router.get('/organizations', getOrganizations);
router.post('/login', rules.user.login, validate, login);

// Protected routes
router.get('/me', authenticateJWT, getCurrentUser);
router.post('/register', authenticateJWT, isOrgAdminOrAdmin, rules.user.create, validate, register);

module.exports = router; 