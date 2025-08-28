import React, { useState, useEffect } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Pie } from 'react-chartjs-2'
import { t } from '../utils/i18n.js'
import { api } from '../utils/api.js'
import Layout, { Loading, EmptyState } from '../components/Layout.jsx'
import { showError } from '../utils/snackbar.js'
import { getCurrentUser } from '../utils/permissions.js'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels)

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [topSoldModels, setTopSoldModels] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    loadDashboardData()
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // First check localStorage
      let userData = getCurrentUser()
      
      // If no user data in localStorage, fetch from API
      if (!userData) {
        userData = await api.getCurrentUser()
      }
      
      setUser(userData)
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

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
  const inRepair = dashboardData?.in_repair || 0
  const inventoryValue = dashboardData?.current_inventory_value || 0
  const carsSoldThisMonth = dashboardData?.cars_sold_this_month || 0
  const profitThisMonth = dashboardData?.profit_this_month || 0

  // Prepare pie chart data
  const pieChartData = {
    labels: [
      t('dashboard.inStock'),
      t('dashboard.sold'),
      t('dashboard.pending'),
      t('dashboard.inRepair')
    ],
    datasets: [
      {
        data: [inStock, sold, pending, inRepair],
        backgroundColor: [
          '#2ECC71', // Green for In Stock
          '#3498DB', // Blue for Sold
          '#F39C12', // Orange for Pending
          '#E74C3C'  // Red for In Repair
        ],
        borderColor: [
          '#27AE60',
          '#2980B9',
          '#E67E22',
          '#C0392B'
        ],
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  }

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '50%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || ''
            const value = context.parsed || 0
            return `${label}: ${value}`
          }
        }
      },
      datalabels: {
        display: true,
        color: 'white',
        font: {
          weight: 'bold',
          size: 16
        },
        formatter: function(value, context) {
          // Only show the number if it's greater than 0
          return value > 0 ? value : ''
        }
      }
    }
  }

  const handleInventoryClick = () => {
    if (window.navigate) {
      window.navigate('/cars')
    }
  }

  const handleQuickAddCar = () => {
    if (window.navigate) {
      window.navigate('/cars?action=add')
    }
  }

  const handleQuickAddMaintenance = () => {
    if (window.navigate) {
      window.navigate('/maintenance?action=add')
    }
  }

  const handleQuickAddExpense = () => {
    if (window.navigate) {
      window.navigate('/expenses?action=add')
    }
  }

  // RBAC helper functions
  const canAddExpense = () => {
    return user && (user.roleId === 1 || user.roleId === 2) // owner or manager
  }

  const canAddCar = () => {
    return user && (user.roleId === 1 || user.roleId === 2 || user.roleId === 3) // all roles
  }

  const canAddMaintenance = () => {
    return user && (user.roleId === 1 || user.roleId === 2 || user.roleId === 3) // all roles
  }

  return (
    <Layout activeRoute="dashboard">
      <div className="dashboard-header">
        <h1>{t('dashboard.title')}</h1>
      </div>
      
      <div className="dashboard-content">
        {/* Three-column layout: chart on left, cards in middle, quick actions on right */}
        <div className="dashboard-grid">
          {/* Left column: Inventory Pie Chart */}
          <div className="chart-section">
            <div className="chart-container">
              <h2 
                onClick={handleInventoryClick}
                style={{ cursor: 'pointer' }}
                className="clickable-title"
              >
                {t('dashboard.inventory')} - {t('dashboard.totalCars')}: {totalCars} 📊
              </h2>
              <p className="click-hint">{t('dashboard.clickToViewAllCars')} →</p>
              <div className="pie-chart-wrapper">
                <Pie data={pieChartData} options={pieChartOptions} />
              </div>
            </div>
          </div>
          
          {/* Middle column: Financial Stats Cards */}
          <div className="stats-column">
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
            
            <div className="stat-card">
              <h3>{t('dashboard.inventoryValue')}</h3>
              <div className="stat-value">${formatNumber(inventoryValue)}</div>
              <p>{t('dashboard.inventoryValue')}</p>
            </div>
          </div>

          {/* Right column: Quick Actions */}
          <div className="quick-actions-column">
            <div className="quick-actions-card">
              <h3>Quick Actions</h3>
              
              {canAddCar() && (
                <button 
                  className="btn quick-action-btn quick-action-car"
                  onClick={handleQuickAddCar}
                  title="Add a new car to inventory"
                >
                  🚗 {t('cars.addCar')}
                </button>
              )}
              
              {canAddMaintenance() && (
                <button 
                  className="btn quick-action-btn quick-action-maintenance"
                  onClick={handleQuickAddMaintenance}
                  title="Add maintenance record"
                >
                  🔧 {t('cars.addMaintenance')}
                </button>
              )}
              
              {canAddExpense() && (
                <button 
                  className="btn quick-action-btn quick-action-expense"
                  onClick={handleQuickAddExpense}
                  title="Add dealership expense"
                >
                  💰 {t('expenses.addExpense')}
                </button>
              )}
              
              {!canAddCar() && !canAddMaintenance() && !canAddExpense() && (
                <p className="no-actions-message">
                  No quick actions available for your role.
                </p>
              )}
            </div>
          </div>
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