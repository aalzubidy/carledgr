const expenseQueries = require('../db/queries/expenseQueries');
const logger = require('../utils/logger');

// Expense Categories Controllers
const getExpenseCategories = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const categories = await expenseQueries.getExpenseCategories(organizationId);
    res.json(categories);
  } catch (error) {
    logger.error(`Error fetching expense categories: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch expense categories' });
  }
};

const createExpenseCategory = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { category_name, is_recurring } = req.body;

    if (!category_name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await expenseQueries.createExpenseCategory(
      organizationId,
      category_name,
      is_recurring || false
    );

    res.status(201).json(category);
  } catch (error) {
    logger.error(`Error creating expense category: ${error.message}`);
    res.status(500).json({ error: 'Failed to create expense category' });
  }
};

const updateExpenseCategory = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { id } = req.params;
    const { category_name, is_recurring } = req.body;

    if (!category_name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const updated = await expenseQueries.updateExpenseCategory(
      id,
      organizationId,
      category_name,
      is_recurring || false
    );

    if (!updated) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    logger.error(`Error updating expense category: ${error.message}`);
    res.status(500).json({ error: 'Failed to update expense category' });
  }
};

const deleteExpenseCategory = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { id } = req.params;
    const { action, uncategorized_category_id } = req.body;

    // Check if category has expenses
    const expenseCount = await expenseQueries.getExpensesByCategoryId(id, organizationId);
    
    if (expenseCount > 0) {
      if (action === 'move' && uncategorized_category_id) {
        // Move expenses to uncategorized category
        await expenseQueries.moveExpensesToUncategorized(id, organizationId, uncategorized_category_id);
      } else if (action === 'delete') {
        // Delete all expenses in this category
        await expenseQueries.deleteExpensesByCategory(id, organizationId);
      } else {
        return res.status(400).json({ 
          error: 'Category has expenses. Please specify action: move or delete',
          expense_count: expenseCount
        });
      }
    }

    const deleted = await expenseQueries.deleteExpenseCategory(id, organizationId);

    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting expense category: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete expense category' });
  }
};

// Expenses Controllers
const getExpenses = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const filters = {
      categoryId: req.query.category_id,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
      isRecurring: req.query.is_recurring !== undefined ? req.query.is_recurring === 'true' : undefined,
      limit: req.query.limit,
      offset: req.query.offset
    };

    const expenses = await expenseQueries.getExpenses(organizationId, filters);
    res.json(expenses);
  } catch (error) {
    logger.error(`Error fetching expenses: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

const getExpenseById = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { id } = req.params;

    const expense = await expenseQueries.getExpenseById(id, organizationId);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    logger.error(`Error fetching expense: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
};

const createExpense = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const userId = req.user.id;
    const { category_id, amount, description, expense_date, is_recurring, recurring_frequency } = req.body;

    // Validation
    if (!category_id || !amount || !expense_date) {
      return res.status(400).json({ error: 'Category, amount, and expense date are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (is_recurring && !recurring_frequency) {
      return res.status(400).json({ error: 'Recurring frequency is required for recurring expenses' });
    }

    const expenseData = {
      organization_id: organizationId,
      category_id,
      amount: parseFloat(amount),
      description: description || '',
      expense_date,
      is_recurring: is_recurring || false,
      recurring_frequency: is_recurring ? recurring_frequency : null,
      created_by_user_id: userId
    };

    const expense = await expenseQueries.createExpense(expenseData);
    res.status(201).json(expense);
  } catch (error) {
    logger.error(`Error creating expense: ${error.message}`);
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

const updateExpense = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { id } = req.params;
    const { category_id, amount, description, expense_date, is_recurring, recurring_frequency } = req.body;

    // Validation
    if (!category_id || !amount || !expense_date) {
      return res.status(400).json({ error: 'Category, amount, and expense date are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (is_recurring && !recurring_frequency) {
      return res.status(400).json({ error: 'Recurring frequency is required for recurring expenses' });
    }

    const expenseData = {
      category_id,
      amount: parseFloat(amount),
      description: description || '',
      expense_date,
      is_recurring: is_recurring || false,
      recurring_frequency: is_recurring ? recurring_frequency : null
    };

    const updated = await expenseQueries.updateExpense(id, organizationId, expenseData);

    if (!updated) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense updated successfully' });
  } catch (error) {
    logger.error(`Error updating expense: ${error.message}`);
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { id } = req.params;

    // Clean up attachments first
    try {
      const attachmentQueries = require('../db/queries/attachmentQueries');
      const storageService = require('../utils/storageService');
      
      const storageKeys = await attachmentQueries.deleteExpenseAttachmentsByExpenseId(id);
      
      // Delete files from storage (don't fail if storage deletion fails)
      for (const storageKey of storageKeys) {
        try {
          await storageService.deleteFile(storageKey);
        } catch (storageError) {
          logger.error(`Storage deletion failed for ${storageKey}: ${storageError.message}`);
        }
      }
    } catch (attachmentError) {
      logger.error(`Attachment cleanup failed for expense ${id}: ${attachmentError.message}`);
      // Continue with expense deletion even if attachment cleanup fails
    }

    const deleted = await expenseQueries.deleteExpense(id, organizationId);

    if (!deleted) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting expense: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};

const getExpenseSummary = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { start_date, end_date, category_id } = req.query;

    // Default to current month if no dates provided
    const startDate = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = end_date || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    const summary = await expenseQueries.getExpenseSummary(organizationId, startDate, endDate, category_id);
    const monthlyRecurring = await expenseQueries.getMonthlyRecurringTotal(organizationId);
    const categoriesBreakdown = await expenseQueries.getCategoriesBreakdown(organizationId, startDate, endDate, category_id);
    const monthlyBreakdown = await expenseQueries.getMonthlyBreakdown(organizationId, startDate, endDate, category_id);

    res.json({
      ...summary,
      monthly_recurring_total: monthlyRecurring,
      categories_breakdown: categoriesBreakdown,
      monthly_breakdown: monthlyBreakdown,
      period: { start_date: startDate, end_date: endDate }
    });
  } catch (error) {
    logger.error(`Error fetching expense summary: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch expense summary' });
  }
};

const moveExpensesToCategory = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { id } = req.params;
    const { target_category_id } = req.body;

    if (!target_category_id) {
      return res.status(400).json({ error: 'Target category ID is required' });
    }

    // Verify both categories exist and belong to the organization
    const sourceCategory = await expenseQueries.getExpenseCategoryById(id, organizationId);
    const targetCategory = await expenseQueries.getExpenseCategoryById(target_category_id, organizationId);

    if (!sourceCategory) {
      return res.status(404).json({ error: 'Source category not found' });
    }

    if (!targetCategory) {
      return res.status(404).json({ error: 'Target category not found' });
    }

    // Move expenses to the target category
    await expenseQueries.moveExpensesToUncategorized(id, organizationId, target_category_id);

    res.json({ message: 'Expenses moved successfully' });
  } catch (error) {
    logger.error(`Error moving expenses to category: ${error.message}`);
    res.status(500).json({ error: 'Failed to move expenses' });
  }
};

module.exports = {
  // Category controllers
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  moveExpensesToCategory,
  
  // Expense controllers
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary
}; 