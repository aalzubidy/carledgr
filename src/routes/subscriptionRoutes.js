const express = require('express');
const router = express.Router();
const { 
  getAvailablePlans, 
  createSubscriptionCheckout, 
  healthCheck 
} = require('../controllers/subscriptionController');

// Public routes (no authentication required)

// Get available subscription plans
router.get('/plans', getAvailablePlans);

// Create checkout session for new subscription
router.post('/checkout', createSubscriptionCheckout);

// Health check endpoint
router.get('/health', healthCheck);

module.exports = router; 