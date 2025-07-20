const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/connection');

// Get all organizations with user count and license info
router.get('/', async (req, res) => {
  try {
    const organizations = await query(`
      SELECT 
        o.id,
        o.name,
        o.address,
        o.phone,
        o.email,
        o.created_at,
        o.updated_at,
        COUNT(DISTINCT u.id) as user_count,
        ol.license_type,
        ol.car_limit,
        ol.is_active as license_active,
        ol.is_free_account,
        ol.subscription_status,
        ol.free_reason,
        lt.display_name as license_display_name,
        lt.monthly_price
      FROM organizations o
      LEFT JOIN users u ON o.id = u.organization_id
      LEFT JOIN organization_licenses ol ON o.id = ol.organization_id
      LEFT JOIN license_tiers lt ON ol.license_type = lt.tier_name
      GROUP BY o.id, ol.id, lt.id
      ORDER BY o.created_at DESC
    `);

    res.json({
      success: true,
      data: organizations
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizations',
      error: error.message
    });
  }
});

// Get single organization by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [organization] = await query(`
      SELECT 
        o.*,
        ol.license_type,
        ol.car_limit,
        ol.is_active as license_active,
        ol.is_free_account,
        ol.subscription_status,
        ol.free_reason,
        ol.stripe_customer_id,
        ol.stripe_subscription_id,
        ol.current_period_end,
        lt.display_name as license_display_name,
        lt.monthly_price
      FROM organizations o
      LEFT JOIN organization_licenses ol ON o.id = ol.organization_id
      LEFT JOIN license_tiers lt ON ol.license_type = lt.tier_name
      WHERE o.id = ?
    `, [id]);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Get users for this organization
    const users = await query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.created_at,
        u.updated_at,
        r.role_name
      FROM users u
      JOIN user_roles r ON u.role_id = r.id
      WHERE u.organization_id = ?
      ORDER BY u.created_at DESC
    `, [id]);

    // Get car count
    const [carStats] = await query(`
      SELECT 
        COUNT(*) as total_cars,
        COUNT(CASE WHEN status != 'sold' THEN 1 END) as active_cars
      FROM cars 
      WHERE organization_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        ...organization,
        users,
        car_stats: carStats || { total_cars: 0, active_cars: 0 }
      }
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization',
      error: error.message
    });
  }
});

// Create new organization
router.post('/', async (req, res) => {
  try {
    const { 
      name, address, phone, email, license_type, car_limit, is_free_account, free_reason,
      is_active, subscription_status, stripe_customer_id, stripe_subscription_id,
      current_period_start, current_period_end
    } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    // Check if organization name already exists
    const [existingOrg] = await query('SELECT id FROM organizations WHERE name = ?', [name]);
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: 'Organization name already exists'
      });
    }

    const organizationId = uuidv4();

    // Create organization
    await query(`
      INSERT INTO organizations (id, name, address, phone, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [organizationId, name, address || null, phone || null, email]);

    // Create license if specified
    if (license_type) {
      // Get tier info to set default car_limit if not provided
      let finalCarLimit = car_limit;
      if (!finalCarLimit && license_type && license_type !== 'champion') {
        const [tier] = await query('SELECT car_limit FROM license_tiers WHERE tier_name = ?', [license_type]);
        if (tier) {
          finalCarLimit = tier.car_limit;
        }
      }
      
      // Convert undefined values to null for database
      const cleanLicenseData = {
        license_type,
        car_limit: finalCarLimit || null,
        is_active: is_active !== false,
        is_free_account: is_free_account || false,
        free_reason: free_reason || null,
        subscription_status: subscription_status || null,
        stripe_customer_id: stripe_customer_id || null,
        stripe_subscription_id: stripe_subscription_id || null,
        current_period_start: current_period_start || null,
        current_period_end: current_period_end || null
      };
      
      const licenseId = uuidv4();
      await query(`
        INSERT INTO organization_licenses (
          id, organization_id, license_type, car_limit, is_active, 
          is_free_account, free_reason, subscription_status, 
          stripe_customer_id, stripe_subscription_id, 
          current_period_start, current_period_end, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        licenseId, 
        organizationId, 
        cleanLicenseData.license_type, 
        cleanLicenseData.car_limit, 
        cleanLicenseData.is_active, 
        cleanLicenseData.is_free_account, 
        cleanLicenseData.free_reason,
        cleanLicenseData.subscription_status,
        cleanLicenseData.stripe_customer_id,
        cleanLicenseData.stripe_subscription_id,
        cleanLicenseData.current_period_start,
        cleanLicenseData.current_period_end
      ]);
    }

    // Fetch the created organization with license info
    const [createdOrg] = await query(`
      SELECT 
        o.*,
        ol.license_type,
        ol.car_limit,
        ol.is_active as license_active,
        ol.is_free_account,
        ol.free_reason,
        lt.display_name as license_display_name,
        lt.monthly_price
      FROM organizations o
      LEFT JOIN organization_licenses ol ON o.id = ol.organization_id
      LEFT JOIN license_tiers lt ON ol.license_type = lt.tier_name
      WHERE o.id = ?
    `, [organizationId]);

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: createdOrg
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create organization',
      error: error.message
    });
  }
});

// Update organization
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, address, phone, email, license_type, car_limit, is_active, is_free_account, free_reason,
      subscription_status, stripe_customer_id, stripe_subscription_id,
      current_period_start, current_period_end
    } = req.body;

    // Check if organization exists
    const [existingOrg] = await query('SELECT id FROM organizations WHERE id = ?', [id]);
    if (!existingOrg) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Update organization
    await query(`
      UPDATE organizations 
      SET name = ?, address = ?, phone = ?, email = ?, updated_at = NOW()
      WHERE id = ?
    `, [name, address, phone, email, id]);

    // Update license if specified
    if (license_type !== undefined) {
      const [existingLicense] = await query('SELECT id FROM organization_licenses WHERE organization_id = ?', [id]);
      
      // Get tier info to set default car_limit if not provided
      let finalCarLimit = car_limit;
      if (!finalCarLimit && license_type && license_type !== 'champion') {
        const [tier] = await query('SELECT car_limit FROM license_tiers WHERE tier_name = ?', [license_type]);
        if (tier) {
          finalCarLimit = tier.car_limit;
        }
      }
      
      // Convert undefined values to null for database
      const cleanData = {
        license_type,
        car_limit: finalCarLimit || null,
        is_active: is_active !== false,
        is_free_account: is_free_account || false,
        free_reason: free_reason || null,
        subscription_status: subscription_status || null,
        stripe_customer_id: stripe_customer_id || null,
        stripe_subscription_id: stripe_subscription_id || null,
        current_period_start: current_period_start || null,
        current_period_end: current_period_end || null
      };
      
      if (existingLicense) {
        await query(`
          UPDATE organization_licenses 
          SET license_type = ?, car_limit = ?, is_active = ?, is_free_account = ?, free_reason = ?, 
              subscription_status = ?, stripe_customer_id = ?, stripe_subscription_id = ?,
              current_period_start = ?, current_period_end = ?, updated_at = NOW()
          WHERE organization_id = ?
        `, [
          cleanData.license_type, 
          cleanData.car_limit, 
          cleanData.is_active, 
          cleanData.is_free_account, 
          cleanData.free_reason,
          cleanData.subscription_status, 
          cleanData.stripe_customer_id, 
          cleanData.stripe_subscription_id,
          cleanData.current_period_start, 
          cleanData.current_period_end, 
          id
        ]);
      } else {
        const licenseId = uuidv4();
        await query(`
          INSERT INTO organization_licenses (
            id, organization_id, license_type, car_limit, is_active, 
            is_free_account, free_reason, subscription_status,
            stripe_customer_id, stripe_subscription_id, 
            current_period_start, current_period_end, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          licenseId, 
          id, 
          cleanData.license_type, 
          cleanData.car_limit, 
          cleanData.is_active, 
          cleanData.is_free_account, 
          cleanData.free_reason, 
          cleanData.subscription_status,
          cleanData.stripe_customer_id, 
          cleanData.stripe_subscription_id,
          cleanData.current_period_start, 
          cleanData.current_period_end
        ]);
      }
    }

    // Fetch updated organization
    const [updatedOrg] = await query(`
      SELECT 
        o.*,
        ol.license_type,
        ol.car_limit,
        ol.is_active as license_active,
        ol.is_free_account,
        ol.free_reason,
        lt.display_name as license_display_name,
        lt.monthly_price
      FROM organizations o
      LEFT JOIN organization_licenses ol ON o.id = ol.organization_id
      LEFT JOIN license_tiers lt ON ol.license_type = lt.tier_name
      WHERE o.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Organization updated successfully',
      data: updatedOrg
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization',
      error: error.message
    });
  }
});

// Delete organization
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if organization exists
    const [existingOrg] = await query('SELECT id, name FROM organizations WHERE id = ?', [id]);
    if (!existingOrg) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Get counts for reporting what will be deleted
    const [userCount] = await query('SELECT COUNT(*) as count FROM users WHERE organization_id = ?', [id]);
    const [carCount] = await query('SELECT COUNT(*) as count FROM cars WHERE organization_id = ?', [id]);
    const [expenseCount] = await query('SELECT COUNT(*) as count FROM organization_expenses WHERE organization_id = ?', [id]);
    const [maintenanceCount] = await query(`
      SELECT COUNT(*) as count FROM maintenance_records mr 
      JOIN cars c ON mr.car_id = c.id 
      WHERE c.organization_id = ?
    `, [id]);

    console.log(`🗑️ Cascading delete for organization "${existingOrg.name}":`, {
      users: userCount.count,
      cars: carCount.count,
      expenses: expenseCount.count,
      maintenanceRecords: maintenanceCount.count
    });

    // Start transaction for cascade delete
    const { createPool } = require('../db/connection');
    const pool = createPool();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. Delete users (this will cascade to any user-related data)
      if (userCount.count > 0) {
        await connection.execute('DELETE FROM users WHERE organization_id = ?', [id]);
        console.log(`✅ Deleted ${userCount.count} users`);
      }

      // 2. Delete cars (this will cascade to maintenance records and attachments)
      if (carCount.count > 0) {
        await connection.execute('DELETE FROM cars WHERE organization_id = ?', [id]);
        console.log(`✅ Deleted ${carCount.count} cars and their maintenance records`);
      }

      // 3. Delete Stripe events related to this organization
      await connection.execute('DELETE FROM stripe_events WHERE organization_id = ?', [id]);

      // 4. Delete organization (this will cascade to licenses, expense categories, expenses, etc. via ON DELETE CASCADE)
      await connection.execute('DELETE FROM organizations WHERE id = ?', [id]);
      console.log(`✅ Deleted organization and all cascade relationships`);

      await connection.commit();

      // Build summary message
      let summary = `Organization "${existingOrg.name}" deleted successfully`;
      const deletedItems = [];
      if (userCount.count > 0) deletedItems.push(`${userCount.count} user(s)`);
      if (carCount.count > 0) deletedItems.push(`${carCount.count} car(s)`);
      if (expenseCount.count > 0) deletedItems.push(`${expenseCount.count} expense(s)`);
      if (maintenanceCount.count > 0) deletedItems.push(`${maintenanceCount.count} maintenance record(s)`);

      if (deletedItems.length > 0) {
        summary += `. Also deleted: ${deletedItems.join(', ')}`;
      }

      res.json({
        success: true,
        message: summary,
        deletedCounts: {
          users: userCount.count,
          cars: carCount.count,
          expenses: expenseCount.count,
          maintenanceRecords: maintenanceCount.count
        }
      });

    } catch (dbError) {
      await connection.rollback();
      throw dbError;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete organization',
      error: error.message
    });
  }
});

// Toggle organization activation status
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Check if organization exists
    const [existingOrg] = await query('SELECT id, name FROM organizations WHERE id = ?', [id]);
    if (!existingOrg) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Update organization license status
    const [existingLicense] = await query('SELECT id FROM organization_licenses WHERE organization_id = ?', [id]);
    
    if (existingLicense) {
      await query(
        'UPDATE organization_licenses SET is_active = ?, updated_at = NOW() WHERE organization_id = ?',
        [is_active, id]
      );
      
      const statusText = is_active ? 'activated' : 'deactivated';
      const statusAction = is_active ? 'reactivated' : 'deactivated';
      
      console.log(`🔄 Organization "${existingOrg.name}" ${statusAction} (license ${statusText})`);
      
      res.json({
        success: true,
        message: `Organization "${existingOrg.name}" ${statusAction} successfully`,
        status: {
          is_active,
          action: statusAction
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Organization has no license to activate/deactivate'
      });
    }
    
  } catch (error) {
    console.error('Error toggling organization status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle organization status',
      error: error.message
    });
  }
});

// Get license tiers for dropdown
router.get('/data/license-tiers', async (req, res) => {
  try {
    const tiers = await query(`
      SELECT 
        tier_name,
        display_name,
        car_limit,
        monthly_price,
        is_active
      FROM license_tiers
      WHERE is_active = true
      ORDER BY monthly_price ASC
    `);

    // Use only real tiers from database
    const allTiers = tiers;

    res.json({
      success: true,
      data: allTiers
    });
  } catch (error) {
    console.error('Error fetching license tiers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch license tiers',
      error: error.message
    });
  }
});

module.exports = router; 