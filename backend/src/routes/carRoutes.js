const express = require('express');
const router = express.Router();
const {
  getAllCars,
  getCarByIdHandler,
  createNewCar,
  updateCarById,
  deleteCarById,
  searchCarsHandler,
  getStatistics
} = require('../controllers/carController');
const { authenticateJWT } = require('../middleware/auth');
const { requireOrganization } = require('../middleware/roleAuth');
const { validate, rules } = require('../middleware/validation');
const { checkLicenseLimit, checkLicenseStatus, checkStatusChange } = require('../middleware/licenseCheck');

// All car routes require authentication and organization isolation
router.use(authenticateJWT);
router.use(requireOrganization);

// All car routes require active license
router.use(checkLicenseStatus);

// Get car statistics
router.get('/statistics', getStatistics);

// Search cars
router.get('/search', rules.car.search, validate, searchCarsHandler);

// Get all cars
router.get('/', getAllCars);

// Get car by ID
router.get('/:id', getCarByIdHandler);

// Create new car (check license limit)
router.post('/', checkLicenseLimit, rules.car.create, validate, createNewCar);

// Update car (check status changes that might affect car count)
router.put('/:id', checkStatusChange, rules.car.update, validate, updateCarById);

// Delete car
router.delete('/:id', deleteCarById);

module.exports = router; 