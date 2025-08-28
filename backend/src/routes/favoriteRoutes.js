const express = require('express');
const router = express.Router();
const {
  getFavoriteCars,
  checkCarFavoriteStatus,
  addToFavorites,
  removeFromFavorites,
  getFavoriteCount
} = require('../controllers/favoriteController');
const { authenticateJWT } = require('../middleware/auth');

// All favorite routes require authentication
router.use(authenticateJWT);

// GET /api/favorites - Get all favorite cars for current user
router.get('/', getFavoriteCars);

// GET /api/favorites/count - Get favorite cars count for current user
router.get('/count', getFavoriteCount);

// GET /api/favorites/check/:carId - Check if car is favorited
router.get('/check/:carId', checkCarFavoriteStatus);

// POST /api/favorites/:carId - Add car to favorites
router.post('/:carId', addToFavorites);

// DELETE /api/favorites/:carId - Remove car from favorites
router.delete('/:carId', removeFromFavorites);

module.exports = router;
