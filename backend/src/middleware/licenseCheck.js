const { getLicenseWithTierByOrganizationId, getCurrentCarCount } = require('../db/queries/licenseQueries');
const { ForbiddenError } = require('./errorHandler');

// Check if organization can add more cars (for car creation)
const checkLicenseLimit = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    
    // Get organization license with tier details
    const [license] = await getLicenseWithTierByOrganizationId(organizationId);
    
    if (!license) {
      throw new ForbiddenError('No license found for organization. Please contact support.');
    }
    
    if (!license.is_active) {
      throw new ForbiddenError('License is inactive. Please contact support or update your subscription.');
    }
    
    // Check subscription status for paid accounts
    if (!license.is_free_account && license.subscription_status !== 'active') {
      const message = license.subscription_status === 'past_due' 
        ? 'Your subscription payment is past due. Please update your payment method to continue adding cars.'
        : 'Your subscription is not active. Please contact support or update your subscription.';
      throw new ForbiddenError(message);
    }
    
    // Get current car count (excluding sold cars)
    const currentCount = await getCurrentCarCount(organizationId);
    
    if (currentCount >= license.car_limit) {
      throw new ForbiddenError(
        `Car limit reached (${license.car_limit} cars). You currently have ${currentCount} cars. Please upgrade your plan to add more cars.`
      );
    }
    
    // Add license info to request for use in controllers
    req.license = license;
    req.currentCarCount = currentCount;
    
    next();
  } catch (error) {
    next(error);
  }
};

// Check if license is active (for general access)
const checkLicenseStatus = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    const [license] = await getLicenseWithTierByOrganizationId(organizationId);
    
    if (!license || !license.is_active) {
      throw new ForbiddenError('License is inactive. Please contact support.');
    }
    
    // Allow grace period for past_due subscriptions (they can still view data)
    if (!license.is_free_account && 
        license.subscription_status !== 'active' && 
        license.subscription_status !== 'past_due') {
      throw new ForbiddenError('Subscription is not active. Please contact support.');
    }
    
    req.license = license;
    next();
  } catch (error) {
    next(error);
  }
};

// Check if organization can change car status (prevent increasing active count beyond limit)
const checkStatusChange = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    // If not changing status, proceed
    if (!status) {
      return next();
    }
    
    // If changing to 'sold', always allow (reduces active count)
    if (status === 'sold') {
      return next();
    }
    
    // If changing from 'sold' to active status, check limit
    if (status === 'in_stock' || status === 'pending') {
      // We need to get the current car to see if it's currently 'sold'
      const carId = req.params.id;
      const { getCarById } = require('../db/queries/carQueries');
      const [car] = await getCarById(carId);
      
      if (car && car.status === 'sold') {
        // This would increase active count, check limit
        const organizationId = req.user.organization_id;
        const [license] = await getLicenseWithTierByOrganizationId(organizationId);
        
        if (!license || !license.is_active) {
          throw new ForbiddenError('License is inactive');
        }
        
        const currentCount = await getCurrentCarCount(organizationId);
        
        if (currentCount >= license.car_limit) {
          throw new ForbiddenError(
            `Cannot change car status. Car limit reached (${license.car_limit} cars). Please upgrade your plan.`
          );
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Check license for viewing only (allows inactive licenses to be viewed)
const checkLicenseViewOnly = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    const [license] = await getLicenseWithTierByOrganizationId(organizationId);
    
    if (!license) {
      throw new ForbiddenError('No license found for organization. Please contact support.');
    }
    
    // Allow viewing even if inactive - just attach license info
    req.license = license;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  checkLicenseLimit, 
  checkLicenseStatus, 
  checkStatusChange,
  checkLicenseViewOnly
}; 