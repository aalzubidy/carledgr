const mysql = require('mysql2/promise');
const config = require('../config');

let pool;

// Create connection pool
const createPool = () => {
  if (pool) {
    return pool;
  }

  const poolConfig = {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    connectionLimit: config.database.connectionLimit,
    queueLimit: 0
  };

  // Add SSL configuration if specified
  if (config.database.ssl) {
    poolConfig.ssl = {
      rejectUnauthorized: false
    };
  }

  pool = mysql.createPool(poolConfig);
  
  console.log(`Admin database pool created: ${config.database.host}:${config.database.port}/${config.database.database}`);
  
  return pool;
};

// Execute query with error handling
const query = async (sql, params = []) => {
  try {
    if (!pool) {
      createPool();
    }
    
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
};

// Test database connection
const testConnection = async () => {
  try {
    const result = await query('SELECT 1 as test');
    console.log('✅ Admin database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Admin database connection failed:', error.message);
    return false;
  }
};

// Close all connections
const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
};

module.exports = {
  query,
  testConnection,
  closePool,
  createPool
}; 