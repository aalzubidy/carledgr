const logger = require('../utils/logger');
const reportQueries = require('../db/queries/reportQueries');

// Get inventory report
const getInventoryReportHandler = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    const { status, make, model, year, start_date, end_date } = req.query;
    
    // Pass date parameters to the query
    const dateRange = {};
    if (start_date) dateRange.start = start_date;
    if (end_date) dateRange.end = end_date;
    
    const report = await reportQueries.getInventoryReport(organizationId, { status, make, model, year, dateRange });
    
    // Calculate totals
    const totals = {
      count: report.length,
      purchase_value: report.reduce((sum, car) => sum + parseFloat(car.purchase_price || 0), 0),
      maintenance_cost: report.reduce((sum, car) => sum + parseFloat(car.total_maintenance_cost || 0), 0),
      total_investment: 0
    };
    
    totals.total_investment = totals.purchase_value + totals.maintenance_cost;
    
    res.json({
      cars: report,
      totals
    });
  } catch (error) {
    next(error);
  }
};

// Get sales report
const getSalesReportHandler = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { start_date, end_date } = req.query;
    
    const dateRange = {};
    if (start_date) dateRange.start = start_date;
    if (end_date) dateRange.end = end_date;
    
    const reportData = await reportQueries.getSalesReport(organizationId, dateRange);
    
    res.json(reportData);
  } catch (error) {
    logger.error('Error generating sales report:', error);
    res.status(500).json({ 
      error: 'Failed to generate sales report',
      details: error.message 
    });
  }
};

// Get maintenance report
const getMaintenanceReportHandler = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    let { start_date, end_date, category_id } = req.query;
    
    const report = await reportQueries.getMaintenanceReport(organizationId, start_date, end_date, category_id);
    
    res.json(report);
  } catch (error) {
    next(error);
  }
};

// Get profit report
const getProfitReportHandler = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    let { start_date, end_date } = req.query;
    
    const report = await reportQueries.getProfitReport(organizationId, start_date, end_date);
    
    res.json(report);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventoryReportHandler,
  getSalesReportHandler,
  getMaintenanceReportHandler,
  getProfitReportHandler
}; 