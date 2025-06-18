import React, { useState, useEffect } from 'react'
import Layout, { Loading, EmptyState } from '../components/Layout.jsx'
import { t } from '../utils/i18n.js'
import { api } from '../utils/api.js'
import { showSuccess, showError } from '../utils/snackbar.js'
import { canAccessExpenses, getPermissionErrorMessage } from '../utils/permissions.js'

function ExpensesPage() {
  // Check permissions first
  if (!canAccessExpenses()) {
    return (
      <Layout activeRoute="expenses">
        <div className="page-container">
          <div className="page-header">
            <h1>{t('expenses.title')}</h1>
          </div>
          <div className="alert alert-warning">
            <h3>{t('common.accessDenied')}</h3>
            <p>{getPermissionErrorMessage('expenses')}</p>
          </div>
        </div>
      </Layout>
    )
  }

  const [expenses, setExpenses] = useState([])
  const [filteredExpenses, setFilteredExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  })
  const [filters, setFilters] = useState({
    category_id: '',
    start_date: '',
    end_date: ''
  })
  const [summary, setSummary] = useState({
    total_amount: 0,
    total_count: 0,
    categories_breakdown: [],
    monthly_breakdown: []
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadExpenses()
    loadSummary()
  }, [filters])

  useEffect(() => {
    // Filter and search expenses when search term changes
    let filtered = expenses

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = expenses.filter(expense =>
        expense.category_name.toLowerCase().includes(term) ||
        (expense.description && expense.description.toLowerCase().includes(term)) ||
        expense.amount.toString().includes(term)
      )
    }

    setFilteredExpenses(filtered)
  }, [searchTerm, expenses])

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
      if (filters.category_id) params.category_id = filters.category_id

      const response = await api.getExpenseSummary(params)
      setSummary(response)
    } catch (error) {
      console.error('Error loading summary:', error)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSort = (column) => {
    let newDirection = 'asc'
    if (sortColumn === column && sortDirection === 'asc') {
      newDirection = 'desc'
    }

    setSortColumn(column)
    setSortDirection(newDirection)

    const sorted = [...filteredExpenses].sort((a, b) => {
      let aVal = a[column]
      let bVal = b[column]

      // Handle null/undefined values
      if (aVal == null) aVal = ''
      if (bVal == null) bVal = ''

      // Special handling for different data types
      if (column === 'amount') {
        aVal = parseFloat(aVal) || 0
        bVal = parseFloat(bVal) || 0
      } else if (column === 'expense_date') {
        aVal = new Date(aVal)
        bVal = new Date(bVal)
      } else {
        // Convert to string for comparison
        aVal = aVal.toString().toLowerCase()
        bVal = bVal.toString().toLowerCase()
      }

      if (newDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }
    })

    setFilteredExpenses(sorted)
  }

  const getSortIcon = (column) => {
    if (sortColumn !== column) return ''
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const handleAddExpense = () => {
    setEditingExpense(null)
    setFormData({
      category_id: '',
      amount: '',
      description: '',
      expense_date: new Date().toISOString().split('T')[0]
    })
    setShowEditModal(true)
  }

  const handleEditExpense = (expense) => {
    setEditingExpense(expense)
    setFormData({
      category_id: expense.category_id ? expense.category_id.toString() : '',
      amount: expense.amount.toString(),
      description: expense.description || '',
      expense_date: expense.expense_date.split('T')[0]
    })
    setShowEditModal(true)
  }

  const handleDeleteExpense = async (expenseId) => {
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

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveExpense = async () => {
    if (!formData.category_id || !formData.amount || !formData.expense_date) {
      showError(t('expenses.category') + ', ' + t('expenses.amount') + ', ' + t('expenses.date') + ' ' + t('common.required'))
      return
    }

    if (parseFloat(formData.amount) <= 0) {
      showError(t('expenses.amount') + ' must be greater than 0')
      return
    }

    const confirmMessage = editingExpense ? t('messages.confirmEdit') : t('messages.confirmAdd')
    if (!confirm(confirmMessage)) {
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

      setShowEditModal(false)
      loadExpenses()
      loadSummary()
    } catch (error) {
      console.error('Error saving expense:', error)
      showError(t('messages.errorOccurred'))
    }
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
      end_date: ''
    })
  }

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank')
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('expenses.title')} - ${t('reports.printReport')}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
            .summary-item { text-align: center; }
            .summary-value { font-size: 24px; font-weight: bold; color: #e74c3c; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .amount { text-align: right; }
            .monthly-breakdown { margin-top: 30px; }
            .monthly-breakdown h3 { margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${t('expenses.title')}</h1>
            <p>${t('reports.dateRange')}: ${filters.start_date || 'All'} - ${filters.end_date || 'All'}</p>
            ${filters.category_id ? `<p>${t('expenses.category')}: ${categories.find(c => c.id === filters.category_id)?.category_name || ''}</p>` : ''}
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <div class="summary-value">${formatCurrency(summary.total_amount || 0)}</div>
              <div>${t('expenses.totalExpenses')}</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${summary.total_count || 0}</div>
              <div>${t('expenses.expenses')}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>${t('expenses.date')}</th>
                <th>${t('expenses.category')}</th>
                <th>${t('expenses.description')}</th>
                <th>${t('expenses.amount')}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses.map(expense => `
                <tr>
                  <td>${new Date(expense.expense_date).toLocaleDateString()}</td>
                  <td>${expense.category_name}</td>
                  <td>${expense.description || '-'}</td>
                  <td class="amount">${formatCurrency(expense.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${summary.monthly_breakdown && summary.monthly_breakdown.length > 0 ? `
            <div class="monthly-breakdown">
              <h3>${t('expenses.monthlyBreakdown')}</h3>
              <table>
                <thead>
                  <tr>
                    <th>${t('expenses.month')}</th>
                    <th>${t('expenses.amount')}</th>
                    <th>${t('expenses.expenses')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${summary.monthly_breakdown.map(month => `
                    <tr>
                      <td>${month.month_year}</td>
                      <td class="amount">${formatCurrency(month.total_amount)}</td>
                      <td>${month.expense_count}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const renderExpensesTable = () => {
    if (filteredExpenses.length === 0) {
      if (expenses.length === 0) {
        return <EmptyState message={t('expenses.noExpenses')} icon="💰" />
      } else {
        return <EmptyState message={t('cars.noResults')} icon="🔍" />
      }
    }

    return (
      <div className="table-wrapper">
        <table className="data-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => handleSort('expense_date')}>
              {t('expenses.date')} {getSortIcon('expense_date')}
            </th>
            <th className="sortable" onClick={() => handleSort('category_name')}>
              {t('expenses.category')} {getSortIcon('category_name')}
            </th>
            <th className="sortable" onClick={() => handleSort('description')}>
              {t('expenses.description')} {getSortIcon('description')}
            </th>
            <th className="sortable" onClick={() => handleSort('amount')}>
              {t('expenses.amount')} {getSortIcon('amount')}
            </th>
            <th>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.map(expense => (
            <tr key={expense.id}>
              <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
              <td>{expense.category_name}</td>
              <td>{expense.description || '-'}</td>
              <td className="amount">{formatCurrency(expense.amount)}</td>
              <td>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleEditExpense(expense)}
                  style={{ marginRight: '8px' }}
                >
                  {t('common.edit')}
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteExpense(expense.id)}
                >
                  {t('common.delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="5" style={{ textAlign: 'center', fontWeight: 'bold', padding: '12px', backgroundColor: '#f8f9fa', borderTop: '2px solid #dee2e6' }}>
              {t('common.total')}: {filteredExpenses.length} {filteredExpenses.length === 1 ? t('expenses.expense') : t('expenses.expenses')} | {t('expenses.totalExpenses')}: {formatCurrency(filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0))}
            </td>
          </tr>
        </tfoot>
        </table>
      </div>
    )
  }

  const renderEditModal = () => {
    if (!showEditModal) return null

    const isEdit = editingExpense !== null
    const modalTitle = isEdit ? t('expenses.editExpense') : t('expenses.addExpense')

    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>{modalTitle}</h2>
            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category_id">{t('expenses.category')}</label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      appearance: 'menulist'
                    }}
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
                    name="amount"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={handleFormChange}
                    required
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="expense_date">{t('expenses.date')}</label>
                <input
                  type="date"
                  id="expense_date"
                  name="expense_date"
                  value={formData.expense_date}
                  onChange={handleFormChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">{t('expenses.description')}</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Optional description"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSaveExpense}>
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Layout activeRoute="expenses">
        <Loading />
      </Layout>
    )
  }

  return (
    <Layout activeRoute="expenses">
      <div className="page-container">
        <div className="page-header">
          <h1>{t('expenses.title')}</h1>
        </div>

        {/* Filters Section - Reports Style */}
        <div className="report-filters" style={{
          background: 'white',
          padding: '25px',
          borderRadius: '8px',
          marginBottom: '25px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>{t('expenses.filters')}</h2>
                        <button 
              className="btn btn-primary"
              onClick={handlePrintReport}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {t('reports.printReport')}
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            alignItems: 'end'
          }}>
            <div className="filter-group">
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#555'
              }}>
                {t('expenses.category')}
              </label>
              <select
                value={filters.category_id}
                onChange={(e) => handleFilterChange('category_id', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  appearance: 'menulist'
                }}
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
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#555'
              }}>
                {t('expenses.startDate')}
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="filter-group">
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#555'
              }}>
                {t('expenses.endDate')}
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="filter-actions">
              <button
                className="btn btn-secondary"
                onClick={clearFilters}
                style={{ width: '100%', padding: '10px 20px' }}
              >
                {t('common.clear')}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '25px'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
              {t('expenses.totalExpenses')}
            </h3>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e74c3c', marginBottom: '5px' }}>
              {formatCurrency(summary.total_amount || 0)}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {summary.total_count || 0} {t('expenses.expenses')}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
              {t('expenses.categoriesBreakdown')}
            </h3>
            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
              {summary.categories_breakdown && summary.categories_breakdown.length > 0 ? (
                summary.categories_breakdown.map(cat => (
                  <div key={cat.category_id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <span style={{ fontSize: '12px' }}>{cat.category_name}</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                      {formatCurrency(cat.total_amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '12px', color: '#999' }}>{t('common.noData')}</div>
              )}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
              {t('expenses.monthlyBreakdown')}
            </h3>
            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
              {summary.monthly_breakdown && summary.monthly_breakdown.length > 0 ? (
                summary.monthly_breakdown.map(month => (
                  <div key={month.month_year} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <span style={{ fontSize: '12px' }}>{month.month_year}</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                      {formatCurrency(month.total_amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '12px', color: '#999' }}>{t('common.noData')}</div>
              )}
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="table-container">
          <div className="table-header">
            <h2>{t('expenses.title')}</h2>
            <div className="table-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder={t('common.search') + ' ' + t('expenses.expenses').toLowerCase()}
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <button className="btn btn-primary" onClick={handleAddExpense}>
                {t('expenses.addExpense')}
              </button>
            </div>
          </div>
          <div className="table-wrapper">
            {renderExpensesTable()}
          </div>
        </div>

        {renderEditModal()}
      </div>
    </Layout>
  )
}

export default ExpensesPage 