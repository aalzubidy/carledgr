const axios = require('axios');
const stripe = require('stripe');
const config = require('./config');
const { query } = require('./src/db/connection');
const logger = require('./src/utils/logger');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3030/api',
  ngrokUrl: 'https://09e0-2601-602-8d80-6da-e91d-42cb-7960-9274.ngrok-free.app',
  testOrganization: {
    name: 'dev123',
    ownerEmail: 'a.jonline@yahoo.com',
    licenseType: 'starter'
  }
};

// Initialize Stripe client
const stripeClient = stripe(config.stripe.secretKey);

class StripeIntegrationTester {
  constructor() {
    this.testData = {
      checkoutSession: null,
      subscription: null,
      customer: null,
      organizationId: null,
      userId: null
    };
  }

  async log(message, data = null) {
    console.log(`[TEST] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    logger.info(`[STRIPE TEST] ${message}`, data);
  }

  async error(message, error = null) {
    console.error(`[ERROR] ${message}`);
    if (error) {
      console.error(error);
    }
    logger.error(`[STRIPE TEST ERROR] ${message}`, error);
  }

  // Step 1: Get license tiers from database
  async getLicenseTiers() {
    try {
      this.log('Step 1: Fetching license tiers from database...');
      
      const tiers = await query(`
        SELECT tier_name, display_name, car_limit, monthly_price, stripe_price_id, is_available_online 
        FROM license_tiers 
        WHERE is_active = TRUE 
        ORDER BY sort_order ASC
      `);

      this.log('Available license tiers:', tiers);
      
      const starterTier = tiers.find(t => t.tier_name === 'starter');
      if (!starterTier) {
        throw new Error('Starter tier not found in database');
      }

      if (!starterTier.stripe_price_id) {
        throw new Error('Starter tier missing Stripe price ID');
      }

      this.log(`Found starter tier: ${starterTier.display_name} - Price ID: ${starterTier.stripe_price_id}`);
      return starterTier;
    } catch (error) {
      this.error('Failed to get license tiers', error);
      throw error;
    }
  }

  // Step 2: Create Stripe checkout session
  async createCheckoutSession(priceId) {
    try {
      this.log('Step 2: Creating Stripe checkout session...');
      
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: 'subscription',
        customer_email: TEST_CONFIG.testOrganization.ownerEmail,
        metadata: {
          organization_name: TEST_CONFIG.testOrganization.name,
          owner_email: TEST_CONFIG.testOrganization.ownerEmail
        },
        success_url: `${TEST_CONFIG.ngrokUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${TEST_CONFIG.ngrokUrl}/cancel`,
        allow_promotion_codes: true,
        billing_address_collection: 'required'
      });

      this.testData.checkoutSession = session;
      this.log(`Checkout session created: ${session.id}`);
      this.log(`Checkout URL: ${session.url}`);
      
      return session;
    } catch (error) {
      this.error('Failed to create checkout session', error);
      throw error;
    }
  }

  // Step 3: Simulate successful payment
  async simulateSuccessfulPayment(priceId) {
    try {
      this.log('Step 3: Simulating successful payment...');
      
      // Create test customer
      const customer = await stripeClient.customers.create({
        email: TEST_CONFIG.testOrganization.ownerEmail,
        name: TEST_CONFIG.testOrganization.name,
        metadata: {
          organization_name: TEST_CONFIG.testOrganization.name,
          test_customer: 'true'
        }
      });

      this.testData.customer = customer;
      this.log(`Test customer created: ${customer.id}`);

      // Create subscription
      const subscription = await stripeClient.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        metadata: {
          organization_name: TEST_CONFIG.testOrganization.name,
          owner_email: TEST_CONFIG.testOrganization.ownerEmail,
          checkout_session_id: this.testData.checkoutSession.id
        }
      });

      this.testData.subscription = subscription;
      this.log(`Test subscription created: ${subscription.id}`);
      
      return { customer, subscription };
    } catch (error) {
      this.error('Failed to simulate payment', error);
      throw error;
    }
  }

  // Step 4: Send webhook events to our server
  async sendWebhookEvents() {
    try {
      this.log('Step 4: Sending webhook events to server...');
      
      const webhookUrl = `${TEST_CONFIG.ngrokUrl}/api/stripe/webhook`;
      
      // Create webhook signature (we'll modify the webhook handler to accept test signatures)
      const timestamp = Math.floor(Date.now() / 1000);
      const testSignature = `t=${timestamp},v1=test_signature_${Date.now()}`;
      
      // Event 1: checkout.session.completed
      const checkoutEvent = {
        id: `evt_test_checkout_${Date.now()}`,
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: this.testData.checkoutSession.id,
            object: 'checkout.session',
            customer: this.testData.customer.id,
            subscription: this.testData.subscription.id,
            payment_status: 'paid',
            metadata: {
              organization_name: TEST_CONFIG.testOrganization.name,
              owner_email: TEST_CONFIG.testOrganization.ownerEmail
            }
          }
        },
        livemode: false,
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
        type: 'checkout.session.completed'
      };

      // Event 2: customer.subscription.created
      const subscriptionEvent = {
        id: `evt_test_subscription_${Date.now()}`,
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: this.testData.subscription.id,
            object: 'subscription',
            customer: this.testData.customer.id,
            status: 'active',
            items: {
              data: [{
                price: {
                  id: this.testData.subscription.items.data[0].price.id
                }
              }]
            },
            metadata: {
              organization_name: TEST_CONFIG.testOrganization.name,
              owner_email: TEST_CONFIG.testOrganization.ownerEmail
            }
          }
        },
        livemode: false,
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
        type: 'customer.subscription.created'
      };

      // Send checkout completed event
      this.log('Sending checkout.session.completed webhook...');
      try {
        const checkoutResponse = await axios.post(webhookUrl, JSON.stringify(checkoutEvent), {
          headers: {
            'Content-Type': 'application/json',
            'Stripe-Signature': testSignature
          }
        });
        this.log('Checkout webhook response:', checkoutResponse.data);
      } catch (error) {
        this.log('Checkout webhook response error (may be expected):', error.response?.data || error.message);
      }

      // Wait a bit before sending subscription event
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Send subscription created event
      this.log('Sending customer.subscription.created webhook...');
      try {
        const subscriptionResponse = await axios.post(webhookUrl, JSON.stringify(subscriptionEvent), {
          headers: {
            'Content-Type': 'application/json',
            'Stripe-Signature': testSignature
          }
        });
        this.log('Subscription webhook response:', subscriptionResponse.data);
      } catch (error) {
        this.log('Subscription webhook response error (may be expected):', error.response?.data || error.message);
      }

    } catch (error) {
      this.error('Failed to send webhook events', error);
      throw error;
    }
  }

  // Step 5: Verify organization and user creation
  async verifyOrganizationCreation() {
    try {
      this.log('Step 5: Verifying organization and user creation...');
      
      // Check if organization was created
      const organizations = await query(
        'SELECT * FROM organizations WHERE name = ?', 
        [TEST_CONFIG.testOrganization.name]
      );

      if (organizations.length === 0) {
        throw new Error('Organization was not created');
      }

      const organization = organizations[0];
      this.testData.organizationId = organization.id;
      this.log(`Organization created successfully:`, {
        id: organization.id,
        name: organization.name,
        email: organization.email
      });

      // Check if user was created
      const users = await query(
        'SELECT * FROM users WHERE organization_id = ? AND email = ?',
        [organization.id, TEST_CONFIG.testOrganization.ownerEmail]
      );

      if (users.length === 0) {
        throw new Error('User was not created');
      }

      const user = users[0];
      this.testData.userId = user.id;
      this.log(`User created successfully:`, {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role_id: user.role_id
      });

      // Check license
      const licenses = await query(
        'SELECT * FROM organization_licenses WHERE organization_id = ?',
        [organization.id]
      );

      if (licenses.length === 0) {
        throw new Error('License was not created');
      }

      const license = licenses[0];
      this.log(`License created successfully:`, {
        license_type: license.license_type,
        car_limit: license.car_limit,
        subscription_status: license.subscription_status,
        stripe_customer_id: license.stripe_customer_id,
        stripe_subscription_id: license.stripe_subscription_id
      });

      return { organization, user, license };
    } catch (error) {
      this.error('Failed to verify organization creation', error);
      throw error;
    }
  }

  // Main test runner
  async runFullTest() {
    try {
      this.log('🚀 Starting Stripe Integration End-to-End Test');
      this.log(`Testing organization: ${TEST_CONFIG.testOrganization.name}`);
      this.log(`Owner email: ${TEST_CONFIG.testOrganization.ownerEmail}`);
      this.log(`License type: ${TEST_CONFIG.testOrganization.licenseType}`);
      
      // Step 1: Get license tiers
      const starterTier = await this.getLicenseTiers();
      
      // Step 2: Create checkout session
      await this.createCheckoutSession(starterTier.stripe_price_id);
      
      // Step 3: Simulate payment
      await this.simulateSuccessfulPayment(starterTier.stripe_price_id);
      
      // Step 4: Send webhooks
      await this.sendWebhookEvents();
      
      // Wait for webhooks to process
      this.log('Waiting for webhook processing...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Step 5: Verify creation
      await this.verifyOrganizationCreation();
      
      this.log('✅ Stripe Integration Test Completed Successfully!');
      this.log('📧 Check email for welcome message and temporary password');
      this.log('🔑 Use the temporary password to login to the application');
      
      return {
        success: true,
        data: this.testData,
        message: 'Test completed successfully'
      };
      
    } catch (error) {
      this.error('❌ Stripe Integration Test Failed', error);
      return {
        success: false,
        error: error.message,
        data: this.testData
      };
    }
  }

  // Cleanup method
  async cleanup() {
    try {
      this.log('Cleaning up test data...');
      
      // Cancel Stripe subscription
      if (this.testData.subscription) {
        try {
          await stripeClient.subscriptions.cancel(this.testData.subscription.id);
          this.log(`Cancelled Stripe subscription: ${this.testData.subscription.id}`);
        } catch (error) {
          this.error('Failed to cancel subscription', error);
        }
      }

      // Delete Stripe customer
      if (this.testData.customer) {
        try {
          await stripeClient.customers.del(this.testData.customer.id);
          this.log(`Deleted Stripe customer: ${this.testData.customer.id}`);
        } catch (error) {
          this.error('Failed to delete customer', error);
        }
      }

      // Delete from database (in reverse order due to foreign keys)
      if (this.testData.organizationId) {
        try {
          await query('DELETE FROM organization_licenses WHERE organization_id = ?', [this.testData.organizationId]);
          await query('DELETE FROM users WHERE organization_id = ?', [this.testData.organizationId]);
          await query('DELETE FROM organizations WHERE id = ?', [this.testData.organizationId]);
          this.log(`Deleted organization and related data: ${this.testData.organizationId}`);
        } catch (error) {
          this.error('Failed to delete database records', error);
        }
      }

      this.log('Cleanup completed');
    } catch (error) {
      this.error('Cleanup failed', error);
    }
  }
}

// Export for use as module or run directly
if (require.main === module) {
  const tester = new StripeIntegrationTester();
  
  tester.runFullTest()
    .then(result => {
      console.log('\n=== TEST RESULTS ===');
      console.log(JSON.stringify(result, null, 2));
      
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = StripeIntegrationTester; 