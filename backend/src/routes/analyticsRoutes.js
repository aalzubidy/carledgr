const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { requireOrganization } = require('../middleware/roleAuth');
const logger = require('../utils/logger');

// All analytics routes require authentication
router.use(authenticateJWT);
router.use(requireOrganization);

// Track user events for internal analytics
router.post('/track', async (req, res, next) => {
  try {
    const { category, action, label, value, timestamp, url } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organization_id;
    
    // Log analytics event
    logger.info(`Analytics Event`, {
      userId,
      organizationId,
      category,
      action,
      label,
      value,
      url,
      timestamp: timestamp || new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
    
    // You could also store in database for reporting
    // await storeAnalyticsEvent({ userId, organizationId, category, action, label, value, url, timestamp });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get usage statistics for the organization (optional)
router.get('/usage', async (req, res, next) => {
  try {
    // This could return usage stats from your database
    // For now, just return a placeholder
    res.json({
      page_views: 0,
      feature_usage: {},
      last_login: req.user.updated_at
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 