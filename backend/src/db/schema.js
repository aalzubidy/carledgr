const { pool } = require('./connection');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { migrateLicensing } = require('./migrations/add-licensing');
const fs = require('fs');
const path = require('path');

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
    organization_id VARCHAR(36) NULL,
    category_name VARCHAR(100) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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

// Load default categories from config file
function loadDefaultCategories() {
  try {
    const configPath = path.join(__dirname, '../../config/default-categories.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    logger.error(`Failed to load default categories config: ${error.message}`);
    // Fallback to hardcoded maintenance categories for backward compatibility
    return {
      maintenance_categories: [
        { id: null, name: 'Engine' },
        { id: null, name: 'Transmission' },
        { id: null, name: 'Brakes' },
        { id: null, name: 'Suspension' },
        { id: null, name: 'Electrical' },
        { id: null, name: 'Body' },
        { id: null, name: 'Interior' },
        { id: null, name: 'Tires' },
        { id: null, name: 'Oil Change' },
        { id: null, name: 'General Maintenance' },
        { id: null, name: 'Other' },
        { id: null, name: 'Taxes' },
        { id: null, name: 'Fees' },
        { id: null, name: 'In State Tax' },
        { id: null, name: 'Out of State Tax' }
      ],
      expense_categories: [
        { id: null, name: 'Rent', is_recurring: true },
        { id: null, name: 'Utilities', is_recurring: true },
        { id: null, name: 'Insurance', is_recurring: true },
        { id: null, name: 'Office Supplies', is_recurring: false }
      ]
    };
  }
}

// Initialize maintenance categories
async function initializeMaintenanceCategories(connection, categories) {
  try {
    // First, get all current default categories
    const [currentDefaults] = await connection.execute(
      'SELECT id, name FROM maintenance_categories WHERE is_default = TRUE AND organization_id IS NULL'
    );
    
    // Create a Set of category IDs and names from config for quick lookup
    const configCategoryIds = new Set(categories.filter(c => c.id).map(c => c.id));
    const configCategoryNames = new Set(categories.map(c => c.name));
    
    // Mark categories as no longer default if they're not in config
    for (const currentDefault of currentDefaults) {
      const isInConfig = configCategoryIds.has(currentDefault.id) || configCategoryNames.has(currentDefault.name);
      if (!isInConfig) {
        await connection.execute(
          'UPDATE maintenance_categories SET is_default = FALSE WHERE id = ?',
          [currentDefault.id]
        );
        logger.info(`Marked maintenance category as no longer default: ${currentDefault.name} (${currentDefault.id})`);
      }
    }
    
    // Process categories from config
    for (const category of categories) {
      try {
        if (category.id) {
          // Check if category with this ID exists
          const [existing] = await connection.execute(
            'SELECT id, name, is_default FROM maintenance_categories WHERE id = ?',
            [category.id]
          );
          
          if (existing.length > 0) {
            // Update existing category name and ensure it's marked as default
            if (existing[0].name !== category.name || !existing[0].is_default) {
              await connection.execute(
                'UPDATE maintenance_categories SET name = ?, is_default = TRUE, organization_id = NULL WHERE id = ?',
                [category.name, category.id]
              );
              logger.info(`Updated maintenance category: ${category.name} (${category.id})`);
            }
          } else {
            // Insert new category with specified ID
            await connection.execute(
              'INSERT INTO maintenance_categories (id, name, organization_id, is_default) VALUES (?, ?, NULL, TRUE)',
              [category.id, category.name]
            );
            logger.info(`Created maintenance category: ${category.name} (${category.id})`);
          }
        } else {
          // Check if category with this name exists as default
          const [existing] = await connection.execute(
            'SELECT id, is_default FROM maintenance_categories WHERE name = ? AND organization_id IS NULL',
            [category.name]
          );
          
          if (existing.length === 0) {
            // Insert new category with generated ID
            await connection.execute(
              'INSERT INTO maintenance_categories (id, name, organization_id, is_default) VALUES (?, ?, NULL, TRUE)',
              [uuidv4(), category.name]
            );
            logger.info(`Created maintenance category: ${category.name}`);
          } else if (!existing[0].is_default) {
            // Re-mark as default if it was previously unmarked
            await connection.execute(
              'UPDATE maintenance_categories SET is_default = TRUE WHERE name = ? AND organization_id IS NULL',
              [category.name]
            );
            logger.info(`Re-marked maintenance category as default: ${category.name}`);
          }
        }
      } catch (error) {
        logger.error(`Error initializing maintenance category ${category.name}: ${error.message}`);
      }
    }
  } catch (error) {
    logger.error(`Error in maintenance categories initialization: ${error.message}`);
  }
}

// Initialize expense categories
async function initializeExpenseCategories(connection, categories) {
  // First, migrate existing expense categories table if needed
  try {
    const [columns] = await connection.execute('DESCRIBE organization_expense_categories');
    const hasIsDefault = columns.some(col => col.Field === 'is_default');
    const hasUpdatedAt = columns.some(col => col.Field === 'updated_at');
    
    if (!hasIsDefault) {
      await connection.execute('ALTER TABLE organization_expense_categories ADD COLUMN is_default BOOLEAN DEFAULT FALSE');
      logger.info('Added is_default column to organization_expense_categories');
    }
    
    if (!hasUpdatedAt) {
      await connection.execute('ALTER TABLE organization_expense_categories ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
      logger.info('Added updated_at column to organization_expense_categories');
    }
    
    // Make organization_id nullable for default categories
    await connection.execute('ALTER TABLE organization_expense_categories MODIFY organization_id VARCHAR(36) NULL');
    logger.info('Made organization_id nullable for default expense categories');
    
  } catch (migrationError) {
    logger.error(`Error migrating expense categories table: ${migrationError.message}`);
  }
  
  try {
    // First, get all current default categories
    const [currentDefaults] = await connection.execute(
      'SELECT id, category_name FROM organization_expense_categories WHERE is_default = TRUE AND organization_id IS NULL'
    );
    
    // Create a Set of category IDs and names from config for quick lookup
    const configCategoryIds = new Set(categories.filter(c => c.id).map(c => c.id));
    const configCategoryNames = new Set(categories.map(c => c.name));
    
    // Mark categories as no longer default if they're not in config
    for (const currentDefault of currentDefaults) {
      const isInConfig = configCategoryIds.has(currentDefault.id) || configCategoryNames.has(currentDefault.category_name);
      if (!isInConfig) {
        await connection.execute(
          'UPDATE organization_expense_categories SET is_default = FALSE WHERE id = ?',
          [currentDefault.id]
        );
        logger.info(`Marked expense category as no longer default: ${currentDefault.category_name} (${currentDefault.id})`);
      }
    }
    
    // Process categories from config
    for (const category of categories) {
      try {
        if (category.id) {
          // Check if category with this ID exists
          const [existing] = await connection.execute(
            'SELECT id, category_name, is_recurring, is_default FROM organization_expense_categories WHERE id = ?',
            [category.id]
          );
          
          if (existing.length > 0) {
            // Update existing category and ensure it's marked as default
            if (existing[0].category_name !== category.name || existing[0].is_recurring !== category.is_recurring || !existing[0].is_default) {
              await connection.execute(
                'UPDATE organization_expense_categories SET category_name = ?, is_recurring = ?, is_default = TRUE, organization_id = NULL WHERE id = ?',
                [category.name, category.is_recurring, category.id]
              );
              logger.info(`Updated expense category: ${category.name} (${category.id})`);
            }
          } else {
            // Insert new category with specified ID
            await connection.execute(
              'INSERT INTO organization_expense_categories (id, organization_id, category_name, is_recurring, is_default) VALUES (?, NULL, ?, ?, TRUE)',
              [category.id, category.name, category.is_recurring]
            );
            logger.info(`Created expense category: ${category.name} (${category.id})`);
          }
        } else {
          // Check if category with this name exists as default
          const [existing] = await connection.execute(
            'SELECT id, is_default, is_recurring FROM organization_expense_categories WHERE category_name = ? AND organization_id IS NULL',
            [category.name]
          );
          
          if (existing.length === 0) {
            // Insert new category with generated ID
            await connection.execute(
              'INSERT INTO organization_expense_categories (id, organization_id, category_name, is_recurring, is_default) VALUES (?, NULL, ?, ?, TRUE)',
              [uuidv4(), category.name, category.is_recurring]
            );
            logger.info(`Created expense category: ${category.name}`);
          } else if (!existing[0].is_default || existing[0].is_recurring !== category.is_recurring) {
            // Re-mark as default and update properties if needed
            await connection.execute(
              'UPDATE organization_expense_categories SET is_default = TRUE, is_recurring = ? WHERE category_name = ? AND organization_id IS NULL',
              [category.is_recurring, category.name]
            );
            logger.info(`Re-marked expense category as default: ${category.name}`);
          }
        }
      } catch (error) {
        logger.error(`Error initializing expense category ${category.name}: ${error.message}`);
      }
    }
  } catch (error) {
    logger.error(`Error in expense categories initialization: ${error.message}`);
  }
}

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

    // Load default categories from config
    const defaultCategories = loadDefaultCategories();
    
    // Initialize maintenance categories
    await initializeMaintenanceCategories(connection, defaultCategories.maintenance_categories);
    
    // Initialize expense categories
    await initializeExpenseCategories(connection, defaultCategories.expense_categories);

    await connection.commit();
    logger.info('Database schema initialized successfully');
    
    // Check if license tables exist and run migration only if needed
    const [licenseTables] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('license_tiers', 'organization_licenses', 'stripe_events')
    `);
    
    if (licenseTables[0].count < 3) {
      // License tables don't exist or are incomplete, run migration
      logger.info('License tables missing, running licensing migration...');
      await migrateLicensing();
    } else {
      // Check if default license tiers exist
      const [defaultTiers] = await connection.execute('SELECT COUNT(*) as count FROM license_tiers');
      if (defaultTiers[0].count === 0) {
        logger.info('License tables exist but no default tiers found, running licensing migration...');
        await migrateLicensing();
      } else {
        logger.info('License system already initialized, skipping migration');
      }
    }
    
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