import React, { useState, useEffect, useRef } from 'react'
import { t } from '../utils/i18n.js'
import { api } from '../utils/api.js'
import Layout, { Loading, EmptyState } from '../components/Layout.jsx'
import { showSuccess, showError, showWarning } from '../utils/snackbar.js'
import vinDecoder from '../utils/vinDecoder.js'

function CarsPage() {
  const [carsData, setCarsData] = useState([])
  const [filteredCars, setFilteredCars] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')
  const [showModal, setShowModal] = useState(false)
  const [editingCar, setEditingCar] = useState(null)
  const [formData, setFormData] = useState({
    vin: '',
    make: '',
    model: '',
    year: '',
    color: '',
    mileage: '',
    purchase_date: '',
    purchase_price: '',
    sale_date: '',
    sale_price: '',
    status: 'in_stock'
  })
  const [vinDecoding, setVinDecoding] = useState(false)
  const decodeTimeoutRef = useRef(null)

  useEffect(() => {
    loadCarsData()
  }, [])

  useEffect(() => {
    // Filter cars when search term changes
    const filtered = carsData.filter(car => {
      const term = searchTerm.toLowerCase()
      return (
        car.vin.toLowerCase().includes(term) ||
        car.make.toLowerCase().includes(term) ||
        car.model.toLowerCase().includes(term) ||
        car.year.toString().includes(term) ||
        (car.color && car.color.toLowerCase().includes(term)) ||
        car.status.toLowerCase().includes(term)
      )
    })
    setFilteredCars(filtered)
  }, [searchTerm, carsData])

  const loadCarsData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await api.getCars()
      setCarsData(data)
      setFilteredCars(data)
    } catch (error) {
      console.error('Failed to load cars:', error)
      setError(error.message)
      showError(t('messages.errorOccurred') + ': ' + error.message)
    } finally {
      setIsLoading(false)
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
    
    const sorted = [...filteredCars].sort((a, b) => {
      let aVal = a[column]
      let bVal = b[column]
      
      // Handle null/undefined values
      if (aVal == null) aVal = ''
      if (bVal == null) bVal = ''
      
      // Convert to string for comparison
      aVal = aVal.toString().toLowerCase()
      bVal = bVal.toString().toLowerCase()
      
      if (newDirection === 'asc') {
        return aVal.localeCompare(bVal)
      } else {
        return bVal.localeCompare(aVal)
      }
    })
    
    setFilteredCars(sorted)
  }

  const getSortIcon = (column) => {
    if (sortColumn !== column) return ''
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const handleCarRowClick = (carId) => {
    if (window.navigate) {
      window.navigate(`/cars/${carId}`)
    }
  }

  const handleAddCar = () => {
    setEditingCar(null)
    setFormData({
      vin: '',
      make: '',
      model: '',
      year: '',
      color: '',
      mileage: '',
      purchase_date: '',
      purchase_price: '',
      sale_date: '',
      sale_price: '',
      status: 'in_stock'
    })
    setShowModal(true)
  }

  const handleEditCar = (car) => {
    setEditingCar(car)
    setFormData({
      vin: car.vin || '',
      make: car.make || '',
      model: car.model || '',
      year: car.year || '',
      color: car.color || '',
      mileage: car.mileage || '',
      purchase_date: car.purchase_date ? car.purchase_date.split('T')[0] : '',
      purchase_price: car.purchase_price || '',
      sale_date: car.sale_date ? car.sale_date.split('T')[0] : '',
      sale_price: car.sale_price || '',
      status: car.status || 'in_stock'
    })
    setShowModal(true)
  }

  const handleDeleteCar = async (carId) => {
    if (window.confirm(t('messages.confirmDelete'))) {
      try {
        await api.deleteCar(carId)
        showSuccess(t('messages.carDeleted'))
        loadCarsData()
      } catch (error) {
        showError(error.message)
      }
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleVinChange = async (e) => {
    const vin = e.target.value.trim()
    handleFormChange(e)
    
    // Clear previous timeout
    if (decodeTimeoutRef.current) {
      clearTimeout(decodeTimeoutRef.current)
    }
    
    // Only decode if we have a 17-character VIN and we're adding a new car
    if (vin.length >= 17 && !editingCar) {
      setVinDecoding(true)
      
      // Decode with a small delay to avoid too many API calls
      decodeTimeoutRef.current = setTimeout(async () => {
        try {
          const decoded = await vinDecoder.decode(vin)
          
          if (decoded.isValid) {
            // Populate fields with decoded data
            setFormData(prev => ({
              ...prev,
              make: decoded.make || prev.make,
              model: decoded.model || prev.model,
              year: decoded.year || prev.year,
              color: decoded.color || prev.color
            }))
            
            showSuccess('VIN decoded successfully!')
          } else {
            throw new Error('Invalid VIN format')
          }
        } catch (error) {
          console.warn('VIN decode error:', error)
          if (vin.length === 17) {
            showWarning('Could not decode VIN. Please check the VIN number or enter details manually.')
          }
        } finally {
          setVinDecoding(false)
        }
      }, 1000)
    } else {
      setVinDecoding(false)
    }
  }

  const handleSaveCar = async (e) => {
    e.preventDefault()
    
    // Show confirmation for edit operations
    if (editingCar && !window.confirm(t('messages.confirmEdit') || 'Are you sure you want to save these changes?')) {
      return
    }
    
    const carData = {
      vin: formData.vin,
      make: formData.make,
      model: formData.model,
      year: parseInt(formData.year),
      color: formData.color,
      mileage: formData.mileage ? parseInt(formData.mileage) : null,
      purchase_date: formData.purchase_date,
      purchase_price: parseFloat(formData.purchase_price)
    }
    
    // Only include sale data and status for edit mode
    if (editingCar) {
      carData.status = formData.status
      carData.sale_date = formData.sale_date || null
      carData.sale_price = formData.sale_price ? parseFloat(formData.sale_price) : null
    }
    
    try {
      if (editingCar) {
        await api.updateCar(editingCar.id, carData)
        showSuccess(t('messages.carUpdated'))
      } else {
        await api.createCar(carData)
        showSuccess(t('messages.carAdded'))
      }
      
      setShowModal(false)
      loadCarsData()
    } catch (error) {
      showError(error.message)
    }
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const renderCarsTable = () => {
    if (filteredCars.length === 0) {
      return <EmptyState message={t('cars.noResults')} icon="🚗" />
    }
    
    return (
      <div className="table-wrapper">
        <table className="data-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => handleSort('vin')}>
              {t('cars.vin')} {getSortIcon('vin')}
            </th>
            <th className="sortable" onClick={() => handleSort('make')}>
              {t('cars.make')} {getSortIcon('make')}
            </th>
            <th className="sortable" onClick={() => handleSort('model')}>
              {t('cars.model')} {getSortIcon('model')}
            </th>
            <th className="sortable" onClick={() => handleSort('year')}>
              {t('cars.year')} {getSortIcon('year')}
            </th>
            <th className="sortable" onClick={() => handleSort('color')}>
              {t('cars.color')} {getSortIcon('color')}
            </th>
            <th className="sortable" onClick={() => handleSort('mileage')}>
              {t('cars.mileage')} {getSortIcon('mileage')}
            </th>
            <th className="sortable" onClick={() => handleSort('purchase_price')}>
              {t('cars.purchasePrice')} {getSortIcon('purchase_price')}
            </th>
            <th className="sortable" onClick={() => handleSort('sale_price')}>
              {t('cars.salePrice')} {getSortIcon('sale_price')}
            </th>
            <th className="sortable" onClick={() => handleSort('status')}>
              {t('cars.status')} {getSortIcon('status')}
            </th>
            <th>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredCars.map(car => (
            <tr 
              key={car.id} 
              className="car-row" 
              onClick={() => handleCarRowClick(car.id)}
              style={{ cursor: 'pointer' }}
            >
              <td>{car.vin}</td>
              <td>{car.make}</td>
              <td>{car.model}</td>
              <td>{car.year}</td>
              <td>{car.color || '-'}</td>
              <td>{car.mileage ? formatNumber(car.mileage) + ' mi' : '-'}</td>
              <td>${formatNumber(car.purchase_price)}</td>
              <td>{car.sale_price ? '$' + formatNumber(car.sale_price) : '-'}</td>
              <td>
                <span className={`status-badge status-${car.status}`}>
                  {t('status.' + car.status)}
                </span>
              </td>
              <td>
                <button 
                  className="btn btn-sm btn-secondary" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditCar(car)
                  }}
                >
                  {t('common.edit')}
                </button>
                <button 
                  className="btn btn-sm btn-danger" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteCar(car.id)
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
            <td colSpan="10" style={{ textAlign: 'center', fontWeight: 'bold', padding: '12px', backgroundColor: '#f8f9fa', borderTop: '2px solid #dee2e6' }}>
              {t('common.total')}: {filteredCars.length} {filteredCars.length === 1 ? t('cars.car') : t('cars.cars')}
            </td>
          </tr>
        </tfoot>
        </table>
      </div>
    )
  }

  const renderModal = () => {
    if (!showModal) return null
    
    const isEdit = editingCar !== null
    const modalTitle = isEdit ? t('cars.editCar') : t('cars.addCar')
    
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>{modalTitle}</h2>
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSaveCar}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="vin">{t('cars.vin')}</label>
                  <input 
                    type="text" 
                    name="vin" 
                    className="form-control" 
                    required 
                    value={formData.vin}
                    onChange={handleVinChange}
                    placeholder="Enter VIN to auto-populate fields"
                    style={{
                      borderColor: vinDecoding ? '#ffc107' : '',
                      backgroundColor: vinDecoding ? '#fff3cd' : ''
                    }}
                  />
                  {!isEdit && (
                    <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                      Enter a VIN number to automatically populate make, model, year, and color
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="make">{t('cars.make')}</label>
                  <input 
                    type="text" 
                    name="make" 
                    className="form-control" 
                    required 
                    value={formData.make}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="model">{t('cars.model')}</label>
                  <input 
                    type="text" 
                    name="model" 
                    className="form-control" 
                    required 
                    value={formData.model}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="year">{t('cars.year')}</label>
                  <input 
                    type="number" 
                    name="year" 
                    className="form-control" 
                    required 
                    value={formData.year}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="color">{t('cars.color')}</label>
                  <input 
                    type="text" 
                    name="color" 
                    className="form-control" 
                    value={formData.color}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="mileage">{t('cars.mileage')}</label>
                  <input 
                    type="number" 
                    name="mileage" 
                    className="form-control" 
                    min="0" 
                    value={formData.mileage}
                    onChange={handleFormChange}
                    placeholder="e.g., 50000"
                  />
                </div>
              </div>
              {isEdit && (
                <div className="form-row single">
                  <div className="form-group">
                    <label htmlFor="status">{t('cars.status')}</label>
                    <select 
                      name="status" 
                      className="form-select"
                      value={formData.status}
                      onChange={handleFormChange}
                    >
                      <option value="in_stock">{t('status.in_stock')}</option>
                      <option value="sold">{t('status.sold')}</option>
                      <option value="pending">{t('status.pending')}</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="purchase_date">{t('cars.purchaseDate')}</label>
                  <input 
                    type="date" 
                    name="purchase_date" 
                    className="form-control" 
                    required 
                    value={formData.purchase_date}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="purchase_price">{t('cars.purchasePrice')}</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="purchase_price" 
                    className="form-control" 
                    required 
                    value={formData.purchase_price}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              {isEdit && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sale_date">{t('cars.saleDate')}</label>
                    <input 
                      type="date" 
                      name="sale_date" 
                      className="form-control" 
                      value={formData.sale_date}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="sale_price">{t('cars.salePrice')}</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="sale_price" 
                      className="form-control" 
                      value={formData.sale_price}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
              )}
            </form>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSaveCar}>
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Layout activeRoute="cars">
        <Loading />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout activeRoute="cars">
        <div className="dashboard-header">
          <h1>{t('cars.title')}</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>{t('messages.errorOccurred')}</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadCarsData}>
            {t('common.retry') || 'Retry'}
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout activeRoute="cars">
      <div className="table-container">
        <div className="table-header">
          <h2>{t('cars.title')}</h2>
          <div className="table-controls">
            <div className="search-box">
              <input 
                type="text" 
                placeholder={t('cars.search')}
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <button className="btn btn-primary" onClick={handleAddCar}>
              {t('cars.addCar')}
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          {renderCarsTable()}
        </div>
      </div>
      {renderModal()}
    </Layout>
  )
}

export default CarsPage 