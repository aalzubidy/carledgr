const mysql = require('mysql2/promise');
const config = require('../../config');
const logger = require('../utils/logger');

// Create a connection pool
const poolConfig = {
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  connectionLimit: config.database.connectionLimit,
  waitForConnections: true,
  queueLimit: 0
};

// Add SSL configuration if enabled
if (config.database.ssl) {
  poolConfig.ssl = {
    rejectUnauthorized: false // For managed databases, you might need to set this
  };
}

const pool = mysql.createPool(poolConfig);

// Test database connection
async function testConnection() {
  try {
    logger.info('🔌 Testing database connection...');
    logger.info(`📍 Connecting to: ${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`);
    logger.info(`👤 User: ${poolConfig.user}`);
    logger.info(`🔐 SSL: ${poolConfig.ssl ? 'enabled' : 'disabled'}`);
    
    const connection = await pool.getConnection();
    
    // Test a simple query to ensure the database is working
    await connection.execute('SELECT 1 as test');
    
    logger.info('✅ Database connection established successfully');
    connection.release();
    return true;
  } catch (error) {
    logger.error('💥 Database connection failed!');
    logger.error(`❌ Error: ${error.message}`);
    logger.error(`🔍 Error code: ${error.code}`);
    logger.error(`📋 Error details: ${error.sqlMessage || 'No SQL message'}`);
    
    // Provide helpful debugging info
    if (error.code === 'ENOTFOUND') {
      logger.error('🌐 DNS lookup failed - check hostname');
    } else if (error.code === 'ECONNREFUSED') {
      logger.error('🚫 Connection refused - check port and firewall');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      logger.error('🔑 Access denied - check username and password');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      logger.error('🗄️ Database not found - check database name');
    }
    
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