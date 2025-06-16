import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout.jsx'
import { t } from '../utils/i18n.js'
import { api } from '../utils/api.js'
import { showSuccess, showError } from '../utils/snackbar.js'

function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    recurring_frequency: 'monthly'
  })
  const [filters, setFilters] = useState({
    category_id: '',
    start_date: '',
    end_date: '',
    is_recurring: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadExpenses()
    loadSummary()
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadCategories(),
        loadExpenses(),
        loadSummary()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
      showError(t('messages.errorOccurred'))
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await api.getExpenseCategories()
      setCategories(response)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadExpenses = async () => {
    try {
      const response = await api.getExpenses(filters)
      setExpenses(response)
    } catch (error) {
      console.error('Error loading expenses:', error)
    }
  }

  const loadSummary = async () => {
    try {
      const params = {}
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date
      
      const response = await api.getExpenseSummary(params)
      setSummary(response)
    } catch (error) {
      console.error('Error loading summary:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.category_id || !formData.amount || !formData.expense_date) {
      showError(t('expenses.category') + ', ' + t('expenses.amount') + ', ' + t('expenses.date') + ' ' + t('common.required'))
      return
    }

    if (parseFloat(formData.amount) <= 0) {
      showError(t('expenses.amount') + ' must be greater than 0')
      return
    }

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount)
      }

      if (editingExpense) {
        await api.updateExpense(editingExpense.id, submitData)
        showSuccess(t('messages.expenseUpdated'))
      } else {
        await api.createExpense(submitData)
        showSuccess(t('messages.expenseAdded'))
      }
      
      resetForm()
      loadExpenses()
      loadSummary()
    } catch (error) {
      console.error('Error saving expense:', error)
      showError(t('messages.errorOccurred'))
    }
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setFormData({
      category_id: expense.category_id,
      amount: expense.amount.toString(),
      description: expense.description || '',
      expense_date: expense.expense_date,
      is_recurring: expense.is_recurring,
      recurring_frequency: expense.recurring_frequency || 'monthly'
    })
    setShowAddForm(true)
  }

  const handleDelete = async (expenseId) => {
    if (!confirm(t('messages.confirmDelete'))) {
      return
    }

    try {
      await api.deleteExpense(expenseId)
      showSuccess(t('messages.expenseDeleted'))
      loadExpenses()
      loadSummary()
    } catch (error) {
      console.error('Error deleting expense:', error)
      showError(t('messages.errorOccurred'))
    }
  }

  const resetForm = () => {
    setFormData({
      category_id: '',
      amount: '',
      description: '',
      expense_date: new Date().toISOString().split('T')[0],
      is_recurring: false,
      recurring_frequency: 'monthly'
    })
    setEditingExpense(null)
    setShowAddForm(false)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      category_id: '',
      start_date: '',
      end_date: '',
      is_recurring: ''
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getFrequencyText = (frequency) => {
    switch (frequency) {
      case 'monthly': return t('expenses.monthly')
      case 'quarterly': return t('expenses.quarterly')
      case 'annually': return t('expenses.annually')
      default: return ''
    }
  }

  if (loading) {
    return (
      <Layout activeRoute="expenses">
        <div className="loading">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout activeRoute="expenses">
      <div className="page-container">
        <div className="page-header">
          <h1>{t('expenses.title')}</h1>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            {t('expenses.addExpense')}
          </button>
        </div>

        {/* Summary Section */}
        <div className="summary-cards">
          <div className="summary-card">
            <h3>{t('expenses.totalThisMonth')}</h3>
            <div className="summary-value">
              {formatCurrency(summary.total_amount || 0)}
            </div>
            <div className="summary-detail">
              {summary.total_count || 0} expenses
            </div>
          </div>
          <div className="summary-card">
            <h3>{t('expenses.recurringMonthly')}</h3>
            <div className="summary-value">
              {formatCurrency(summary.monthly_recurring_total || 0)}
            </div>
            <div className="summary-detail">
              {summary.recurring_count || 0} recurring
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="form-container">
            <form onSubmit={handleSubmit} className="expense-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category_id">{t('expenses.category')}</label>
                  <select
                    id="category_id"
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    required
                  >
                    <option value="">{t('common.select')}</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="amount">{t('expenses.amount')}</label>
                  <input
                    type="number"
                    id="amount"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="expense_date">{t('expenses.date')}</label>
                  <input
                    type="date"
                    id="expense_date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">{t('expenses.description')}</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_recurring}
                      onChange={(e) => setFormData({...formData, is_recurring: e.target.checked})}
                    />
                    {t('expenses.recurring')}
                  </label>
                </div>

                {formData.is_recurring && (
                  <div className="form-group">
                    <label htmlFor="recurring_frequency">{t('expenses.frequency')}</label>
                    <select
                      id="recurring_frequency"
                      value={formData.recurring_frequency}
                      onChange={(e) => setFormData({...formData, recurring_frequency: e.target.value})}
                    >
                      <option value="monthly">{t('expenses.monthly')}</option>
                      <option value="quarterly">{t('expenses.quarterly')}</option>
                      <option value="annually">{t('expenses.annually')}</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingExpense ? t('common.save') : t('common.add')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="filters-container">
          <div className="filters-row">
            <div className="filter-group">
              <label>{t('expenses.category')}</label>
              <select
                value={filters.category_id}
                onChange={(e) => handleFilterChange('category_id', e.target.value)}
              >
                <option value="">{t('expenses.allCategories')}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>{t('expenses.startDate')}</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>{t('expenses.endDate')}</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>{t('expenses.type')}</label>
              <select
                value={filters.is_recurring}
                onChange={(e) => handleFilterChange('is_recurring', e.target.value)}
              >
                <option value="">{t('common.all')}</option>
                <option value="true">{t('expenses.recurringOnly')}</option>
                <option value="false">{t('expenses.oneTimeOnly')}</option>
              </select>
            </div>

            <div className="filter-actions">
              <button className="btn btn-secondary" onClick={clearFilters}>
                {t('common.clear')}
              </button>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="expenses-list">
          {expenses.length === 0 ? (
            <div className="empty-state">
              <p>{t('expenses.noExpenses')}</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('expenses.date')}</th>
                    <th>{t('expenses.category')}</th>
                    <th>{t('expenses.description')}</th>
                    <th>{t('expenses.amount')}</th>
                    <th>{t('expenses.type')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense.id}>
                      <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
                      <td>{expense.category_name}</td>
                      <td>{expense.description || '-'}</td>
                      <td className="amount">{formatCurrency(expense.amount)}</td>
                      <td>
                        <span className={`status ${expense.is_recurring ? 'recurring' : 'one-time'}`}>
                          {expense.is_recurring 
                            ? `${t('expenses.recurring')} (${getFrequencyText(expense.recurring_frequency)})`
                            : t('expenses.oneTime')
                          }
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleEdit(expense)}
                          >
                            {t('common.edit')}
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(expense.id)}
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default ExpensesPage 