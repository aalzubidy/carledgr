const { query } = require('../connection');

// Get inventory report
const getInventoryReport = async (organizationId, filters = {}) => {
  let sql = `
    SELECT 
      c.*,
      COALESCE(SUM(m.cost), 0) as total_maintenance_cost,
      COUNT(m.id) as maintenance_count
    FROM cars c
    LEFT JOIN maintenance_records m ON c.id = m.car_id
    WHERE c.organization_id = ?
  `;
  
  const params = [organizationId];
  
  // Apply filters if provided
  if (filters.status) {
    sql += ' AND c.status = ?';
    params.push(filters.status);
  }
  
  if (filters.make) {
    sql += ' AND c.make LIKE ?';
    params.push(`%${filters.make}%`);
  }
  
  if (filters.model) {
    sql += ' AND c.model LIKE ?';
    params.push(`%${filters.model}%`);
  }
  
  if (filters.year) {
    sql += ' AND c.year = ?';
    params.push(filters.year);
  }
  
  // Add date range filtering on created_at
  if (filters.dateRange) {
    if (filters.dateRange.start) {
      sql += ' AND c.created_at >= ?';
      params.push(filters.dateRange.start);
    }
    
    if (filters.dateRange.end) {
      sql += ' AND c.created_at <= ?';
      params.push(filters.dateRange.end);
    }
  }
  
  sql += ' GROUP BY c.id ORDER BY c.created_at DESC';
  
  return query(sql, params);
};

// Get sales report
const getSalesReport = async (organizationId, dateRange = {}) => {
  let dateFilter = '';
  let params = [organizationId];
  
  if (dateRange.start && dateRange.end) {
    dateFilter = 'AND c.sale_date BETWEEN ? AND ?';
    params.push(dateRange.start, dateRange.end);
  } else if (dateRange.start) {
    dateFilter = 'AND c.sale_date >= ?';
    params.push(dateRange.start);
  } else if (dateRange.end) {
    dateFilter = 'AND c.sale_date <= ?';
    params.push(dateRange.end);
  }
  
  // Get sold cars with maintenance costs
  const carsQuery = `
    SELECT 
      c.*,
      COALESCE(SUM(m.cost), 0) as total_maintenance_cost,
      (c.sale_price - c.purchase_price) as profit,
      (c.sale_price - c.purchase_price - COALESCE(SUM(m.cost), 0)) as net_profit
    FROM cars c
    LEFT JOIN maintenance_records m ON c.id = m.car_id
    WHERE c.organization_id = ? AND c.status = 'sold' ${dateFilter}
    GROUP BY c.id
    ORDER BY c.sale_date DESC
  `;
  
  // Get totals
  const totalsQuery = `
    SELECT 
      COUNT(c.id) as count,
      COALESCE(SUM(c.sale_price), 0) as sale_value,
      COALESCE(SUM(c.purchase_price), 0) as purchase_value,
      COALESCE(SUM(maintenance_totals.total_maintenance), 0) as maintenance_cost,
      COALESCE(SUM(c.sale_price - c.purchase_price), 0) as gross_profit,
      COALESCE(SUM(c.sale_price - c.purchase_price - COALESCE(maintenance_totals.total_maintenance, 0)), 0) as net_profit
    FROM cars c
    LEFT JOIN (
      SELECT car_id, SUM(cost) as total_maintenance
      FROM maintenance_records
      GROUP BY car_id
    ) maintenance_totals ON c.id = maintenance_totals.car_id
    WHERE c.organization_id = ? AND c.status = 'sold' ${dateFilter}
  `;
  
  const cars = await query(carsQuery, params);
  const totals = await query(totalsQuery, params);
  
  return {
    cars,
    totals: totals[0] || { count: 0, sale_value: 0, purchase_value: 0, maintenance_cost: 0, gross_profit: 0, net_profit: 0 }
  };
};

// Get maintenance cost report by date range
const getMaintenanceReport = async (organizationId, startDate, endDate, categoryId) => {
  let sql = `
    SELECT 
      c.id,
      c.vin,
      c.make,
      c.model,
      c.year,
      c.status,
      c.purchase_price,
      COUNT(m.id) as maintenance_count,
      COALESCE(SUM(m.cost), 0) as total_cost
    FROM cars c
    LEFT JOIN maintenance_records m ON c.id = m.car_id
    WHERE c.organization_id = ?
  `;
  
  const params = [organizationId];
  
  // Add category filter if provided - this will filter at the JOIN level
  if (categoryId) {
    sql += ' AND (m.category_id = ? OR m.id IS NULL)';
    params.push(categoryId);
  }
  
  if (startDate) {
    sql += ' AND (m.created_at >= ? OR m.created_at IS NULL)';
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ' AND (m.created_at <= ? OR m.created_at IS NULL)';
    params.push(endDate);
  }
  
  sql += ' GROUP BY c.id';
  
  // If category filter is applied, only show cars that have maintenance records in that category
  if (categoryId) {
    sql += ' HAVING maintenance_count > 0';
  }
  
  sql += ' ORDER BY total_cost DESC';
  
  const cars = await query(sql, params);
  
  // Get detailed maintenance records for each car
  for (let car of cars) {
    let recordsSql = `
      SELECT 
        m.id,
        m.description,
        m.cost,
        m.maintenance_date,
        m.vendor,
        mc.name as category_name
      FROM maintenance_records m
      LEFT JOIN maintenance_categories mc ON m.category_id = mc.id
      WHERE m.car_id = ?
    `;
    
    const recordsParams = [car.id];
    
    // Add category filter for detailed records too
    if (categoryId) {
      recordsSql += ' AND m.category_id = ?';
      recordsParams.push(categoryId);
    }
    
    if (startDate) {
      recordsSql += ' AND m.created_at >= ?';
      recordsParams.push(startDate);
    }
    
    if (endDate) {
      recordsSql += ' AND m.created_at <= ?';
      recordsParams.push(endDate);
    }
    
    recordsSql += ' ORDER BY m.created_at DESC';
    
    car.maintenance_records = await query(recordsSql, recordsParams);
  }
  
  // Get category cost rankings
  let categorySql = `
    SELECT 
      mc.name as category_name,
      COUNT(m.id) as record_count,
      COALESCE(SUM(m.cost), 0) as total_cost,
      COALESCE(AVG(m.cost), 0) as avg_cost
    FROM maintenance_categories mc
    LEFT JOIN maintenance_records m ON mc.id = m.category_id
    LEFT JOIN cars c ON m.car_id = c.id
    WHERE c.organization_id = ?
  `;
  
  const categoryParams = [organizationId];
  
  // Add category filter for category rankings if provided
  if (categoryId) {
    categorySql += ' AND (mc.id = ? OR mc.id IS NULL)';
    categoryParams.push(categoryId);
  }
  
  if (startDate) {
    categorySql += ' AND (m.created_at >= ? OR m.created_at IS NULL)';
    categoryParams.push(startDate);
  }
  
  if (endDate) {
    categorySql += ' AND (m.created_at <= ? OR m.created_at IS NULL)';
    categoryParams.push(endDate);
  }
  
  categorySql += ' GROUP BY mc.id, mc.name ORDER BY total_cost DESC';
  
  const categoryRankings = await query(categorySql, categoryParams);
  
  // Get model cost rankings
  let modelSql = `
    SELECT 
      c.make,
      c.model,
      COUNT(DISTINCT c.id) as car_count,
      COUNT(m.id) as record_count,
      COALESCE(SUM(m.cost), 0) as total_cost,
      COALESCE(AVG(m.cost), 0) as avg_cost_per_record,
      COALESCE(SUM(m.cost) / COUNT(DISTINCT c.id), 0) as avg_cost_per_car
    FROM cars c
    LEFT JOIN maintenance_records m ON c.id = m.car_id
    WHERE c.organization_id = ?
  `;
  
  const modelParams = [organizationId];
  
  // Add category filter for model rankings if provided
  if (categoryId) {
    modelSql += ' AND (m.category_id = ? OR m.id IS NULL)';
    modelParams.push(categoryId);
  }
  
  if (startDate) {
    modelSql += ' AND (m.created_at >= ? OR m.created_at IS NULL)';
    modelParams.push(startDate);
  }
  
  if (endDate) {
    modelSql += ' AND (m.created_at <= ? OR m.created_at IS NULL)';
    modelParams.push(endDate);
  }
  
  modelSql += ' GROUP BY c.make, c.model HAVING record_count > 0 ORDER BY total_cost DESC';
  
  const modelRankings = await query(modelSql, modelParams);
  
  // Calculate totals
  const totalMaintenanceCost = cars.reduce((sum, car) => sum + parseFloat(car.total_cost || 0), 0);
  const recordCount = cars.reduce((sum, car) => sum + car.maintenance_records.length, 0);
  
  // Calculate total car cost (purchase prices of all cars in inventory)
  const totalCarCostQuery = `
    SELECT COALESCE(SUM(purchase_price), 0) as total_car_cost
    FROM cars 
    WHERE organization_id = ? AND status IN ('in_stock', 'pending')
  `;
  const totalCarCostResult = await query(totalCarCostQuery, [organizationId]);
  const totalCarCost = parseFloat(totalCarCostResult[0]?.total_car_cost || 0);
  
  // Calculate total investment (total car cost + total maintenance cost for all cars)
  let totalMaintenanceAllCarsQuery = `
    SELECT COALESCE(SUM(m.cost), 0) as total_maintenance_all_cars
    FROM maintenance_records m
    JOIN cars c ON m.car_id = c.id
    WHERE c.organization_id = ?
  `;
  
  const totalMaintenanceAllCarsParams = [organizationId];
  
  // Add category filter for total maintenance calculation if provided
  if (categoryId) {
    totalMaintenanceAllCarsQuery += ' AND m.category_id = ?';
    totalMaintenanceAllCarsParams.push(categoryId);
  }
  
  const totalMaintenanceAllCarsResult = await query(totalMaintenanceAllCarsQuery, totalMaintenanceAllCarsParams);
  const totalMaintenanceAllCars = parseFloat(totalMaintenanceAllCarsResult[0]?.total_maintenance_all_cars || 0);
  const totalInvestment = totalCarCost + totalMaintenanceAllCars;
  
  return {
    cars,
    total_cost: totalMaintenanceCost,
    record_count: recordCount,
    total_car_cost: totalCarCost,
    total_investment: totalInvestment,
    category_rankings: categoryRankings,
    model_rankings: modelRankings
  };
};

// Get profit report by date range
const getProfitReport = async (organizationId, startDate, endDate) => {
  // Get sales summary
  const salesSummaryQuery = `
    SELECT 
      COUNT(*) as cars_sold,
      COALESCE(SUM(c.sale_price), 0) as total_sales,
      COALESCE(SUM(c.purchase_price), 0) as total_cost,
      COALESCE(SUM(c.sale_price - c.purchase_price), 0) as gross_profit
    FROM cars c
    WHERE c.organization_id = ? AND c.status = 'sold'
    ${startDate ? 'AND c.sale_date >= ?' : ''}
    ${endDate ? 'AND c.sale_date <= ?' : ''}
  `;
  
  const salesParams = [organizationId];
  if (startDate) salesParams.push(startDate);
  if (endDate) salesParams.push(endDate);
  
  // Get maintenance costs
  const maintenanceCostQuery = `
    SELECT 
      COALESCE(SUM(m.cost), 0) as total_maintenance_cost
    FROM maintenance_records m
    JOIN cars c ON m.car_id = c.id
    WHERE c.organization_id = ? AND c.status = 'sold'
    ${startDate ? 'AND c.sale_date >= ?' : ''}
    ${endDate ? 'AND c.sale_date <= ?' : ''}
  `;
  
  const maintenanceParams = [organizationId];
  if (startDate) maintenanceParams.push(startDate);
  if (endDate) maintenanceParams.push(endDate);
  
  // Monthly breakdown
  const monthlyBreakdownQuery = `
    SELECT 
      DATE_FORMAT(c.sale_date, '%Y-%m') as month,
      COUNT(*) as cars_sold,
      COALESCE(SUM(c.sale_price), 0) as total_sales,
      COALESCE(SUM(c.purchase_price), 0) as total_cost,
      COALESCE(SUM(c.sale_price - c.purchase_price), 0) as gross_profit
    FROM cars c
    WHERE c.organization_id = ? AND c.status = 'sold'
    ${startDate ? 'AND c.sale_date >= ?' : ''}
    ${endDate ? 'AND c.sale_date <= ?' : ''}
    GROUP BY DATE_FORMAT(c.sale_date, '%Y-%m')
    ORDER BY month
  `;
  
  const monthlyParams = [organizationId];
  if (startDate) monthlyParams.push(startDate);
  if (endDate) monthlyParams.push(endDate);
  
  // Make breakdown
  const makeBreakdownQuery = `
    SELECT 
      c.make,
      COUNT(*) as cars_sold,
      COALESCE(SUM(c.sale_price), 0) as total_sales,
      COALESCE(SUM(c.purchase_price), 0) as total_cost,
      COALESCE(SUM(c.sale_price - c.purchase_price), 0) as gross_profit,
      COALESCE(AVG(c.sale_price - c.purchase_price), 0) as avg_profit_per_car
    FROM cars c
    WHERE c.organization_id = ? AND c.status = 'sold'
    ${startDate ? 'AND c.sale_date >= ?' : ''}
    ${endDate ? 'AND c.sale_date <= ?' : ''}
    GROUP BY c.make
    ORDER BY gross_profit DESC
  `;
  
  const makeParams = [organizationId];
  if (startDate) makeParams.push(startDate);
  if (endDate) makeParams.push(endDate);
  
  try {
    const salesSummaryResult = await query(salesSummaryQuery, salesParams);
    const maintenanceCostResult = await query(maintenanceCostQuery, maintenanceParams);
    const monthlyBreakdown = await query(monthlyBreakdownQuery, monthlyParams);
    const makeBreakdown = await query(makeBreakdownQuery, makeParams);
    
    const salesSummary = salesSummaryResult[0] || { cars_sold: 0, total_sales: 0, total_cost: 0, gross_profit: 0 };
    const maintenanceCost = maintenanceCostResult[0] || { total_maintenance_cost: 0 };
    
    return {
      summary: {
        cars_sold: salesSummary.cars_sold || 0,
        total_sales: salesSummary.total_sales || 0,
        total_cost: salesSummary.total_cost || 0,
        gross_profit: salesSummary.gross_profit || 0,
        total_maintenance_cost: maintenanceCost.total_maintenance_cost || 0,
        net_profit: (salesSummary.gross_profit || 0) - (maintenanceCost.total_maintenance_cost || 0)
      },
      monthly: monthlyBreakdown || [],
      by_make: makeBreakdown || []
    };
  } catch (error) {
    console.error('Error in getProfitReport:', error);
    throw error;
  }
};

// Get dashboard summary
const getDashboardSummary = async (organizationId) => {
  const sql = `
    SELECT 
      -- Inventory counts
      COUNT(*) as total_cars,
      SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END) as in_stock,
      SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      
      -- Current inventory value (only in_stock cars)
      COALESCE(SUM(CASE WHEN status = 'in_stock' THEN purchase_price ELSE 0 END), 0) as current_inventory_value,
      
      -- Cars sold this month
      SUM(CASE 
        WHEN status = 'sold' 
        AND sale_date IS NOT NULL 
        AND YEAR(sale_date) = YEAR(CURDATE()) 
        AND MONTH(sale_date) = MONTH(CURDATE()) 
        THEN 1 
        ELSE 0 
      END) as cars_sold_this_month,
      
      -- Revenue this month (from sold cars)
      COALESCE(SUM(CASE 
        WHEN status = 'sold' 
        AND sale_date IS NOT NULL 
        AND YEAR(sale_date) = YEAR(CURDATE()) 
        AND MONTH(sale_date) = MONTH(CURDATE()) 
        THEN sale_price 
        ELSE 0 
      END), 0) as revenue_this_month,
      
      -- Cost this month (purchase price of cars sold this month)
      COALESCE(SUM(CASE 
        WHEN status = 'sold' 
        AND sale_date IS NOT NULL 
        AND YEAR(sale_date) = YEAR(CURDATE()) 
        AND MONTH(sale_date) = MONTH(CURDATE()) 
        THEN purchase_price 
        ELSE 0 
      END), 0) as cost_this_month
      
    FROM cars 
    WHERE organization_id = ?
  `;
  
  const rows = await query(sql, [organizationId]);
  const result = rows[0];
  
  // Get maintenance costs for cars sold this month
  const maintenanceQuery = `
    SELECT COALESCE(SUM(m.cost), 0) as maintenance_cost_this_month
    FROM maintenance_records m
    JOIN cars c ON m.car_id = c.id
    WHERE c.organization_id = ?
    AND c.status = 'sold'
    AND c.sale_date IS NOT NULL
    AND YEAR(c.sale_date) = YEAR(CURDATE())
    AND MONTH(c.sale_date) = MONTH(CURDATE())
  `;
  
  const maintenanceRows = await query(maintenanceQuery, [organizationId]);
  const maintenanceCost = maintenanceRows[0].maintenance_cost_this_month;
  
  // Calculate profit this month
  const profitThisMonth = result.revenue_this_month - result.cost_this_month - maintenanceCost;
  
  return {
    total_cars: result.total_cars || 0,
    in_stock: result.in_stock || 0,
    sold: result.sold || 0,
    pending: result.pending || 0,
    current_inventory_value: parseFloat(result.current_inventory_value) || 0,
    cars_sold_this_month: result.cars_sold_this_month || 0,
    profit_this_month: profitThisMonth || 0
  };
};

// Get top sold models
const getTopSoldModels = async (organizationId) => {
  const sql = `
    SELECT 
      c.make,
      c.model,
      COUNT(c.id) as units_sold,
      COALESCE(SUM(c.sale_price), 0) as total_revenue,
      COALESCE(AVG(c.sale_price), 0) as avg_sale_price
    FROM cars c
    WHERE c.organization_id = ? AND c.status = 'sold'
    GROUP BY c.make, c.model
    ORDER BY units_sold DESC, total_revenue DESC
    LIMIT 10
  `;
  
  return query(sql, [organizationId]);
};

module.exports = {
  getInventoryReport,
  getSalesReport,
  getMaintenanceReport,
  getProfitReport,
  getDashboardSummary,
  getTopSoldModels
}; 