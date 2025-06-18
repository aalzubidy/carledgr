import React, { useState, useEffect } from 'react'
import { t } from '../utils/i18n.js'
import { api } from '../utils/api.js'
import Layout, { Loading, EmptyState } from '../components/Layout.jsx'
import { showSuccess, showError, showWarning } from '../utils/snackbar.js'

function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reportType, setReportType] = useState('inventory')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [reportData, setReportData] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    loadReport()
  }, [reportType]) // Only trigger when report type changes
  
  useEffect(() => {
    if (reportType === 'maintenance' && categories.length === 0) {
      loadCategories()
    }
  }, [reportType]) // Load categories when switching to maintenance report
  
  useEffect(() => {
    if (reportType === 'maintenance') {
      loadReport()
    }
  }, [selectedCategory]) // Trigger when category changes for maintenance reports

  const loadCategories = async () => {
    try {
      const categoriesData = await api.getMaintenanceCategories()
      setCategories(categoriesData)
    } catch (error) {
      console.error('Failed to load categories:', error)
      // Don't show error for categories as it's not critical
    }
  }

  const loadReport = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      let data
      
      switch (reportType) {
        case 'inventory':
          data = await api.getInventoryReport(dateRange)
          break
        case 'sales':
          // Get both sales and profit data for combined report
          const salesData = await api.getSalesReport(dateRange)
          const profitData = await api.getProfitReport(dateRange)
          
          // Combine the data
          data = {
            ...salesData,
            monthly: profitData.monthly || [],
            by_make: profitData.by_make || []
          }
          break
        case 'maintenance':
          data = await api.getMaintenanceReport(dateRange, selectedCategory || null)
          break
        default:
          throw new Error('Unknown report type')
      }
      
      setReportData(data)
    } catch (error) {
      console.error('Failed to load report:', error)
      setError(error.message)
      showError(t('messages.errorOccurred') + ': ' + error.message)
    } finally {
      setIsLoading(false)
      setIsGenerating(false)
    }
  }

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value)
    setReportData(null) // Clear previous report data
    setSelectedCategory('') // Clear category filter when switching report types
  }

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value)
  }

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGenerate = () => {
    loadReport()
  }

  const handleClearDates = () => {
    setDateRange({ start: '', end: '' })
    // Reload report with cleared dates
    setTimeout(() => loadReport(), 100)
  }

  const handlePrint = () => {
    if (!reportData) {
      showWarning('No report data to print')
      return
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    
    // Create print-friendly HTML
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t('reports.title')} - ${t('reports.' + reportType)}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
            line-height: 1.6;
          }
          .report-header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .report-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2196F3;
          }
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
          }
          .stat-card { 
            border: 1px solid #ddd; 
            padding: 15px; 
            border-radius: 8px; 
            background-color: #f9f9f9;
            text-align: center;
          }
          .stat-label { 
            font-weight: bold; 
            color: #555;
            margin-bottom: 5px;
          }
          .stat-value { 
            font-size: 24px; 
            color: #333; 
            font-weight: bold;
          }
          .data-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
          }
          .data-table th, .data-table td { 
            border: 1px solid #ddd; 
            padding: 10px; 
            text-align: left; 
          }
          .data-table th { 
            background-color: #f5f5f5; 
            font-weight: bold; 
          }
          .data-table tr:nth-child(even) {
            background-color: #f9f9f9;
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
        <div class="report-header">
          <div class="report-title">${t('reports.title')} - ${t('reports.' + reportType)}</div>
          ${dateRange.start || dateRange.end ? `<p>Period: ${dateRange.start || 'All'} to ${dateRange.end || 'All'}</p>` : ''}
        </div>
        
        ${renderPrintContent()}
        
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

  const renderPrintContent = () => {
    if (!reportData) return ''
    
    switch (reportType) {
      case 'inventory':
        return renderInventoryPrintContent()
      case 'sales':
        return renderSalesPrintContent()
      case 'maintenance':
        return renderMaintenancePrintContent()
      default:
        return ''
    }
  }

  const renderInventoryPrintContent = () => {
    const { cars, totals } = reportData || {}
    
    if (!cars) return ''
    
    const inStockCars = cars.filter(car => car.status === 'in_stock')
    const soldCars = cars.filter(car => car.status === 'sold')
    const pendingCars = cars.filter(car => car.status === 'pending')
    const currentInventoryValue = inStockCars.reduce((sum, car) => sum + (parseFloat(car.purchase_price) || 0), 0)
    
    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">${t('dashboard.totalCars')}</div>
          <div class="stat-value">${cars.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('dashboard.inStock')}</div>
          <div class="stat-value">${inStockCars.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('dashboard.sold')}</div>
          <div class="stat-value">${soldCars.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('dashboard.currentInventoryValue')}</div>
          <div class="stat-value">$${formatNumber(currentInventoryValue)}</div>
        </div>
      </div>
      
      <table class="data-table">
        <thead>
          <tr>
            <th>${t('cars.vin')}</th>
            <th>${t('cars.make')}</th>
            <th>${t('cars.model')}</th>
            <th>${t('cars.year')}</th>
            <th>${t('cars.status')}</th>
            <th>${t('cars.purchasePrice')}</th>
          </tr>
        </thead>
        <tbody>
          ${cars.map(car => `
            <tr>
              <td>${car.vin}</td>
              <td>${car.make}</td>
              <td>${car.model}</td>
              <td>${car.year}</td>
              <td>${t('status.' + car.status)}</td>
              <td>$${formatNumber(parseFloat(car.purchase_price) || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  }

  const renderSalesPrintContent = () => {
    const { cars, totals, monthly, by_make } = reportData || {}
    
    if (!cars || !totals) return ''
    
    let content = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">${t('reports.totalSales')}</div>
          <div class="stat-value">${totals.count}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('reports.totalRevenue')}</div>
          <div class="stat-value">$${formatNumber(totals.sale_value)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('reports.totalCost')}</div>
          <div class="stat-value">$${formatNumber(totals.purchase_value)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('reports.totalMaintenanceCost')}</div>
          <div class="stat-value">$${formatNumber(totals.maintenance_cost)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('reports.netProfit')}</div>
          <div class="stat-value">$${formatNumber(totals.net_profit)}</div>
        </div>
      </div>
    `
    
    // Add monthly breakdown if available
    if (monthly && monthly.length > 0) {
      content += `
        <h3>${t('reports.monthly')}</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>${t('common.date')}</th>
              <th>${t('reports.totalSales')}</th>
              <th>${t('reports.totalRevenue')}</th>
              <th>${t('reports.grossProfit')}</th>
            </tr>
          </thead>
          <tbody>
            ${monthly.map(month => `
              <tr>
                <td>${month.month}</td>
                <td>${month.cars_sold}</td>
                <td>$${formatNumber(month.total_sales)}</td>
                <td>$${formatNumber(month.gross_profit)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    }
    
    // Add by make breakdown if available
    if (by_make && by_make.length > 0) {
      content += `
        <h3>${t('reports.byMake')}</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>${t('cars.make')}</th>
              <th>${t('reports.totalSales')}</th>
              <th>${t('reports.totalRevenue')}</th>
              <th>${t('reports.grossProfit')}</th>
              <th>${t('reports.averageProfit')}</th>
            </tr>
          </thead>
          <tbody>
            ${by_make.map(make => `
              <tr>
                <td>${make.make}</td>
                <td>${make.cars_sold}</td>
                <td>$${formatNumber(make.total_sales)}</td>
                <td>$${formatNumber(make.gross_profit)}</td>
                <td>$${formatNumber(make.avg_profit_per_car)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    }
    
    // Add details table
    content += `
      <h3>${t('reports.details')}</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>${t('cars.vin')}</th>
            <th>${t('cars.make')}</th>
            <th>${t('cars.model')}</th>
            <th>${t('cars.saleDate')}</th>
            <th>${t('cars.purchasePrice')}</th>
            <th>${t('cars.salePrice')}</th>
            <th>${t('reports.totalMaintenanceCost')}</th>
            <th>${t('reports.grossProfit')}</th>
            <th>${t('reports.netProfit')}</th>
          </tr>
        </thead>
        <tbody>
          ${cars.map(car => `
            <tr>
              <td>${car.vin}</td>
              <td>${car.make}</td>
              <td>${car.model}</td>
              <td>${formatDate(car.sale_date)}</td>
              <td>$${formatNumber(car.purchase_price)}</td>
              <td>$${formatNumber(car.sale_price)}</td>
              <td>$${formatNumber(car.total_maintenance_cost || 0)}</td>
              <td>$${formatNumber(car.profit || 0)}</td>
              <td>$${formatNumber(car.net_profit || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    
    return content
  }

  const renderMaintenancePrintContent = () => {
    const { cars, total_cost, record_count, category_rankings, model_rankings } = reportData || {}
    
    if (!cars) return ''
    
    // Calculate additional metrics properly
    const totalCarCost = cars.reduce((sum, car) => sum + (parseFloat(car.purchase_price) || 0), 0)
    const totalMaintenanceCost = parseFloat(total_cost) || 0
    const totalInvestment = totalCarCost + totalMaintenanceCost
    
    let content = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">${t('maintenance.allRecords')}</div>
          <div class="stat-value">${record_count}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('reports.totalCarCost')}</div>
          <div class="stat-value">$${formatNumber(totalCarCost)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('reports.totalMaintenanceCost')}</div>
          <div class="stat-value">$${formatNumber(totalMaintenanceCost)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('reports.totalInvestment')}</div>
          <div class="stat-value">$${formatNumber(totalInvestment)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('dashboard.totalCars')}</div>
          <div class="stat-value">${cars.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('reports.averageProfit')}</div>
          <div class="stat-value">$${formatNumber(cars.length > 0 ? totalMaintenanceCost / cars.length : 0)}</div>
        </div>
      </div>
    `
    
    // Add category rankings if available
    if (category_rankings && category_rankings.length > 0) {
      content += `
        <h3>${t('reports.categoryRankings')}</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>${t('maintenance.category')}</th>
              <th>${t('maintenance.allRecords')}</th>
              <th>${t('maintenance.totalCost')}</th>
              <th>${t('reports.averageCost')}</th>
            </tr>
          </thead>
          <tbody>
            ${category_rankings.map(category => `
              <tr>
                <td>${t('categories.' + category.category_name) || category.category_name}</td>
                <td>${category.record_count}</td>
                <td>$${formatNumber(category.total_cost)}</td>
                <td>$${formatNumber(category.avg_cost)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    }
    
    // Add model rankings if available
    if (model_rankings && model_rankings.length > 0) {
      content += `
        <h3>${t('reports.modelRankings')}</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>${t('cars.make')}</th>
              <th>${t('cars.model')}</th>
              <th>${t('dashboard.totalCars')}</th>
              <th>${t('maintenance.totalCost')}</th>
              <th>${t('reports.avgCostPerCar')}</th>
            </tr>
          </thead>
          <tbody>
            ${model_rankings.map(model => `
              <tr>
                <td>${model.make}</td>
                <td>${model.model}</td>
                <td>${model.car_count}</td>
                <td>$${formatNumber(model.total_cost)}</td>
                <td>$${formatNumber(model.avg_cost_per_car)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    }
    
    // Add details table
    content += `
      <h3>${t('reports.details')}</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>${t('cars.vin')}</th>
            <th>${t('cars.make')}</th>
            <th>${t('cars.model')}</th>
            <th>${t('cars.status')}</th>
            <th>${t('maintenance.allRecords')}</th>
            <th>${t('reports.totalMaintenanceCost')}</th>
          </tr>
        </thead>
        <tbody>
          ${cars.map(car => `
            <tr>
              <td>${car.vin}</td>
              <td>${car.make}</td>
              <td>${car.model}</td>
              <td>${t('status.' + car.status)}</td>
              <td>${car.maintenance_records ? car.maintenance_records.length : 0}</td>
              <td>$${formatNumber(car.total_cost || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    
    return content
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatNumber = (num) => {
    const number = parseFloat(num) || 0
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number)
  }

  const renderInventoryReport = () => {
    const { cars, totals } = reportData || {}
    
    if (!cars) {
      return <EmptyState message={t('common.loading')} icon="📋" />
    }
    
    const inStockCars = cars.filter(car => car.status === 'in_stock')
    const soldCars = cars.filter(car => car.status === 'sold')
    const pendingCars = cars.filter(car => car.status === 'pending')
    const currentInventoryValue = inStockCars.reduce((sum, car) => sum + (parseFloat(car.purchase_price) || 0), 0)
    
    return (
      <>
        <div className="report-summary">
          <h2>{t('reports.inventory')} - {t('reports.summary')}</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{t('dashboard.totalCars')}</h3>
              <div className="stat-value">{cars.length}</div>
            </div>
            <div className="stat-card">
              <h3>{t('dashboard.inStock')}</h3>
              <div className="stat-value">{inStockCars.length}</div>
            </div>
            <div className="stat-card">
              <h3>{t('dashboard.sold')}</h3>
              <div className="stat-value">{soldCars.length}</div>
            </div>
            <div className="stat-card">
              <h3>{t('dashboard.pending')}</h3>
              <div className="stat-value">{pendingCars.length}</div>
            </div>
            <div className="stat-card">
              <h3>{t('dashboard.currentInventoryValue')}</h3>
              <div className="stat-value">${formatNumber(currentInventoryValue)}</div>
            </div>
          </div>
        </div>
        
        <div className="report-table">
          <h3>{t('reports.inventoryDetails')}</h3>
          {cars.length === 0 ? (
            <EmptyState message={t('common.noData')} icon="📋" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('cars.vin')}</th>
                  <th>{t('cars.make')}</th>
                  <th>{t('cars.model')}</th>
                  <th>{t('cars.year')}</th>
                  <th>{t('cars.status')}</th>
                  <th>{t('cars.purchasePrice')}</th>
                  <th>{t('reports.totalMaintenanceCost')}</th>
                  <th>{t('reports.totalInvestment')}</th>
                </tr>
              </thead>
              <tbody>
                {cars.map(car => (
                  <tr key={car.id}>
                    <td>{car.vin}</td>
                    <td>{car.make}</td>
                    <td>{car.model}</td>
                    <td>{car.year}</td>
                    <td>
                      <span className={`status-badge status-${car.status}`}>
                        {t('status.' + car.status)}
                      </span>
                    </td>
                    <td>${formatNumber(parseFloat(car.purchase_price) || 0)}</td>
                    <td>${formatNumber(parseFloat(car.total_maintenance_cost) || 0)}</td>
                    <td>${formatNumber((parseFloat(car.purchase_price) || 0) + (parseFloat(car.total_maintenance_cost) || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    )
  }

  const renderSalesReport = () => {
    const { cars, totals, monthly, by_make } = reportData || {}
    
    if (!totals) {
      return <EmptyState message={t('common.loading')} icon="📊" />
    }
    
    return (
      <>
        <div className="report-summary">
          <h2>{t('reports.sales')} - {t('reports.summary')}</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{t('reports.totalSales')}</h3>
              <div className="stat-value">{totals.count}</div>
            </div>
            <div className="stat-card">
              <h3>{t('reports.totalRevenue')}</h3>
              <div className="stat-value">${formatNumber(totals.sale_value)}</div>
            </div>
            <div className="stat-card">
              <h3>{t('reports.totalCost')}</h3>
              <div className="stat-value">${formatNumber(totals.purchase_value)}</div>
            </div>
            <div className="stat-card expense">
              <h3>{t('reports.totalMaintenanceCost')}</h3>
              <div className="stat-value">${formatNumber(totals.maintenance_cost)}</div>
            </div>
            <div className="stat-card profit">
              <h3>{t('reports.netProfit')}</h3>
              <div className="stat-value">${formatNumber(totals.net_profit)}</div>
            </div>
          </div>
        </div>
        
        <div className="stats-grid">
          {monthly && monthly.length > 0 && (
            <div className="table-container">
              <div className="table-header">
                <h2>{t('reports.monthly')}</h2>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('common.date')}</th>
                      <th>{t('reports.totalSales')}</th>
                      <th>{t('reports.totalRevenue')}</th>
                      <th>{t('reports.grossProfit')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.map((month, index) => (
                      <tr key={index}>
                        <td>{month.month}</td>
                        <td>{month.cars_sold}</td>
                        <td>${formatNumber(month.total_sales)}</td>
                        <td>${formatNumber(month.gross_profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {by_make && by_make.length > 0 && (
            <div className="table-container">
              <div className="table-header">
                <h2>{t('reports.byMake')}</h2>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('cars.make')}</th>
                      <th>{t('reports.totalSales')}</th>
                      <th>{t('reports.totalRevenue')}</th>
                      <th>{t('reports.grossProfit')}</th>
                      <th>{t('reports.averageProfit')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {by_make.map((make, index) => (
                      <tr key={index}>
                        <td>{make.make}</td>
                        <td>{make.cars_sold}</td>
                        <td>${formatNumber(make.total_sales)}</td>
                        <td>${formatNumber(make.gross_profit)}</td>
                        <td>${formatNumber(make.avg_profit_per_car)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        <div className="table-container">
          <div className="table-header">
            <h2>{t('reports.details')}</h2>
          </div>
          <div className="table-wrapper">
            {cars.length === 0 ? (
              <EmptyState message={t('common.noData')} icon="📊" />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('cars.vin')}</th>
                    <th>{t('cars.make')}</th>
                    <th>{t('cars.model')}</th>
                    <th>{t('cars.saleDate')}</th>
                    <th>{t('cars.purchasePrice')}</th>
                    <th>{t('cars.salePrice')}</th>
                    <th>{t('reports.totalMaintenanceCost')}</th>
                    <th>{t('reports.grossProfit')}</th>
                    <th>{t('reports.netProfit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cars.map(car => (
                    <tr key={car.id}>
                      <td>{car.vin}</td>
                      <td>{car.make}</td>
                      <td>{car.model}</td>
                      <td>{formatDate(car.sale_date)}</td>
                      <td>${formatNumber(car.purchase_price)}</td>
                      <td>${formatNumber(car.sale_price)}</td>
                      <td>${formatNumber(car.total_maintenance_cost || 0)}</td>
                      <td>${formatNumber(car.profit || 0)}</td>
                      <td>${formatNumber(car.net_profit || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </>
    )
  }

  const renderMaintenanceReport = () => {
    const { cars, total_cost, record_count, category_rankings, model_rankings } = reportData || {}
    
    if (!cars) {
      return <EmptyState message={t('common.loading')} icon="🔧" />
    }
    
    // Calculate additional metrics properly
    const totalCarCost = cars.reduce((sum, car) => sum + (parseFloat(car.purchase_price) || 0), 0)
    const totalMaintenanceCost = parseFloat(total_cost) || 0
    const totalInvestment = totalCarCost + totalMaintenanceCost
    
    return (
      <>
        <div className="report-summary">
          <h2>{t('reports.maintenance')} - {t('reports.summary')}</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{t('maintenance.allRecords')}</h3>
              <div className="stat-value">{record_count}</div>
            </div>
            <div className="stat-card">
              <h3>{t('reports.totalCarCost')}</h3>
              <div className="stat-value">${formatNumber(totalCarCost)}</div>
            </div>
            <div className="stat-card">
              <h3>{t('reports.totalMaintenanceCost')}</h3>
              <div className="stat-value">${formatNumber(totalMaintenanceCost)}</div>
            </div>
            <div className="stat-card">
              <h3>{t('reports.totalInvestment')}</h3>
              <div className="stat-value">${formatNumber(totalInvestment)}</div>
            </div>
            <div className="stat-card">
              <h3>{t('dashboard.totalCars')}</h3>
              <div className="stat-value">{cars.length}</div>
            </div>
            <div className="stat-card">
              <h3>{t('reports.averageProfit')}</h3>
              <div className="stat-value">${formatNumber(cars.length > 0 ? totalMaintenanceCost / cars.length : 0)}</div>
            </div>
          </div>
        </div>
        
        <div className="stats-grid">
          {/* Category Rankings */}
          {category_rankings && category_rankings.length > 0 && (
            <div className="table-container">
              <div className="table-header">
                <h2>{t('reports.categoryRankings')}</h2>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('maintenance.category')}</th>
                      <th>{t('maintenance.allRecords')}</th>
                      <th>{t('maintenance.totalCost')}</th>
                      <th>{t('reports.averageCost')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category_rankings.map((category, index) => (
                      <tr key={index}>
                        <td>{t('categories.' + category.category_name) || category.category_name}</td>
                        <td>{category.record_count}</td>
                        <td>${formatNumber(category.total_cost)}</td>
                        <td>${formatNumber(category.avg_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Model Rankings */}
          {model_rankings && model_rankings.length > 0 && (
            <div className="table-container">
              <div className="table-header">
                <h2>{t('reports.modelRankings')}</h2>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('cars.make')}</th>
                      <th>{t('cars.model')}</th>
                      <th>{t('dashboard.totalCars')}</th>
                      <th>{t('maintenance.totalCost')}</th>
                      <th>{t('reports.avgCostPerCar')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model_rankings.map((model, index) => (
                      <tr key={index}>
                        <td>{model.make}</td>
                        <td>{model.model}</td>
                        <td>{model.car_count}</td>
                        <td>${formatNumber(model.total_cost)}</td>
                        <td>${formatNumber(model.avg_cost_per_car)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        <div className="table-container">
          <div className="table-header">
            <h2>{t('reports.details')}</h2>
          </div>
          <div className="table-wrapper">
            {cars.length === 0 ? (
              <EmptyState message={t('common.noData')} icon="🔧" />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('cars.vin')}</th>
                    <th>{t('cars.make')}</th>
                    <th>{t('cars.model')}</th>
                    <th>{t('cars.status')}</th>
                    <th>{t('maintenance.allRecords')}</th>
                    <th>{t('reports.totalMaintenanceCost')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cars.map(car => (
                    <tr key={car.id}>
                      <td>{car.vin}</td>
                      <td>{car.make}</td>
                      <td>{car.model}</td>
                      <td>
                        <span className={`status-badge status-${car.status}`}>
                          {t('status.' + car.status)}
                        </span>
                      </td>
                      <td>{car.maintenance_records ? car.maintenance_records.length : 0}</td>
                      <td>${formatNumber(car.total_cost || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </>
    )
  }

  const renderReportContent = () => {
    if (isGenerating) {
      return (
        <div className="loading">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      )
    }
    
    if (!reportData) {
      return <EmptyState message={t('common.noData')} icon="📊" />
    }
    
    switch (reportType) {
      case 'inventory':
        return renderInventoryReport()
      case 'sales':
        return renderSalesReport()
      case 'maintenance':
        return renderMaintenanceReport()
      default:
        return <EmptyState message={t('common.noData')} icon="📊" />
    }
  }

  if (isLoading) {
    return (
      <Layout activeRoute="reports">
        <Loading />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout activeRoute="reports">
        <div className="dashboard-header">
          <h1>{t('reports.title')}</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>{t('messages.errorOccurred')}</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadReport}>
            {t('common.retry')}
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout activeRoute="reports">
      <div className="reports-header">
        <h1>{t('reports.title')}</h1>
      </div>
      
      <div className="reports-controls">
        <div className="control-group">
          <label>{t('reports.type')}</label>
          <select 
            className="form-select"
            value={reportType}
            onChange={handleReportTypeChange}
          >
            <option value="inventory">{t('reports.inventory')}</option>
            <option value="sales">{t('reports.sales')}</option>
            <option value="maintenance">{t('reports.maintenance')}</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>{t('reports.dateRange')}</label>
          <div className="date-range">
            <input 
              type="date" 
              placeholder={t('reports.startDate')}
              value={dateRange.start}
              onChange={(e) => handleDateChange('start', e.target.value)}
            />
            <input 
              type="date" 
              placeholder={t('reports.endDate')}
              value={dateRange.end}
              onChange={(e) => handleDateChange('end', e.target.value)}
            />
          </div>
        </div>
        
        {reportType === 'maintenance' && (
          <div className="control-group">
            <label>{t('maintenance.category')}</label>
            <select 
              className="form-select"
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              <option value="">{t('reports.allCategories')}</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="control-actions">
          <button className="btn btn-primary" onClick={handleGenerate}>
            {t('reports.generate')}
          </button>
          <button className="btn btn-secondary" onClick={handleClearDates}>
            {t('common.clear')}
          </button>
          <button className="btn btn-info" onClick={handlePrint}>
            {t('reports.printReport')}
          </button>
        </div>
      </div>
      
      <div className="report-content">
        {renderReportContent()}
      </div>
    </Layout>
  )
}

export default ReportsPage 