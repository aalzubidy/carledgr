// Reports page component
import { t } from '../utils/i18n.js';
import { api } from '../utils/api.js';
import { createLayout, showLoading } from '../components/layout.js';
import { showSuccess, showError, showWarning } from '../utils/snackbar.js';

let currentReportType = 'inventory';
let currentDateRange = { start: '', end: '' };

export async function showReportsPage() {
  // Show loading state
  createLayout(showLoading(), 'reports');
  
  try {
    // Render reports page
    const content = renderReportsContent();
    createLayout(content, 'reports');
    
    // Setup event listeners
    setupReportsEventListeners();
    
    // Load default report
    await loadReport();
  } catch (error) {
    console.error('Failed to load reports page:', error);
    showError(t('messages.errorOccurred') + ': ' + error.message);
    
    // Show error state
    const errorContent = `
      <div class="dashboard-header">
        <h1>${t('reports.title')}</h1>
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
    createLayout(errorContent, 'reports');
  }
}

function renderReportsContent() {
  return `
    <div class="reports-header">
      <h1>${t('reports.title')}</h1>
    </div>
    
    <div class="reports-controls">
      <div class="control-group">
        <label>${t('reports.type')}</label>
        <select id="reportTypeSelect" class="form-select">
          <option value="inventory" ${currentReportType === 'inventory' ? 'selected' : ''}>${t('reports.inventory')}</option>
          <option value="sales" ${currentReportType === 'sales' ? 'selected' : ''}>${t('reports.sales')}</option>
          <option value="maintenance" ${currentReportType === 'maintenance' ? 'selected' : ''}>${t('reports.maintenance')}</option>
        </select>
      </div>
      
      <div class="control-group">
        <label>${t('reports.dateRange')}</label>
        <div class="date-range">
          <input type="date" id="startDate" placeholder="${t('reports.startDate')}">
          <input type="date" id="endDate" placeholder="${t('reports.endDate')}">
        </div>
      </div>
      
      <div class="control-actions">
        <button id="generateBtn" class="btn btn-primary">
          ${t('reports.generate')}
        </button>
        <button id="clearDatesBtn" class="btn btn-secondary">
          ${t('common.clear')}
        </button>
        <button id="exportExcelBtn" class="btn btn-success">
          ${t('reports.exportToExcel')}
        </button>
        <button id="printBtn" class="btn btn-info">
          ${t('reports.printReport')}
        </button>
      </div>
    </div>
    
    <div id="reportContent" class="report-content">
      ${renderLoadingState()}
    </div>
  `;
}

function renderLoadingState() {
  return `
    <div class="loading">
      <div class="spinner"></div>
      <p>${t('common.loading')}</p>
    </div>
  `;
}

function setupReportsEventListeners() {
  // Report type dropdown
  const reportTypeSelect = document.getElementById('reportTypeSelect');
  if (reportTypeSelect) {
    reportTypeSelect.addEventListener('change', (e) => {
      currentReportType = e.target.value;
      loadReport();
    });
  }
  
  // Generate button
  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      currentDateRange = { start: startDate, end: endDate };
      loadReport();
    });
  }
  
  // Clear dates button
  const clearDatesBtn = document.getElementById('clearDatesBtn');
  if (clearDatesBtn) {
    clearDatesBtn.addEventListener('click', () => {
      document.getElementById('startDate').value = '';
      document.getElementById('endDate').value = '';
      currentDateRange = { start: '', end: '' };
      loadReport();
    });
  }
  
  // Export to Excel button
  const exportExcelBtn = document.getElementById('exportExcelBtn');
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', () => {
      exportToExcel();
    });
  }
  
  // Print button
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      printReport();
    });
  }
}

async function loadReport() {
  const reportContent = document.getElementById('reportContent');
  if (!reportContent) return;
  
  reportContent.innerHTML = renderLoadingState();
  
  try {
    let reportData;
    
    switch (currentReportType) {
      case 'inventory':
        reportData = await api.getInventoryReport(currentDateRange);
        reportContent.innerHTML = renderInventoryReport(reportData);
        break;
      case 'sales':
        // Get both sales and profit data for combined report
        const salesData = await api.getSalesReport(currentDateRange);
        const profitData = await api.getProfitReport(currentDateRange);
        
        // Combine the data
        const combinedData = {
          ...salesData,
          monthly: profitData.monthly || [],
          by_make: profitData.by_make || []
        };
        
        reportContent.innerHTML = renderSalesReport(combinedData);
        break;
      case 'maintenance':
        reportData = await api.getMaintenanceReport(currentDateRange);
        reportContent.innerHTML = renderMaintenanceReport(reportData);
        break;
      default:
        throw new Error('Unknown report type');
    }
  } catch (error) {
    console.error('Failed to load report:', error);
    reportContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>${t('messages.errorOccurred')}</h3>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="loadReport()">
          ${t('common.retry')}
        </button>
      </div>
    `;
  }
}

function renderInventoryReport(data) {
  const { cars, totals } = data;
  
  // Calculate inventory-specific metrics
  const inStockCars = cars.filter(car => car.status === 'in_stock');
  const soldCars = cars.filter(car => car.status === 'sold');
  const pendingCars = cars.filter(car => car.status === 'pending');
  const currentInventoryValue = inStockCars.reduce((sum, car) => sum + (parseFloat(car.purchase_price) || 0), 0);
  
  return `
    <div class="report-summary">
      <h2>${t('reports.inventory')} - ${t('reports.summary')}</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <h3>${t('dashboard.totalCars')}</h3>
          <div class="stat-value">${cars.length}</div>
        </div>
        <div class="stat-card">
          <h3>${t('dashboard.inStock')}</h3>
          <div class="stat-value">${inStockCars.length}</div>
        </div>
        <div class="stat-card">
          <h3>${t('dashboard.sold')}</h3>
          <div class="stat-value">${soldCars.length}</div>
        </div>
        <div class="stat-card">
          <h3>${t('dashboard.pending')}</h3>
          <div class="stat-value">${pendingCars.length}</div>
        </div>
        <div class="stat-card">
          <h3>${t('dashboard.currentInventoryValue')}</h3>
          <div class="stat-value">$${formatNumber(currentInventoryValue)}</div>
        </div>
      </div>
    </div>
    
    <div class="report-table">
      <h3>${t('reports.inventoryDetails')}</h3>
      ${renderInventoryTable(cars)}
    </div>
  `;
}

function renderInventoryTable(cars) {
  if (!cars || cars.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3>${t('common.noData')}</h3>
      </div>
    `;
  }
  
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>${t('cars.vin')}</th>
          <th>${t('cars.make')}</th>
          <th>${t('cars.model')}</th>
          <th>${t('cars.year')}</th>
          <th>${t('cars.status')}</th>
          <th>${t('cars.purchasePrice')}</th>
          <th>${t('reports.totalMaintenanceCost')}</th>
          <th>${t('reports.totalInvestment')}</th>
        </tr>
      </thead>
      <tbody>
        ${cars.map(car => `
          <tr>
            <td>${car.vin}</td>
            <td>${car.make}</td>
            <td>${car.model}</td>
            <td>${car.year}</td>
            <td><span class="status-badge status-${car.status}">${t('status.' + car.status)}</span></td>
            <td>$${formatNumber(parseFloat(car.purchase_price) || 0)}</td>
            <td>$${formatNumber(parseFloat(car.total_maintenance_cost) || 0)}</td>
            <td>$${formatNumber((parseFloat(car.purchase_price) || 0) + (parseFloat(car.total_maintenance_cost) || 0))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderSalesReport(data) {
  const { cars, totals, monthly, by_make } = data;
  
  return `
    <div class="report-summary">
      <h2>${t('reports.sales')} - ${t('reports.summary')}</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <h3>${t('reports.totalSales')}</h3>
          <div class="stat-value">${totals.count}</div>
        </div>
        <div class="stat-card">
          <h3>${t('reports.totalRevenue')}</h3>
          <div class="stat-value">$${formatNumber(totals.sale_value)}</div>
        </div>
        <div class="stat-card">
          <h3>${t('reports.totalCost')}</h3>
          <div class="stat-value">$${formatNumber(totals.purchase_value)}</div>
        </div>
        <div class="stat-card expense">
          <h3>${t('reports.totalMaintenanceCost')}</h3>
          <div class="stat-value">$${formatNumber(totals.maintenance_cost)}</div>
        </div>
        <div class="stat-card profit">
          <h3>${t('reports.netProfit')}</h3>
          <div class="stat-value">$${formatNumber(totals.net_profit)}</div>
        </div>
      </div>
    </div>
    
    <div class="stats-grid">
      <div class="table-container">
        <div class="table-header">
          <h2>${t('reports.monthly')}</h2>
        </div>
        <div class="table-wrapper">
          ${renderMonthlyTable(monthly)}
        </div>
      </div>
      
      <div class="table-container">
        <div class="table-header">
          <h2>${t('reports.byMake')}</h2>
        </div>
        <div class="table-wrapper">
          ${renderMakeTable(by_make)}
        </div>
      </div>
    </div>
    
    <div class="table-container">
      <div class="table-header">
        <h2>${t('reports.details')}</h2>
      </div>
      <div class="table-wrapper">
        ${renderSalesTable(cars)}
      </div>
    </div>
  `;
}

function renderSalesTable(cars) {
  if (!cars || cars.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <h3>${t('common.noData')}</h3>
      </div>
    `;
  }
  
  return `
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
  `;
}

function renderMaintenanceReport(data) {
  const { cars, total_cost, record_count, category_rankings, model_rankings } = data;
  
  // Calculate additional metrics properly
  const totalCarCost = cars.reduce((sum, car) => sum + (parseFloat(car.purchase_price) || 0), 0);
  const totalMaintenanceCost = parseFloat(total_cost) || 0;
  const totalInvestment = totalCarCost + totalMaintenanceCost;
  
  return `
    <div class="report-summary">
      <h2>${t('reports.maintenance')} - ${t('reports.summary')}</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <h3>${t('maintenance.allRecords')}</h3>
          <div class="stat-value">${record_count}</div>
        </div>
        <div class="stat-card">
          <h3>${t('reports.totalCarCost')}</h3>
          <div class="stat-value">$${formatNumber(totalCarCost)}</div>
        </div>
        <div class="stat-card">
          <h3>${t('reports.totalMaintenanceCost')}</h3>
          <div class="stat-value">$${formatNumber(totalMaintenanceCost)}</div>
        </div>
        <div class="stat-card">
          <h3>${t('reports.totalInvestment')}</h3>
          <div class="stat-value">$${formatNumber(totalInvestment)}</div>
        </div>
        <div class="stat-card">
          <h3>${t('dashboard.totalCars')}</h3>
          <div class="stat-value">${cars.length}</div>
        </div>
        <div class="stat-card">
          <h3>${t('reports.averageProfit')}</h3>
          <div class="stat-value">$${formatNumber(cars.length > 0 ? totalMaintenanceCost / cars.length : 0)}</div>
        </div>
      </div>
    </div>
    
    <div class="stats-grid">
      <!-- Category Rankings -->
      <div class="table-container">
        <div class="table-header">
          <h2>${t('reports.categoryRankings')}</h2>
        </div>
        <div class="table-wrapper">
          ${renderCategoryRankingsTable(category_rankings)}
        </div>
      </div>
      
      <!-- Model Rankings -->
      <div class="table-container">
        <div class="table-header">
          <h2>${t('reports.modelRankings')}</h2>
        </div>
        <div class="table-wrapper">
          ${renderModelRankingsTable(model_rankings)}
        </div>
      </div>
    </div>
    
    <div class="table-container">
      <div class="table-header">
        <h2>${t('reports.details')}</h2>
      </div>
      <div class="table-wrapper">
        ${renderMaintenanceTable(cars)}
      </div>
    </div>
  `;
}

function renderCategoryRankingsTable(categories) {
  if (!categories || categories.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <h3>${t('common.noData')}</h3>
      </div>
    `;
  }
  
  return `
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
        ${categories.map(category => `
          <tr>
            <td>${t('categories.' + category.category_name) || category.category_name}</td>
            <td>${category.record_count}</td>
            <td>$${formatNumber(category.total_cost)}</td>
            <td>$${formatNumber(category.avg_cost)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderModelRankingsTable(models) {
  if (!models || models.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🚗</div>
        <h3>${t('common.noData')}</h3>
      </div>
    `;
  }
  
  return `
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
        ${models.map(model => `
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
  `;
}

function renderMaintenanceTable(cars) {
  if (!cars || cars.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🔧</div>
        <h3>${t('common.noData')}</h3>
      </div>
    `;
  }
  
  return `
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
            <td><span class="status-badge status-${car.status}">${t('status.' + car.status)}</span></td>
            <td>${car.maintenance_records.length}</td>
            <td>$${formatNumber(car.total_cost)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderMonthlyTable(monthly) {
  if (!monthly || monthly.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <h3>${t('common.noData')}</h3>
      </div>
    `;
  }
  
  return `
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
  `;
}

function renderMakeTable(makes) {
  if (!makes || makes.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🚗</div>
        <h3>${t('common.noData')}</h3>
      </div>
    `;
  }
  
  return `
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
        ${makes.map(make => `
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
  `;
}

async function exportToExcel() {
  try {
    let reportData;
    
    // Get current report data
    switch (currentReportType) {
      case 'inventory':
        reportData = await api.getInventoryReport(currentDateRange);
        break;
      case 'sales':
        const salesData = await api.getSalesReport(currentDateRange);
        const profitData = await api.getProfitReport(currentDateRange);
        reportData = {
          ...salesData,
          monthly: profitData.monthly || [],
          by_make: profitData.by_make || []
        };
        break;
      case 'maintenance':
        reportData = await api.getMaintenanceReport(currentDateRange);
        break;
    }
    
    exportDataToExcel(reportData);
    
    showSuccess('Excel export completed successfully');
  } catch (error) {
    console.error('Export error:', error);
    showError(t('messages.errorOccurred') + ': ' + error.message);
  }
}

function exportDataToExcel(data) {
  const wb = XLSX.utils.book_new();
  
  if (currentReportType === 'inventory') {
    addInventoryToExcel(wb, data);
  } else if (currentReportType === 'sales') {
    addSalesToExcel(wb, data);
  } else if (currentReportType === 'maintenance') {
    addMaintenanceToExcel(wb, data);
  }
  
  // Save the Excel file
  const filename = `${currentReportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

function addInventoryToExcel(wb, data) {
  const { cars } = data;
  
  // Summary sheet
  const summaryData = [
    ['Metric', 'Value'],
    ['Total Cars', cars.length],
    ['In Stock', cars.filter(car => car.status === 'in_stock').length],
    ['Sold', cars.filter(car => car.status === 'sold').length],
    ['Pending', cars.filter(car => car.status === 'pending').length],
    [t('dashboard.currentInventoryValue'), cars.filter(car => car.status === 'in_stock').reduce((sum, car) => sum + (parseFloat(car.purchase_price) || 0), 0)]
  ];
  
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
  
  // Details sheet
  const detailsData = [
    ['VIN', 'Make', 'Model', 'Year', 'Color', 'Status', 'Purchase Price', 'Maintenance Cost', 'Total Investment']
  ];
  
  cars.forEach(car => {
    detailsData.push([
      car.vin,
      car.make,
      car.model,
      car.year,
      car.color || '',
      car.status,
      car.purchase_price || 0,
      car.total_maintenance_cost || 0,
      (car.purchase_price || 0) + (car.total_maintenance_cost || 0)
    ]);
  });
  
  const detailsWs = XLSX.utils.aoa_to_sheet(detailsData);
  XLSX.utils.book_append_sheet(wb, detailsWs, 'Details');
}

function addSalesToExcel(wb, data) {
  const { cars, totals, monthly, by_make } = data;
  
  // Summary sheet
  const summaryData = [
    ['Metric', 'Value'],
    ['Total Sales', totals.count],
    ['Total Revenue', totals.sale_value],
    ['Total Cost', totals.purchase_value],
    ['Total Maintenance Cost', totals.maintenance_cost],
    ['Net Profit', totals.net_profit]
  ];
  
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
  
  // Monthly breakdown
  if (monthly && monthly.length > 0) {
    const monthlyData = [
      ['Month', 'Cars Sold', 'Total Revenue', 'Gross Profit']
    ];
    
    monthly.forEach(month => {
      monthlyData.push([
        month.month,
        month.cars_sold,
        month.total_sales,
        month.gross_profit
      ]);
    });
    
    const monthlyWs = XLSX.utils.aoa_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(wb, monthlyWs, 'Monthly');
  }
  
  // By make breakdown
  if (by_make && by_make.length > 0) {
    const makeData = [
      ['Make', 'Cars Sold', 'Total Revenue', 'Gross Profit', 'Avg Profit Per Car']
    ];
    
    by_make.forEach(make => {
      makeData.push([
        make.make,
        make.cars_sold,
        make.total_sales,
        make.gross_profit,
        make.avg_profit_per_car
      ]);
    });
    
    const makeWs = XLSX.utils.aoa_to_sheet(makeData);
    XLSX.utils.book_append_sheet(wb, makeWs, 'By Make');
  }
  
  // Details sheet
  const detailsData = [
    ['VIN', 'Make', 'Model', 'Sale Date', 'Purchase Price', 'Sale Price', 'Maintenance Cost', 'Gross Profit', 'Net Profit']
  ];
  
  cars.forEach(car => {
    detailsData.push([
      car.vin,
      car.make,
      car.model,
      car.sale_date,
      car.purchase_price,
      car.sale_price,
      car.total_maintenance_cost || 0,
      car.profit || 0,
      car.net_profit || 0
    ]);
  });
  
  const detailsWs = XLSX.utils.aoa_to_sheet(detailsData);
  XLSX.utils.book_append_sheet(wb, detailsWs, 'Details');
}

function addMaintenanceToExcel(wb, data) {
  const { cars, total_cost, record_count, category_rankings, model_rankings } = data;
  
  // Summary sheet
  const summaryData = [
    ['Metric', 'Value'],
    ['Total Records', record_count],
    ['Total Cost', total_cost],
    ['Total Cars', cars.length],
    ['Average Cost Per Car', cars.length > 0 ? total_cost / cars.length : 0]
  ];
  
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
  
  // Category rankings
  if (category_rankings && category_rankings.length > 0) {
    const categoryData = [
      ['Category', 'Record Count', 'Total Cost', 'Average Cost']
    ];
    
    category_rankings.forEach(category => {
      categoryData.push([
        category.category_name,
        category.record_count,
        category.total_cost,
        category.avg_cost
      ]);
    });
    
    const categoryWs = XLSX.utils.aoa_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, categoryWs, 'Categories');
  }
  
  // Model rankings
  if (model_rankings && model_rankings.length > 0) {
    const modelData = [
      ['Make', 'Model', 'Car Count', 'Total Cost', 'Avg Cost Per Car']
    ];
    
    model_rankings.forEach(model => {
      modelData.push([
        model.make,
        model.model,
        model.car_count,
        model.total_cost,
        model.avg_cost_per_car
      ]);
    });
    
    const modelWs = XLSX.utils.aoa_to_sheet(modelData);
    XLSX.utils.book_append_sheet(wb, modelWs, 'Models');
  }
  
  // Details sheet
  const detailsData = [
    ['VIN', 'Make', 'Model', 'Status', 'Maintenance Records', 'Total Cost']
  ];
  
  cars.forEach(car => {
    detailsData.push([
      car.vin,
      car.make,
      car.model,
      car.status,
      car.maintenance_records ? car.maintenance_records.length : 0,
      car.total_cost || 0
    ]);
  });
  
  const detailsWs = XLSX.utils.aoa_to_sheet(detailsData);
  XLSX.utils.book_append_sheet(wb, detailsWs, 'Details');
}

function printReport() {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  // Get the report content
  const reportContent = document.getElementById('reportContent');
  const reportsHeader = document.querySelector('.reports-header');
  
  if (!reportContent || !reportsHeader) {
    showWarning('No report content to print');
    return;
  }
  
  // Create print-friendly HTML
  const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${currentReportType.charAt(0).toUpperCase() + currentReportType.slice(1)} Report</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          color: #333;
        }
        .report-header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
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
          text-align: center;
        }
        .stat-value { 
          font-size: 24px; 
          font-weight: bold; 
          color: #2196F3; 
          margin: 10px 0;
        }
        .data-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px; 
        }
        .data-table th, .data-table td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left; 
        }
        .data-table th { 
          background-color: #f5f5f5; 
          font-weight: bold; 
        }
        .table-container { 
          margin-bottom: 30px; 
        }
        .table-header h2 { 
          margin-bottom: 15px; 
          color: #333; 
        }
        .status-badge { 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-size: 12px; 
          font-weight: bold; 
        }
        .status-in_stock { background-color: #e8f5e8; color: #2e7d32; }
        .status-sold { background-color: #e3f2fd; color: #1976d2; }
        .status-pending { background-color: #fff3e0; color: #f57c00; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>${currentReportType.charAt(0).toUpperCase() + currentReportType.slice(1)} Report</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        ${currentDateRange.start || currentDateRange.end ? 
          `<p>Date Range: ${currentDateRange.start || 'Start'} to ${currentDateRange.end || 'End'}</p>` : 
          ''
        }
      </div>
      ${reportContent.innerHTML}
    </body>
    </html>
  `;
  
  printWindow.document.write(printHTML);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = function() {
    printWindow.print();
    printWindow.close();
  };
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function formatNumber(num) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

// Make loadReport available globally for retry buttons
window.loadReport = loadReport; 