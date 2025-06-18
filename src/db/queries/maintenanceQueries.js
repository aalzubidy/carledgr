const { query } = require('../connection');
const { v4: uuidv4 } = require('uuid');

// Get maintenance records for a car
const getMaintenanceRecordsByCar = async (carId) => {
  return query(`
    SELECT 
      m.*,
      mc.name as category_name
    FROM maintenance_records m
    LEFT JOIN maintenance_categories mc ON m.category_id = mc.id
    WHERE m.car_id = ?
    ORDER BY m.maintenance_date DESC
  `, [carId]);
};

// Get all maintenance records for an organization
const getMaintenanceRecordsByOrganization = async (organizationId) => {
  return query(`
    SELECT 
      m.*,
      mc.name as category_name,
      c.make as car_make,
      c.model as car_model,
      c.year as car_year,
      c.vin as car_vin
    FROM maintenance_records m
    LEFT JOIN maintenance_categories mc ON m.category_id = mc.id
    JOIN cars c ON m.car_id = c.id
    WHERE c.organization_id = ?
    ORDER BY m.maintenance_date DESC
  `, [organizationId]);
};

// Get maintenance record by ID
const getMaintenanceRecordById = async (id) => {
  return query(`
    SELECT 
      m.*, 
      mc.name as category_name
    FROM maintenance_records m
    LEFT JOIN maintenance_categories mc ON m.category_id = mc.id
    WHERE m.id = ?
  `, [id]);
};

// Create maintenance record
const createMaintenanceRecord = async (maintenance) => {
  const { id, car_id, category_id, description, cost, maintenance_date, vendor, notes } = maintenance;
  
  return query(
    `INSERT INTO maintenance_records (
      id, car_id, category_id, description, cost, maintenance_date, vendor, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, car_id, category_id, description, cost, maintenance_date, vendor, notes]
  );
};

// Update maintenance record
const updateMaintenanceRecord = async (id, maintenance) => {
  const { category_id, description, cost, maintenance_date, vendor, notes } = maintenance;
  
  return query(
    `UPDATE maintenance_records SET 
      category_id = ?,
      description = ?, 
      cost = ?, 
      maintenance_date = ?, 
      vendor = ?, 
      notes = ?
    WHERE id = ?`,
    [category_id, description, cost, maintenance_date, vendor, notes, id]
  );
};

// Delete maintenance record
const deleteMaintenanceRecord = async (id) => {
  return query('DELETE FROM maintenance_records WHERE id = ?', [id]);
};

// This function is no longer needed as we store category_id directly
// Keeping for backward compatibility but it does nothing
const associateMaintenanceCategories = async (maintenanceId, categoryIds) => {
  return Promise.resolve();
};

// Get maintenance categories
const getMaintenanceCategories = async (organizationId) => {
  const sql = `
    SELECT 
      id, 
      name, 
      organization_id,
      is_default,
      created_at,
      (
        SELECT COUNT(*) 
        FROM maintenance_records mr 
        WHERE mr.category_id = mc.id
      ) as maintenance_count
    FROM maintenance_categories mc
    WHERE (is_default = TRUE AND organization_id IS NULL) 
       OR (organization_id = ? AND is_default = FALSE)
    ORDER BY name ASC
  `;
  return await query(sql, [organizationId]);
};

const getMaintenanceCategoryById = async (id, organizationId) => {
  const sql = `
    SELECT id, name, organization_id, is_default, created_at
    FROM maintenance_categories 
    WHERE id = ? AND ((is_default = TRUE AND organization_id IS NULL) OR organization_id = ?)
  `;
  const result = await query(sql, [id, organizationId]);
  return result[0];
};

const createMaintenanceCategory = async (organizationId, categoryName) => {
  const id = uuidv4();
  const sql = `
    INSERT INTO maintenance_categories (id, name, organization_id, is_default)
    VALUES (?, ?, ?, FALSE)
  `;
  await query(sql, [id, categoryName, organizationId]);
  return { id, name: categoryName, organization_id: organizationId, is_default: false };
};

const updateMaintenanceCategory = async (categoryId, organizationId, categoryName) => {
  const sql = `
    UPDATE maintenance_categories 
    SET name = ? 
    WHERE id = ? AND organization_id = ? AND is_default = FALSE
  `;
  const result = await query(sql, [categoryName, categoryId, organizationId]);
  return result.affectedRows > 0;
};

const deleteMaintenanceCategory = async (categoryId, organizationId) => {
  const sql = `
    DELETE FROM maintenance_categories 
    WHERE id = ? AND organization_id = ? AND is_default = FALSE
  `;
  const result = await query(sql, [categoryId, organizationId]);
  return result.affectedRows > 0;
};

const getMaintenanceRecordsByCategoryId = async (categoryId) => {
  const sql = `
    SELECT COUNT(*) as count
    FROM maintenance_records 
    WHERE category_id = ?
  `;
  const result = await query(sql, [categoryId]);
  return result[0].count;
};

const moveMaintenanceRecordsToCategory = async (fromCategoryId, toCategoryId) => {
  const sql = `
    UPDATE maintenance_records 
    SET category_id = ?
    WHERE category_id = ?
  `;
  const result = await query(sql, [toCategoryId, fromCategoryId]);
  return result.affectedRows;
};

const deleteMaintenanceRecordsByCategory = async (categoryId) => {
  const sql = `
    DELETE FROM maintenance_records 
    WHERE category_id = ?
  `;
  const result = await query(sql, [categoryId]);
  return result.affectedRows;
};

// Get the "Other" default category for moving records
const getDefaultOtherCategory = async () => {
  const sql = `
    SELECT id, name
    FROM maintenance_categories 
    WHERE name = 'Other' AND is_default = TRUE AND organization_id IS NULL
    LIMIT 1
  `;
  const result = await query(sql);
  return result[0];
};

// Get maintenance statistics
const getMaintenanceStatistics = async (organizationId) => {
  const totalCostQuery = `
    SELECT 
      SUM(m.cost) as total_cost,
      COUNT(*) as total_records
    FROM maintenance_records m
    JOIN cars c ON m.car_id = c.id
    WHERE c.organization_id = ?
  `;
  
  const categoryCostsQuery = `
    SELECT 
      mc.name as category,
      SUM(m.cost) as cost,
      COUNT(*) as count
    FROM maintenance_records m
    JOIN cars c ON m.car_id = c.id
    JOIN maintenance_categories mc ON m.category_id = mc.id
    WHERE c.organization_id = ?
    GROUP BY mc.id
    ORDER BY cost DESC
  `;
  
  const [totalStats] = await query(totalCostQuery, [organizationId]);
  const categoryStats = await query(categoryCostsQuery, [organizationId]);
  
  return {
    ...totalStats[0],
    categories: categoryStats
  };
};

module.exports = {
  getMaintenanceRecordsByCar,
  getMaintenanceRecordsByOrganization,
  getMaintenanceRecordById,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  associateMaintenanceCategories,
  getMaintenanceCategories,
  getMaintenanceCategoryById,
  createMaintenanceCategory,
  updateMaintenanceCategory,
  deleteMaintenanceCategory,
  getMaintenanceRecordsByCategoryId,
  moveMaintenanceRecordsToCategory,
  deleteMaintenanceRecordsByCategory,
  getDefaultOtherCategory,
  getMaintenanceStatistics
}; 