import React, { useState, useEffect } from 'react'
import { t } from '../utils/i18n.js'
import { api } from '../utils/api.js'
import Layout, { Loading, EmptyState } from '../components/Layout.jsx'
import { showError } from '../utils/snackbar.js'

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [topSoldModels, setTopSoldModels] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch dashboard data and top sold models
      const [dashboardResponse, topSoldModelsResponse] = await Promise.all([
        api.getDashboardSummary(),
        api.getTopSoldModels()
      ])
      
      setDashboardData(dashboardResponse)
      setTopSoldModels(topSoldModelsResponse || [])
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      setError(error.message)
      showError(t('messages.errorOccurred') + ': ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  const renderTopSoldModelsTable = () => {
    if (!topSoldModels || topSoldModels.length === 0) {
      return (
        <EmptyState 
          message={t('dashboard.noSalesData')} 
          icon="📊" 
        />
      )
    }
    
    return (
      <table className="data-table">
        <thead>
          <tr>
            <th>{t('cars.make')}</th>
            <th>{t('cars.model')}</th>
            <th>{t('dashboard.unitsSold')}</th>
            <th>{t('dashboard.totalRevenue')}</th>
            <th>{t('dashboard.avgSalePrice')}</th>
          </tr>
        </thead>
        <tbody>
          {topSoldModels.map((model, index) => (
            <tr key={index}>
              <td>{model.make}</td>
              <td>{model.model}</td>
              <td>{model.units_sold}</td>
              <td>${formatNumber(model.total_revenue)}</td>
              <td>${formatNumber(model.avg_sale_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (isLoading) {
    return (
      <Layout activeRoute="dashboard">
        <Loading />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout activeRoute="dashboard">
        <div className="dashboard-header">
          <h1>{t('dashboard.title')}</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>{t('messages.errorOccurred')}</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadDashboardData}>
            {t('common.retry')}
          </button>
        </div>
      </Layout>
    )
  }

  // Use the simplified data structure directly
  const totalCars = dashboardData?.total_cars || 0
  const inStock = dashboardData?.in_stock || 0
  const sold = dashboardData?.sold || 0
  const pending = dashboardData?.pending || 0
  const inventoryValue = dashboardData?.current_inventory_value || 0
  const carsSoldThisMonth = dashboardData?.cars_sold_this_month || 0
  const profitThisMonth = dashboardData?.profit_this_month || 0

  return (
    <Layout activeRoute="dashboard">
      <div className="dashboard-header">
        <h1>{t('dashboard.title')}</h1>
      </div>
      
      <div className="stats-grid">
        {/* Inventory Stats */}
        <div className="stat-card">
          <h3>{t('dashboard.totalCars')}</h3>
          <div className="stat-value">{totalCars}</div>
          <p>{t('dashboard.totalCars')}</p>
        </div>
        
        <div className="stat-card">
          <h3>{t('dashboard.inStock')}</h3>
          <div className="stat-value">{inStock}</div>
          <p>{t('dashboard.inStock')}</p>
        </div>
        
        <div className="stat-card">
          <h3>{t('dashboard.sold')}</h3>
          <div className="stat-value">{sold}</div>
          <p>{t('dashboard.sold')}</p>
        </div>
        
        <div className="stat-card">
          <h3>{t('dashboard.pending')}</h3>
          <div className="stat-value">{pending}</div>
          <p>{t('dashboard.pending')}</p>
        </div>
        
        <div className="stat-card">
          <h3>{t('dashboard.inventoryValue')}</h3>
          <div className="stat-value">${formatNumber(inventoryValue)}</div>
          <p>{t('dashboard.inventoryValue')}</p>
        </div>
        
        {/* Financial Stats */}
        <div className="stat-card">
          <h3>{t('dashboard.carsSoldThisMonth')}</h3>
          <div className="stat-value">{carsSoldThisMonth}</div>
          <p>{t('dashboard.carsSoldThisMonth')}</p>
        </div>
        
        <div className="stat-card profit">
          <h3>{t('dashboard.profitThisMonth')}</h3>
          <div className="stat-value">${formatNumber(profitThisMonth)}</div>
          <p>{t('dashboard.profitThisMonth')}</p>
        </div>
      </div>
      
      {/* Top Sold Models Table */}
      <div className="table-container" style={{ marginTop: '30px' }}>
        <div className="table-header">
          <h2>{t('dashboard.topSoldModels')}</h2>
        </div>
        <div className="table-wrapper">
          {renderTopSoldModelsTable()}
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard 