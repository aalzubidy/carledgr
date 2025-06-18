const express = require('express');
const router = express.Router();
const {
  getInventoryReportHandler,
  getSalesReportHandler,
  getMaintenanceReportHandler,
  getProfitReportHandler
} = require('../controllers/reportController');
const { authenticateJWT } = require('../middleware/auth');
const { requireOrganization } = require('../middleware/roleAuth');
const { validate, rules } = require('../middleware/validation');

// All report routes require authentication and organization isolation
router.use(authenticateJWT);
router.use(requireOrganization);

// Inventory report
router.get('/inventory', rules.report.generate, validate, getInventoryReportHandler);

// Sales report
router.get('/sales', rules.report.generate, validate, getSalesReportHandler);

// Maintenance report
router.get('/maintenance', rules.report.generate, validate, getMaintenanceReportHandler);

// Profit report
router.get('/profit', rules.report.generate, validate, getProfitReportHandler);

module.exports = router; 