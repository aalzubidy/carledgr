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
const { checkLicenseViewOnly } = require('../middleware/licenseCheck');
const { getCurrentCarCount } = require('../db/queries/licenseQueries');

// All license routes require authentication
router.use(authenticateJWT);

// Get current organization's license info (allows viewing inactive licenses)
router.get('/', requireOrganization, checkLicenseViewOnly, getLicenseInfo);

// Get license info with car count (for settings page - allows inactive licenses)
router.get('/with-usage', requireOrganization, checkLicenseViewOnly, async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    const { getLicenseWithTierByOrganizationId } = require('../db/queries/licenseQueries');
    
    // Get license info
    const [license] = await getLicenseWithTierByOrganizationId(organizationId);
    
    if (!license) {
      return res.status(404).json({ message: 'License not found' });
    }
    
    // Get car count (this bypasses car route middleware)
    const currentCarCount = await getCurrentCarCount(organizationId);
    
    res.json({
      license_type: license.license_type,
      display_name: license.tier_display_name,
      car_limit: license.car_limit,
      monthly_price: license.tier_monthly_price,
      current_car_count: currentCarCount,
      usage_percentage: Math.round((currentCarCount / license.car_limit) * 100),
      is_active: license.is_active,
      is_free_account: license.is_free_account,
      subscription_status: license.subscription_status,
      current_period_end: license.current_period_end,
      free_reason: license.free_reason
    });
  } catch (error) {
    next(error);
  }
});

// Admin-only routes
router.get('/:organizationId', requireOwner, getLicenseInfoById);
router.post('/free', requireOwner, createFreeLicense);
router.put('/:organizationId', requireOwner, updateLicenseById);

module.exports = router; 