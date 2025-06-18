import React, { useState, useEffect } from 'react'
import { t } from '../utils/i18n.js'
import { api } from '../utils/api.js'
import Layout, { Loading, EmptyState } from '../components/Layout.jsx'
import { showSuccess, showError, showWarning } from '../utils/snackbar.js'

function CarDetails({ carId }) {
  const [carData, setCarData] = useState(null)
  const [maintenanceRecords, setMaintenanceRecords] = useState([])
  const [maintenanceCategories, setMaintenanceCategories] = useState([])
  const [filteredMaintenance, setFilteredMaintenance] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCarModal, setShowCarModal] = useState(false)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [editingMaintenance, setEditingMaintenance] = useState(null)
  const [carFormData, setCarFormData] = useState({
    vin: '',
    make: '',
    model: '',
    year: '',
    color: '',
    status: 'in_stock',
    purchase_date: '',
    purchase_price: '',
    sale_date: '',
    sale_price: ''
  })
  const [maintenanceFormData, setMaintenanceFormData] = useState({
    category_id: '',
    maintenance_date: new Date().toISOString().split('T')[0],
    description: '',
    cost: '',
    vendor: '',
    notes: ''
  })

  useEffect(() => {
    if (carId) {
      loadCarDetails()
    }
  }, [carId])

  useEffect(() => {
    // Filter maintenance when search term changes
    const filtered = maintenanceRecords.filter(record => {
      const term = searchTerm.toLowerCase()
      const categoryName = record.category ? record.category.name : (record.category_name || '')
      return (
        record.description.toLowerCase().includes(term) ||
        categoryName.toLowerCase().includes(term) ||
        (record.vendor && record.vendor.toLowerCase().includes(term)) ||
        record.maintenance_date.includes(term)
      )
    })
    setFilteredMaintenance(filtered)
  }, [searchTerm, maintenanceRecords])

  const loadCarDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch car data and maintenance records
      const [car, maintenance, categories] = await Promise.all([
        api.getCar(carId),
        api.getMaintenanceRecords(carId),
        api.getMaintenanceCategories()
      ])
      
      setCarData(car)
      setMaintenanceRecords(maintenance)
      setMaintenanceCategories(categories)
      setFilteredMaintenance(maintenance)
    } catch (error) {
      console.error('Failed to load car details:', error)
      setError(error.message)
      showError(t('messages.errorOccurred') + ': ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleEditCar = () => {
    setCarFormData({
      vin: carData.vin || '',
      make: carData.make || '',
      model: carData.model || '',
      year: carData.year || '',
      color: carData.color || '',
      status: carData.status || 'in_stock',
      purchase_date: carData.purchase_date ? carData.purchase_date.split('T')[0] : '',
      purchase_price: carData.purchase_price || '',
      sale_date: carData.sale_date ? carData.sale_date.split('T')[0] : '',
      sale_price: carData.sale_price || ''
    })
    setShowCarModal(true)
  }

  const handleDeleteCar = async () => {
    if (window.confirm(t('messages.confirmDelete') || 'Are you sure you want to delete this car?')) {
      try {
        await api.deleteCar(carId)
        showSuccess(t('messages.carDeleted'))
        if (window.navigate) {
          window.navigate('/cars')
        }
      } catch (error) {
        showError(error.message)
      }
    }
  }

  const handleAddMaintenance = () => {
    setEditingMaintenance(null)
    setMaintenanceFormData({
      category_id: '',
      maintenance_date: new Date().toISOString().split('T')[0],
      description: '',
      cost: '',
      vendor: '',
      notes: ''
    })
    setShowMaintenanceModal(true)
  }

  const handleEditMaintenance = (maintenance) => {
    setEditingMaintenance(maintenance)
    setMaintenanceFormData({
      category_id: maintenance.category_id || '',
      maintenance_date: maintenance.maintenance_date ? maintenance.maintenance_date.split('T')[0] : '',
      description: maintenance.description || '',
      cost: maintenance.cost || '',
      vendor: maintenance.vendor || '',
      notes: maintenance.notes || ''
    })
    setShowMaintenanceModal(true)
  }

  const handleDeleteMaintenance = async (maintenanceId) => {
    if (window.confirm(t('messages.confirmDelete') || 'Are you sure you want to delete this maintenance record?')) {
      try {
        await api.deleteMaintenanceRecord(maintenanceId)
        showSuccess(t('messages.maintenanceDeleted'))
        loadCarDetails()
      } catch (error) {
        showError(error.message)
      }
    }
  }

  const handleCarFormChange = (e) => {
    const { name, value } = e.target
    setCarFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleMaintenanceFormChange = (e) => {
    const { name, value } = e.target
    setMaintenanceFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveCar = async (e) => {
    e.preventDefault()
    
    if (!window.confirm(t('messages.confirmEdit') || 'Are you sure you want to save these changes?')) {
      return
    }
    
    const carDataToSave = {
      vin: carFormData.vin,
      make: carFormData.make,
      model: carFormData.model,
      year: parseInt(carFormData.year),
      color: carFormData.color,
      status: carFormData.status,
      purchase_date: carFormData.purchase_date,
      purchase_price: parseFloat(carFormData.purchase_price),
      sale_date: carFormData.sale_date || null,
      sale_price: carFormData.sale_price ? parseFloat(carFormData.sale_price) : null
    }
    
    try {
      await api.updateCar(carId, carDataToSave)
      showSuccess(t('messages.carUpdated'))
      setShowCarModal(false)
      loadCarDetails()
    } catch (error) {
      showError(error.message)
    }
  }

  const handleSaveMaintenance = async (e) => {
    e.preventDefault()
    
    if (editingMaintenance && !window.confirm(t('messages.confirmEdit') || 'Are you sure you want to save these changes?')) {
      return
    }
    
    const maintenanceDataToSave = {
      car_id: carId,
      category_id: maintenanceFormData.category_id,
      description: maintenanceFormData.description,
      cost: parseFloat(maintenanceFormData.cost),
      maintenance_date: maintenanceFormData.maintenance_date,
      vendor: maintenanceFormData.vendor || null,
      notes: maintenanceFormData.notes || null
    }
    
    try {
      if (editingMaintenance) {
        await api.updateMaintenanceRecord(editingMaintenance.id, maintenanceDataToSave)
        showSuccess(t('messages.maintenanceUpdated'))
      } else {
        await api.createMaintenanceRecord(maintenanceDataToSave)
        showSuccess(t('messages.maintenanceAdded'))
      }
      
      setShowMaintenanceModal(false)
      loadCarDetails()
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const printCarDetails = () => {
    if (!carData || !maintenanceRecords) {
      showWarning('No car details to print')
      return
    }
    
    const totalMaintenanceCost = maintenanceRecords.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0)
    const netProfit = carData.sale_price ? (parseFloat(carData.sale_price) || 0) - (parseFloat(carData.purchase_price) || 0) - totalMaintenanceCost : 0
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    
    // Create print-friendly HTML
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t('cars.carDetails')} - ${carData.year} ${carData.make} ${carData.model}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
            line-height: 1.6;
          }
          .car-header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .car-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2196F3;
          }
          .car-info-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
          }
          .info-card { 
            border: 1px solid #ddd; 
            padding: 15px; 
            border-radius: 8px; 
            background-color: #f9f9f9;
          }
          .info-label { 
            font-weight: bold; 
            color: #555;
            margin-bottom: 5px;
          }
          .info-value { 
            font-size: 18px; 
            color: #333; 
          }
          .status-badge { 
            padding: 6px 12px; 
            border-radius: 20px; 
            font-size: 14px; 
            font-weight: bold; 
            display: inline-block;
          }
          .status-in_stock { background-color: #e8f5e8; color: #2e7d32; }
          .status-sold { background-color: #e3f2fd; color: #1976d2; }
          .status-pending { background-color: #fff3e0; color: #f57c00; }
          .maintenance-section {
            margin-top: 40px;
          }
          .section-title {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
          }
          .maintenance-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
          }
          .maintenance-table th, .maintenance-table td { 
            border: 1px solid #ddd; 
            padding: 10px; 
            text-align: left; 
          }
          .maintenance-table th { 
            background-color: #f5f5f5; 
            font-weight: bold; 
          }
          .maintenance-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .summary-section {
            margin-top: 30px;
            padding: 20px;
            background-color: #f0f8ff;
            border-radius: 8px;
            border: 1px solid #2196F3;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          .summary-item {
            text-align: center;
          }
          .summary-label {
            font-weight: bold;
            color: #555;
            margin-bottom: 5px;
          }
          .summary-value {
            font-size: 20px;
            font-weight: bold;
            color: #2196F3;
          }
          .print-date {
            text-align: right;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="car-header">
          <div class="car-title">${carData.year} ${carData.make} ${carData.model}</div>
          <p><strong>${t('cars.vin')}:</strong> ${carData.vin}</p>
        </div>
        
        <div class="car-info-grid">
          <div class="info-card">
            <div class="info-label">${t('cars.make')}</div>
            <div class="info-value">${carData.make}</div>
          </div>
          <div class="info-card">
            <div class="info-label">${t('cars.model')}</div>
            <div class="info-value">${carData.model}</div>
          </div>
          <div class="info-card">
            <div class="info-label">${t('cars.year')}</div>
            <div class="info-value">${carData.year}</div>
          </div>
          <div class="info-card">
            <div class="info-label">${t('cars.color')}</div>
            <div class="info-value">${carData.color || '-'}</div>
          </div>
          <div class="info-card">
            <div class="info-label">${t('cars.mileage')}</div>
            <div class="info-value">${carData.mileage ? formatNumber(carData.mileage) + ' mi' : '-'}</div>
          </div>
          <div class="info-card">
            <div class="info-label">${t('cars.status')}</div>
            <div class="info-value">
              <span class="status-badge status-${carData.status}">${t('status.' + carData.status)}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-label">${t('cars.purchaseDate')}</div>
            <div class="info-value">${carData.purchase_date ? formatDate(carData.purchase_date) : '-'}</div>
          </div>
          <div class="info-card">
            <div class="info-label">${t('cars.purchasePrice')}</div>
            <div class="info-value">$${formatNumber(parseFloat(carData.purchase_price) || 0)}</div>
          </div>
          <div class="info-card">
            <div class="info-label">${t('cars.saleDate')}</div>
            <div class="info-value">${carData.sale_date ? formatDate(carData.sale_date) : '-'}</div>
          </div>
          <div class="info-card">
            <div class="info-label">${t('cars.salePrice')}</div>
            <div class="info-value">${carData.sale_price ? '$' + formatNumber(parseFloat(carData.sale_price) || 0) : '-'}</div>
          </div>
        </div>
        
        <div class="summary-section">
          <div class="section-title">${t('reports.summary')}</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">${t('cars.totalMaintenanceCost')}</div>
              <div class="summary-value">$${formatNumber(totalMaintenanceCost)}</div>
            </div>
            ${carData.sale_price ? `
            <div class="summary-item">
              <div class="summary-label">${t('dashboard.netProfit')}</div>
              <div class="summary-value">$${formatNumber(netProfit)}</div>
            </div>
            ` : ''}
          </div>
        </div>
        
        ${maintenanceRecords.length > 0 ? `
        <div class="maintenance-section">
          <div class="section-title">${t('cars.maintenanceRecords')} (${maintenanceRecords.length})</div>
          <table class="maintenance-table">
            <thead>
              <tr>
                <th>${t('maintenance.date')}</th>
                <th>${t('maintenance.category')}</th>
                <th>${t('maintenance.description')}</th>
                <th>${t('maintenance.cost')}</th>
                <th>${t('maintenance.vendor')}</th>
              </tr>
            </thead>
            <tbody>
              ${maintenanceRecords.map(record => `
                <tr>
                  <td>${formatDate(record.maintenance_date)}</td>
                  <td>${record.category ? record.category.name : (record.category_name || '-')}</td>
                  <td>${record.description}</td>
                  <td>$${formatNumber(parseFloat(record.cost) || 0)}</td>
                  <td>${record.vendor || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : `
        <div class="maintenance-section">
          <div class="section-title">${t('cars.maintenanceRecords')}</div>
          <p style="text-align: center; color: #666; font-style: italic;">${t('maintenance.noRecords')}</p>
        </div>
        `}
        
        <div class="print-date">
          ${t('reports.printReport')} - ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(printHTML)
    printWindow.document.close()
    
    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.print()
    }
  }

  const renderMaintenanceTable = () => {
    if (filteredMaintenance.length === 0) {
      return <EmptyState message={t('maintenance.noRecords')} icon="🔧" />
    }
    
    return (
      <table className="data-table">
        <thead>
          <tr>
            <th>{t('maintenance.date')}</th>
            <th>{t('maintenance.category')}</th>
            <th>{t('maintenance.description')}</th>
            <th>{t('maintenance.cost')}</th>
            <th>{t('maintenance.vendor')}</th>
            <th>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredMaintenance.map(record => (
            <tr 
              key={record.id} 
              className="maintenance-row"
              onClick={() => handleEditMaintenance(record)}
              style={{ cursor: 'pointer' }}
            >
              <td>{formatDate(record.maintenance_date)}</td>
              <td>{record.category ? record.category.name : (record.category_name || '-')}</td>
              <td>{record.description}</td>
              <td>${formatNumber(record.cost)}</td>
              <td>{record.vendor || '-'}</td>
              <td>
                <button 
                  className="btn btn-sm btn-secondary" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditMaintenance(record)
                  }}
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
      </table>
    )
  }

  const renderCarModal = () => {
    if (!showCarModal) return null
    
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>{t('cars.editCar')}</h2>
            <button className="modal-close" onClick={() => setShowCarModal(false)}>×</button>
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
                    value={carFormData.vin}
                    onChange={handleCarFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="make">{t('cars.make')}</label>
                  <input 
                    type="text" 
                    name="make" 
                    className="form-control" 
                    required 
                    value={carFormData.make}
                    onChange={handleCarFormChange}
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
                    value={carFormData.model}
                    onChange={handleCarFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="year">{t('cars.year')}</label>
                  <input 
                    type="number" 
                    name="year" 
                    className="form-control" 
                    required 
                    value={carFormData.year}
                    onChange={handleCarFormChange}
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
                    value={carFormData.color}
                    onChange={handleCarFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="status">{t('cars.status')}</label>
                  <select 
                    name="status" 
                    className="form-select"
                    value={carFormData.status}
                    onChange={handleCarFormChange}
                  >
                    <option value="in_stock">{t('status.in_stock')}</option>
                    <option value="sold">{t('status.sold')}</option>
                    <option value="pending">{t('status.pending')}</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="purchase_date">{t('cars.purchaseDate')}</label>
                  <input 
                    type="date" 
                    name="purchase_date" 
                    className="form-control" 
                    required 
                    value={carFormData.purchase_date}
                    onChange={handleCarFormChange}
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
                    value={carFormData.purchase_price}
                    onChange={handleCarFormChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sale_date">{t('cars.saleDate')}</label>
                  <input 
                    type="date" 
                    name="sale_date" 
                    className="form-control" 
                    value={carFormData.sale_date}
                    onChange={handleCarFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="sale_price">{t('cars.salePrice')}</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="sale_price" 
                    className="form-control" 
                    value={carFormData.sale_price}
                    onChange={handleCarFormChange}
                  />
                </div>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowCarModal(false)}>
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

  const renderMaintenanceModal = () => {
    if (!showMaintenanceModal) return null
    
    const isEdit = editingMaintenance !== null
    const modalTitle = isEdit ? t('maintenance.editRecord') : t('maintenance.addRecord')
    
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>{modalTitle}</h2>
            <button className="modal-close" onClick={() => setShowMaintenanceModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSaveMaintenance}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">{t('maintenance.category')}</label>
                  <select 
                    name="category_id" 
                    className="form-select" 
                    required
                    value={maintenanceFormData.category_id}
                    onChange={handleMaintenanceFormChange}
                  >
                    <option value="">{t('common.select')}...</option>
                                  {maintenanceCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="maintenance_date">{t('maintenance.date')}</label>
                  <input 
                    type="date" 
                    name="maintenance_date" 
                    className="form-control" 
                    required 
                    value={maintenanceFormData.maintenance_date}
                    onChange={handleMaintenanceFormChange}
                  />
                </div>
              </div>
              <div className="form-row single">
                <div className="form-group">
                  <label htmlFor="description">{t('maintenance.description')}</label>
                  <input 
                    type="text" 
                    name="description" 
                    className="form-control" 
                    required 
                    value={maintenanceFormData.description}
                    onChange={handleMaintenanceFormChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cost">{t('maintenance.cost')}</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="cost" 
                    className="form-control" 
                    required 
                    value={maintenanceFormData.cost}
                    onChange={handleMaintenanceFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vendor">{t('maintenance.vendor')}</label>
                  <input 
                    type="text" 
                    name="vendor" 
                    className="form-control" 
                    value={maintenanceFormData.vendor}
                    onChange={handleMaintenanceFormChange}
                  />
                </div>
              </div>
              <div className="form-row single">
                <div className="form-group">
                  <label htmlFor="notes">{t('maintenance.notes')}</label>
                  <textarea 
                    name="notes" 
                    className="form-control" 
                    rows="3"
                    value={maintenanceFormData.notes}
                    onChange={handleMaintenanceFormChange}
                  />
                </div>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowMaintenanceModal(false)}>
              {t('common.cancel')}
            </button>
            {editingMaintenance && (
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  if (window.confirm(t('messages.confirmDelete') || 'Are you sure you want to delete this maintenance record?')) {
                    handleDeleteMaintenance(editingMaintenance.id)
                    setShowMaintenanceModal(false)
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
      <Layout activeRoute="cars">
        <Loading />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout activeRoute="cars">
        <div className="dashboard-header">
          <h1>{t('cars.carDetails')}</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>{t('messages.errorOccurred')}</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadCarDetails}>
            {t('common.retry') || 'Retry'}
          </button>
        </div>
      </Layout>
    )
  }

  if (!carData) {
    return (
      <Layout activeRoute="cars">
        <EmptyState message="Car not found" icon="🚗" />
      </Layout>
    )
  }

  const totalMaintenanceCost = maintenanceRecords.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0)

  return (
    <Layout activeRoute="cars">
      <div className="dashboard-header">
        <h1>{t('cars.carDetails')}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handleEditCar}>
            {t('cars.editCar')}
          </button>
          <button className="btn btn-info" onClick={printCarDetails}>
            {t('cars.printDetails')}
          </button>
          <button className="btn btn-danger" onClick={handleDeleteCar}>
            {t('common.delete')}
          </button>
        </div>
      </div>
      
      {/* Car Information */}
      <div className="table-container" style={{ marginBottom: '30px' }}>
        <div className="table-header">
          <h2>{carData.year} {carData.make} {carData.model}</h2>
          <span className={`status-badge status-${carData.status}`}>
            {t('status.' + carData.status)}
          </span>
        </div>
        <div style={{ padding: '20px' }}>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{t('cars.vin')}</h3>
              <div className="stat-value" style={{ fontSize: '1.2rem' }}>{carData.vin}</div>
            </div>
            <div className="stat-card">
              <h3>{t('cars.color')}</h3>
              <div className="stat-value" style={{ fontSize: '1.2rem' }}>{carData.color || '-'}</div>
            </div>
            <div className="stat-card">
              <h3>{t('cars.mileage')}</h3>
              <div className="stat-value" style={{ fontSize: '1.2rem' }}>
                {carData.mileage ? formatNumber(carData.mileage) + ' mi' : '-'}
              </div>
            </div>
            <div className="stat-card">
              <h3>{t('cars.purchasePrice')}</h3>
              <div className="stat-value">${formatNumber(parseFloat(carData.purchase_price) || 0)}</div>
            </div>
            <div className="stat-card">
              <h3>{t('cars.salePrice')}</h3>
              <div className="stat-value">
                {carData.sale_price ? '$' + formatNumber(parseFloat(carData.sale_price) || 0) : '-'}
              </div>
            </div>
            <div className="stat-card expense">
              <h3>{t('cars.totalMaintenanceCost')}</h3>
              <div className="stat-value">${formatNumber(totalMaintenanceCost)}</div>
            </div>
            <div className={`stat-card ${carData.sale_price ? 'profit' : ''}`}>
              <h3>{t('dashboard.netProfit')}</h3>
              <div className="stat-value">
                {carData.sale_price ? 
                  '$' + formatNumber((parseFloat(carData.sale_price) || 0) - (parseFloat(carData.purchase_price) || 0) - totalMaintenanceCost) : 
                  '-'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Maintenance Records */}
      <div className="table-container">
        <div className="table-header">
          <h2>{t('cars.maintenanceRecords')}</h2>
          <div className="table-controls">
            <div className="search-box">
              <input 
                type="text" 
                placeholder={t('common.search') + '...'}
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <button className="btn btn-primary" onClick={handleAddMaintenance}>
              {t('cars.addMaintenance')}
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          {renderMaintenanceTable()}
        </div>
      </div>
      
      {renderCarModal()}
      {renderMaintenanceModal()}
    </Layout>
  )
}

export default CarDetails 