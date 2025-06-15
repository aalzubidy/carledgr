const { pool } = require('./connection');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

// SQL statements to create the database schema
const createTableStatements = [
  // Organizations table
  `CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
  )`,

  // Cars table
  `CREATE TABLE IF NOT EXISTS cars (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    vin VARCHAR(17) NOT NULL UNIQUE,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    color VARCHAR(30),
    mileage INT DEFAULT 0,
    purchase_date DATE NOT NULL,
    purchase_price DECIMAL(10, 2) NOT NULL,
    sale_date DATE,
    sale_price DECIMAL(10, 2),
    status ENUM('in_stock', 'sold', 'pending') DEFAULT 'in_stock',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
  )`,

  // Maintenance Categories table
  `CREATE TABLE IF NOT EXISTS maintenance_categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Maintenance Records table
  `CREATE TABLE IF NOT EXISTS maintenance_records (
    id VARCHAR(36) PRIMARY KEY,
    car_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    description VARCHAR(255) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    maintenance_date DATE NOT NULL,
    vendor VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES maintenance_categories(id)
  )`
];

// Default maintenance categories
const defaultCategories = [
  'Engine',
  'Transmission',
  'Brakes',
  'Suspension',
  'Electrical',
  'Body',
  'Interior',
  'Tires',
  'Oil Change',
  'General Maintenance',
  'Other',
  'Taxes',
  'Fees',
  'In State Tax',
  'Out of State Tax'
];

// Initialize the database schema
async function initializeSchema() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Create tables
    for (const statement of createTableStatements) {
      await connection.execute(statement);
      logger.info('Table created successfully');
    }

    // Check if default admin organization exists
    const [organizations] = await connection.execute('SELECT * FROM organizations LIMIT 1');
    
    if (organizations.length === 0) {
      // Create default admin organization
      const adminOrgId = uuidv4();
      await connection.execute(
        'INSERT INTO organizations (id, name, email) VALUES (?, ?, ?)',
        [adminOrgId, 'Admin Organization', 'admin@carfin.com']
      );
      
      // Create default admin user
      const adminId = uuidv4();
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.execute(
        'INSERT INTO users (id, organization_id, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [adminId, adminOrgId, 'admin@carfin.com', hashedPassword, 'Admin', 'User', 'admin']
      );
      
      logger.info('Default admin organization and user created');
    }

    // Check if default maintenance categories exist
    const [categories] = await connection.execute('SELECT * FROM maintenance_categories LIMIT 1');
    
    if (categories.length === 0) {
      // Insert default maintenance categories
      for (const category of defaultCategories) {
        await connection.execute(
          'INSERT INTO maintenance_categories (id, name) VALUES (?, ?)',
          [uuidv4(), category]
        );
      }
      
      logger.info('Default maintenance categories created');
    }

    await connection.commit();
    logger.info('Database schema initialized successfully');
    
  } catch (error) {
    await connection.rollback();
    logger.error(`Failed to initialize database schema: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  initializeSchema
}; 