const express = require('express');
const router = express.Router();
const {
  getAllMaintenance,
  getMaintenanceByCarId,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  moveRecordsToCategory,
  getStatistics
} = require('../controllers/maintenanceController');
const { authenticateJWT, isOrgAdminOrAdmin } = require('../middleware/auth');
const { validate, rules } = require('../middleware/validation');

// All maintenance routes require authentication
router.use(authenticateJWT);

// Get all maintenance records for organization
router.get('/', getAllMaintenance);

// Maintenance statistics
router.get('/statistics', getStatistics);

// Maintenance categories
router.get('/categories', getCategories);
router.post('/categories', isOrgAdminOrAdmin, createCategory);
router.put('/categories/:id', isOrgAdminOrAdmin, updateCategory);
router.delete('/categories/:id', isOrgAdminOrAdmin, deleteCategory);
router.post('/categories/:id/move', isOrgAdminOrAdmin, moveRecordsToCategory);

// Get maintenance records for a car
router.get('/car/:carId', getMaintenanceByCarId);

// Get maintenance record by ID
router.get('/:id', getMaintenanceById);

// Create maintenance record
router.post('/', rules.maintenance.create, validate, createMaintenance);

// Update maintenance record
router.put('/:id', rules.maintenance.update, validate, updateMaintenance);

// Delete maintenance record
router.delete('/:id', deleteMaintenance);

module.exports = router; 