const logger = require('../utils/logger');
const {
  getFavoriteCarsByUser,
  isCarFavorited,
  addCarToFavorites,
  removeCarFromFavorites,
  getFavoriteCarCount
} = require('../db/queries/favoriteQueries');
const { getCarById } = require('../db/queries/carQueries');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../middleware/errorHandler');

// Get all favorite cars for the current user
const getFavoriteCars = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const favoriteCars = await getFavoriteCarsByUser(userId);
    res.json(favoriteCars);
  } catch (error) {
    next(error);
  }
};

// Check if a specific car is favorited by the current user
const checkCarFavoriteStatus = async (req, res, next) => {
  try {
    const { carId } = req.params;
    const userId = req.user.id;
    
    // First verify the car exists and user has access to it
    const cars = await getCarById(carId);
    if (cars.length === 0) {
      throw new NotFoundError('Car not found');
    }
    
    const car = cars[0];
    if (car.organization_id !== req.user.organization_id && req.user.role !== 'admin') {
      throw new ForbiddenError('You do not have access to this car');
    }
    
    const isFavorited = await isCarFavorited(userId, carId);
    res.json({ isFavorited });
  } catch (error) {
    next(error);
  }
};

// Add a car to favorites
const addToFavorites = async (req, res, next) => {
  try {
    const { carId } = req.params;
    const userId = req.user.id;
    
    // First verify the car exists and user has access to it
    const cars = await getCarById(carId);
    if (cars.length === 0) {
      throw new NotFoundError('Car not found');
    }
    
    const car = cars[0];
    if (car.organization_id !== req.user.organization_id && req.user.role !== 'admin') {
      throw new ForbiddenError('You do not have access to this car');
    }
    
    const favorite = await addCarToFavorites(userId, carId);
    res.status(201).json({ 
      message: 'Car added to favorites successfully',
      favorite
    });
  } catch (error) {
    if (error.message === 'Maximum number of favorite cars (10) reached') {
      const maxError = new BadRequestError(error.message);
      return next(maxError);
    }
    if (error.message === 'Car is already in favorites') {
      const duplicateError = new BadRequestError(error.message);
      return next(duplicateError);
    }
    next(error);
  }
};

// Remove a car from favorites
const removeFromFavorites = async (req, res, next) => {
  try {
    const { carId } = req.params;
    const userId = req.user.id;
    
    const removed = await removeCarFromFavorites(userId, carId);
    
    if (!removed) {
      throw new NotFoundError('Car not found in favorites');
    }
    
    res.json({ message: 'Car removed from favorites successfully' });
  } catch (error) {
    next(error);
  }
};

// Get favorite cars count for current user
const getFavoriteCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await getFavoriteCarCount(userId);
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavoriteCars,
  checkCarFavoriteStatus,
  addToFavorites,
  removeFromFavorites,
  getFavoriteCount
};
