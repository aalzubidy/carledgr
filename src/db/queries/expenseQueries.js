const { query } = require('../connection');
const { v4: uuidv4 } = require('uuid');

// Expense Categories Queries
const getExpenseCategories = async (organizationId) => {
  const sql = `
    SELECT 
      c.id, 
      c.category_name, 
      c.is_recurring, 
      c.created_date,
      COUNT(e.id) as expense_count
    FROM organization_expense_categories c
    LEFT JOIN organization_expenses e ON c.id = e.category_id
    WHERE c.organization_id = ?
    GROUP BY c.id, c.category_name, c.is_recurring, c.created_date
    ORDER BY c.category_name ASC
  `;
  return await query(sql, [organizationId]);
};

const getExpenseCategoryById = async (id, organizationId) => {
  const sql = `
    SELECT id, category_name, is_recurring, created_date
    FROM organization_expense_categories 
    WHERE id = ? AND organization_id = ?
  `;
  const results = await query(sql, [id, organizationId]);
  return results[0];
};

const createExpenseCategory = async (organizationId, categoryName, isRecurring) => {
  const id = uuidv4();
  const sql = `
    INSERT INTO organization_expense_categories (id, organization_id, category_name, is_recurring)
    VALUES (?, ?, ?, ?)
  `;
  await query(sql, [id, organizationId, categoryName, isRecurring]);
  return { id, organization_id: organizationId, category_name: categoryName, is_recurring: isRecurring };
};

const updateExpenseCategory = async (categoryId, organizationId, categoryName, isRecurring) => {
  const sql = `
    UPDATE organization_expense_categories 
    SET category_name = ?, is_recurring = ?
    WHERE id = ? AND organization_id = ?
  `;
  const result = await query(sql, [categoryName, isRecurring, categoryId, organizationId]);
  return result.affectedRows > 0;
};

const deleteExpenseCategory = async (categoryId, organizationId) => {
  const sql = `
    DELETE FROM organization_expense_categories 
    WHERE id = ? AND organization_id = ?
  `;
  const result = await query(sql, [categoryId, organizationId]);
  return result.affectedRows > 0;
};

const getExpensesByCategoryId = async (categoryId, organizationId) => {
  const sql = `
    SELECT COUNT(*) as count
    FROM organization_expenses 
    WHERE category_id = ? AND organization_id = ?
  `;
  const result = await query(sql, [categoryId, organizationId]);
  return result[0].count;
};

const moveExpensesToUncategorized = async (categoryId, organizationId, uncategorizedCategoryId) => {
  const sql = `
    UPDATE organization_expenses 
    SET category_id = ?
    WHERE category_id = ? AND organization_id = ?
  `;
  const result = await query(sql, [uncategorizedCategoryId, categoryId, organizationId]);
  return result.affectedRows;
};

const deleteExpensesByCategory = async (categoryId, organizationId) => {
  const sql = `
    DELETE FROM organization_expenses 
    WHERE category_id = ? AND organization_id = ?
  `;
  const result = await query(sql, [categoryId, organizationId]);
  return result.affectedRows;
};

// Expenses Queries
const getExpenses = async (organizationId, filters = {}) => {
  let sql = `
    SELECT 
      e.id, e.category_id, e.amount, e.description, e.expense_date, e.is_recurring, e.recurring_frequency,
      e.created_at, e.updated_at,
      c.category_name,
      u.first_name, u.last_name
    FROM organization_expenses e
    JOIN organization_expense_categories c ON e.category_id = c.id
    JOIN users u ON e.created_by_user_id = u.id
    WHERE e.organization_id = ?
  `;
  
  const params = [organizationId];
  
  if (filters.categoryId) {
    sql += ' AND e.category_id = ?';
    params.push(filters.categoryId);
  }
  
  if (filters.startDate) {
    sql += ' AND e.expense_date >= ?';
    params.push(filters.startDate);
  }
  
  if (filters.endDate) {
    sql += ' AND e.expense_date <= ?';
    params.push(filters.endDate);
  }
  
  if (filters.isRecurring !== undefined) {
    sql += ' AND e.is_recurring = ?';
    params.push(filters.isRecurring);
  }
  
  sql += ' ORDER BY e.expense_date DESC, e.created_at DESC';
  
  if (filters.limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(filters.limit));
  }
  
  if (filters.offset) {
    sql += ' OFFSET ?';
    params.push(parseInt(filters.offset));
  }
  
  return await query(sql, params);
};

const getExpenseById = async (expenseId, organizationId) => {
  const sql = `
    SELECT 
      e.id, e.category_id, e.amount, e.description, e.expense_date, 
      e.is_recurring, e.recurring_frequency, e.created_by_user_id,
      c.category_name
    FROM organization_expenses e
    JOIN organization_expense_categories c ON e.category_id = c.id
    WHERE e.id = ? AND e.organization_id = ?
  `;
  const result = await query(sql, [expenseId, organizationId]);
  return result[0];
};

const createExpense = async (expenseData) => {
  const id = uuidv4();
  const sql = `
    INSERT INTO organization_expenses 
    (id, organization_id, category_id, amount, description, expense_date, is_recurring, recurring_frequency, created_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  await query(sql, [
    id,
    expenseData.organization_id,
    expenseData.category_id,
    expenseData.amount,
    expenseData.description,
    expenseData.expense_date,
    expenseData.is_recurring,
    expenseData.recurring_frequency,
    expenseData.created_by_user_id
  ]);
  
  return { id, ...expenseData };
};

const updateExpense = async (expenseId, organizationId, expenseData) => {
  const sql = `
    UPDATE organization_expenses 
    SET category_id = ?, amount = ?, description = ?, expense_date = ?, 
        is_recurring = ?, recurring_frequency = ?
    WHERE id = ? AND organization_id = ?
  `;
  
  const result = await query(sql, [
    expenseData.category_id,
    expenseData.amount,
    expenseData.description,
    expenseData.expense_date,
    expenseData.is_recurring,
    expenseData.recurring_frequency,
    expenseId,
    organizationId
  ]);
  
  return result.affectedRows > 0;
};

const deleteExpense = async (expenseId, organizationId) => {
  const sql = `
    DELETE FROM organization_expenses 
    WHERE id = ? AND organization_id = ?
  `;
  const result = await query(sql, [expenseId, organizationId]);
  return result.affectedRows > 0;
};

const getExpenseSummary = async (organizationId, startDate, endDate, categoryId = null) => {
  let sql = `
    SELECT 
      SUM(amount) as total_amount,
      COUNT(*) as total_count,
      SUM(CASE WHEN is_recurring = 1 THEN amount ELSE 0 END) as recurring_amount,
      COUNT(CASE WHEN is_recurring = 1 THEN 1 END) as recurring_count
    FROM organization_expenses 
    WHERE organization_id = ? 
    AND expense_date BETWEEN ? AND ?
  `;
  
  const params = [organizationId, startDate, endDate];
  
  if (categoryId) {
    sql += ' AND category_id = ?';
    params.push(categoryId);
  }
  
  const result = await query(sql, params);
  return result[0];
};

const getMonthlyRecurringTotal = async (organizationId) => {
  const sql = `
    SELECT 
      SUM(CASE 
        WHEN recurring_frequency = 'monthly' THEN amount
        WHEN recurring_frequency = 'quarterly' THEN amount / 3
        WHEN recurring_frequency = 'annually' THEN amount / 12
        ELSE 0
      END) as monthly_recurring_total
    FROM organization_expenses 
    WHERE organization_id = ? AND is_recurring = 1
  `;
  const result = await query(sql, [organizationId]);
  return result[0].monthly_recurring_total || 0;
};

const getCategoriesBreakdown = async (organizationId, startDate, endDate, categoryId = null) => {
  let sql = `
    SELECT 
      c.id as category_id,
      c.category_name,
      SUM(e.amount) as total_amount,
      COUNT(e.id) as expense_count
    FROM organization_expense_categories c
    LEFT JOIN organization_expenses e ON c.id = e.category_id 
      AND e.organization_id = ? 
      AND e.expense_date BETWEEN ? AND ?
  `;
  
  const params = [organizationId, startDate, endDate];
  
  if (categoryId) {
    sql += ' AND c.id = ?';
    params.push(categoryId);
  }
  
  sql += `
    WHERE c.organization_id = ?
    GROUP BY c.id, c.category_name
    HAVING total_amount > 0
    ORDER BY total_amount DESC
  `;
  
  params.push(organizationId);
  
  return await query(sql, params);
};

const getMonthlyBreakdown = async (organizationId, startDate, endDate, categoryId = null) => {
  let sql = `
    SELECT 
      DATE_FORMAT(e.expense_date, '%Y-%m') as month_year,
      SUM(e.amount) as total_amount,
      COUNT(e.id) as expense_count
    FROM organization_expenses e
    WHERE e.organization_id = ?
  `;
  
  const params = [organizationId];
  
  if (startDate && endDate) {
    sql += ' AND e.expense_date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }
  
  if (categoryId) {
    sql += ' AND e.category_id = ?';
    params.push(categoryId);
  }
  
  sql += `
    GROUP BY DATE_FORMAT(e.expense_date, '%Y-%m')
    ORDER BY month_year DESC
    LIMIT 12
  `;
  
  return await query(sql, params);
};

module.exports = {
  // Category queries
  getExpenseCategories,
  getExpenseCategoryById,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  getExpensesByCategoryId,
  moveExpensesToUncategorized,
  deleteExpensesByCategory,
  
  // Expense queries
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
  getMonthlyRecurringTotal,
  getCategoriesBreakdown,
  getMonthlyBreakdown
}; 