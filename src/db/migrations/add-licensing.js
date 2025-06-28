const { pool } = require('../connection');
const { v4: uuidv4 } = require('uuid');
const config = require('../../../config');

async function migrateLicensing() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('Starting licensing migration...');
    
    // Create license tiers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS license_tiers (
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
      )
    `);
    console.log('✓ License tiers table created');
    
    // Create organization licenses table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS organization_licenses (
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
      )
    `);
    console.log('✓ Organization licenses table created');
    
    // Create stripe events table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS stripe_events (
        id VARCHAR(36) PRIMARY KEY,
        stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        organization_id VARCHAR(36) NULL,
        license_id VARCHAR(36) NULL,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        event_data JSON,
        processing_status ENUM('pending', 'processed', 'failed') DEFAULT 'processed',
        error_message TEXT NULL,
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (license_id) REFERENCES organization_licenses(id)
      )
    `);
    console.log('✓ Stripe events table created');
    
    // Insert default license tiers
    const defaultTiers = [
      { 
        tier_name: 'champion', 
        display_name: 'Champion Plan', 
        car_limit: 10000, 
        monthly_price: 0.00, 
        stripe_price_id: null, 
        is_available_online: false, 
        sort_order: 0 
      },
      { 
        tier_name: 'starter', 
        display_name: 'Starter Plan', 
        car_limit: 30, 
        monthly_price: 79.99, 
        stripe_price_id: config.stripe?.starterPriceId || 'price_starter', 
        is_available_online: true, 
        sort_order: 1 
      },
      { 
        tier_name: 'professional', 
        display_name: 'Professional Plan', 
        car_limit: 75, 
        monthly_price: 119.99, 
        stripe_price_id: config.stripe?.professionalPriceId || 'price_professional', 
        is_available_online: true, 
        sort_order: 2 
      },
      { 
        tier_name: 'business', 
        display_name: 'Business Plan', 
        car_limit: 150, 
        monthly_price: 179.99, 
        stripe_price_id: config.stripe?.businessPriceId || 'price_business', 
        is_available_online: true, 
        sort_order: 3 
      },
      { 
        tier_name: 'enterprise', 
        display_name: 'Enterprise Plan', 
        car_limit: 10000, 
        monthly_price: 249.99, 
        stripe_price_id: config.stripe?.enterprisePriceId || 'price_enterprise', 
        is_available_online: true, 
        sort_order: 4 
      }
    ];
    
    for (const tier of defaultTiers) {
      const id = uuidv4();
      await connection.execute(
        `INSERT IGNORE INTO license_tiers 
         (id, tier_name, display_name, car_limit, monthly_price, stripe_price_id, is_available_online, sort_order) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, tier.tier_name, tier.display_name, tier.car_limit, tier.monthly_price, tier.stripe_price_id, tier.is_available_online, tier.sort_order]
      );
    }
    console.log('✓ Default license tiers inserted');
    
    // Get Admin Organization and assign Champion license
    const [adminOrgs] = await connection.execute(
      'SELECT id FROM organizations WHERE name = "Admin Organization" LIMIT 1'
    );
    
    if (adminOrgs.length > 0) {
      const adminOrgId = adminOrgs[0].id;
      
      // Check if license already exists
      const [existingLicense] = await connection.execute(
        'SELECT id FROM organization_licenses WHERE organization_id = ?',
        [adminOrgId]
      );
      
      if (existingLicense.length === 0) {
        const licenseId = uuidv4();
        await connection.execute(
          `INSERT INTO organization_licenses 
           (id, organization_id, license_type, car_limit, is_free_account, free_reason) 
           VALUES (?, ?, 'champion', 10000, TRUE, 'admin_organization')`,
          [licenseId, adminOrgId]
        );
        console.log('✓ Champion license assigned to Admin Organization');
      } else {
        console.log('✓ Admin Organization already has a license');
      }
    } else {
      console.log('⚠ Admin Organization not found - will be created on next startup');
    }
    
    // Create default licenses for any existing organizations without licenses
    const [orgsWithoutLicense] = await connection.execute(`
      SELECT o.id, o.name 
      FROM organizations o 
      LEFT JOIN organization_licenses ol ON o.id = ol.organization_id 
      WHERE ol.id IS NULL AND o.name != 'Admin Organization'
    `);
    
    for (const org of orgsWithoutLicense) {
      const licenseId = uuidv4();
      await connection.execute(
        `INSERT INTO organization_licenses 
         (id, organization_id, license_type, car_limit, is_free_account, free_reason) 
         VALUES (?, ?, 'champion', 10000, TRUE, 'existing_organization')`,
        [licenseId, org.id]
      );
      console.log(`✓ Champion license assigned to existing organization: ${org.name}`);
    }
    
    await connection.commit();
    console.log('🎉 Licensing migration completed successfully!');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Licensing migration failed:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateLicensing()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateLicensing }; 