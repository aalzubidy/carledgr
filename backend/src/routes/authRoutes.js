const express = require('express');
const router = express.Router();
const { login, register, getOrganizations, getCurrentUser, getRoles, updateProfile, updatePassword, forgotPassword, logout } = require('../controllers/authController');
const { authenticateJWT, isOwner } = require('../middleware/auth');
const { requireOwner } = require('../middleware/roleAuth');
const { validate, rules } = require('../middleware/validation');

// Public routes
router.get('/organizations', getOrganizations);
router.post('/login', rules.user.login, validate, login);
router.post('/forgot-password', rules.user.forgotPassword, validate, forgotPassword);

// Protected routes
router.get('/me', authenticateJWT, getCurrentUser);
router.post('/register', authenticateJWT, requireOwner, rules.user.create, validate, register);
router.post('/logout', authenticateJWT, logout);
router.get('/roles', authenticateJWT, requireOwner, getRoles);
router.put('/profile', authenticateJWT, updateProfile);
router.put('/password', authenticateJWT, updatePassword);

module.exports = router; 