// Car details page component
import { t } from '../utils/i18n.js';
import { api } from '../utils/api.js';
import { createLayout, showLoading, showEmptyState } from '../components/layout.js';
import { showSuccess, showError, showWarning } from '../utils/snackbar.js';
import { navigate } from '../utils/router.js';

let carData = null;
let maintenanceRecords = [];
let maintenanceCategories = [];
let filteredMaintenance = [];

export async function showCarDetails(carId) {
  // Show loading state
  createLayout(showLoading(), 'cars');
  
  try {
    // Fetch car data and maintenance records
    const [car, maintenance, categories] = await Promise.all([
      api.getCar(carId),
      api.getMaintenanceRecords(carId),
      api.getMaintenanceCategories()
    ]);
    
    carData = car;
    maintenanceRecords = maintenance;
    maintenanceCategories = categories;
    filteredMaintenance = [...maintenanceRecords];
    
    // Render car details page
    const content = renderCarDetailsContent();
    createLayout(content, 'cars');
    
    // Set up event listeners
    setupCarDetailsEventListeners();
  } catch (error) {
    console.error('Failed to load car details:', error);
    showError(t('messages.errorOccurred') + ': ' + error.message);
    
    // Show error state
    const errorContent = `
      <div class="dashboard-header">
        <h1>${t('cars.carDetails')}</h1>
        <button class="btn btn-secondary" onclick="history.back()">
          ${t('common.back')}
        </button>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>${t('messages.errorOccurred')}</h3>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">
          ${t('common.retry') || 'Retry'}
        </button>
      </div>
    `;
    createLayout(errorContent, 'cars');
  }
}

function renderCarDetailsContent() {
  const totalMaintenanceCost = maintenanceRecords.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0);
  
  return `
    <div class="dashboard-header">
      <h1>${t('cars.carDetails')}</h1>
      <div>
        <button class="btn btn-secondary" onclick="history.back()">
          ${t('common.back')}
        </button>
        <button class="btn btn-primary" id="editCarBtn">
          ${t('cars.editCar')}
        </button>
        <button class="btn btn-info" id="printCarBtn">
          ${t('cars.printDetails')}
        </button>
        <button class="btn btn-danger" id="deleteCarBtn">
          ${t('common.delete')}
        </button>
      </div>
    </div>
    
    <!-- Car Information -->
    <div class="table-container" style="margin-bottom: 30px;">
      <div class="table-header">
        <h2>${carData.year} ${carData.make} ${carData.model}</h2>
        <span class="status-badge status-${carData.status}">${t('status.' + carData.status)}</span>
      </div>
      <div style="padding: 20px;">
        <div class="stats-grid">
          <div class="stat-card">
            <h3>${t('cars.vin')}</h3>
            <div class="stat-value" style="font-size: 1.2rem;">${carData.vin}</div>
          </div>
          <div class="stat-card">
            <h3>${t('cars.color')}</h3>
            <div class="stat-value" style="font-size: 1.2rem;">${carData.color || '-'}</div>
          </div>
          <div class="stat-card">
            <h3>${t('cars.mileage')}</h3>
            <div class="stat-value" style="font-size: 1.2rem;">${carData.mileage ? formatNumber(carData.mileage) + ' mi' : '-'}</div>
          </div>
          <div class="stat-card">
            <h3>${t('cars.purchasePrice')}</h3>
            <div class="stat-value">$${formatNumber(parseFloat(carData.purchase_price) || 0)}</div>
          </div>
          <div class="stat-card">
            <h3>${t('cars.salePrice')}</h3>
            <div class="stat-value">${carData.sale_price ? '$' + formatNumber(parseFloat(carData.sale_price) || 0) : '-'}</div>
          </div>
          <div class="stat-card expense">
            <h3>${t('cars.totalMaintenanceCost')}</h3>
            <div class="stat-value">$${formatNumber(totalMaintenanceCost)}</div>
          </div>
          <div class="stat-card ${carData.sale_price ? 'profit' : ''}">
            <h3>${t('dashboard.netProfit')}</h3>
            <div class="stat-value">
              ${carData.sale_price ? '$' + formatNumber((parseFloat(carData.sale_price) || 0) - (parseFloat(carData.purchase_price) || 0) - totalMaintenanceCost) : '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Maintenance Records -->
    <div class="table-container">
      <div class="table-header">
        <h2>${t('cars.maintenanceRecords')}</h2>
        <div class="table-controls">
          <div class="search-box">
            <input 
              type="text" 
              id="maintenanceSearchInput" 
              placeholder="${t('common.search')}..."
              value=""
            >
          </div>
          <button class="btn btn-primary" id="addMaintenanceBtn">
            ${t('cars.addMaintenance')}
          </button>
        </div>
      </div>
      <div class="table-wrapper">
        ${renderMaintenanceTable()}
      </div>
    </div>
  `;
}

function renderMaintenanceTable() {
  if (filteredMaintenance.length === 0) {
    return showEmptyState(t('maintenance.noRecords'), '🔧');
  }
  
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>${t('maintenance.date')}</th>
          <th>${t('maintenance.category')}</th>
          <th>${t('maintenance.description')}</th>
          <th>${t('maintenance.cost')}</th>
          <th>${t('maintenance.vendor')}</th>
          <th>${t('common.actions')}</th>
        </tr>
      </thead>
      <tbody>
        ${filteredMaintenance.map(record => `
          <tr data-maintenance-id="${record.id}" class="maintenance-row">
            <td>${formatDate(record.maintenance_date)}</td>
            <td>${record.category ? record.category.name : (record.category_name || '-')}</td>
            <td>${record.description}</td>
            <td>$${formatNumber(record.cost)}</td>
            <td>${record.vendor || '-'}</td>
            <td>
              <button class="btn btn-sm btn-secondary edit-maintenance-btn" data-maintenance-id="${record.id}">
                ${t('common.edit')}
              </button>
              <button class="btn btn-sm btn-danger delete-maintenance-btn" data-maintenance-id="${record.id}">
                ${t('common.delete')}
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function setupCarDetailsEventListeners() {
  // Edit car button
  const editCarBtn = document.getElementById('editCarBtn');
  if (editCarBtn) {
    editCarBtn.addEventListener('click', () => showCarModal(carData));
  }
  
  // Delete car button
  const deleteCarBtn = document.getElementById('deleteCarBtn');
  if (deleteCarBtn) {
    deleteCarBtn.addEventListener('click', () => handleDeleteCar(carData.id));
  }
  
  // Print car button
  const printCarBtn = document.getElementById('printCarBtn');
  if (printCarBtn) {
    printCarBtn.addEventListener('click', () => printCarDetails());
  }
  
  // Add maintenance button
  const addMaintenanceBtn = document.getElementById('addMaintenanceBtn');
  if (addMaintenanceBtn) {
    addMaintenanceBtn.addEventListener('click', () => showMaintenanceModal());
  }
  
  // Maintenance search
  const searchInput = document.getElementById('maintenanceSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', handleMaintenanceSearch);
  }
  
  // Maintenance row clicks
  const maintenanceRows = document.querySelectorAll('.maintenance-row');
  maintenanceRows.forEach(row => {
    row.addEventListener('click', (e) => {
      // Don't trigger if clicking on action buttons
      if (e.target.classList.contains('btn')) return;
      
      const maintenanceId = row.getAttribute('data-maintenance-id');
      const maintenance = maintenanceRecords.find(m => m.id === maintenanceId);
      showMaintenanceModal(maintenance);
    });
  });
  
  // Edit maintenance buttons
  const editBtns = document.querySelectorAll('.edit-maintenance-btn');
  editBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const maintenanceId = btn.getAttribute('data-maintenance-id');
      const maintenance = maintenanceRecords.find(m => m.id === maintenanceId);
      showMaintenanceModal(maintenance);
    });
  });
  
  // Delete maintenance buttons
  const deleteBtns = document.querySelectorAll('.delete-maintenance-btn');
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const maintenanceId = btn.getAttribute('data-maintenance-id');
      handleDeleteMaintenance(maintenanceId);
    });
  });
}

function handleMaintenanceSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  
  filteredMaintenance = maintenanceRecords.filter(record => {
    const categoryName = record.category ? record.category.name : (record.category_name || '');
    return (
      record.description.toLowerCase().includes(searchTerm) ||
      categoryName.toLowerCase().includes(searchTerm) ||
      (record.vendor && record.vendor.toLowerCase().includes(searchTerm)) ||
      record.maintenance_date.includes(searchTerm)
    );
  });
  
  // Re-render table
  const tableWrapper = document.querySelector('.table-wrapper');
  if (tableWrapper) {
    tableWrapper.innerHTML = renderMaintenanceTable();
    setupCarDetailsEventListeners();
  }
}

function showCarModal(car) {
  // Remove existing modal if it exists
  const existingModal = document.getElementById('carModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modalHtml = `
    <div class="modal-overlay" id="carModal">
      <div class="modal">
        <div class="modal-header">
          <h2>${t('cars.editCar')}</h2>
          <button class="modal-close" id="closeCarModal">×</button>
        </div>
        <div class="modal-body">
          <form id="carForm">
            <div class="form-row">
              <div class="form-group">
                <label for="vin">${t('cars.vin')}</label>
                <input type="text" id="vin" class="form-control" required value="${car.vin}">
              </div>
              <div class="form-group">
                <label for="make">${t('cars.make')}</label>
                <input type="text" id="make" class="form-control" required value="${car.make}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="model">${t('cars.model')}</label>
                <input type="text" id="model" class="form-control" required value="${car.model}">
              </div>
              <div class="form-group">
                <label for="year">${t('cars.year')}</label>
                <input type="number" id="year" class="form-control" required value="${car.year}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="color">${t('cars.color')}</label>
                <input type="text" id="color" class="form-control" value="${car.color || ''}">
              </div>
              <div class="form-group">
                <label for="status">${t('cars.status')}</label>
                <select id="status" class="form-select">
                  <option value="in_stock" ${car.status === 'in_stock' ? 'selected' : ''}>${t('status.in_stock')}</option>
                  <option value="sold" ${car.status === 'sold' ? 'selected' : ''}>${t('status.sold')}</option>
                  <option value="pending" ${car.status === 'pending' ? 'selected' : ''}>${t('status.pending')}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="purchase_date">${t('cars.purchaseDate')}</label>
                <input type="date" id="purchase_date" class="form-control" required value="${car.purchase_date ? car.purchase_date.split('T')[0] : ''}">
              </div>
              <div class="form-group">
                <label for="purchase_price">${t('cars.purchasePrice')}</label>
                <input type="number" step="0.01" id="purchase_price" class="form-control" required value="${car.purchase_price}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="sale_date">${t('cars.saleDate')}</label>
                <input type="date" id="sale_date" class="form-control" value="${car.sale_date ? car.sale_date.split('T')[0] : ''}">
              </div>
              <div class="form-group">
                <label for="sale_price">${t('cars.salePrice')}</label>
                <input type="number" step="0.01" id="sale_price" class="form-control" value="${car.sale_price || ''}">
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancelCarBtn">
            ${t('common.cancel')}
          </button>
          <button class="btn btn-primary" id="saveCarBtn">
            ${t('common.save')}
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Show the modal
  const modal = document.getElementById('carModal');
  modal.classList.add('show');
  
  // Set up event listeners
  const closeBtn = document.getElementById('closeCarModal');
  const cancelBtn = document.getElementById('cancelCarBtn');
  const saveBtn = document.getElementById('saveCarBtn');
  
  closeBtn.addEventListener('click', hideCarModal);
  cancelBtn.addEventListener('click', hideCarModal);
  saveBtn.addEventListener('click', () => handleSaveCar(car.id));
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideCarModal();
    }
  });
}

function hideCarModal() {
  const modal = document.getElementById('carModal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300); // Wait for CSS transition
  }
}

function showMaintenanceModal(maintenance = null) {
  const isEdit = maintenance !== null;
  const modalTitle = isEdit ? t('maintenance.editRecord') : t('maintenance.addRecord');
  
  // Remove existing modal if it exists
  const existingModal = document.getElementById('maintenanceModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modalHtml = `
    <div class="modal-overlay" id="maintenanceModal">
      <div class="modal">
        <div class="modal-header">
          <h2>${modalTitle}</h2>
          <button class="modal-close" id="closeMaintenanceModal">×</button>
        </div>
        <div class="modal-body">
          <form id="maintenanceForm">
            <div class="form-row">
              <div class="form-group">
                <label for="category">${t('maintenance.category')}</label>
                <select id="category" class="form-select" required>
                  <option value="">${t('common.select')}...</option>
                  ${maintenanceCategories.map(category => `
                    <option value="${category.id}" ${maintenance?.category_id === category.id ? 'selected' : ''}>
                      ${t('categories.' + category.name) || category.name}
                    </option>
                  `).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="maintenance_date">${t('maintenance.date')}</label>
                <input type="date" id="maintenance_date" class="form-control" required value="${maintenance?.maintenance_date ? maintenance.maintenance_date.split('T')[0] : new Date().toISOString().split('T')[0]}">
              </div>
            </div>
            <div class="form-row single">
              <div class="form-group">
                <label for="description">${t('maintenance.description')}</label>
                <input type="text" id="description" class="form-control" required value="${maintenance?.description || ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="cost">${t('maintenance.cost')}</label>
                <input type="number" step="0.01" id="cost" class="form-control" required value="${maintenance?.cost || ''}">
              </div>
              <div class="form-group">
                <label for="vendor">${t('maintenance.vendor')}</label>
                <input type="text" id="vendor" class="form-control" value="${maintenance?.vendor || ''}">
              </div>
            </div>
            <div class="form-row single">
              <div class="form-group">
                <label for="notes">${t('maintenance.notes')}</label>
                <textarea id="notes" class="form-control" rows="3">${maintenance?.notes || ''}</textarea>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancelMaintenanceBtn">
            ${t('common.cancel')}
          </button>
          <button class="btn btn-primary" id="saveMaintenanceBtn">
            ${t('common.save')}
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Show the modal
  const modal = document.getElementById('maintenanceModal');
  modal.classList.add('show');
  
  // Set up event listeners
  const closeBtn = document.getElementById('closeMaintenanceModal');
  const cancelBtn = document.getElementById('cancelMaintenanceBtn');
  const saveBtn = document.getElementById('saveMaintenanceBtn');
  
  closeBtn.addEventListener('click', hideMaintenanceModal);
  cancelBtn.addEventListener('click', hideMaintenanceModal);
  saveBtn.addEventListener('click', () => handleSaveMaintenance(maintenance?.id));
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideMaintenanceModal();
    }
  });
}

function hideMaintenanceModal() {
  const modal = document.getElementById('maintenanceModal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300); // Wait for CSS transition
  }
}

async function handleSaveCar(carId) {
  // Show confirmation dialog
  if (!confirm(t('messages.confirmEdit') || 'Are you sure you want to save these changes?')) {
    return;
  }
  
  const carData = {
    vin: document.getElementById('vin').value,
    make: document.getElementById('make').value,
    model: document.getElementById('model').value,
    year: parseInt(document.getElementById('year').value),
    color: document.getElementById('color').value,
    status: document.getElementById('status').value,
    purchase_date: document.getElementById('purchase_date').value,
    purchase_price: parseFloat(document.getElementById('purchase_price').value),
    sale_date: document.getElementById('sale_date').value || null,
    sale_price: document.getElementById('sale_price').value ? parseFloat(document.getElementById('sale_price').value) : null
  };
  
  try {
    await api.updateCar(carId, carData);
    showSuccess(t('messages.carUpdated'));
    
    // Close modal and refresh data
    hideCarModal();
    showCarDetails(carId);
  } catch (error) {
    showError(error.message);
  }
}

async function handleDeleteCar(carId) {
  // Show confirmation dialog
  if (!confirm(t('messages.confirmDelete') || 'Are you sure you want to delete this car?')) {
    return;
  }
  
  try {
    await api.deleteCar(carId);
    showSuccess(t('messages.carDeleted'));
    
    // Navigate back to cars page
    navigate('/cars');
  } catch (error) {
    showError(error.message);
  }
}

async function handleSaveMaintenance(maintenanceId = null) {
  // Show confirmation for edit operations
  if (maintenanceId && !confirm(t('messages.confirmEdit') || 'Are you sure you want to save these changes?')) {
    return;
  }
  
  const maintenanceData = {
    car_id: carData.id,
    category_id: document.getElementById('category').value,
    description: document.getElementById('description').value,
    cost: parseFloat(document.getElementById('cost').value),
    maintenance_date: document.getElementById('maintenance_date').value,
    vendor: document.getElementById('vendor').value || null,
    notes: document.getElementById('notes').value || null
  };
  
  try {
    if (maintenanceId) {
      await api.updateMaintenanceRecord(maintenanceId, maintenanceData);
      showSuccess(t('messages.maintenanceUpdated'));
    } else {
      await api.createMaintenanceRecord(maintenanceData);
      showSuccess(t('messages.maintenanceAdded'));
    }
    
    // Close modal and refresh data
    hideMaintenanceModal();
    showCarDetails(carData.id);
  } catch (error) {
    showError(error.message);
  }
}

async function handleDeleteMaintenance(maintenanceId) {
  if (!confirm(t('messages.confirmDelete') || 'Are you sure you want to delete this maintenance record?')) {
    return;
  }
  
  try {
    await api.deleteMaintenanceRecord(maintenanceId);
    showSuccess(t('messages.maintenanceDeleted'));
    showCarDetails(carData.id);
  } catch (error) {
    showError(error.message);
  }
}

function formatNumber(num) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function printCarDetails() {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!carData || !maintenanceRecords) {
    showWarning('No car details to print');
    return;
  }
  
  const totalMaintenanceCost = maintenanceRecords.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0);
  const netProfit = carData.sale_price ? (parseFloat(carData.sale_price) || 0) - (parseFloat(carData.purchase_price) || 0) - totalMaintenanceCost : 0;
  
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
  `;
  
  printWindow.document.write(printHTML);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = function() {
    printWindow.print();
    printWindow.close();
  };
} 