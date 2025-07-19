const { createCheckoutSession } = require('../utils/stripeService');
const { getAllLicenseTiers } = require('../db/queries/licenseQueries');
const logger = require('../utils/logger');

// Get available subscription plans (public endpoint)
const getAvailablePlans = async (req, res, next) => {
  try {
    const tiers = await getAllLicenseTiers(true); // online only
    
    // Format for public consumption
    const plans = tiers.map(tier => ({
      id: tier.tier_name,
      name: tier.display_name,
      price: parseFloat(tier.monthly_price),
      car_limit: tier.car_limit,
      stripe_price_id: tier.stripe_price_id,
      features: getFeaturesByTier(tier.tier_name)
    }));
    
    res.json(plans);
  } catch (error) {
    next(error);
  }
};

// Create subscription checkout session (public endpoint)
const createSubscriptionCheckout = async (req, res, next) => {
  try {
    const { 
      price_id, 
      organization_name, 
      owner_email,
      success_url, 
      cancel_url 
    } = req.body;

    // Validate required fields
    if (!price_id || !organization_name || !owner_email || !success_url || !cancel_url) {
      return res.status(400).json({ 
        error: 'Missing required fields: price_id, organization_name, owner_email, success_url, cancel_url' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(owner_email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const session = await createCheckoutSession(
      price_id,
      owner_email,
      organization_name,
      success_url,
      cancel_url
    );

    logger.info(`Checkout session created for ${organization_name} (${owner_email})`);

    res.json({ 
      checkout_url: session.url,
      session_id: session.id 
    });
  } catch (error) {
    logger.error(`Failed to create checkout session: ${error.message}`);
    next(error);
  }
};

// Get features by tier for display
const getFeaturesByTier = (tierName) => {
  const features = {
    starter: [
      'Up to 20 active cars',
      'Unlimited sold cars tracking',
      'Basic inventory management',
      'Expense tracking',
      'Basic reports',
      'Email support'
    ],
    professional: [
      'Up to 50 active cars',
      'Unlimited sold cars tracking',
      'Advanced inventory management',
      'Detailed expense tracking',
      'Advanced reports & analytics',
      'Maintenance tracking',
      'Priority email support'
    ],
    business: [
      'Up to 100 active cars',
      'Unlimited sold cars tracking',
      'Full inventory management',
      'Complete expense tracking',
      'Business intelligence reports',
      'Advanced maintenance tracking',
      'Multi-user access',
      'Phone support'
    ],
    enterprise: [
      'Unlimited active cars',
      'Unlimited sold cars tracking',
      'Enterprise inventory management',
      'Advanced expense analytics',
      'Custom reports & dashboards',
      'Complete maintenance suite',
      'Unlimited users',
      'Dedicated account manager',
      'Priority phone support',
      'Custom integrations'
    ]
  };

  return features[tierName] || [];
};

// Health check for subscription service
const healthCheck = async (req, res) => {
  try {
    // Check if we can fetch tiers (tests database connection)
    const tiers = await getAllLicenseTiers(true);
    
    res.json({ 
      status: 'healthy',
      available_plans: tiers.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getAvailablePlans,
  createSubscriptionCheckout,
  healthCheck
}; 