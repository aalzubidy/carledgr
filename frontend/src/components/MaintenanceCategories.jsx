import React, { useState, useEffect } from 'react'
import { EmptyState } from './Layout.jsx'
import { t } from '../utils/i18n.js'
import { api } from '../utils/api.js'
import { showSuccess, showError } from '../utils/snackbar.js'

function MaintenanceCategories() {
  const [categories, setCategories] = useState([])
  const [filteredCategories, setFilteredCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: ''
  })
  const [deleteData, setDeleteData] = useState({
    category: null,
    action: ''
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
        category.name.toLowerCase().includes(term) ||
        (category.is_default ? 'default' : 'custom').includes(term)
      )
    })
    setFilteredCategories(filtered)
  }, [searchTerm, categories])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await api.getMaintenanceCategories()
      setCategories(response)
      setFilteredCategories(response)
    } catch (error) {
      console.error('Error loading maintenance categories:', error)
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
      if (column === 'maintenance_count') {
        aVal = parseInt(aVal) || 0
        bVal = parseInt(bVal) || 0
      } else if (column === 'created_at') {
        aVal = new Date(aVal)
        bVal = new Date(bVal)
      } else if (column === 'is_default') {
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
      name: ''
    })
    setShowEditModal(true)
  }

  const handleEditCategory = (category) => {
    if (category.is_default) {
      showError(t('settings.readOnly'))
      return
    }
    
    setEditingCategory(category)
    setFormData({
      name: category.name
    })
    setShowEditModal(true)
  }

  const handleDeleteCategory = (category) => {
    if (category.is_default) {
      showError(t('settings.readOnly'))
      return
    }
    
    setDeleteData({
      category,
      action: ''
    })
    setShowDeleteModal(true)
  }

  const handleMoveRecords = (category) => {
    if (category.maintenance_count === 0) {
      showError(t('settings.maintenanceCategoryEmpty'))
      return
    }
    
    setMoveData({
      category,
      targetCategoryId: ''
    })
    setShowMoveModal(true)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) {
      showError(t('settings.categoryName') + ' ' + t('common.required'))
      return
    }

    const confirmMessage = editingCategory ? t('messages.confirmEdit') : t('messages.confirmAdd')
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      if (editingCategory) {
        await api.updateMaintenanceCategory(editingCategory.id, formData)
        showSuccess(t('messages.categoryUpdated'))
      } else {
        await api.createMaintenanceCategory(formData)
        showSuccess(t('messages.categoryAdded'))
      }
      
      setShowEditModal(false)
      loadCategories()
    } catch (error) {
      console.error('Error saving maintenance category:', error)
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
      
      await api.deleteMaintenanceCategory(deleteData.category.id, payload)
      showSuccess(t('messages.categoryDeleted'))
      setShowDeleteModal(false)
      loadCategories()
    } catch (error) {
      console.error('Error deleting maintenance category:', error)
      showError(t('messages.errorOccurred'))
    }
  }

  const handleConfirmMove = async () => {
    if (!moveData.targetCategoryId) {
      showError(t('settings.selectTargetCategory'))
      return
    }

    if (!confirm(t('messages.confirmMove'))) {
      return
    }

    try {
      await api.moveMaintenanceRecordsToCategory(moveData.category.id, moveData.targetCategoryId)
      showSuccess(t('messages.recordsMoved'))
      setShowMoveModal(false)
      loadCategories()
    } catch (error) {
      console.error('Error moving maintenance records:', error)
      showError(t('messages.errorOccurred'))
    }
  }

  const renderCategoriesTable = () => {
    if (loading) {
      return <div className="text-center p-4">Loading...</div>
    }

    const customCategories = filteredCategories.filter(cat => !cat.is_default)
    
    if (customCategories.length === 0 && !searchTerm) {
      return (
        <EmptyState 
          message={t('settings.noMaintenanceCategories')}
          action={
            <button className="btn btn-primary" onClick={handleAddCategory}>
              {t('settings.newCategory')}
            </button>
          }
        />
      )
    }

    if (filteredCategories.length === 0 && searchTerm) {
      return (
        <EmptyState 
          message={t('common.noResultsFound')}
        />
      )
    }

    return (
      <div className="table-wrapper">
        <table className="data-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => handleSort('name')} style={{ width: '35%' }}>
              {t('settings.categoryName')} {getSortIcon('name')}
            </th>
            <th className="sortable" onClick={() => handleSort('is_default')} style={{ width: '20%' }}>
              {t('settings.categoryType')} {getSortIcon('is_default')}
            </th>
            <th className="sortable" onClick={() => handleSort('maintenance_count')} style={{ width: '20%' }}>
              {t('settings.numberOfMaintenance')} {getSortIcon('maintenance_count')}
            </th>
            <th style={{ width: '25%' }}>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredCategories.map(category => (
            <tr key={category.id}>
              <td>{category.name}</td>
              <td>
                <span className={`badge ${category.is_default ? 'badge-secondary' : 'badge-primary'}`}>
                  {category.is_default ? t('settings.defaultCategory') : t('settings.customCategory')}
                </span>
              </td>
              <td>
                <span className="expense-count">
                  {category.maintenance_count || 0}
                </span>
              </td>
              <td>
                <div className="btn-group">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEditCategory(category)}
                    disabled={category.is_default}
                    style={{ marginRight: '8px' }}
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    className="btn btn-sm btn-info"
                    onClick={() => handleMoveRecords(category)}
                    disabled={category.maintenance_count === 0}
                    style={{ marginRight: '8px' }}
                  >
                    {t('settings.moveRecords')}
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteCategory(category)}
                    disabled={category.is_default}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="4" style={{ textAlign: 'center', fontWeight: 'bold', padding: '12px', backgroundColor: '#f8f9fa', borderTop: '2px solid #dee2e6' }}>
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

    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>{editingCategory ? t('settings.editCategory') : t('settings.newCategory')}</h2>
            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="name">{t('settings.categoryName')}</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="form-control"
                placeholder={t('settings.categoryName')}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSaveCategory}>
              {editingCategory ? t('common.save') : t('common.add')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderDeleteModal = () => {
    if (!showDeleteModal) return null

    const category = deleteData.category
    const hasRecords = category && category.maintenance_count > 0
    
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>{t('settings.deleteCategory')}</h2>
            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <p><strong>{t('settings.categoryName')}:</strong> {category?.name}</p>
            
            {hasRecords ? (
              <div>
                <div className="alert alert-warning">
                  <strong>{t('settings.categoryHasMaintenance')}:</strong> {category.maintenance_count} {category.maintenance_count === 1 ? t('maintenance.record') : t('maintenance.records')}
                </div>
                
                <p>{t('settings.deleteMaintenanceWarning')}</p>
                
                <div className="form-group">
                  <label>
                    <input
                      type="radio"
                      name="deleteAction"
                      value="move"
                      checked={deleteData.action === 'move'}
                      onChange={(e) => setDeleteData({...deleteData, action: e.target.value})}
                    />
                    <span style={{ marginLeft: '8px' }}>{t('settings.moveMaintenanceFirst')}</span>
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
                    <span style={{ marginLeft: '8px' }}>{t('settings.deleteMaintenance')}</span>
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
            {hasRecords && deleteData.action === 'move' ? (
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowDeleteModal(false)
                  handleMoveRecords(category)
                }}
              >
                {t('settings.openMoveForm')}
              </button>
            ) : (
              <button 
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={hasRecords && !deleteData.action}
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
    const otherCategories = categories.filter(cat => cat.id !== category?.id)
    
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>{t('settings.moveMaintenanceRecords')}</h2>
            <button className="modal-close" onClick={() => setShowMoveModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <p><strong>{t('settings.sourceCategory')}:</strong> {category?.name}</p>
            <p><strong>{t('settings.maintenanceToMove')}:</strong> {category?.maintenance_count} {category?.maintenance_count === 1 ? t('maintenance.record') : t('maintenance.records')}</p>
            
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
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {otherCategories.length === 0 && (
                <small className="text-warning">No other categories available to move to.</small>
              )}
            </div>
            
            <div className="alert alert-info">
              <small>{t('settings.moveMaintenanceHelp')}</small>
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
              {t('settings.moveMaintenanceRecords')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="table-container">
        <div className="table-header">
          <h2>{t('settings.maintenanceCategories')}</h2>
          <div className="table-controls">
            <div className="search-box">
              <input 
                type="text" 
                placeholder={t('common.search') + ' ' + t('settings.maintenanceCategories').toLowerCase()}
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

      {renderEditModal()}
      {renderDeleteModal()}
      {renderMoveModal()}
    </>
  )
}

export default MaintenanceCategories 