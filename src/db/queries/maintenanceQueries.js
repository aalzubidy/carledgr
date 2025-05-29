const { query } = require('../connection');

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
const getMaintenanceCategories = async () => {
  return query('SELECT * FROM maintenance_categories ORDER BY name');
};

// Create maintenance category
const createMaintenanceCategory = async (category) => {
  const { id, name } = category;
  
  return query(
    'INSERT INTO maintenance_categories (id, name) VALUES (?, ?)',
    [id, name]
  );
};

// Update maintenance category
const updateMaintenanceCategory = async (id, name) => {
  return query(
    'UPDATE maintenance_categories SET name = ? WHERE id = ?',
    [name, id]
  );
};

// Delete maintenance category
const deleteMaintenanceCategory = async (id) => {
  return query('DELETE FROM maintenance_categories WHERE id = ?', [id]);
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
  createMaintenanceCategory,
  updateMaintenanceCategory,
  deleteMaintenanceCategory,
  getMaintenanceStatistics
}; 