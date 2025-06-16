const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticateJWT } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Expense Categories Routes
router.get('/categories', expenseController.getExpenseCategories);
router.post('/categories', expenseController.createExpenseCategory);
router.put('/categories/:id', expenseController.updateExpenseCategory);
router.delete('/categories/:id', expenseController.deleteExpenseCategory);

// Expenses Routes
router.get('/', expenseController.getExpenses);
router.get('/summary', expenseController.getExpenseSummary);
router.get('/:id', expenseController.getExpenseById);
router.post('/', expenseController.createExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router; 