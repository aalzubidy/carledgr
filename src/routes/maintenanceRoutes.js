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
const { authenticateJWT } = require('../middleware/auth');
const { requireSettings, requireOrganization } = require('../middleware/roleAuth');
const { validate, rules } = require('../middleware/validation');

// All maintenance routes require authentication and organization isolation
router.use(authenticateJWT);
router.use(requireOrganization);

// Get all maintenance records for organization
router.get('/', getAllMaintenance);

// Maintenance statistics
router.get('/statistics', getStatistics);

// Maintenance categories (Settings - Owners only for management, all roles can view)
router.get('/categories', getCategories);
router.post('/categories', requireSettings, createCategory);
router.put('/categories/:id', requireSettings, updateCategory);
router.delete('/categories/:id', requireSettings, deleteCategory);
router.post('/categories/:id/move', requireSettings, moveRecordsToCategory);

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