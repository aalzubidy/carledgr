const express = require('express');
const router = express.Router();
const {
  getDashboardSummaryHandler,
  getTopMaintenanceHandler,
  getCarMetricsHandler,
  getTopSoldModelsHandler
} = require('../controllers/dashboardController');
const { authenticateJWT } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(authenticateJWT);

// Dashboard summary
router.get('/summary', getDashboardSummaryHandler);

// Top sold models
router.get('/top-sold-models', getTopSoldModelsHandler);

// Top maintenance categories
router.get('/top-maintenance', getTopMaintenanceHandler);

// Car metrics
router.get('/car-metrics', getCarMetricsHandler);

module.exports = router; 