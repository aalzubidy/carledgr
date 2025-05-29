// Dashboard page component
import { t } from '../utils/i18n.js';
import { api } from '../utils/api.js';
import { createLayout, showLoading } from '../components/layout.js';
import { showToast } from '../utils/toast.js';

export async function showDashboard() {
  // Show loading state
  createLayout(showLoading(), 'dashboard');
  
  try {
    // Fetch dashboard data and top sold models
    const [dashboardData, topSoldModels] = await Promise.all([
      api.getDashboardSummary(),
      api.getTopSoldModels()
    ]);
    
    // Render dashboard with data
    const content = renderDashboardContent(dashboardData, topSoldModels);
    createLayout(content, 'dashboard');
  } catch (error) {
    console.error('Failed to load dashboard:', error);
    showToast(t('messages.errorOccurred') + ': ' + error.message, 'error');
    
    // Show error state
    const errorContent = `
      <div class="dashboard-header">
        <h1>${t('dashboard.title')}</h1>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>${t('messages.errorOccurred')}</h3>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">
          ${t('common.retry')}
        </button>
      </div>
    `;
    createLayout(errorContent, 'dashboard');
  }
}

function renderDashboardContent(data, topSoldModels) {
  // Use the simplified data structure directly
  const totalCars = data?.total_cars || 0;
  const inStock = data?.in_stock || 0;
  const sold = data?.sold || 0;
  const pending = data?.pending || 0;
  const inventoryValue = data?.current_inventory_value || 0;
  const carsSoldThisMonth = data?.cars_sold_this_month || 0;
  const profitThisMonth = data?.profit_this_month || 0;
  
  return `
    <div class="dashboard-header">
      <h1>${t('dashboard.title')}</h1>
    </div>
    
    <div class="stats-grid">
      <!-- Inventory Stats -->
      <div class="stat-card">
        <h3>${t('dashboard.totalCars')}</h3>
        <div class="stat-value">${totalCars}</div>
        <p>${t('dashboard.totalCars')}</p>
      </div>
      
      <div class="stat-card">
        <h3>${t('dashboard.inStock')}</h3>
        <div class="stat-value">${inStock}</div>
        <p>${t('dashboard.inStock')}</p>
      </div>
      
      <div class="stat-card">
        <h3>${t('dashboard.sold')}</h3>
        <div class="stat-value">${sold}</div>
        <p>${t('dashboard.sold')}</p>
      </div>
      
      <div class="stat-card">
        <h3>${t('dashboard.pending')}</h3>
        <div class="stat-value">${pending}</div>
        <p>${t('dashboard.pending')}</p>
      </div>
      
      <div class="stat-card">
        <h3>${t('dashboard.inventoryValue')}</h3>
        <div class="stat-value">$${formatNumber(inventoryValue)}</div>
        <p>${t('dashboard.inventoryValue')}</p>
      </div>
      
      <!-- Financial Stats -->
      <div class="stat-card">
        <h3>${t('dashboard.carsSoldThisMonth')}</h3>
        <div class="stat-value">${carsSoldThisMonth}</div>
        <p>${t('dashboard.carsSoldThisMonth')}</p>
      </div>
      
      <div class="stat-card profit">
        <h3>${t('dashboard.profitThisMonth')}</h3>
        <div class="stat-value">$${formatNumber(profitThisMonth)}</div>
        <p>${t('dashboard.profitThisMonth')}</p>
      </div>
    </div>
    
    <!-- Top Sold Models Table -->
    <div class="table-container" style="margin-top: 30px;">
      <div class="table-header">
        <h2>${t('dashboard.topSoldModels')}</h2>
      </div>
      <div class="table-wrapper">
        ${renderTopSoldModelsTable(topSoldModels)}
      </div>
    </div>
  `;
}

function renderTopSoldModelsTable(topSoldModels) {
  if (!topSoldModels || topSoldModels.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <h3>${t('dashboard.noSalesData')}</h3>
        <p>${t('dashboard.noSalesDataDesc')}</p>
      </div>
    `;
  }
  
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>${t('cars.make')}</th>
          <th>${t('cars.model')}</th>
          <th>${t('dashboard.unitsSold')}</th>
          <th>${t('dashboard.totalRevenue')}</th>
          <th>${t('dashboard.avgSalePrice')}</th>
        </tr>
      </thead>
      <tbody>
        ${topSoldModels.map(model => `
          <tr>
            <td>${model.make}</td>
            <td>${model.model}</td>
            <td>${model.units_sold}</td>
            <td>$${formatNumber(model.total_revenue)}</td>
            <td>$${formatNumber(model.avg_sale_price)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function formatNumber(num) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
} 