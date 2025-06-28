const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { requireOwner } = require('../middleware/roleAuth');
const { clearTemplateCache } = require('../utils/emailService');
const logger = require('../utils/logger');

// Clear email template cache (admin only)
router.post('/clear-email-cache', authenticateJWT, requireOwner, async (req, res) => {
  try {
    clearTemplateCache();
    logger.info(`Email template cache cleared by user ${req.user.id}`);
    res.json({ 
      success: true, 
      message: 'Email template cache cleared successfully' 
    });
  } catch (error) {
    logger.error('Failed to clear email template cache:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear email template cache' 
    });
  }
});

module.exports = router; 