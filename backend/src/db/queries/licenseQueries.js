const { query } = require('../connection');

// ============= LICENSE TIERS =============

// Get all license tiers
const getAllLicenseTiers = async (onlineOnly = false) => {
  let sql = 'SELECT * FROM license_tiers WHERE is_active = TRUE';
  if (onlineOnly) {
    sql += ' AND is_available_online = TRUE';
  }
  sql += ' ORDER BY sort_order ASC';
  
  return query(sql);
};

// Get license tier by name
const getLicenseTierByName = async (tierName) => {
  return query('SELECT * FROM license_tiers WHERE tier_name = ? AND is_active = TRUE', [tierName]);
};

// Get license tier by stripe price ID
const getLicenseTierByStripePrice = async (stripePriceId) => {
  return query('SELECT * FROM license_tiers WHERE stripe_price_id = ? AND is_active = TRUE', [stripePriceId]);
};

// Update license tier
const updateLicenseTier = async (tierName, updates) => {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(tierName);
  
  return query(
    `UPDATE license_tiers SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE tier_name = ?`,
    values
  );
};

// Create new license tier
const createLicenseTier = async (tier) => {
  const {
    id, tier_name, display_name, car_limit, monthly_price, 
    stripe_price_id, is_available_online, sort_order
  } = tier;
  
  return query(
    `INSERT INTO license_tiers 
    (id, tier_name, display_name, car_limit, monthly_price, stripe_price_id, is_available_online, sort_order) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, tier_name, display_name, car_limit, monthly_price, stripe_price_id, is_available_online, sort_order]
  );
};

// ============= ORGANIZATION LICENSES =============

// Get license for organization with tier details
const getLicenseWithTierByOrganizationId = async (organizationId) => {
  return query(`
    SELECT 
      ol.*,
      lt.display_name as tier_display_name,
      lt.monthly_price as tier_monthly_price,
      lt.is_available_online as tier_available_online
    FROM organization_licenses ol
    JOIN license_tiers lt ON ol.license_type = lt.tier_name
    WHERE ol.organization_id = ? AND lt.is_active = TRUE
  `, [organizationId]);
};

// Get license by organization ID (simple)
const getLicenseByOrganizationId = async (organizationId) => {
  return query('SELECT * FROM organization_licenses WHERE organization_id = ?', [organizationId]);
};

// Create license
const createLicense = async (license) => {
  const {
    id, organization_id, license_type, car_limit, is_free_account, 
    free_reason, stripe_customer_id, stripe_subscription_id, subscription_status
  } = license;
  
  return query(
    `INSERT INTO organization_licenses 
    (id, organization_id, license_type, car_limit, is_free_account, free_reason, 
     stripe_customer_id, stripe_subscription_id, subscription_status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, organization_id, license_type, car_limit, is_free_account, 
     free_reason, stripe_customer_id, stripe_subscription_id, subscription_status]
  );
};

// Update license
const updateLicense = async (organizationId, updates) => {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(organizationId);
  
  return query(
    `UPDATE organization_licenses SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE organization_id = ?`,
    values
  );
};

// ============= CAR COUNTING & LIMITS =============

// Get current car count for organization (excluding sold cars)
const getCurrentCarCount = async (organizationId) => {
  const result = await query(
    `SELECT COUNT(*) as count FROM cars 
     WHERE organization_id = ? AND status != 'sold'`,
    [organizationId]
  );
  return result[0].count;
};

// Check if organization can add more cars
const canAddCar = async (organizationId) => {
  const [license] = await getLicenseWithTierByOrganizationId(organizationId);
  if (!license || !license.is_active) {
    return { canAdd: false, reason: 'License inactive', currentCount: 0, limit: 0 };
  }
  
  // Check subscription status for paid accounts
  if (!license.is_free_account && license.subscription_status !== 'active') {
    return { canAdd: false, reason: 'Subscription not active', currentCount: 0, limit: license.car_limit };
  }
  
  const currentCount = await getCurrentCarCount(organizationId);
  const canAdd = currentCount < license.car_limit;
  
  return {
    canAdd,
    reason: canAdd ? null : 'Car limit reached',
    currentCount,
    limit: license.car_limit,
    tierName: license.license_type
  };
};

// ============= STRIPE EVENTS =============

// Create stripe event record
const createStripeEvent = async (eventData) => {
  const { id, stripe_event_id, event_type, organization_id, event_data } = eventData;
  
  return query(
    `INSERT INTO stripe_events (id, stripe_event_id, event_type, organization_id, event_data) 
     VALUES (?, ?, ?, ?, ?)`,
    [id, stripe_event_id, event_type, organization_id, JSON.stringify(event_data)]
  );
};

// Check if stripe event already processed
const isStripeEventProcessed = async (stripeEventId) => {
  const result = await query(
    'SELECT id FROM stripe_events WHERE stripe_event_id = ?',
    [stripeEventId]
  );
  return result.length > 0;
};

// Update stripe event status
const updateStripeEventStatus = async (stripeEventId, status, errorMessage = null) => {
  return query(
    'UPDATE stripe_events SET processed = ?, processed_at = CURRENT_TIMESTAMP WHERE stripe_event_id = ?',
    [status === 'processed' ? true : false, stripeEventId]
  );
};

module.exports = {
  // License tiers
  getAllLicenseTiers,
  getLicenseTierByName,
  getLicenseTierByStripePrice,
  updateLicenseTier,
  createLicenseTier,
  
  // Organization licenses
  getLicenseWithTierByOrganizationId,
  getLicenseByOrganizationId,
  createLicense,
  updateLicense,
  
  // Car counting
  getCurrentCarCount,
  canAddCar,
  
  // Stripe events
  createStripeEvent,
  isStripeEventProcessed,
  updateStripeEventStatus
}; 