const { pool } = require('../connection');
const { v4: uuidv4 } = require('uuid');

// Get all favorite cars for a user
const getFavoriteCarsByUser = async (userId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT 
        fc.id as favorite_id,
        fc.created_at as favorited_at,
        c.id,
        c.vin,
        c.make,
        c.model,
        c.year,
        c.color,
        c.mileage,
        c.purchase_date,
        c.purchase_price,
        c.sale_date,
        c.sale_price,
        c.status,
        c.created_at,
        c.updated_at,
        c.organization_id
      FROM favorite_cars fc
      JOIN cars c ON CAST(fc.car_id AS CHAR) = CAST(c.id AS CHAR)
      WHERE CAST(fc.user_id AS CHAR) = CAST(? AS CHAR)
      ORDER BY fc.created_at DESC
    `, [userId]);
    
    return rows;
  } finally {
    connection.release();
  }
};

// Check if a car is favorited by a user
const isCarFavorited = async (userId, carId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT id FROM favorite_cars 
      WHERE CAST(user_id AS CHAR) = CAST(? AS CHAR) 
      AND CAST(car_id AS CHAR) = CAST(? AS CHAR)
    `, [userId, carId]);
    
    return rows.length > 0;
  } finally {
    connection.release();
  }
};

// Add a car to user's favorites
const addCarToFavorites = async (userId, carId) => {
  const connection = await pool.getConnection();
  try {
    // First check if user has reached the limit (10 favorites)
    const [countRows] = await connection.execute(`
      SELECT COUNT(*) as count FROM favorite_cars 
      WHERE CAST(user_id AS CHAR) = CAST(? AS CHAR)
    `, [userId]);
    
    if (countRows[0].count >= 10) {
      throw new Error('Maximum number of favorite cars (10) reached');
    }
    
    // Check if already favorited
    const alreadyFavorited = await isCarFavorited(userId, carId);
    if (alreadyFavorited) {
      throw new Error('Car is already in favorites');
    }
    
    const favoriteId = uuidv4();
    await connection.execute(`
      INSERT INTO favorite_cars (id, user_id, car_id)
      VALUES (?, ?, ?)
    `, [favoriteId, userId, carId]);
    
    return { id: favoriteId, user_id: userId, car_id: carId };
  } finally {
    connection.release();
  }
};

// Remove a car from user's favorites
const removeCarFromFavorites = async (userId, carId) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(`
      DELETE FROM favorite_cars 
      WHERE CAST(user_id AS CHAR) = CAST(? AS CHAR) 
      AND CAST(car_id AS CHAR) = CAST(? AS CHAR)
    `, [userId, carId]);
    
    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
};

// Get favorite cars count for a user
const getFavoriteCarCount = async (userId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT COUNT(*) as count FROM favorite_cars 
      WHERE CAST(user_id AS CHAR) = CAST(? AS CHAR)
    `, [userId]);
    
    return rows[0].count;
  } finally {
    connection.release();
  }
};

module.exports = {
  getFavoriteCarsByUser,
  isCarFavorited,
  addCarToFavorites,
  removeCarFromFavorites,
  getFavoriteCarCount
};
