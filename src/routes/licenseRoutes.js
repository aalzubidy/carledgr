const express = require('express');
const router = express.Router();
const {
  getLicenseInfo,
  getLicenseInfoById,
  createFreeLicense,
  updateLicenseById
} = require('../controllers/licenseController');
const { authenticateJWT } = require('../middleware/auth');
const { requireOwner, requireOrganization } = require('../middleware/roleAuth');

// All license routes require authentication
router.use(authenticateJWT);

// Get current organization's license info
router.get('/', requireOrganization, getLicenseInfo);

// Admin-only routes
router.get('/:organizationId', requireOwner, getLicenseInfoById);
router.post('/free', requireOwner, createFreeLicense);
router.put('/:organizationId', requireOwner, updateLicenseById);

module.exports = router; 