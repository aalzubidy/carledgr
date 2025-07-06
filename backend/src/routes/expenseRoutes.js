const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticateJWT } = require('../middleware/auth');
const { requireExpenseAccess, requireSettings, requireOrganization } = require('../middleware/roleAuth');

// Apply authentication and organization middleware to all routes
router.use(authenticateJWT);
router.use(requireOrganization);

// Expense Categories Routes (Settings - Owners only for management, all roles can view)
router.get('/categories', expenseController.getExpenseCategories);
router.post('/categories', requireSettings, expenseController.createExpenseCategory);
router.put('/categories/:id', requireSettings, expenseController.updateExpenseCategory);
router.delete('/categories/:id', requireSettings, expenseController.deleteExpenseCategory);
router.post('/categories/:id/move', requireSettings, expenseController.moveExpensesToCategory);

// Expenses Routes (Owners and Managers only)
router.get('/', requireExpenseAccess, expenseController.getExpenses);
router.get('/summary', requireExpenseAccess, expenseController.getExpenseSummary);
router.get('/:id', requireExpenseAccess, expenseController.getExpenseById);
router.post('/', requireExpenseAccess, expenseController.createExpense);
router.put('/:id', requireExpenseAccess, expenseController.updateExpense);
router.delete('/:id', requireExpenseAccess, expenseController.deleteExpense);

module.exports = router; 