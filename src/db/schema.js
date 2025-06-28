const { pool } = require('./connection');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { migrateLicensing } = require('./migrations/add-licensing');

// SQL statements to create the database schema
const createTableStatements = [
  // User Roles table
  `CREATE TABLE IF NOT EXISTS user_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

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
    role_id INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (role_id) REFERENCES user_roles(id)
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
    organization_id VARCHAR(36) NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
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
  )`,

  // Organization Expense Categories table
  `CREATE TABLE IF NOT EXISTS organization_expense_categories (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
  )`,

  // Organization Expenses table
  `CREATE TABLE IF NOT EXISTS organization_expenses (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency ENUM('monthly', 'quarterly', 'annually') NULL,
    created_by_user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES organization_expense_categories(id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
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

    // Check if default roles exist
    const [roles] = await connection.execute('SELECT * FROM user_roles LIMIT 1');
    
    if (roles.length === 0) {
      // Create default roles
      await connection.execute('INSERT INTO user_roles (id, role_name) VALUES (1, "owner")');
      await connection.execute('INSERT INTO user_roles (id, role_name) VALUES (2, "manager")');
      await connection.execute('INSERT INTO user_roles (id, role_name) VALUES (3, "operator")');
      
      logger.info('Default user roles created');
    }

    // Migration: Update existing users to use role_id instead of role (if needed)
    try {
      // Check if role_id column exists
      const [columns] = await connection.execute('DESCRIBE users');
      const hasRoleId = columns.some(col => col.Field === 'role_id');
      const hasOldRole = columns.some(col => col.Field === 'role');
      
      if (hasOldRole && hasRoleId) {
        // Migrate existing users from role to role_id
        await connection.execute('UPDATE users SET role_id = 1 WHERE role IN ("admin", "owner")');
        await connection.execute('UPDATE users SET role_id = 2 WHERE role = "manager"');
        await connection.execute('UPDATE users SET role_id = 3 WHERE role IN ("user", "operator")');
        
        // Drop the old role column
        await connection.execute('ALTER TABLE users DROP COLUMN role');
        
        logger.info('Migrated users from role to role_id system');
      }
    } catch (migrationError) {
      logger.error(`Migration error: ${migrationError.message}`);
    }

    // Check if default maintenance categories exist
    const [categories] = await connection.execute('SELECT * FROM maintenance_categories LIMIT 1');
    
    if (categories.length === 0) {
      // Insert default maintenance categories
      for (const category of defaultCategories) {
        await connection.execute(
          'INSERT INTO maintenance_categories (id, name, organization_id, is_default) VALUES (?, ?, NULL, TRUE)',
          [uuidv4(), category]
        );
      }
      
      logger.info('Default maintenance categories created');
    } else {
      // Migration: Check if the new columns exist and update existing categories
      try {
        const [existingDefaults] = await connection.execute('SELECT COUNT(*) as count FROM maintenance_categories WHERE is_default = TRUE');
        
        if (existingDefaults[0].count === 0) {
          // Update all existing categories to be default
          await connection.execute('UPDATE maintenance_categories SET is_default = TRUE, organization_id = NULL WHERE organization_id IS NULL OR organization_id = ""');
          logger.info('Migrated existing maintenance categories to default status');
        }
      } catch (migrationError) {
        // If the columns don't exist yet, that's fine - they'll be added by the table creation
        if (migrationError.message.includes('Unknown column')) {
          logger.info('New columns not yet present, skipping migration');
        } else {
          throw migrationError;
        }
      }
    }

    await connection.commit();
    logger.info('Database schema initialized successfully');
    
    // Run licensing migration
    logger.info('Running licensing migration...');
    await migrateLicensing();
    
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