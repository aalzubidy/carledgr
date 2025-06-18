import React, { useState, useEffect, useRef } from 'react'
import { t } from '../utils/i18n.js'
import { api } from '../utils/api.js'
import Layout, { Loading, EmptyState } from '../components/Layout.jsx'
import { showSuccess, showError, showWarning } from '../utils/snackbar.js'

function MaintenancePage() {
  const [maintenanceRecords, setMaintenanceRecords] = useState([])
  const [filteredRecords, setFilteredRecords] = useState([])
  const [categories, setCategories] = useState([])
  const [cars, setCars] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [carSearchTerm, setCarSearchTerm] = useState('')
  const [selectedCarId, setSelectedCarId] = useState(null)
  const [showCarResults, setShowCarResults] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [sortField, setSortField] = useState('')
  const [sortAscending, setSortAscending] = useState(true)
  const [formData, setFormData] = useState({
    car_id: '',
    category_id: '',
    description: '',
    cost: '',
    maintenance_date: new Date().toISOString().split('T')[0],
    vendor: '',
    notes: ''
  })
  const carSearchRef = useRef(null)

  useEffect(() => {
    loadMaintenanceData()
  }, [])

  useEffect(() => {
    // Filter records when search term changes
    const filtered = maintenanceRecords.filter(record => {
      const term = searchTerm.toLowerCase()
      return (
        record.description.toLowerCase().includes(term) ||
        record.car_make.toLowerCase().includes(term) ||
        record.car_model.toLowerCase().includes(term) ||
        record.category_name.toLowerCase().includes(term) ||
        (record.vendor && record.vendor.toLowerCase().includes(term))
      )
    })
    setFilteredRecords(filtered)
  }, [searchTerm, maintenanceRecords])

  useEffect(() => {
    // Handle clicks outside car search to hide results
    const handleClickOutside = (e) => {
      if (carSearchRef.current && !carSearchRef.current.contains(e.target)) {
        setShowCarResults(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const loadMaintenanceData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch maintenance data
      const [recordsData, categoriesData, carsData] = await Promise.all([
        api.getAllMaintenanceRecords(),
        api.getMaintenanceCategories(),
        api.getCars()
      ])
      
      setMaintenanceRecords(recordsData)
      setFilteredRecords(recordsData)
      setCategories(categoriesData)
      setCars(carsData)
    } catch (error) {
      console.error('Failed to load maintenance records:', error)
      setError(error.message)
      showError(t('messages.errorOccurred') + ': ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleCarSearch = (e) => {
    const term = e.target.value
    setCarSearchTerm(term)
    
    if (term.length < 1) {
      setShowCarResults(false)
      setSelectedCarId(null)
      return
    }
    
    setShowCarResults(true)
  }

  const getFilteredCars = () => {
    if (carSearchTerm.length < 1) return []
    
    return cars.filter(car => {
      const term = carSearchTerm.toLowerCase()
      return (
        car.vin.toLowerCase().includes(term) ||
        car.make.toLowerCase().includes(term) ||
        car.model.toLowerCase().includes(term) ||
        car.year.toString().includes(term) ||
        `${car.year} ${car.make} ${car.model}`.toLowerCase().includes(term)
      )
    })
  }

  const handleCarSelect = (car) => {
    const carInfo = `${car.year} ${car.make} ${car.model} (${car.vin})`
    setCarSearchTerm(carInfo)
    setSelectedCarId(car.id)
    setShowCarResults(false)
  }

  const handleSort = (field) => {
    const isAscending = sortField !== field || !sortAscending
    setSortField(field)
    setSortAscending(isAscending)
    
    const sorted = [...filteredRecords].sort((a, b) => {
      let aVal = a[field]
      let bVal = b[field]
      
      // Handle special cases
      if (field === 'car_info') {
        aVal = `${a.car_year} ${a.car_make} ${a.car_model}`
        bVal = `${b.car_year} ${b.car_make} ${b.car_model}`
      }
      
      if (field === 'cost') {
        aVal = parseFloat(aVal) || 0
        bVal = parseFloat(bVal) || 0
      }
      
      if (field === 'maintenance_date') {
        aVal = new Date(aVal)
        bVal = new Date(bVal)
      }
      
      if (aVal < bVal) return isAscending ? -1 : 1
      if (aVal > bVal) return isAscending ? 1 : -1
      return 0
    })
    
    setFilteredRecords(sorted)
  }

  const handleAddMaintenance = () => {
    if (!selectedCarId) {
      showWarning(t('common.select') + ' ' + t('maintenance.car'))
      return
    }
    
    setEditingRecord(null)
    setFormData({
      car_id: selectedCarId,
      category_id: '',
      description: '',
      cost: '',
      maintenance_date: new Date().toISOString().split('T')[0],
      vendor: '',
      notes: ''
    })
    setShowModal(true)
  }

  const handleEditMaintenance = (record) => {
    setEditingRecord(record)
    setFormData({
      car_id: record.car_id,
      category_id: record.category_id,
      description: record.description,
      cost: record.cost,
      maintenance_date: record.maintenance_date.split('T')[0],
      vendor: record.vendor || '',
      notes: record.notes || ''
    })
    setShowModal(true)
  }

  const handleDeleteMaintenance = async (recordId) => {
    if (!window.confirm(t('messages.confirmDelete') || 'Are you sure you want to delete this maintenance record?')) {
      return
    }
    
    try {
      await api.deleteMaintenanceRecord(recordId)
      showSuccess(t('messages.maintenanceDeleted'))
      loadMaintenanceData()
    } catch (error) {
      console.error('Error deleting maintenance record:', error)
      showError(t('messages.errorOccurred') + ': ' + error.message)
    }
  }

  const handleViewCar = (carId) => {
    if (window.navigate) {
      window.navigate(`/cars/${carId}`)
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveMaintenance = async (e) => {
    e.preventDefault()
    
    // Show confirmation for edit operations
    if (editingRecord && !window.confirm(t('messages.confirmEdit') || 'Are you sure you want to save these changes?')) {
      return
    }
    
    const data = {
      car_id: formData.car_id,
      category_id: formData.category_id,
      description: formData.description,
      cost: parseFloat(formData.cost),
      maintenance_date: formData.maintenance_date,
      vendor: formData.vendor || null,
      notes: formData.notes || null
    }
    
    try {
      if (editingRecord) {
        await api.updateMaintenanceRecord(editingRecord.id, data)
        showSuccess(t('messages.maintenanceUpdated'))
      } else {
        await api.createMaintenanceRecord(data)
        showSuccess(t('messages.maintenanceAdded'))
      }
      
      setShowModal(false)
      loadMaintenanceData()
    } catch (error) {
      console.error('Error saving maintenance record:', error)
      showError(t('messages.errorOccurred') + ': ' + error.message)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  const renderMaintenanceTable = () => {
    if (!filteredRecords || filteredRecords.length === 0) {
      return <EmptyState message={t('maintenance.noRecords')} icon="🔧" />
    }
    
    const totalCost = filteredRecords.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0)
    
    return (
      <>
        <div className="table-wrapper">
          <table className="data-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('maintenance_date')}>
                {t('maintenance.date')}
              </th>
              <th className="sortable" onClick={() => handleSort('car_vin')}>
                {t('cars.vin')}
              </th>
              <th className="sortable" onClick={() => handleSort('car_info')}>
                {t('maintenance.car')}
              </th>
              <th className="sortable" onClick={() => handleSort('category_name')}>
                {t('maintenance.category')}
              </th>
              <th className="sortable" onClick={() => handleSort('description')}>
                {t('maintenance.description')}
              </th>
              <th className="sortable" onClick={() => handleSort('cost')}>
                {t('maintenance.cost')}
              </th>
              <th className="sortable" onClick={() => handleSort('vendor')}>
                {t('maintenance.vendor')}
              </th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map(record => (
              <tr 
                key={record.id} 
                className="maintenance-row"
                onClick={() => handleEditMaintenance(record)}
                style={{ cursor: 'pointer' }}
              >
                <td>{formatDate(record.maintenance_date)}</td>
                <td>{record.car_vin}</td>
                <td>{record.car_year} {record.car_make} {record.car_model}</td>
                <td>{record.category_name}</td>
                <td>{record.description}</td>
                <td>${formatNumber(record.cost)}</td>
                <td>{record.vendor || '-'}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-primary" 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewCar(record.car_id)
                    }}
                  >
                    {t('cars.carDetails')}
                  </button>
                  <button 
                    className="btn btn-sm btn-secondary" 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditMaintenance(record)
                    }}
                    style={{ marginLeft: '5px' }}
                  >
                    {t('common.edit')}
                  </button>
                  <button 
                    className="btn btn-sm btn-danger" 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteMaintenance(record.id)
                    }}
                    style={{ marginLeft: '5px' }}
                  >
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', fontWeight: 'bold', padding: '12px', backgroundColor: '#f8f9fa', borderTop: '2px solid #dee2e6' }}>
                {t('common.total')}: {filteredRecords.length} {filteredRecords.length === 1 ? t('maintenance.record') : t('maintenance.records')} | {t('maintenance.totalCost')}: ${formatNumber(totalCost)}
              </td>
            </tr>
          </tfoot>
          </table>
        </div>
      </>
    )
  }

  const renderModal = () => {
    if (!showModal) return null
    
    const isEdit = editingRecord !== null
    const modalTitle = isEdit ? t('maintenance.editRecord') : t('maintenance.addRecord')
    
    // Get selected car info for display
    let selectedCarInfo = ''
    if (formData.car_id) {
      const car = cars.find(c => c.id === formData.car_id)
      if (car) {
        selectedCarInfo = `${car.year} ${car.make} ${car.model} (${car.vin})`
      }
    }
    
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>{modalTitle}</h2>
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSaveMaintenance}>
              <div className="form-group">
                <label htmlFor="selectedCarInfo">{t('maintenance.car')}:</label>
                <input 
                  type="text" 
                  value={selectedCarInfo}
                  readOnly 
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">{t('maintenance.category')}:</label>
                <select 
                  name="category_id"
                  className="form-select" 
                  required
                  value={formData.category_id}
                  onChange={handleFormChange}
                >
                  <option value="">{t('common.select')} {t('maintenance.category')}</option>
                                {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">{t('maintenance.description')}:</label>
                <textarea 
                  name="description"
                  required 
                  className="form-control"
                  value={formData.description}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cost">{t('maintenance.cost')}:</label>
                <input 
                  type="number" 
                  name="cost"
                  step="0.01" 
                  min="0" 
                  required 
                  className="form-control"
                  value={formData.cost}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="maintenance_date">{t('maintenance.date')}:</label>
                <input 
                  type="date" 
                  name="maintenance_date"
                  required 
                  className="form-control"
                  value={formData.maintenance_date}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="vendor">{t('maintenance.vendor')}:</label>
                <input 
                  type="text" 
                  name="vendor"
                  className="form-control"
                  value={formData.vendor}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">{t('maintenance.notes')}:</label>
                <textarea 
                  name="notes"
                  className="form-control"
                  value={formData.notes}
                  onChange={handleFormChange}
                />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
              {t('common.cancel')}
            </button>
            {editingRecord && (
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  if (window.confirm(t('messages.confirmDelete') || 'Are you sure you want to delete this maintenance record?')) {
                    handleDeleteMaintenance(editingRecord.id)
                    setShowModal(false)
                  }
                }}
              >
                {t('common.delete')}
              </button>
            )}
            <button className="btn btn-primary" onClick={handleSaveMaintenance}>
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Layout activeRoute="maintenance">
        <Loading />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout activeRoute="maintenance">
        <div className="dashboard-header">
          <h1>{t('maintenance.title')}</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>{t('messages.errorOccurred')}</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadMaintenanceData}>
            {t('common.retry')}
          </button>
        </div>
      </Layout>
    )
  }

  const filteredCars = getFilteredCars()

  return (
    <Layout activeRoute="maintenance">
      <div className="dashboard-header">
        <h1>{t('maintenance.allRecords')}</h1>
        <div className="car-search-container" ref={carSearchRef}>
          <input 
            type="text" 
            placeholder={`${t('common.search')} ${t('maintenance.car')}...`}
            className="car-search-input"
            value={carSearchTerm}
            onChange={handleCarSearch}
            onFocus={handleCarSearch}
          />
          {showCarResults && filteredCars.length > 0 && (
            <div className="car-search-results" style={{ display: 'block' }}>
              {filteredCars.map(car => (
                <div 
                  key={car.id}
                  className="car-search-item"
                  onClick={() => handleCarSelect(car)}
                >
                  <strong>{car.year} {car.make} {car.model}</strong>
                  <small>VIN: {car.vin}</small>
                </div>
              ))}
            </div>
          )}
          <button 
            className="btn btn-primary" 
            disabled={!selectedCarId}
            onClick={handleAddMaintenance}
          >
            {t('maintenance.addRecord')}
          </button>
        </div>
      </div>
      
      <div className="table-container">
        <div className="table-header">
          <div className="search-container">
            <input 
              type="text" 
              placeholder={`${t('common.search')}...`}
              className="search-input"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        <div className="table-wrapper">
          {renderMaintenanceTable()}
        </div>
      </div>
      
      {renderModal()}
    </Layout>
  )
}

export default MaintenancePage 