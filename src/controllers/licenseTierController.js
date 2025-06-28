const { v4: uuidv4 } = require('uuid');
const {
  getAllLicenseTiers,
  getLicenseTierByName,
  updateLicenseTier,
  createLicenseTier
} = require('../db/queries/licenseQueries');
const { NotFoundError } = require('../middleware/errorHandler');

// Get all license tiers (admin only)
const getAllTiers = async (req, res, next) => {
  try {
    const tiers = await getAllLicenseTiers();
    res.json(tiers);
  } catch (error) {
    next(error);
  }
};

// Get available tiers for public (online purchase)
const getAvailableTiers = async (req, res, next) => {
  try {
    const tiers = await getAllLicenseTiers(true); // online only
    res.json(tiers);
  } catch (error) {
    next(error);
  }
};

// Get specific tier by name
const getTierByName = async (req, res, next) => {
  try {
    const { tierName } = req.params;
    const [tier] = await getLicenseTierByName(tierName);
    
    if (!tier) {
      throw new NotFoundError('License tier not found');
    }
    
    res.json(tier);
  } catch (error) {
    next(error);
  }
};

// Update license tier (admin only)
const updateTier = async (req, res, next) => {
  try {
    const { tierName } = req.params;
    const { 
      display_name, 
      car_limit, 
      monthly_price, 
      stripe_price_id, 
      is_available_online, 
      sort_order 
    } = req.body;
    
    // Check if tier exists
    const [existingTier] = await getLicenseTierByName(tierName);
    if (!existingTier) {
      throw new NotFoundError('License tier not found');
    }
    
    // Prepare updates (only include provided fields)
    const updates = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (car_limit !== undefined) updates.car_limit = car_limit;
    if (monthly_price !== undefined) updates.monthly_price = monthly_price;
    if (stripe_price_id !== undefined) updates.stripe_price_id = stripe_price_id;
    if (is_available_online !== undefined) updates.is_available_online = is_available_online;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    
    await updateLicenseTier(tierName, updates);
    
    // Return updated tier
    const [updatedTier] = await getLicenseTierByName(tierName);
    res.json(updatedTier);
  } catch (error) {
    next(error);
  }
};

// Create new license tier (admin only)
const createTier = async (req, res, next) => {
  try {
    const { 
      tier_name, 
      display_name, 
      car_limit, 
      monthly_price, 
      stripe_price_id, 
      is_available_online, 
      sort_order 
    } = req.body;
    
    const id = uuidv4();
    const tier = {
      id,
      tier_name,
      display_name,
      car_limit,
      monthly_price,
      stripe_price_id,
      is_available_online: is_available_online !== undefined ? is_available_online : true,
      sort_order: sort_order !== undefined ? sort_order : 999
    };
    
    await createLicenseTier(tier);
    
    const [newTier] = await getLicenseTierByName(tier_name);
    res.status(201).json(newTier);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTiers,
  getAvailableTiers,
  getTierByName,
  updateTier,
  createTier
}; 