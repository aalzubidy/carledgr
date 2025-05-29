const mysql = require('mysql2/promise');
const config = require('../../config');
const logger = require('../utils/logger');

// Create a connection pool
const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  connectionLimit: config.database.connectionLimit,
  waitForConnections: true,
  queueLimit: 0
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info('Database connection established successfully');
    connection.release();
    return true;
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    return false;
  }
}

// Execute a query with parameters
async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    logger.error(`Query error: ${error.message}`);
    logger.error(`SQL: ${sql}`);
    logger.error(`Params: ${JSON.stringify(params)}`);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  testConnection
}; 