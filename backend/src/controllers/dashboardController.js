const logger = require('../utils/logger');
const { getDashboardSummary, getTopSoldModels } = require('../db/queries/reportQueries');
const { getMaintenanceStatistics } = require('../db/queries/maintenanceQueries');
const { getCarStatistics } = require('../db/queries/carQueries');

// Get dashboard summary data
const getDashboardSummaryHandler = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    
    const summary = await getDashboardSummary(organizationId);
    
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

// Get top sold models
const getTopSoldModelsHandler = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    
    const topSoldModels = await getTopSoldModels(organizationId);
    
    res.json(topSoldModels);
  } catch (error) {
    next(error);
  }
};

// Get top maintenance categories
const getTopMaintenanceHandler = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    
    const maintenanceStats = await getMaintenanceStatistics(organizationId);
    
    res.json(maintenanceStats);
  } catch (error) {
    next(error);
  }
};

// Get car metrics
const getCarMetricsHandler = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    
    const carStats = await getCarStatistics(organizationId);
    
    res.json(carStats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummaryHandler,
  getTopSoldModelsHandler,
  getTopMaintenanceHandler,
  getCarMetricsHandler
}; 