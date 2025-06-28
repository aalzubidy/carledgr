const express = require('express');
const router = express.Router();
const { 
  getAll, 
  getById, 
  create, 
  update, 
  remove 
} = require('../controllers/organizationController');
const { authenticateJWT, isOwner } = require('../middleware/auth');
const { requireOwner, requireOrganization } = require('../middleware/roleAuth');
const { validate, rules } = require('../middleware/validation');

// All organization routes require authentication
router.use(authenticateJWT);

// Get all organizations (owner only)
router.get('/', requireOwner, getAll);

// Get organization by ID (owner only)
router.get('/:id', requireOwner, getById);

// Create organization (owner only)
router.post('/', requireOwner, rules.organization.create, validate, create);

// Update organization (owner only)
router.put('/:id', requireOwner, rules.organization.update, validate, update);

// Delete organization (owner only)
router.delete('/:id', requireOwner, remove);

module.exports = router; 