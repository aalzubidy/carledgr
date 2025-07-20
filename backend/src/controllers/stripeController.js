const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { verifyWebhookSignature } = require('../utils/stripeService');
const { sendWelcomeEmail, sendSubscriptionStatusEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

// Database queries
const { createOrganization, getOrganizationById } = require('../db/queries/organizationQueries');
const { 
  createLicense, 
  updateLicense, 
  getLicenseByOrganizationId,
  getLicenseTierByStripePrice,
  createStripeEvent,
  isStripeEventProcessed,
  updateStripeEventStatus
} = require('../db/queries/licenseQueries');
const { query } = require('../db/connection');

// Generate random password
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Handle Stripe webhooks
const handleWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = verifyWebhookSignature(req.body, signature);
    logger.info(`Stripe webhook received: ${event.type} - ${event.id}`);

    // Check if event already processed
    const alreadyProcessed = await isStripeEventProcessed(event.id);
    if (alreadyProcessed) {
      logger.info(`Stripe event ${event.id} already processed, skipping`);
      return res.status(200).json({ received: true, status: 'already_processed' });
    }

    // Create event record
    const eventRecord = {
      id: uuidv4(),
      stripe_event_id: event.id,
      event_type: event.type,
      organization_id: null,
      license_id: null,
      event_data: event
    };

    await createStripeEvent(eventRecord);

    // Process different event types
    let result;
    switch (event.type) {
      case 'checkout.session.completed':
        result = await handleCheckoutCompleted(event);
        break;
      case 'customer.subscription.created':
        result = await handleSubscriptionCreated(event);
        break;
      case 'customer.subscription.updated':
        result = await handleSubscriptionUpdated(event);
        break;
      case 'customer.subscription.deleted':
        result = await handleSubscriptionDeleted(event);
        break;
      case 'invoice.payment_succeeded':
        result = await handlePaymentSucceeded(event);
        break;
      case 'invoice.payment_failed':
        result = await handlePaymentFailed(event);
        break;
      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
        result = { status: 'unhandled', message: 'Event type not handled' };
    }

    // Update event processing status
    await updateStripeEventStatus(event.id, 'processed');

    res.status(200).json({ 
      received: true, 
      event_type: event.type,
      result 
    });

  } catch (error) {
    logger.error(`Stripe webhook error: ${error.message}`, error);
    
    // Update event processing status if event was created
    if (event?.id) {
      try {
        await updateStripeEventStatus(event.id, 'failed', error.message);
      } catch (updateError) {
        logger.error(`Failed to update event status: ${updateError.message}`);
      }
    }

    res.status(400).json({ 
      error: 'Webhook processing failed', 
      message: error.message 
    });
  }
};

// Handle successful checkout completion
const handleCheckoutCompleted = async (event) => {
  const session = event.data.object;
  logger.info(`Processing checkout completion: ${session.id}`);

  try {
    // Get organization details from metadata
    const organizationName = session.metadata?.organization_name;
    const ownerEmail = session.metadata?.owner_email || session.customer_email;

    if (!organizationName || !ownerEmail) {
      throw new Error('Missing organization name or owner email in checkout session metadata');
    }

    // Get subscription details
    const subscriptionId = session.subscription;
    if (!subscriptionId) {
      throw new Error('No subscription ID found in checkout session');
    }

    // This will be handled by subscription.created event
    return { status: 'success', message: 'Checkout completed, waiting for subscription.created' };

  } catch (error) {
    logger.error(`Error processing checkout completion: ${error.message}`);
    throw error;
  }
};

// Handle subscription creation (this is where we create the organization)
const handleSubscriptionCreated = async (event) => {
  const subscription = event.data.object;
  logger.info(`Processing subscription creation: ${subscription.id}`);

  try {
    // Get customer details
    const customerId = subscription.customer;
    const priceId = subscription.items.data[0]?.price?.id;

    if (!priceId) {
      throw new Error('No price ID found in subscription');
    }

    // Get license tier by Stripe price ID
    const [licenseTier] = await getLicenseTierByStripePrice(priceId);
    if (!licenseTier) {
      throw new Error(`No license tier found for Stripe price ID: ${priceId}`);
    }

    // Get customer details from Stripe (handle test scenarios)
    const stripe = require('stripe')(require('../../config').stripe.secretKey);
    let customer = null;
    let organizationName = subscription.metadata?.organization_name;
    let ownerEmail = subscription.metadata?.owner_email;

    // Handle test customer IDs
    if (customerId.startsWith('cus_test')) {
      logger.info(`Test customer detected: ${customerId}, using metadata only`);
      customer = {
        id: customerId,
        email: ownerEmail || 'test@example.com',
        name: organizationName || 'Test Organization'
      };
    } else {
      // Real customer - fetch from Stripe
      customer = await stripe.customers.retrieve(customerId);
      
      // If no metadata, try to get from recent checkout sessions
      if (!organizationName) {
        const sessions = await stripe.checkout.sessions.list({
          customer: customerId,
          limit: 10
        });
        
        const recentSession = sessions.data.find(s => 
          s.subscription === subscription.id || 
          s.metadata?.organization_name
        );

        if (recentSession?.metadata) {
          organizationName = recentSession.metadata.organization_name;
          ownerEmail = recentSession.metadata.owner_email || ownerEmail;
        }
      }
    }

    // Ensure we have required data
    ownerEmail = ownerEmail || customer.email;
    if (!organizationName) {
      // Fallback: use customer name or email
      organizationName = customer.name || `${ownerEmail} Organization`;
    }

    // Check if organization already exists for this customer
    const existingOrgs = await query(
      'SELECT id FROM organizations WHERE email = ? OR name = ?',
      [ownerEmail, organizationName]
    );

    let organizationId;
    let isNewOrganization = false;

    if (existingOrgs.length > 0) {
      organizationId = existingOrgs[0].id;
      logger.info(`Using existing organization: ${organizationId} for ${ownerEmail}`);
    } else {
      // Create new organization
      organizationId = uuidv4();
      await createOrganization({
        id: organizationId,
        name: organizationName,
        email: ownerEmail,
        address: null,
        phone: null
      });
      isNewOrganization = true;
      logger.info(`Created new organization: ${organizationId} - ${organizationName}`);
    }

    // Create or update license
    const existingLicense = await getLicenseByOrganizationId(organizationId);
    
    if (existingLicense.length > 0) {
      // Update existing license
      await updateLicense(organizationId, {
        license_type: licenseTier.tier_name,
        car_limit: licenseTier.car_limit,
        is_free_account: false,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000)
      });
      logger.info(`Updated license for organization: ${organizationId}`);
    } else {
      // Create new license
      const licenseId = uuidv4();
      await createLicense({
        id: licenseId,
        organization_id: organizationId,
        license_type: licenseTier.tier_name,
        car_limit: licenseTier.car_limit,
        is_free_account: false,
        free_reason: null,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status
      });
      logger.info(`Created license for organization: ${organizationId}`);
    }

    // Create owner user if new organization
    if (isNewOrganization) {
      const tempPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      const userId = uuidv4();
      await query(
        `INSERT INTO users (id, organization_id, email, password, first_name, last_name, role_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, organizationId, ownerEmail, hashedPassword, 'Owner', 'User', 1] // role_id 1 = owner
      );

      // Send welcome email
      try {
        await sendWelcomeEmail(organizationName, ownerEmail, tempPassword, licenseTier.tier_name);
        logger.info(`Welcome email sent to ${ownerEmail}`);
      } catch (emailError) {
        logger.error(`Failed to send welcome email to ${ownerEmail}: ${emailError.message}`);
        // Don't fail the whole process if email fails
      }
    }

    return {
      status: 'success',
      organization_id: organizationId,
      license_type: licenseTier.tier_name,
      is_new_organization: isNewOrganization
    };

  } catch (error) {
    logger.error(`Error processing subscription creation: ${error.message}`);
    throw error;
  }
};

// Handle subscription updates
const handleSubscriptionUpdated = async (event) => {
  const subscription = event.data.object;
  logger.info(`Processing subscription update: ${subscription.id}`);

  try {
    // Find organization by subscription ID
    const orgs = await query(
      'SELECT organization_id FROM organization_licenses WHERE stripe_subscription_id = ?',
      [subscription.id]
    );

    if (orgs.length === 0) {
      logger.warn(`No organization found for subscription: ${subscription.id}`);
      return { status: 'warning', message: 'Organization not found' };
    }

    const organizationId = orgs[0].organization_id;

    // Get new price ID and license tier
    const priceId = subscription.items.data[0]?.price?.id;
    let updates = {
      subscription_status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000)
    };

    // Check for scheduled cancellation
    if (subscription.cancel_at_period_end) {
      logger.info(`Subscription ${subscription.id} scheduled for cancellation at period end`);
      // Keep subscription active but track that it's scheduled for cancellation
      // The actual deactivation will happen when subscription.deleted webhook fires
      updates.subscription_status = 'active'; // Keep active until period ends
    }

    // If price changed, update license tier
    if (priceId) {
      const [licenseTier] = await getLicenseTierByStripePrice(priceId);
      if (licenseTier) {
        updates.license_type = licenseTier.tier_name;
        updates.car_limit = licenseTier.car_limit;
      }
    }

    await updateLicense(organizationId, updates);

    // Send status change email if status changed
    const previousAttributes = event.data.previous_attributes;
    if (previousAttributes?.status && previousAttributes.status !== subscription.status) {
      try {
        const [org] = await getOrganizationById(organizationId);
        if (org?.email) {
          await sendSubscriptionStatusEmail(
            org.name, 
            org.email, 
            subscription.status
          );
        }
      } catch (emailError) {
        logger.error(`Failed to send status change email: ${emailError.message}`);
      }
    }

    // Handle scheduled cancellation notification
    if (subscription.cancel_at_period_end && !previousAttributes?.cancel_at_period_end) {
      try {
        const [org] = await getOrganizationById(organizationId);
        if (org?.email) {
          const cancelDate = new Date(subscription.current_period_end * 1000);
          await sendSubscriptionStatusEmail(
            org.name, 
            org.email, 
            'scheduled_cancellation',
            `Your subscription will be canceled on ${cancelDate.toLocaleDateString()}`
          );
        }
      } catch (emailError) {
        logger.error(`Failed to send scheduled cancellation email: ${emailError.message}`);
      }
    }

    return {
      status: 'success',
      organization_id: organizationId,
      subscription_status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: subscription.current_period_end
    };

  } catch (error) {
    logger.error(`Error processing subscription update: ${error.message}`);
    throw error;
  }
};

// Handle subscription deletion
const handleSubscriptionDeleted = async (event) => {
  const subscription = event.data.object;
  logger.info(`Processing subscription deletion: ${subscription.id}`);

  try {
    // Find organization by subscription ID
    const orgs = await query(
      'SELECT organization_id FROM organization_licenses WHERE stripe_subscription_id = ?',
      [subscription.id]
    );

    if (orgs.length === 0) {
      logger.warn(`No organization found for subscription: ${subscription.id}`);
      return { status: 'warning', message: 'Organization not found' };
    }

    const organizationId = orgs[0].organization_id;

    // Update license status
    await updateLicense(organizationId, {
      subscription_status: 'canceled',
      is_active: false
    });

    // Send cancellation email
    try {
      const [org] = await getOrganizationById(organizationId);
      if (org?.email) {
        await sendSubscriptionStatusEmail(
          org.name, 
          org.email, 
          'canceled'
        );
      }
    } catch (emailError) {
      logger.error(`Failed to send cancellation email: ${emailError.message}`);
    }

    return {
      status: 'success',
      organization_id: organizationId,
      action: 'subscription_canceled'
    };

  } catch (error) {
    logger.error(`Error processing subscription deletion: ${error.message}`);
    throw error;
  }
};

// Handle successful payment
const handlePaymentSucceeded = async (event) => {
  const invoice = event.data.object;
  logger.info(`Processing payment success: ${invoice.id}`);

  try {
    if (invoice.subscription) {
      // Find organization by subscription ID
      const orgs = await query(
        'SELECT organization_id FROM organization_licenses WHERE stripe_subscription_id = ?',
        [invoice.subscription]
      );

      if (orgs.length > 0) {
        const organizationId = orgs[0].organization_id;
        
        // Ensure license is active
        await updateLicense(organizationId, {
          subscription_status: 'active',
          is_active: true
        });

        return {
          status: 'success',
          organization_id: organizationId,
          action: 'payment_succeeded'
        };
      }
    }

    return { status: 'success', message: 'Payment processed' };

  } catch (error) {
    logger.error(`Error processing payment success: ${error.message}`);
    throw error;
  }
};

// Handle failed payment
const handlePaymentFailed = async (event) => {
  const invoice = event.data.object;
  logger.info(`Processing payment failure: ${invoice.id}`);

  try {
    if (invoice.subscription) {
      // Find organization by subscription ID
      const orgs = await query(
        'SELECT organization_id FROM organization_licenses WHERE stripe_subscription_id = ?',
        [invoice.subscription]
      );

      if (orgs.length > 0) {
        const organizationId = orgs[0].organization_id;
        
        // Update license status to past_due
        await updateLicense(organizationId, {
          subscription_status: 'past_due'
        });

        // Send payment failed email
        try {
          const [org] = await getOrganizationById(organizationId);
          if (org?.email) {
            await sendSubscriptionStatusEmail(
              org.name, 
              org.email, 
              'past_due',
              'Payment failed'
            );
          }
        } catch (emailError) {
          logger.error(`Failed to send payment failed email: ${emailError.message}`);
        }

        return {
          status: 'success',
          organization_id: organizationId,
          action: 'payment_failed'
        };
      }
    }

    return { status: 'success', message: 'Payment failure processed' };

  } catch (error) {
    logger.error(`Error processing payment failure: ${error.message}`);
    throw error;
  }
};

module.exports = {
  handleWebhook
}; 