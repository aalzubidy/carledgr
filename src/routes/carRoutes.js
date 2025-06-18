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

// All car routes require authentication and organization isolation
router.use(authenticateJWT);
router.use(requireOrganization);

// Get car statistics
router.get('/statistics', getStatistics);

// Search cars
router.get('/search', rules.car.search, validate, searchCarsHandler);

// Get all cars
router.get('/', getAllCars);

// Get car by ID
router.get('/:id', getCarByIdHandler);

// Create new car
router.post('/', rules.car.create, validate, createNewCar);

// Update car
router.put('/:id', rules.car.update, validate, updateCarById);

// Delete car
router.delete('/:id', deleteCarById);

module.exports = router; 