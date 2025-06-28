const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/stripeController');
const { createCheckoutSession, createPortalSession } = require('../utils/stripeService');
const { authenticateJWT } = require('../middleware/auth');
const { requireOrganization } = require('../middleware/roleAuth');
const { getLicenseWithTierByOrganizationId } = require('../db/queries/licenseQueries');

// Webhook endpoint (must be before express.json() middleware)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes (require authentication)
router.use(authenticateJWT);

// Create checkout session for subscription
router.post('/create-checkout-session', async (req, res, next) => {
  try {
    const { price_id, organization_name, success_url, cancel_url } = req.body;
    const customerEmail = req.user.email;

    if (!price_id || !organization_name || !success_url || !cancel_url) {
      return res.status(400).json({ 
        error: 'Missing required fields: price_id, organization_name, success_url, cancel_url' 
      });
    }

    const session = await createCheckoutSession(
      price_id,
      customerEmail,
      organization_name,
      success_url,
      cancel_url
    );

    res.json({ 
      checkout_url: session.url,
      session_id: session.id 
    });
  } catch (error) {
    next(error);
  }
});

// Create customer portal session for subscription management
router.post('/create-portal-session', requireOrganization, async (req, res, next) => {
  try {
    const { return_url } = req.body;
    const organizationId = req.user.organization_id;

    if (!return_url) {
      return res.status(400).json({ error: 'Missing return_url' });
    }

    // Get organization's license to find Stripe customer ID
    const [license] = await getLicenseWithTierByOrganizationId(organizationId);
    
    if (!license || !license.stripe_customer_id) {
      return res.status(404).json({ 
        error: 'No Stripe customer found for this organization' 
      });
    }

    const session = await createPortalSession(
      license.stripe_customer_id,
      return_url
    );

    res.json({ 
      portal_url: session.url 
    });
  } catch (error) {
    next(error);
  }
});

// Get subscription status
router.get('/subscription-status', requireOrganization, async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    const [license] = await getLicenseWithTierByOrganizationId(organizationId);
    
    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    res.json({
      subscription_status: license.subscription_status,
      license_type: license.license_type,
      car_limit: license.car_limit,
      is_free_account: license.is_free_account,
      current_period_end: license.current_period_end,
      stripe_customer_id: license.stripe_customer_id ? 'present' : null,
      stripe_subscription_id: license.stripe_subscription_id ? 'present' : null
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 