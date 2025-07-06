import React, { useState, useEffect } from 'react'
import Layout, { Loading, EmptyState } from '../components/Layout.jsx'
import MaintenanceCategories from '../components/MaintenanceCategories.jsx'
import { t } from '../utils/i18n.js'
import { api, getAuthToken } from '../utils/api.js'
import { showSuccess, showError } from '../utils/snackbar.js'
import { canAccessSettings, getPermissionErrorMessage } from '../utils/permissions.js'

function SettingsPage() {
  const [categories, setCategories] = useState([])
  const [filteredCategories, setFilteredCategories] = useState([])
  const [loading, setLoading] = useState(true)
  
  // User management state
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [userRoles, setUserRoles] = useState([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userSortColumn, setUserSortColumn] = useState('')
  const [userSortDirection, setUserSortDirection] = useState('asc')
  const [showUserEditModal, setShowUserEditModal] = useState(false)
  const [showUserDeleteModal, setShowUserDeleteModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userFormData, setUserFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
    role_id: ''
  })
  const [currentUser, setCurrentUser] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  
  // License usage state
  const [licenseData, setLicenseData] = useState(null)
  const [activeCarsCount, setActiveCarsCount] = useState(0)

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
    loadCurrentUser()
    loadLicenseData()
  }, [])

  useEffect(() => {
    // Filter categories when search term changes
    const filtered = categories.filter(category => {
      const term = searchTerm.toLowerCase()
      return (
        category.category_name.toLowerCase().includes(term) ||
        (category.is_recurring ? 'recurring' : 'one-time').includes(term) ||
        (category.is_default ? 'default' : 'custom').includes(term)
      )
    })
    setFilteredCategories(filtered)
  }, [searchTerm, categories])

  useEffect(() => {
    // Filter users when search term changes
    const filtered = users.filter(user => {
      const term = userSearchTerm.toLowerCase()
      return (
        user.email.toLowerCase().includes(term) ||
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
      )
    })
    setFilteredUsers(filtered)
  }, [userSearchTerm, users])

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
      } else if (column === 'is_recurring' || column === 'is_default') {
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
    if (category.is_default) {
      showError(t('settings.readOnly'))
      return
    }
    
    setEditingCategory(category)
    setFormData({
      category_name: category.category_name,
      is_recurring: category.is_recurring
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

  // User Management Functions
  const loadCurrentUser = async () => {
    try {
      const user = await api.getCurrentUser()
      setCurrentUser(user)
      setIsOwner(user.roleId === 1)
      
      if (user.roleId === 1) {
        loadUsers()
        loadUserRoles()
      }
    } catch (error) {
      console.error('Error loading current user:', error)
    }
  }

  const loadLicenseData = async () => {
    try {
      // Get license information and cars data
      const [licenseInfo, carsData] = await Promise.all([
        api.getLicenseInfo(),
        api.getCars()
      ])
      
      setLicenseData(licenseInfo)
      
      // Count active cars (not sold)
      const activeCars = carsData.filter(car => car.status !== 'sold')
      setActiveCarsCount(activeCars.length)
    } catch (error) {
      console.error('Error loading license data:', error)
      // Don't show error for this as it's not critical for the page function
    }
  }

  const handleManageSubscription = async () => {
    try {
      // Show loading state
      const button = event.target
      const originalText = button.textContent
      button.textContent = 'Opening...'
      button.disabled = true

      // Get current URL for return
      const returnUrl = window.location.origin + window.location.pathname

      // Create portal session
      const response = await api.createPortalSession(returnUrl)
      
      // Open Stripe Customer Portal in same tab
      window.location.href = response.portal_url

    } catch (error) {
      console.error('Error opening customer portal:', error)
      showError(error.message || 'Failed to open subscription management portal')
      
      // Reset button
      const button = event.target
      button.textContent = '💳 Manage Subscription'
      button.disabled = false
    }
  }

  const loadUsers = async () => {
    try {
      const response = await api.getOrganizationUsers()
      setUsers(response)
      setFilteredUsers(response)
    } catch (error) {
      console.error('Error loading users:', error)
      showError(t('messages.errorOccurred'))
    }
  }

  const loadUserRoles = async () => {
    try {
      const response = await api.getUserRoles()
      setUserRoles(response)
    } catch (error) {
      console.error('Error loading user roles:', error)
      // Fallback to default roles if API fails
      setUserRoles([
        { id: 1, role_name: 'owner' },
        { id: 2, role_name: 'manager' },
        { id: 3, role_name: 'operator' }
      ])
    }
  }

  const handleUserSearch = (e) => {
    setUserSearchTerm(e.target.value)
  }

  const handleUserSort = (column) => {
    let newDirection = 'asc'
    if (userSortColumn === column && userSortDirection === 'asc') {
      newDirection = 'desc'
    }
    
    setUserSortColumn(column)
    setUserSortDirection(newDirection)
    
    const sorted = [...filteredUsers].sort((a, b) => {
      let aVal = a[column]
      let bVal = b[column]
      
      if (aVal == null) aVal = ''
      if (bVal == null) bVal = ''
      
      if (column === 'createdAt') {
        aVal = new Date(aVal)
        bVal = new Date(bVal)
      } else {
        aVal = aVal.toString().toLowerCase()
        bVal = bVal.toString().toLowerCase()
      }
      
      if (newDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }
    })
    
    setFilteredUsers(sorted)
  }

  const getUserSortIcon = (column) => {
    if (userSortColumn !== column) return ''
    return userSortDirection === 'asc' ? '↑' : '↓'
  }

  const handleAddUser = () => {
    setEditingUser(null)
    setUserFormData({
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      confirmPassword: '',
      role_id: ''
    })
    setShowUserEditModal(true)
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setUserFormData({
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      password: '', // Don't populate password for editing
      confirmPassword: '',
      role_id: user.roleId
    })
    setShowUserEditModal(true)
  }

  const handleDeleteUser = (user) => {
    if (user.id === currentUser?.id) {
      showError(t('settings.cannotDeleteSelf'))
      return
    }
    setEditingUser(user)
    setShowUserDeleteModal(true)
  }

  const handleUserFormChange = (e) => {
    const { name, value } = e.target
    setUserFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveUser = async () => {
    if (!userFormData.email.trim() || !userFormData.first_name.trim() || !userFormData.last_name.trim() || !userFormData.role_id) {
      showError(t('common.firstName') + ', ' + t('common.lastName') + ', ' + t('common.email') + ', ' + t('settings.userRole') + ' ' + t('common.required'))
      return
    }

    if (!editingUser && !userFormData.password.trim()) {
      showError(t('settings.userPassword') + ' ' + t('common.required'))
      return
    }

    if (!editingUser && userFormData.password !== userFormData.confirmPassword) {
      showError(t('validation.passwordMismatch'))
      return
    }

    if (editingUser && editingUser.id === currentUser?.id && parseInt(userFormData.role_id) !== 1) {
      showError(t('settings.cannotChangeSelfRole'))
      return
    }

    const confirmMessage = editingUser ? t('messages.confirmEdit') : t('messages.confirmAdd')
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      if (editingUser) {
        await api.updateOrganizationUser(editingUser.id, {
          email: userFormData.email,
          first_name: userFormData.first_name,
          last_name: userFormData.last_name,
          role_id: parseInt(userFormData.role_id)
        })
        showSuccess(t('settings.userUpdated'))
      } else {
        await api.createOrganizationUser({
          email: userFormData.email,
          first_name: userFormData.first_name,
          last_name: userFormData.last_name,
          password: userFormData.password,
          role_id: parseInt(userFormData.role_id)
        })
        showSuccess(t('settings.userAdded'))
      }
      
      setShowUserEditModal(false)
      loadUsers()
    } catch (error) {
      console.error('Error saving user:', error)
      showError(error.message || t('messages.errorOccurred'))
    }
  }

  const handleConfirmDeleteUser = async () => {
    if (!editingUser) return

    if (!confirm(t('settings.confirmDeleteUser'))) {
      return
    }

    try {
      await api.deleteOrganizationUser(editingUser.id)
      showSuccess(t('settings.userDeleted'))
      setShowUserDeleteModal(false)
      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      showError(error.message || t('messages.errorOccurred'))
    }
  }

  const renderLicenseUsage = () => {
    if (!licenseData) {
      return (
        <div className="license-usage-card" style={{ marginBottom: '2rem' }}>
          <div className="license-header">
            <h2>License Usage</h2>
          </div>
          <div className="license-content" style={{ textAlign: 'center', padding: '20px' }}>
            <p>Loading license information...</p>
          </div>
        </div>
      )
    }

    const usagePercentage = Math.round((activeCarsCount / licenseData.car_limit) * 100)
    const isNearLimit = usagePercentage >= 80
    const isAtLimit = usagePercentage >= 100
    
    // Determine progress bar color
    let progressColor = '#28a745' // Green
    if (usagePercentage >= 90) {
      progressColor = '#dc3545' // Red
    } else if (usagePercentage >= 80) {
      progressColor = '#ffc107' // Yellow
    }

    return (
      <div className="license-usage-card" style={{ 
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        marginBottom: '2rem',
        overflow: 'hidden'
      }}>
        <div className="license-header" style={{
          backgroundColor: '#f8f9fa',
          padding: '15px 20px',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.25rem' }}>
            License Usage
          </h2>
          <span style={{
            backgroundColor: licenseData.is_free_account ? '#17a2b8' : '#28a745',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'uppercase'
          }}>
            {licenseData.is_free_account ? 'Free Account' : licenseData.display_name}
          </span>
        </div>
        
        <div className="license-content" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontWeight: '500', color: '#495057' }}>
                Active Cars: {activeCarsCount} of {licenseData.car_limit}
              </span>
              <span style={{ 
                fontWeight: 'bold',
                color: isAtLimit ? '#dc3545' : isNearLimit ? '#ffc107' : '#28a745'
              }}>
                {usagePercentage}%
              </span>
            </div>
            
            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '20px',
              backgroundColor: '#e9ecef',
              borderRadius: '10px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(usagePercentage, 100)}%`,
                backgroundColor: progressColor,
                borderRadius: '10px',
                transition: 'width 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {usagePercentage > 15 && (
                  <span style={{ 
                    color: 'white', 
                    fontSize: '12px', 
                    fontWeight: 'bold' 
                  }}>
                    {usagePercentage}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {isAtLimit && (
            <div style={{
              padding: '10px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: '5px',
              fontSize: '14px',
              marginTop: '10px'
            }}>
              ⚠️ You've reached your car limit. Please upgrade your plan to add more cars.
            </div>
          )}
          
          {isNearLimit && !isAtLimit && (
            <div style={{
              padding: '10px',
              backgroundColor: '#fff3cd',
              color: '#856404',
              borderRadius: '5px',
              fontSize: '14px',
              marginTop: '10px'
            }}>
              ⚡ You're approaching your car limit. Consider upgrading your plan.
            </div>
          )}

          {/* Additional Info */}
          <div style={{ 
            marginTop: '15px', 
            fontSize: '14px', 
            color: '#6c757d',
            lineHeight: '1.4'
          }}>
            <div style={{ marginBottom: '5px' }}>
              <strong>Plan:</strong> {licenseData.display_name}
              {!licenseData.is_free_account && (
                <span> (${licenseData.monthly_price}/month)</span>
              )}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Status:</strong> 
              <span style={{ 
                color: licenseData.is_active ? '#28a745' : '#dc3545',
                marginLeft: '5px'
              }}>
                {licenseData.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Manage Subscription Button */}
          {!licenseData.is_free_account && licenseData.is_active && (
            <div style={{ 
              borderTop: '1px solid #dee2e6',
              paddingTop: '15px',
              marginTop: '15px'
            }}>
              <button
                onClick={handleManageSubscription}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
              >
                <span>💳</span>
                Manage Subscription
              </button>
              <p style={{ 
                fontSize: '12px', 
                color: '#6c757d', 
                margin: '8px 0 0 0' 
              }}>
                Update payment method, view invoices, or cancel subscription
              </p>
            </div>
          )}
        </div>
      </div>
    )
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
            <th className="sortable" onClick={() => handleSort('category_name')} style={{ width: '35%' }}>
              {t('settings.categoryName')} {getSortIcon('category_name')}
            </th>
            <th className="sortable" onClick={() => handleSort('is_default')} style={{ width: '20%' }}>
              {t('settings.categoryType')} {getSortIcon('is_default')}
            </th>
            <th className="sortable" onClick={() => handleSort('expense_count')} style={{ width: '20%' }}>
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
                <span className={`badge ${category.is_default ? 'badge-secondary' : 'badge-primary'}`}>
                  {category.is_default ? t('settings.defaultCategory') : t('settings.customCategory')}
                </span>
              </td>
              <td>
                <span className="expense-count">
                  {category.expense_count || 0}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button 
                    onClick={() => handleEditCategory(category)}
                    disabled={category.is_default}
                    title={category.is_default ? t('settings.readOnly') : t('common.edit')}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      fontSize: '18px', 
                      cursor: category.is_default ? 'not-allowed' : 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                      color: category.is_default ? '#adb5bd' : '#6c757d',
                      opacity: category.is_default ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!category.is_default) {
                        e.target.style.backgroundColor = '#f8f9fa'
                      }
                    }}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(category)}
                    disabled={category.is_default}
                    title={category.is_default ? t('settings.readOnly') : t('common.delete')}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      fontSize: '18px', 
                      cursor: category.is_default ? 'not-allowed' : 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                      color: category.is_default ? '#adb5bd' : '#dc3545',
                      opacity: category.is_default ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!category.is_default) {
                        e.target.style.backgroundColor = '#f8d7da'
                      }
                    }}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    🗑️
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
              
              {isEdit && editingCategory && editingCategory.expense_count > 0 && (
                <div className="form-group" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#495057' }}>
                    📊 Expense Management
                  </h4>
                  <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#6c757d' }}>
                    {t('settings.categoryHasExpenses')}: <strong>{editingCategory.expense_count}</strong> {editingCategory.expense_count === 1 ? t('expenses.expense') : t('expenses.expenses')}
                  </p>
                  <button 
                    type="button"
                    className="btn btn-info btn-sm"
                    onClick={() => {
                      setShowEditModal(false)
                      handleMoveTransactions(editingCategory)
                    }}
                    style={{ fontSize: '14px' }}
                  >
                    📤 {t('settings.moveTransactions')}
                  </button>
                </div>
              )}
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

  // User Management Render Functions
  const renderUsersTable = () => {
    if (filteredUsers.length === 0) {
      if (users.length === 0) {
        return <EmptyState message={t('settings.noUsers')} icon="👥" />
      } else {
        return <EmptyState message={t('cars.noResults')} icon="🔍" />
      }
    }
    
    return (
      <div className="table-wrapper">
        <table className="data-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => handleUserSort('email')} style={{ width: '25%' }}>
              {t('settings.userEmail')} {getUserSortIcon('email')}
            </th>
            <th className="sortable" onClick={() => handleUserSort('firstName')} style={{ width: '18%' }}>
              {t('settings.userFirstName')} {getUserSortIcon('firstName')}
            </th>
            <th className="sortable" onClick={() => handleUserSort('lastName')} style={{ width: '18%' }}>
              {t('settings.userLastName')} {getUserSortIcon('lastName')}
            </th>
            <th className="sortable" onClick={() => handleUserSort('role')} style={{ width: '14%' }}>
              {t('settings.userRole')} {getUserSortIcon('role')}
            </th>
            <th className="sortable" onClick={() => handleUserSort('createdAt')} style={{ width: '15%' }}>
              {t('settings.userCreatedAt')} {getUserSortIcon('createdAt')}
            </th>
            <th style={{ width: '10%' }}>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.firstName}</td>
              <td>{user.lastName}</td>
              <td>
                <span className={`role-badge role-${user.role.toLowerCase()}`}>
                  {t(`settings.${user.role.toLowerCase()}`)}
                </span>
              </td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button 
                    onClick={() => handleEditUser(user)}
                    title={t('common.edit')}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      fontSize: '18px', 
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                      color: '#6c757d'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user)}
                    disabled={user.id === currentUser?.id}
                    title={t('common.delete')}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      fontSize: '18px', 
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                      color: user.id === currentUser?.id ? '#adb5bd' : '#dc3545',
                      opacity: user.id === currentUser?.id ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (user.id !== currentUser?.id) {
                        e.target.style.backgroundColor = '#f8d7da'
                      }
                    }}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="6" style={{ textAlign: 'center', fontWeight: 'bold', padding: '12px', backgroundColor: '#f8f9fa', borderTop: '2px solid #dee2e6' }}>
              {t('common.total')}: {filteredUsers.length} {filteredUsers.length === 1 ? t('settings.user') : t('settings.users')}
            </td>
          </tr>
        </tfoot>
        </table>
      </div>
    )
  }

  const renderUserEditModal = () => {
    if (!showUserEditModal) return null
    
    const isEdit = editingUser !== null
    const modalTitle = isEdit ? t('settings.editUser') : t('settings.addUser')
    
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ maxWidth: '600px', width: '90%' }}>
          <div className="modal-header">
            <h2>{modalTitle}</h2>
            <button className="modal-close" onClick={() => setShowUserEditModal(false)}>×</button>
          </div>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label htmlFor="user_email">{t('settings.userEmail')}</label>
                <input
                  type="email"
                  id="user_email"
                  name="email"
                  className="form-control"
                  value={userFormData.email}
                  onChange={handleUserFormChange}
                  required
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="user_first_name">{t('settings.userFirstName')}</label>
                <input
                  type="text"
                  id="user_first_name"
                  name="first_name"
                  className="form-control"
                  value={userFormData.first_name}
                  onChange={handleUserFormChange}
                  required
                  placeholder="Enter first name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="user_last_name">{t('settings.userLastName')}</label>
                <input
                  type="text"
                  id="user_last_name"
                  name="last_name"
                  className="form-control"
                  value={userFormData.last_name}
                  onChange={handleUserFormChange}
                  required
                  placeholder="Enter last name"
                />
              </div>
              
              {!isEdit && (
                <>
                  <div className="form-group">
                    <label htmlFor="user_password">{t('settings.userPassword')}</label>
                    <input
                      type="password"
                      id="user_password"
                      name="password"
                      className="form-control"
                      value={userFormData.password}
                      onChange={handleUserFormChange}
                      required
                      placeholder="Enter password (min 6 characters)"
                      minLength="6"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="user_confirm_password">{t('profile.confirmPassword')}</label>
                    <input
                      type="password"
                      id="user_confirm_password"
                      name="confirmPassword"
                      className="form-control"
                      value={userFormData.confirmPassword}
                      onChange={handleUserFormChange}
                      required
                      placeholder="Confirm password"
                      minLength="6"
                    />
                  </div>
                </>
              )}
              
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="user_role" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Role *
                </label>
                <select
                  id="user_role"
                  name="role_id"
                  value={userFormData.role_id || ''}
                  onChange={handleUserFormChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px',
                    backgroundColor: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">-- Select Role --</option>
                  <option value="1">Owner</option>
                  <option value="2">Manager</option>
                  <option value="3">Operator</option>
                </select>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowUserEditModal(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSaveUser}>
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderUserDeleteModal = () => {
    if (!showUserDeleteModal) return null
    
    const user = editingUser
    
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>{t('settings.deleteUser')}</h2>
            <button className="modal-close" onClick={() => setShowUserDeleteModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <p><strong>{t('settings.userEmail')}:</strong> {user?.email}</p>
            <p><strong>{t('settings.userFirstName')}:</strong> {user?.firstName}</p>
            <p><strong>{t('settings.userLastName')}:</strong> {user?.lastName}</p>
            <p><strong>{t('settings.userRole')}:</strong> {t(`settings.${user?.role?.toLowerCase()}`)}</p>
            
            <div className="alert alert-warning">
              <p>{t('settings.confirmDeleteUser')}</p>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowUserDeleteModal(false)}>
              {t('common.cancel')}
            </button>
            <button 
              className="btn btn-danger"
              onClick={handleConfirmDeleteUser}
            >
              {t('common.delete')}
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

        {/* Settings Navigation */}
        <div className="settings-navigation">
          <div className="nav-pills">
            <a href="#license" className="nav-pill">
              📊 {t('settings.licenseUsage')}
            </a>
            <a href="#expense-categories" className="nav-pill">
              💰 {t('settings.expenseCategories')}
            </a>
            <a href="#maintenance-categories" className="nav-pill">
              🔧 {t('settings.maintenanceCategories')}
            </a>
            {isOwner && (
              <a href="#user-management" className="nav-pill">
                👥 {t('settings.userManagement')}
              </a>
            )}
          </div>
        </div>

        <div className="settings-content">
          {/* License Usage Section */}
          <div id="license">
            {renderLicenseUsage()}
          </div>
          
          <div id="expense-categories" className="settings-section">
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

          <div id="maintenance-categories" className="settings-section" style={{ marginTop: '2rem' }}>
            <MaintenanceCategories />
          </div>

          {/* User Management Section - Only for Owner role */}
          {isOwner && (
            <div id="user-management" className="settings-section" style={{ marginTop: '2rem' }}>
              <div className="table-container">
                <div className="table-header">
                  <h2>{t('settings.userManagement')}</h2>
                  <div className="table-controls">
                    <div className="search-box">
                      <input 
                        type="text" 
                        placeholder={t('common.search') + ' ' + t('settings.users').toLowerCase()}
                        value={userSearchTerm}
                        onChange={handleUserSearch}
                      />
                    </div>
                    <button className="btn btn-primary" onClick={handleAddUser}>
                      {t('settings.newUser')}
                    </button>
                  </div>
                </div>
                <div className="table-wrapper">
                  {renderUsersTable()}
                </div>
              </div>
            </div>
          )}
        </div>

        {renderEditModal()}
        {renderDeleteModal()}
        {renderMoveModal()}
        {renderUserEditModal()}
        {renderUserDeleteModal()}
      </div>
    </Layout>
  )
}

export default SettingsPage 