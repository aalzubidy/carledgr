const { pool } = require('./connection');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
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
    status ENUM('in_stock', 'sold', 'pending', 'in_repair') DEFAULT 'pending',
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
  )`,

  // License Tiers table
  `CREATE TABLE IF NOT EXISTS license_tiers (
    id VARCHAR(36) PRIMARY KEY,
    tier_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    car_limit INT NOT NULL,
    monthly_price DECIMAL(8, 2) NOT NULL,
    stripe_price_id VARCHAR(255) NULL,
    is_available_online BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Organization Licenses table
  `CREATE TABLE IF NOT EXISTS organization_licenses (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    license_type VARCHAR(50) NOT NULL,
    car_limit INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_free_account BOOLEAN DEFAULT FALSE,
    free_reason VARCHAR(255) NULL,
    stripe_customer_id VARCHAR(255) NULL,
    stripe_subscription_id VARCHAR(255) NULL,
    subscription_status ENUM('active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid') NULL,
    current_period_start TIMESTAMP NULL,
    current_period_end TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (license_type) REFERENCES license_tiers(tier_name),
    UNIQUE KEY unique_org_license (organization_id)
  )`,

  // Stripe Events table
  `CREATE TABLE IF NOT EXISTS stripe_events (
    id VARCHAR(36) PRIMARY KEY,
    stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    organization_id VARCHAR(36) NULL,
    subscription_id VARCHAR(255) NULL,
    customer_id VARCHAR(255) NULL,
    event_data JSON NOT NULL,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
  )`,

  // System Info table
  `CREATE TABLE IF NOT EXISTS system_info (
    id VARCHAR(36) PRIMARY KEY,
    info_key VARCHAR(100) NOT NULL UNIQUE,
    info_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`
];

// Helper functions for system info management
async function getSystemInfo(connection, key) {
  try {
    const [rows] = await connection.execute(
      'SELECT info_value FROM system_info WHERE info_key = ?',
      [key]
    );
    return rows.length > 0 ? rows[0].info_value : null;
  } catch (error) {
    logger.error(`Error getting system info for key ${key}: ${error.message}`);
    return null;
  }
}

async function setSystemInfo(connection, key, value) {
  try {
    await connection.execute(
      'INSERT INTO system_info (id, info_key, info_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE info_value = VALUES(info_value), updated_at = CURRENT_TIMESTAMP',
      [uuidv4(), key, value]
    );
  } catch (error) {
    logger.error(`Error setting system info for key ${key}: ${error.message}`);
  }
}

function getFileLastModified(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.getTime();
  } catch (error) {
    logger.error(`Error getting file modification time for ${filePath}: ${error.message}`);
    return 0;
  }
}

// Load default categories from config
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

// Initialize user roles
async function initializeUserRoles(connection) {
  try {
    logger.info('Initializing user roles...');
    
    // Check if roles already exist
    const [existingRoles] = await connection.execute('SELECT COUNT(*) as count FROM user_roles');
    
    if (existingRoles[0].count === 0) {
      // Insert default user roles
      const defaultRoles = [
        { id: 1, role_name: 'owner' },
        { id: 2, role_name: 'manager' },
        { id: 3, role_name: 'operator' }
      ];
      
      for (const role of defaultRoles) {
        await connection.execute(
          'INSERT INTO user_roles (id, role_name) VALUES (?, ?)',
          [role.id, role.role_name]
        );
        logger.info(`Created user role: ${role.role_name} (${role.id})`);
      }
      
      logger.info('✅ User roles initialized successfully');
    } else {
      logger.info('✅ User roles already exist, skipping initialization');
    }
  } catch (error) {
    logger.error(`Error initializing user roles: ${error.message}`);
    throw error;
  }
}

// Initialize license tiers
async function initializeLicenseTiers(connection) {
  try {
    logger.info('🏷️ Initializing license tiers...');
    
    // Check if license tiers already exist
    const [existingTiers] = await connection.execute('SELECT COUNT(*) as count FROM license_tiers');
    
    if (existingTiers[0].count === 0) {
      // Insert default license tiers
      const defaultTiers = [
        {
          id: uuidv4(),
          tier_name: 'starter',
          display_name: 'Starter Plan',
          car_limit: 20,
          monthly_price: 79.99,
          stripe_price_id: null,
          sort_order: 1
        },
        {
          id: uuidv4(),
          tier_name: 'professional',
          display_name: 'Professional Plan',
          car_limit: 50,
          monthly_price: 119.99,
          stripe_price_id: null,
          sort_order: 2
        },
        {
          id: uuidv4(),
          tier_name: 'business',
          display_name: 'Business Plan',
          car_limit: 100,
          monthly_price: 179.99,
          stripe_price_id: null,
          sort_order: 3
        },
        {
          id: uuidv4(),
          tier_name: 'enterprise',
          display_name: 'Enterprise Plan',
          car_limit: 10000,
          monthly_price: 249.99,
          stripe_price_id: null,
          sort_order: 4
        },
        {
          id: uuidv4(),
          tier_name: 'champion',
          display_name: 'Champion Plan',
          car_limit: 10000,
          monthly_price: 0.00,
          stripe_price_id: null,
          sort_order: 5,
          is_available_online: false
        }
      ];
      
      for (const tier of defaultTiers) {
        await connection.execute(
          `INSERT INTO license_tiers 
           (id, tier_name, display_name, car_limit, monthly_price, stripe_price_id, sort_order, is_available_online) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [tier.id, tier.tier_name, tier.display_name, tier.car_limit, tier.monthly_price, tier.stripe_price_id, tier.sort_order, tier.is_available_online || true]
        );
        logger.info(`Created license tier: ${tier.tier_name} - ${tier.display_name}`);
      }
      
      logger.info('✅ License tiers initialized successfully');
    } else {
      logger.info('✅ License tiers already exist, skipping initialization');
    }
  } catch (error) {
    logger.error(`Error initializing license tiers: ${error.message}`);
    throw error;
  }
}

// Migrate favorite_cars table
async function migrateFavoriteCarsTable(connection) {
  try {
    // Check if favorite_cars table exists
    const [tableExists] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'favorite_cars'
    `);
    
    if (tableExists[0].count === 0) {
      logger.info('📋 Creating favorite_cars table...');
      
      // Get the actual data type and collation from users table
      const [userTableInfo] = await connection.execute(`
        SELECT COLUMN_TYPE, COLLATION_NAME 
        FROM information_schema.COLUMNS 
        WHERE table_schema = DATABASE() 
        AND table_name = 'users' 
        AND column_name = 'id'
      `);
      
      const [carTableInfo] = await connection.execute(`
        SELECT COLUMN_TYPE, COLLATION_NAME 
        FROM information_schema.COLUMNS 
        WHERE table_schema = DATABASE() 
        AND table_name = 'cars' 
        AND column_name = 'id'
      `);
      
      const userIdType = userTableInfo[0].COLUMN_TYPE;
      const userCollation = userTableInfo[0].COLLATION_NAME;
      const carIdType = carTableInfo[0].COLUMN_TYPE;
      const carCollation = carTableInfo[0].COLLATION_NAME;
      
      // Create the table with matching collations
      await connection.execute(`
        CREATE TABLE favorite_cars (
          id ${userIdType} COLLATE ${userCollation} PRIMARY KEY,
          user_id ${userIdType} COLLATE ${userCollation} NOT NULL,
          car_id ${carIdType} COLLATE ${carCollation} NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_car (user_id, car_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
        ) COLLATE=${userCollation}
      `);
      
      logger.info('✅ favorite_cars table created successfully');
    } else {
      logger.info('✅ favorite_cars table already exists');
    }
  } catch (error) {
    logger.error(`Error migrating favorite_cars table: ${error.message}`);
    // Don't throw error here, as this is a non-critical feature
    logger.info('⚠️ Continuing without favorite_cars table');
  }
}

// Initialize the database schema
async function initializeSchema() {
  const connection = await pool.getConnection();
  
  try {
    logger.info('🔧 Starting database schema initialization...');
    await connection.beginTransaction();
    
    // Step 1: Create all tables
    logger.info('📋 Creating database tables...');
    for (let i = 0; i < createTableStatements.length; i++) {
      const statement = createTableStatements[i];
      await connection.execute(statement);
      logger.info(`✅ Table ${i + 1}/${createTableStatements.length} created successfully`);
    }

    // Step 1.5: Handle favorite_cars table migration
    await migrateFavoriteCarsTable(connection);
    
    // Step 2: Initialize user roles (critical for system to function)
    await initializeUserRoles(connection);
    
         // Step 3: Initialize license tiers
     await initializeLicenseTiers(connection);

    // Step 4: Initialize default categories
    logger.info('📁 Initializing default categories...');
    try {
      const defaultCategories = loadDefaultCategories();
      
      // Initialize maintenance categories
      await initializeMaintenanceCategories(connection, defaultCategories.maintenance_categories);
      
      // Initialize expense categories
      await initializeExpenseCategories(connection, defaultCategories.expense_categories);
      
      // Update the last sync time
      const configPath = path.join(__dirname, '../../config/default-categories.json');
      const currentFileModTime = getFileLastModified(configPath);
      await setSystemInfo(connection, 'default_categories_last_modified', currentFileModTime.toString());
      
      logger.info('✅ Default categories initialized successfully');
    } catch (categoryError) {
      logger.error(`Category initialization failed: ${categoryError.message}`);
      // Categories are not critical, continue without them
      logger.info('⚠️ Continuing without default categories...');
    }

    await connection.commit();
    logger.info('🎉 Database schema initialized successfully!');
    
    // Log summary of what was created
    const [tables] = await connection.execute("SHOW TABLES");
    logger.info(`📊 Database ready with ${tables.length} tables`);
    
  } catch (error) {
    await connection.rollback();
    logger.error(`💥 Failed to initialize database schema: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  initializeSchema
}; 