const express = require('express');
const router = express.Router();
const {
  getAllTiers,
  getAvailableTiers,
  getTierByName,
  updateTier,
  createTier
} = require('../controllers/licenseTierController');
const { authenticateJWT } = require('../middleware/auth');
const { requireOwner } = require('../middleware/roleAuth');

// Public route for available tiers (for Stripe checkout)
router.get('/available', getAvailableTiers);

// Protected routes
router.use(authenticateJWT);

// Admin-only routes
router.get('/', requireOwner, getAllTiers);
router.get('/:tierName', requireOwner, getTierByName);
router.put('/:tierName', requireOwner, updateTier);
router.post('/', requireOwner, createTier);

module.exports = router; 