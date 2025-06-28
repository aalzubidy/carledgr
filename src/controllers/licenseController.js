const { v4: uuidv4 } = require('uuid');
const { 
  getLicenseWithTierByOrganizationId, 
  createLicense, 
  updateLicense,
  getCurrentCarCount,
  getLicenseTierByName,
  getAllLicenseTiers
} = require('../db/queries/licenseQueries');
const { NotFoundError } = require('../middleware/errorHandler');

// Get license info for current organization
const getLicenseInfo = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    const [license] = await getLicenseWithTierByOrganizationId(organizationId);
    
    if (!license) {
      return res.status(404).json({ message: 'License not found' });
    }
    
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
};

// Get license info for specific organization (admin only)
const getLicenseInfoById = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const [license] = await getLicenseWithTierByOrganizationId(organizationId);
    
    if (!license) {
      throw new NotFoundError('License not found for organization');
    }
    
    const currentCarCount = await getCurrentCarCount(organizationId);
    
    res.json({
      organization_id: license.organization_id,
      license_type: license.license_type,
      display_name: license.tier_display_name,
      car_limit: license.car_limit,
      monthly_price: license.tier_monthly_price,
      current_car_count: currentCarCount,
      usage_percentage: Math.round((currentCarCount / license.car_limit) * 100),
      is_active: license.is_active,
      is_free_account: license.is_free_account,
      subscription_status: license.subscription_status,
      stripe_customer_id: license.stripe_customer_id,
      stripe_subscription_id: license.stripe_subscription_id,
      current_period_start: license.current_period_start,
      current_period_end: license.current_period_end,
      free_reason: license.free_reason,
      created_at: license.created_at,
      updated_at: license.updated_at
    });
  } catch (error) {
    next(error);
  }
};

// Create free license (admin only)
const createFreeLicense = async (req, res, next) => {
  try {
    const { organization_id, reason, car_limit } = req.body;
    
    // Get champion tier details or use custom limit
    const customLimit = car_limit || 10000; // Default to champion level
    
    const licenseId = uuidv4();
    const license = {
      id: licenseId,
      organization_id,
      license_type: 'champion',
      car_limit: customLimit,
      is_free_account: true,
      free_reason: reason || 'admin_assigned',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: null
    };
    
    await createLicense(license);
    res.status(201).json({ 
      message: 'Free license created successfully', 
      license_id: licenseId,
      car_limit: customLimit
    });
  } catch (error) {
    next(error);
  }
};

// Update license (admin only)
const updateLicenseById = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const { license_type, is_active, car_limit, free_reason } = req.body;
    
    // Prepare updates
    const updates = {};
    if (license_type !== undefined) {
      // If changing license type, get the tier details
      if (license_type !== 'champion') {
        const [tier] = await getLicenseTierByName(license_type);
        if (!tier) {
          throw new NotFoundError('License tier not found');
        }
        updates.license_type = license_type;
        updates.car_limit = tier.car_limit;
      } else {
        updates.license_type = license_type;
        updates.car_limit = car_limit || 10000;
      }
    }
    if (is_active !== undefined) updates.is_active = is_active;
    if (free_reason !== undefined) updates.free_reason = free_reason;
    
    await updateLicense(organizationId, updates);
    
    // Return updated license
    const [updatedLicense] = await getLicenseWithTierByOrganizationId(organizationId);
    res.json(updatedLicense);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLicenseInfo,
  getLicenseInfoById,
  createFreeLicense,
  updateLicenseById
}; 