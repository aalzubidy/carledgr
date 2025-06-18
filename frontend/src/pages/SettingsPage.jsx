import React, { useState, useEffect } from 'react'
import Layout, { Loading, EmptyState } from '../components/Layout.jsx'
import MaintenanceCategories from '../components/MaintenanceCategories.jsx'
import { t } from '../utils/i18n.js'
import { api } from '../utils/api.js'
import { showSuccess, showError } from '../utils/snackbar.js'
import { canAccessSettings, getPermissionErrorMessage } from '../utils/permissions.js'

function SettingsPage() {
  const [categories, setCategories] = useState([])
  const [filteredCategories, setFilteredCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Check permissions
  if (!canAccessSettings()) {
    return (
      <Layout activeRoute="settings">
        <div className="page-container">
          <div className="page-header">
            <h1>{t('settings.title')}</h1>
          </div>
          <div className="alert alert-warning">
            <h3>{t('common.accessDenied')}</h3>
            <p>{getPermissionErrorMessage('settings')}</p>
          </div>
        </div>
      </Layout>
    )
  }
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    category_name: '',
    is_recurring: false
  })
  const [deleteData, setDeleteData] = useState({
    category: null,
    action: '',
    uncategorizedCategoryId: ''
  })
  const [moveData, setMoveData] = useState({
    category: null,
    targetCategoryId: ''
  })

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    // Filter categories when search term changes
    const filtered = categories.filter(category => {
      const term = searchTerm.toLowerCase()
      return (
        category.category_name.toLowerCase().includes(term) ||
        (category.is_recurring ? 'recurring' : 'one-time').includes(term)
      )
    })
    setFilteredCategories(filtered)
  }, [searchTerm, categories])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await api.getExpenseCategories()
      setCategories(response)
      setFilteredCategories(response)
    } catch (error) {
      console.error('Error loading categories:', error)
      showError(t('messages.errorOccurred'))
    } finally {
      setLoading(false)
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
    
    const sorted = [...filteredCategories].sort((a, b) => {
      let aVal = a[column]
      let bVal = b[column]
      
      // Handle null/undefined values
      if (aVal == null) aVal = ''
      if (bVal == null) bVal = ''
      
      // Special handling for different data types
      if (column === 'expense_count') {
        aVal = parseInt(aVal) || 0
        bVal = parseInt(bVal) || 0
      } else if (column === 'created_date') {
        aVal = new Date(aVal)
        bVal = new Date(bVal)
      } else if (column === 'is_recurring') {
        aVal = aVal ? 1 : 0
        bVal = bVal ? 1 : 0
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
    
    setFilteredCategories(sorted)
  }

  const getSortIcon = (column) => {
    if (sortColumn !== column) return ''
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const handleAddCategory = () => {
    setEditingCategory(null)
    setFormData({
      category_name: '',
      is_recurring: false
    })
    setShowEditModal(true)
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setFormData({
      category_name: category.category_name,
      is_recurring: category.is_recurring
    })
    setShowEditModal(true)
  }

  const handleDeleteCategory = (category) => {
    setDeleteData({
      category,
      action: '',
      uncategorizedCategoryId: ''
    })
    setShowDeleteModal(true)
  }

  const handleMoveTransactions = (category) => {
    if (category.expense_count === 0) {
      showError(t('settings.categoryEmpty'))
      return
    }
    
    setMoveData({
      category,
      targetCategoryId: ''
    })
    setShowMoveModal(true)
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSaveCategory = async () => {
    if (!formData.category_name.trim()) {
      showError(t('settings.categoryName') + ' ' + t('common.required'))
      return
    }

    const confirmMessage = editingCategory ? t('messages.confirmEdit') : t('messages.confirmAdd')
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      if (editingCategory) {
        await api.updateExpenseCategory(editingCategory.id, formData)
        showSuccess(t('messages.categoryUpdated'))
      } else {
        await api.createExpenseCategory(formData)
        showSuccess(t('messages.categoryAdded'))
      }
      
      setShowEditModal(false)
      loadCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      showError(t('messages.errorOccurred'))
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirm(t('messages.confirmDelete'))) {
      return
    }

    try {
      const payload = {
        action: deleteData.action
      }
      
      if (deleteData.action === 'move') {
        payload.uncategorized_category_id = deleteData.uncategorizedCategoryId
      }

      await api.deleteExpenseCategory(deleteData.category.id, payload)
      showSuccess(t('messages.categoryDeleted'))
      setShowDeleteModal(false)
      loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      showError(t('messages.errorOccurred'))
    }
  }

  const handleConfirmMove = async () => {
    if (!moveData.targetCategoryId) {
      showError(t('settings.selectTargetCategory'))
      return
    }

    const targetCategory = categories.find(cat => cat.id == moveData.targetCategoryId)
    const confirmMessage = `${t('messages.confirmMove')}\n\n${t('settings.sourceCategory')}: ${moveData.category.category_name}\n${t('settings.targetCategory')}: ${targetCategory?.category_name}\n${t('settings.expensesToMove')}: ${moveData.category.expense_count}`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      await api.moveExpensesToCategory(moveData.category.id, moveData.targetCategoryId)
      showSuccess(t('messages.expensesMoved'))
      setShowMoveModal(false)
      loadCategories()
    } catch (error) {
      console.error('Error moving expenses:', error)
      showError(t('messages.errorOccurred'))
    }
  }

  const renderCategoriesTable = () => {
    if (filteredCategories.length === 0) {
      if (categories.length === 0) {
        return <EmptyState message={t('settings.noCategories')} icon="📁" />
      } else {
        return <EmptyState message={t('cars.noResults')} icon="🔍" />
      }
    }
    
    return (
      <div className="table-wrapper">
        <table className="data-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => handleSort('category_name')} style={{ width: '50%' }}>
              {t('settings.categoryName')} {getSortIcon('category_name')}
            </th>
            <th className="sortable" onClick={() => handleSort('expense_count')} style={{ width: '25%' }}>
              {t('settings.numberOfExpenses')} {getSortIcon('expense_count')}
            </th>
            <th style={{ width: '25%' }}>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredCategories.map(category => (
            <tr key={category.id}>
              <td>{category.category_name}</td>
              <td>
                <span className="expense-count">
                  {category.expense_count || 0}
                </span>
              </td>
              <td>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleEditCategory(category)}
                  style={{ marginRight: '8px' }}
                >
                  {t('common.edit')}
                </button>
                <button 
                  className="btn btn-sm btn-info"
                  onClick={() => handleMoveTransactions(category)}
                  style={{ marginRight: '8px' }}
                >
                  {t('settings.moveTransactions')}
                </button>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteCategory(category)}
                >
                  {t('common.delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="3" style={{ textAlign: 'center', fontWeight: 'bold', padding: '12px', backgroundColor: '#f8f9fa', borderTop: '2px solid #dee2e6' }}>
              {t('common.total')}: {filteredCategories.length} {filteredCategories.length === 1 ? t('settings.category') : t('settings.categories')}
            </td>
          </tr>
        </tfoot>
        </table>
      </div>
    )
  }

  const renderEditModal = () => {
    if (!showEditModal) return null
    
    const isEdit = editingCategory !== null
    const modalTitle = isEdit ? t('settings.editCategory') : t('settings.addCategory')
    
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>{modalTitle}</h2>
            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label htmlFor="category_name">{t('settings.categoryName')}</label>
                <input
                  type="text"
                  id="category_name"
                  name="category_name"
                  className="form-control"
                  value={formData.category_name}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter category name"
                />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSaveCategory}>
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderDeleteModal = () => {
    if (!showDeleteModal) return null
    
    const category = deleteData.category
    const hasExpenses = category && category.expense_count > 0
    
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>{t('settings.deleteCategory')}</h2>
            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <p><strong>{t('settings.categoryName')}:</strong> {category?.category_name}</p>
            
            {hasExpenses ? (
              <div>
                <div className="alert alert-warning">
                  <strong>{t('settings.categoryHasExpenses')}:</strong> {category.expense_count} {category.expense_count === 1 ? t('expenses.expense') : t('expenses.expenses')}
                </div>
                
                <p>{t('settings.deleteWarning')}</p>
                
                <div className="form-group">
                  <label>
                    <input
                      type="radio"
                      name="deleteAction"
                      value="move"
                      checked={deleteData.action === 'move'}
                      onChange={(e) => setDeleteData({...deleteData, action: e.target.value})}
                    />
                    <span style={{ marginLeft: '8px' }}>{t('settings.moveExpensesFirst')}</span>
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="radio"
                      name="deleteAction"
                      value="delete"
                      checked={deleteData.action === 'delete'}
                      onChange={(e) => setDeleteData({...deleteData, action: e.target.value})}
                    />
                    <span style={{ marginLeft: '8px' }}>{t('settings.deleteExpenses')}</span>
                  </label>
                </div>
              </div>
            ) : (
              <p>{t('settings.confirmDeleteCategory')}</p>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
              {t('common.cancel')}
            </button>
            {hasExpenses && deleteData.action === 'move' ? (
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowDeleteModal(false)
                  handleMoveTransactions(category)
                }}
              >
                {t('settings.openMoveForm')}
              </button>
            ) : (
              <button 
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={hasExpenses && !deleteData.action}
              >
                {t('common.delete')}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderMoveModal = () => {
    if (!showMoveModal) return null
    
    const category = moveData.category
    const otherCategories = categories.filter(cat => cat.id != category?.id)
    
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>{t('settings.moveTransactions')}</h2>
            <button className="modal-close" onClick={() => setShowMoveModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <p><strong>{t('settings.sourceCategory')}:</strong> {category?.category_name}</p>
            <p><strong>{t('settings.expensesToMove')}:</strong> {category?.expense_count} {category?.expense_count === 1 ? t('expenses.expense') : t('expenses.expenses')}</p>
            
            <div className="form-group">
              <label htmlFor="target_category">{t('settings.targetCategory')}</label>
              <select
                id="target_category"
                value={moveData.targetCategoryId}
                onChange={(e) => {
                  setMoveData({...moveData, targetCategoryId: e.target.value})
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  appearance: 'auto',
                  WebkitAppearance: 'menulist',
                  MozAppearance: 'menulist'
                }}
                required
              >
                <option value="">{t('common.select')} ({otherCategories.length} available)</option>
                {otherCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                ))}
              </select>
              {otherCategories.length === 0 && (
                <small className="text-warning">No other categories available to move to.</small>
              )}
            </div>
            
            <div className="alert alert-info">
              <small>{t('settings.moveTransactionsHelp')}</small>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowMoveModal(false)}>
              {t('common.cancel')}
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleConfirmMove}
              disabled={!moveData.targetCategoryId}
            >
              {t('settings.moveTransactions')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Layout activeRoute="settings">
        <Loading />
      </Layout>
    )
  }

  return (
    <Layout activeRoute="settings">
      <div className="page-container">
        <div className="page-header">
          <h1>{t('settings.title')}</h1>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <div className="table-container">
              <div className="table-header">
                <h2>{t('settings.expenseCategories')}</h2>
                <div className="table-controls">
                  <div className="search-box">
                    <input 
                      type="text" 
                      placeholder={t('common.search') + ' ' + t('settings.expenseCategories').toLowerCase()}
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleAddCategory}>
                    {t('settings.newCategory')}
                  </button>
                </div>
              </div>
              <div className="table-wrapper">
                {renderCategoriesTable()}
              </div>
            </div>
          </div>

          <div className="settings-section" style={{ marginTop: '2rem' }}>
            <MaintenanceCategories />
          </div>
        </div>

        {renderEditModal()}
        {renderDeleteModal()}
        {renderMoveModal()}
      </div>
    </Layout>
  )
}

export default SettingsPage 