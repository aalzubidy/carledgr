const express = require('express');
const router = express.Router();
const { 
  getAll, 
  getById, 
  create, 
  update, 
  remove 
} = require('../controllers/organizationController');
const { authenticateJWT, isAdmin, isSameOrganizationOrAdmin } = require('../middleware/auth');
const { validate, rules } = require('../middleware/validation');

// All organization routes require authentication
router.use(authenticateJWT);

// Get all organizations (admin only)
router.get('/', isAdmin, getAll);

// Get organization by ID (admin or same organization)
router.get('/:id', isSameOrganizationOrAdmin, getById);

// Create organization (admin only)
router.post('/', isAdmin, rules.organization.create, validate, create);

// Update organization (admin or same organization)
router.put('/:id', isSameOrganizationOrAdmin, rules.organization.update, validate, update);

// Delete organization (admin only)
router.delete('/:id', isAdmin, remove);

module.exports = router; 