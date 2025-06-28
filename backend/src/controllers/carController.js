const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const {
  getCarsByOrganization,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  searchCars,
  getCarStatistics
} = require('../db/queries/carQueries');
const { NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

// Get all cars for the organization
const getAllCars = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    const { status } = req.query;
    
    const cars = await getCarsByOrganization(organizationId, { status });
    res.json(cars);
  } catch (error) {
    next(error);
  }
};

// Get car by ID
const getCarByIdHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cars = await getCarById(id);
    
    if (cars.length === 0) {
      throw new NotFoundError('Car not found');
    }
    
    const car = cars[0];
    
    // Check if car belongs to user's organization
    if (car.organization_id !== req.user.organization_id && req.user.role !== 'admin') {
      throw new ForbiddenError('You do not have access to this car');
    }
    
    res.json(car);
  } catch (error) {
    next(error);
  }
};

// Create new car
const createNewCar = async (req, res, next) => {
  try {
    const { 
      vin, 
      make, 
      model, 
      year, 
      color, 
      purchase_date, 
      purchase_price
    } = req.body;
    
    // Always use the user's organization_id from the token
    const organization_id = req.user.organization_id;
    
    const id = uuidv4();
    const status = 'in_stock'; // New cars are always in stock initially
    
    await createCar({
      id,
      organization_id,
      vin,
      make,
      model,
      year,
      color,
      purchase_date,
      purchase_price,
      sale_date: null,
      sale_price: null,
      status
    });
    
    const cars = await getCarById(id);
    
    if (cars.length === 0) {
      throw new Error('Failed to create car');
    }
    
    res.status(201).json(cars[0]);
  } catch (error) {
    // Handle VIN uniqueness constraint violation
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.includes('vin')) {
      const duplicateError = new Error('A car with this VIN already exists');
      duplicateError.status = 400;
      return next(duplicateError);
    }
    next(error);
  }
};

// Update car
const updateCarById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      vin, 
      make, 
      model, 
      year, 
      color, 
      purchase_date, 
      purchase_price, 
      sale_date, 
      sale_price, 
      status 
    } = req.body;
    
    // Check if car exists
    const cars = await getCarById(id);
    
    if (cars.length === 0) {
      throw new NotFoundError('Car not found');
    }
    
    const car = cars[0];
    
    // Check if car belongs to user's organization
    if (car.organization_id !== req.user.organization_id && req.user.role !== 'admin') {
      throw new ForbiddenError('You do not have access to this car');
    }
    
    // Determine status based on sale information if not explicitly provided
    let updatedStatus = status;
    if (!updatedStatus) {
      if (sale_date && sale_price) {
        updatedStatus = 'sold';
      } else if (car.status === 'sold' && (!sale_date || !sale_price)) {
        updatedStatus = 'in_stock';
      } else {
        updatedStatus = car.status;
      }
    }
    
    // Update with new values or keep existing ones
    const updatedCar = {
      vin: vin || car.vin,
      make: make || car.make,
      model: model || car.model,
      year: year || car.year,
      color: color !== undefined ? color : car.color,
      purchase_date: purchase_date || car.purchase_date,
      purchase_price: purchase_price || car.purchase_price,
      sale_date: sale_date !== undefined ? sale_date : car.sale_date,
      sale_price: sale_price !== undefined ? sale_price : car.sale_price,
      status: updatedStatus
    };
    
    await updateCar(id, updatedCar);
    
    const updatedCars = await getCarById(id);
    res.json(updatedCars[0]);
  } catch (error) {
    // Handle VIN uniqueness constraint violation
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.includes('vin')) {
      const duplicateError = new Error('A car with this VIN already exists');
      duplicateError.status = 400;
      return next(duplicateError);
    }
    next(error);
  }
};

// Delete car
const deleteCarById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if car exists
    const cars = await getCarById(id);
    
    if (cars.length === 0) {
      throw new NotFoundError('Car not found');
    }
    
    const car = cars[0];
    
    // Check if car belongs to user's organization
    if (car.organization_id !== req.user.organization_id && req.user.role !== 'admin') {
      throw new ForbiddenError('You do not have access to this car');
    }
    
    await deleteCar(id);
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// Search cars
const searchCarsHandler = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    const { make, model, year, vin } = req.query;
    
    const cars = await searchCars(organizationId, { make, model, year, vin });
    res.json(cars);
  } catch (error) {
    next(error);
  }
};

// Get car statistics
const getStatistics = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    
    const statistics = await getCarStatistics(organizationId);
    res.json(statistics);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCars,
  getCarByIdHandler,
  createNewCar,
  updateCarById,
  deleteCarById,
  searchCarsHandler,
  getStatistics
}; 