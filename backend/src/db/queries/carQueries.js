const { query } = require('../connection');

// Get all cars for an organization
const getCarsByOrganization = async (organizationId, filters = {}) => {
  let sql = 'SELECT * FROM cars WHERE organization_id = ?';
  const params = [organizationId];
  
  // Apply filters if provided
  if (filters.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  return query(sql, params);
};

// Get car by ID
const getCarById = async (id) => {
  return query('SELECT * FROM cars WHERE id = ?', [id]);
};

// Create new car
const createCar = async (car) => {
  const { 
    id, 
    organization_id, 
    vin, 
    make, 
    model, 
    year, 
    color, 
    purchase_date, 
    purchase_price, 
    sale_date, 
    sale_price, 
    status 
  } = car;
  
  return query(
    `INSERT INTO cars (
      id, 
      organization_id, 
      vin, 
      make, 
      model, 
      year, 
      color, 
      purchase_date, 
      purchase_price, 
      sale_date, 
      sale_price, 
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, 
      organization_id, 
      vin, 
      make, 
      model, 
      year, 
      color, 
      purchase_date, 
      purchase_price, 
      sale_date, 
      sale_price, 
      status
    ]
  );
};

// Update car
const updateCar = async (id, car) => {
  const { 
    vin, 
    make, 
    model, 
    year, 
    color, 
    purchase_date, 
    purchase_price, 
    sale_date, 
    sale_price, 
    status 
  } = car;
  
  return query(
    `UPDATE cars SET 
      vin = ?, 
      make = ?, 
      model = ?, 
      year = ?, 
      color = ?, 
      purchase_date = ?, 
      purchase_price = ?, 
      sale_date = ?, 
      sale_price = ?, 
      status = ?
    WHERE id = ?`,
    [
      vin, 
      make, 
      model, 
      year, 
      color, 
      purchase_date, 
      purchase_price, 
      sale_date, 
      sale_price, 
      status, 
      id
    ]
  );
};

// Delete car
const deleteCar = async (id) => {
  return query('DELETE FROM cars WHERE id = ?', [id]);
};

// Search cars
const searchCars = async (organizationId, searchParams) => {
  let sql = 'SELECT * FROM cars WHERE organization_id = ?';
  const params = [organizationId];
  
  if (searchParams.make) {
    sql += ' AND make LIKE ?';
    params.push(`%${searchParams.make}%`);
  }
  
  if (searchParams.model) {
    sql += ' AND model LIKE ?';
    params.push(`%${searchParams.model}%`);
  }
  
  if (searchParams.year) {
    sql += ' AND year = ?';
    params.push(searchParams.year);
  }
  
  if (searchParams.vin) {
    sql += ' AND vin LIKE ?';
    params.push(`%${searchParams.vin}%`);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  return query(sql, params);
};

// Get car statistics
const getCarStatistics = async (organizationId) => {
  const totalCarsQuery = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END) as in_stock,
      SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM cars 
    WHERE organization_id = ?
  `;
  
  const profitQuery = `
    SELECT 
      SUM(sale_price - purchase_price) as total_profit
    FROM cars 
    WHERE organization_id = ? AND status = 'sold'
  `;
  
  const [totalStats] = await query(totalCarsQuery, [organizationId]);
  const [profitStats] = await query(profitQuery, [organizationId]);
  
  return {
    ...totalStats[0],
    ...profitStats[0]
  };
};

module.exports = {
  getCarsByOrganization,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  searchCars,
  getCarStatistics
}; 