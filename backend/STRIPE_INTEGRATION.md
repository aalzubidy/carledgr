# CarLedgr Stripe Integration

This document outlines the complete Stripe integration for CarLedgr's subscription-based licensing system.

## Overview

CarLedgr uses Stripe to handle monthly subscriptions for salvage car dealerships. The system automatically:
- Provides a 15-day free trial for all new subscriptions
- Creates organizations and user accounts when subscriptions are purchased
- Manages license limits based on subscription tiers
- Handles subscription status changes and payment failures
- Sends welcome and notification emails

## Trial Period

All new subscriptions include a **15-day free trial** period:
- No payment required during the trial
- Full access to all plan features
- Trial automatically converts to paid subscription unless canceled
- Email notifications sent before trial ends
- Subscription status shows as 'trialing' during the trial period

## Architecture

### Components

1. **Stripe Service** (`src/utils/stripeService.js`) - Handles Stripe API interactions
2. **Email Service** (`src/utils/emailService.js`) - Sends welcome and notification emails
3. **Stripe Controller** (`src/controllers/stripeController.js`) - Processes webhook events
4. **Subscription Controller** (`src/controllers/subscriptionController.js`) - Public subscription API
5. **License Middleware** (`src/middleware/licenseCheck.js`) - Enforces car limits

### Database Tables

- `license_tiers` - Configurable subscription plans
- `organization_licenses` - Links organizations to licenses and Stripe
- `stripe_events` - Webhook event tracking for idempotency

## Subscription Tiers

| Plan | Cars | Price | Stripe Price ID |
|------|------|-------|----------------|
| Starter | 30 | $79.99 | `price_1RbVjX4bsQpEhvmDr2Oay1cp` |
| Professional | 75 | $119.99 | `price_1RbVmE4bsQpEhvmD3L3HuwXI` |
| Business | 150 | $179.99 | `price_1RbVmE4bsQpEhvmDDazrIF8x` |
| Enterprise | 10,000 | $249.99 | `price_1Reixo4bsQpEhvmDRdHfN8oM` |
| Champion | 10,000 | Free | (Admin only) |

## API Endpoints

### Public Endpoints (No Authentication)

#### Get Available Plans
```http
GET /api/subscriptions/plans
```

Returns all available subscription plans with features and pricing.

#### Create Checkout Session
```http
POST /api/subscriptions/checkout
Content-Type: application/json

{
  "price_id": "price_1RbVjX4bsQpEhvmDr2Oay1cp",
  "organization_name": "ABC Salvage",
  "owner_email": "owner@abcsalvage.com",
  "success_url": "https://yoursite.com/success",
  "cancel_url": "https://yoursite.com/cancel"
}
```

Creates a Stripe checkout session and returns the checkout URL.

#### Health Check
```http
GET /api/subscriptions/health
```

Returns system health status and available plan count.

### Protected Endpoints (Require Authentication)

#### Get Subscription Status
```http
GET /api/stripe/subscription-status
Authorization: Bearer <jwt_token>
```

Returns current organization's subscription status and limits.

#### Create Customer Portal Session
```http
POST /api/stripe/create-portal-session
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "return_url": "https://yoursite.com/dashboard"
}
```

Creates a Stripe customer portal session for subscription management.

### Webhook Endpoint

#### Stripe Webhooks
```http
POST /api/stripe/webhook
Content-Type: application/json
Stripe-Signature: <webhook_signature>
```

Handles Stripe webhook events. Must include valid Stripe signature.

## Webhook Events Handled

### `customer.subscription.created`
- Creates new organization and owner user
- Assigns appropriate license tier
- Sends welcome email with login credentials

### `customer.subscription.updated`
- Updates subscription status and license tier
- Handles plan changes and status updates
- Sends notification emails for status changes

### `customer.subscription.deleted`
- Deactivates license
- Sends cancellation notification email

### `invoice.payment_succeeded`
- Ensures license remains active
- Reactivates license if previously suspended

### `invoice.payment_failed`
- Sets license status to 'past_due'
- Sends payment failure notification email

## Configuration

### Environment Variables

```bash
# Stripe Configuration
CL_BACKEND_STRIPE_SECRET_KEY=sk_test_...
CL_BACKEND_STRIPE_WEBHOOK_SECRET=whsec_...

# Email Configuration
CL_BACKEND_EMAIL_HOST=smtp.gmail.com
CL_BACKEND_EMAIL_PORT=587
CL_BACKEND_EMAIL_SECURE=false
CL_BACKEND_EMAIL_USER=your-email@gmail.com
CL_BACKEND_EMAIL_PASSWORD=your-app-password
CL_BACKEND_EMAIL_FROM_NAME=CarLedgr Team
CL_BACKEND_EMAIL_FROM=noreply@carfin.com

# Frontend URL (for email links)
CL_BACKEND_FRONTEND_URL=https://app.carfin.com
```

### Config File (`config/config.json`)

```json
{
  "stripe": {
    "secretKey": "sk_test_...",
    "webhookSecret": "whsec_...",
    "priceIds": {
      "starter": "price_1RbVjX4bsQpEhvmDr2Oay1cp",
      "professional": "price_1RbVmE4bsQpEhvmD3L3HuwXI",
      "business": "price_1RbVmE4bsQpEhvmDDazrIF8x",
      "enterprise": "price_1Reixo4bsQpEhvmDRdHfN8oM"
    }
  },
  "email": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "user": "your-email@gmail.com",
    "password": "your-app-password",
    "fromName": "CarLedgr Team",
    "fromEmail": "noreply@carfin.com"
  }
}
```

## Webhook Setup in Stripe

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to your config

## License Enforcement

The system enforces car limits through middleware:

```javascript
// Middleware checks before car creation/status changes
const { canAddCar } = require('../db/queries/licenseQueries');

// Prevents adding cars when limit reached
// Prevents changing status from 'sold' to active when over limit
// Uses status != 'sold' for counting (future-proof)
```

## Email Templates

### Welcome Email Features
- Professional HTML design
- Login credentials (temporary password)
- Security warnings
- Getting started guide
- Support contact information

### Notification Emails
- Subscription status changes
- Payment failures
- Cancellation notices
- Reactivation confirmations

## Testing

### Test Checkout Flow
```bash
# Get available plans
curl -X GET http://localhost:3030/api/subscriptions/plans

# Create checkout session
curl -X POST http://localhost:3030/api/subscriptions/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "price_id": "price_1RbVjX4bsQpEhvmDr2Oay1cp",
    "organization_name": "Test Dealership",
    "owner_email": "test@example.com",
    "success_url": "https://example.com/success",
    "cancel_url": "https://example.com/cancel"
  }'
```

### Stripe Test Cards
- Success: `4242424242424242`
- Decline: `4000000000000002`
- Require 3DS: `4000002500003155`

## Error Handling

### Webhook Idempotency
- All webhook events are logged in `stripe_events` table
- Duplicate events are automatically detected and skipped
- Failed events are marked with error messages

### Graceful Degradation
- Email failures don't block subscription creation
- Missing metadata falls back to customer email/name
- Comprehensive error logging for debugging

## Security

### Webhook Verification
- All webhooks require valid Stripe signatures
- Raw body parsing for signature verification
- Automatic rejection of invalid requests

### Data Protection
- Sensitive Stripe data stored securely
- Email templates don't expose internal IDs
- Temporary passwords are cryptographically secure

## Monitoring

### Logs to Monitor
- Subscription creations/updates
- Email delivery status
- Webhook processing results
- License limit violations

### Key Metrics
- Subscription conversion rates
- Payment failure rates
- Email delivery success
- License utilization

## Troubleshooting

### Common Issues

**Webhook not receiving events:**
- Check webhook URL is publicly accessible
- Verify webhook secret matches Stripe dashboard
- Ensure events are selected in Stripe dashboard

**Email not sending:**
- Verify SMTP credentials
- Check email provider settings (Gmail: app passwords)
- Monitor email service logs

**License limits not enforcing:**
- Check middleware is applied to car routes
- Verify license status is 'active'
- Ensure subscription status is current

**Organization not created:**
- Check webhook metadata includes organization_name
- Verify database permissions
- Monitor webhook processing logs

### Debug Commands

```bash
# Check webhook events
SELECT * FROM stripe_events ORDER BY created_at DESC LIMIT 10;

# Check organization licenses
SELECT ol.*, lt.display_name, lt.car_limit 
FROM organization_licenses ol 
JOIN license_tiers lt ON ol.license_type = lt.tier_name;

# Check car counts vs limits
SELECT o.name, ol.car_limit, 
  (SELECT COUNT(*) FROM cars WHERE organization_id = o.id AND status != 'sold') as current_count
FROM organizations o 
JOIN organization_licenses ol ON o.id = ol.organization_id;
```

## Production Deployment

### Checklist
- [ ] Replace test Stripe keys with live keys
- [ ] Update webhook URL to production domain
- [ ] Configure production email service
- [ ] Set up monitoring and alerting
- [ ] Test webhook connectivity
- [ ] Verify email delivery
- [ ] Test subscription flow end-to-end

### Environment Setup
```bash
# Production environment variables
CL_BACKEND_STRIPE_SECRET_KEY=sk_live_...
CL_BACKEND_STRIPE_WEBHOOK_SECRET=whsec_...
CL_BACKEND_EMAIL_HOST=your-production-smtp.com
CL_BACKEND_FRONTEND_URL=https://app.carfin.com
CL_BACKEND_NODE_ENV=production
```

## Support

For issues with the Stripe integration:
1. Check the logs for specific error messages
2. Verify configuration matches this documentation
3. Test with Stripe's test mode first
4. Contact Stripe support for payment-related issues
5. Review webhook event history in Stripe dashboard 