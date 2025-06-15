// Maintenance page component
import { t } from '../utils/i18n.js';
import { api } from '../utils/api.js';
import { createLayout, showLoading } from '../components/layout.js';
import { showSuccess, showError, showWarning } from '../utils/snackbar.js';
import { navigate } from '../utils/router.js';

let maintenanceRecords = [];
let filteredRecords = [];
let categories = [];
let cars = [];

export async function showMaintenancePage() {
  // Show loading state
  createLayout(showLoading(), 'maintenance');
  
  try {
    // Fetch maintenance data
    const [recordsData, categoriesData, carsData] = await Promise.all([
      api.getAllMaintenanceRecords(),
      api.getMaintenanceCategories(),
      api.getCars()
    ]);
    
    maintenanceRecords = recordsData;
    filteredRecords = [...maintenanceRecords];
    categories = categoriesData;
    cars = carsData;
    
    // Render maintenance page with data
    const content = renderMaintenanceContent();
    createLayout(content, 'maintenance');
    
    // Setup event listeners
    setupMaintenanceEventListeners();
  } catch (error) {
    console.error('Failed to load maintenance records:', error);
    showError(t('messages.errorOccurred') + ': ' + error.message);
    
    // Show error state
    const errorContent = `
      <div class="dashboard-header">
        <h1>${t('maintenance.title')}</h1>
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
    createLayout(errorContent, 'maintenance');
  }
}

function renderMaintenanceContent() {
  return `
    <div class="dashboard-header">
      <h1>${t('maintenance.allRecords')}</h1>
      <div class="car-search-container">
        <input type="text" id="carSearchInput" placeholder="${t('common.search')} ${t('maintenance.car')}..." class="car-search-input">
        <div id="carSearchResults" class="car-search-results"></div>
        <button class="btn btn-primary" id="addMaintenanceBtn" disabled>
          ${t('maintenance.addRecord')}
        </button>
      </div>
    </div>
    
    <div class="table-container">
      <div class="table-header">
        <div class="search-container">
          <input type="text" id="searchInput" placeholder="${t('common.search')}..." class="search-input">
        </div>
      </div>
      
      <div class="table-wrapper">
        ${renderMaintenanceTable()}
      </div>
    </div>
    
    <!-- Add/Edit Maintenance Modal -->
    <div id="maintenanceModal" class="modal-overlay" style="display: none;">
      <div class="modal">
        <div class="modal-header">
          <h2 id="modalTitle">${t('maintenance.addRecord')}</h2>
          <span class="modal-close" id="closeModal">&times;</span>
        </div>
        <div class="modal-body">
          <form id="maintenanceForm">
            <div class="form-group">
              <label for="selectedCarInfo">${t('maintenance.car')}:</label>
              <input type="text" id="selectedCarInfo" readonly class="form-control">
              <input type="hidden" id="selectedCarId">
            </div>
            
            <div class="form-group">
              <label for="category">${t('maintenance.category')}:</label>
              <select id="category" class="form-select" required>
                <option value="">${t('common.select')} ${t('maintenance.category')}</option>
                ${categories.map(cat => `
                  <option value="${cat.id}">${t('categories.' + cat.name) || cat.name}</option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label for="description">${t('maintenance.description')}:</label>
              <textarea id="description" required class="form-control"></textarea>
            </div>
            
            <div class="form-group">
              <label for="cost">${t('maintenance.cost')}:</label>
              <input type="number" id="cost" step="0.01" min="0" required class="form-control">
            </div>
            
            <div class="form-group">
              <label for="maintenanceDate">${t('maintenance.date')}:</label>
              <input type="date" id="maintenanceDate" required class="form-control">
            </div>
            
            <div class="form-group">
              <label for="vendor">${t('maintenance.vendor')}:</label>
              <input type="text" id="vendor" class="form-control">
            </div>
            
            <div class="form-group">
              <label for="notes">${t('maintenance.notes')}:</label>
              <textarea id="notes" class="form-control"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="cancelBtn">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary" id="saveBtn">${t('common.save')}</button>
        </div>
      </div>
    </div>
  `;
}

function renderMaintenanceTable() {
  if (!filteredRecords || filteredRecords.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🔧</div>
        <h3>${t('maintenance.noRecords')}</h3>
      </div>
    `;
  }
  
  return `
    <table class="data-table" id="maintenanceTable">
      <thead>
        <tr>
          <th class="sortable" data-sort="maintenance_date">${t('maintenance.date')}</th>
          <th class="sortable" data-sort="car_vin">${t('cars.vin')}</th>
          <th class="sortable" data-sort="car_info">${t('maintenance.car')}</th>
          <th class="sortable" data-sort="category_name">${t('maintenance.category')}</th>
          <th class="sortable" data-sort="description">${t('maintenance.description')}</th>
          <th class="sortable" data-sort="cost">${t('maintenance.cost')}</th>
          <th class="sortable" data-sort="vendor">${t('maintenance.vendor')}</th>
          <th>${t('common.actions')}</th>
        </tr>
      </thead>
      <tbody>
        ${filteredRecords.map(record => `
          <tr class="maintenance-row" data-maintenance-id="${record.id}">
            <td>${formatDate(record.maintenance_date)}</td>
            <td>${record.car_vin}</td>
            <td>${record.car_year} ${record.car_make} ${record.car_model}</td>
            <td>${t('categories.' + record.category_name) || record.category_name}</td>
            <td>${record.description}</td>
            <td>$${formatNumber(record.cost)}</td>
            <td>${record.vendor || '-'}</td>
            <td>
              <button class="btn btn-sm btn-primary" onclick="viewCar('${record.car_id}')">
                ${t('cars.carDetails')}
              </button>
              <button class="btn btn-sm btn-secondary" onclick="editMaintenance('${record.id}')">
                ${t('common.edit')}
              </button>
              <button class="btn btn-sm btn-danger" onclick="deleteMaintenance('${record.id}')">
                ${t('common.delete')}
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="table-footer">
      <div class="table-info">
        ${t('common.total')}: ${filteredRecords.length} ${t('maintenance.noRecords').toLowerCase()}
        | ${t('maintenance.totalCost')}: $${formatNumber(filteredRecords.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0))}
      </div>
    </div>
  `;
}

let selectedCarId = null;

function setupMaintenanceEventListeners() {
  // Car search functionality
  const carSearchInput = document.getElementById('carSearchInput');
  if (carSearchInput) {
    carSearchInput.addEventListener('input', handleCarSearch);
    carSearchInput.addEventListener('focus', handleCarSearch);
  }
  
  // Hide search results when clicking outside
  document.addEventListener('click', (e) => {
    const searchResults = document.getElementById('carSearchResults');
    if (searchResults && !e.target.closest('.car-search-container')) {
      searchResults.style.display = 'none';
    }
  });
  
  // Search functionality
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
  
  // Add maintenance button
  const addBtn = document.getElementById('addMaintenanceBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      if (selectedCarId) {
        showMaintenanceModal();
      } else {
        showWarning(t('common.select') + ' ' + t('maintenance.car'));
      }
    });
  }
  
  // Maintenance row clicks
  const maintenanceRows = document.querySelectorAll('.maintenance-row');
  maintenanceRows.forEach(row => {
    row.addEventListener('click', (e) => {
      // Don't open edit if clicking on action buttons
      if (e.target.classList.contains('btn')) return;
      
      const maintenanceId = row.getAttribute('data-maintenance-id');
      const record = maintenanceRecords.find(r => r.id === maintenanceId);
      if (record) {
        showMaintenanceModal(record.id);
      }
    });
  });
  
  // Modal close button
  const closeModal = document.getElementById('closeModal');
  if (closeModal) {
    closeModal.addEventListener('click', hideMaintenanceModal);
  }
  
  // Cancel button
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', hideMaintenanceModal);
  }
  
  // Save button and form submission
  const saveBtn = document.getElementById('saveBtn');
  const form = document.getElementById('maintenanceForm');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleMaintenanceSubmit);
  }
  if (form) {
    form.addEventListener('submit', handleMaintenanceSubmit);
  }
  
  // Sortable headers
  const sortableHeaders = document.querySelectorAll('.sortable');
  sortableHeaders.forEach(header => {
    header.addEventListener('click', () => handleSort(header.dataset.sort));
  });
  
  // Modal click outside to close
  const modal = document.getElementById('maintenanceModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideMaintenanceModal();
      }
    });
  }
}

function handleCarSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  const resultsContainer = document.getElementById('carSearchResults');
  const addBtn = document.getElementById('addMaintenanceBtn');
  
  if (searchTerm.length < 1) {
    resultsContainer.style.display = 'none';
    selectedCarId = null;
    addBtn.disabled = true;
    return;
  }
  
  const filteredCars = cars.filter(car => {
    return (
      car.vin.toLowerCase().includes(searchTerm) ||
      car.make.toLowerCase().includes(searchTerm) ||
      car.model.toLowerCase().includes(searchTerm) ||
      car.year.toString().includes(searchTerm) ||
      `${car.year} ${car.make} ${car.model}`.toLowerCase().includes(searchTerm)
    );
  });
  
  if (filteredCars.length > 0) {
    resultsContainer.innerHTML = filteredCars.map(car => `
      <div class="car-search-item" data-car-id="${car.id}" data-car-info="${car.year} ${car.make} ${car.model} (${car.vin})">
        <strong>${car.year} ${car.make} ${car.model}</strong>
        <small>VIN: ${car.vin}</small>
      </div>
    `).join('');
    
    resultsContainer.style.display = 'block';
    
    // Add click handlers to search results
    resultsContainer.querySelectorAll('.car-search-item').forEach(item => {
      item.addEventListener('click', () => {
        selectedCarId = item.dataset.carId;
        const carInfo = item.dataset.carInfo;
        document.getElementById('carSearchInput').value = carInfo;
        resultsContainer.style.display = 'none';
        addBtn.disabled = false;
      });
    });
  } else {
    resultsContainer.style.display = 'none';
    selectedCarId = null;
    addBtn.disabled = true;
  }
}

function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  
  filteredRecords = maintenanceRecords.filter(record => {
    return (
      record.description.toLowerCase().includes(searchTerm) ||
      record.car_make.toLowerCase().includes(searchTerm) ||
      record.car_model.toLowerCase().includes(searchTerm) ||
      record.category_name.toLowerCase().includes(searchTerm) ||
      (record.vendor && record.vendor.toLowerCase().includes(searchTerm))
    );
  });
  
  updateTable();
}

function handleSort(sortField) {
  const isAscending = !filteredRecords._sortAscending || filteredRecords._lastSort !== sortField;
  
  filteredRecords.sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    // Handle special cases
    if (sortField === 'car_info') {
      aVal = `${a.car_year} ${a.car_make} ${a.car_model}`;
      bVal = `${b.car_year} ${b.car_make} ${b.car_model}`;
    }
    
    if (sortField === 'cost') {
      aVal = parseFloat(aVal) || 0;
      bVal = parseFloat(bVal) || 0;
    }
    
    if (sortField === 'maintenance_date') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    
    if (aVal < bVal) return isAscending ? -1 : 1;
    if (aVal > bVal) return isAscending ? 1 : -1;
    return 0;
  });
  
  filteredRecords._sortAscending = isAscending;
  filteredRecords._lastSort = sortField;
  
  updateTable();
}

function updateTable() {
  const tableWrapper = document.querySelector('.table-wrapper');
  if (tableWrapper) {
    tableWrapper.innerHTML = renderMaintenanceTable();
    
    // Re-setup event listeners for new table rows
    const maintenanceRows = document.querySelectorAll('.maintenance-row');
    maintenanceRows.forEach(row => {
      row.addEventListener('click', (e) => {
        // Don't open edit if clicking on action buttons
        if (e.target.classList.contains('btn')) return;
        
        const maintenanceId = row.getAttribute('data-maintenance-id');
        const record = maintenanceRecords.find(r => r.id === maintenanceId);
        if (record) {
          showMaintenanceModal(record.id);
        }
      });
    });
    
    // Re-setup sortable headers
    const sortableHeaders = document.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
      header.addEventListener('click', () => handleSort(header.dataset.sort));
    });
  }
}

function showMaintenanceModal(recordId = null) {
  const modal = document.getElementById('maintenanceModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('maintenanceForm');
  
  if (recordId) {
    // Edit mode
    modalTitle.textContent = t('maintenance.editRecord');
    const record = maintenanceRecords.find(r => r.id === recordId);
    if (record) {
      const carInfo = `${record.car_year} ${record.car_make} ${record.car_model} (${record.car_vin})`;
      document.getElementById('selectedCarInfo').value = carInfo;
      document.getElementById('selectedCarId').value = record.car_id;
      
      // Set category dropdown value
      document.getElementById('category').value = record.category_id;
      
      document.getElementById('description').value = record.description;
      document.getElementById('cost').value = record.cost;
      document.getElementById('maintenanceDate').value = record.maintenance_date.split('T')[0];
      document.getElementById('vendor').value = record.vendor || '';
      document.getElementById('notes').value = record.notes || '';
      form.dataset.recordId = recordId;
    }
  } else {
    // Add mode
    modalTitle.textContent = t('maintenance.addRecord');
    form.reset();
    delete form.dataset.recordId;
    
    // Reset category dropdown
    document.getElementById('category').value = '';
    
    // Set selected car info
    if (selectedCarId) {
      const car = cars.find(c => c.id === selectedCarId);
      if (car) {
        const carInfo = `${car.year} ${car.make} ${car.model} (${car.vin})`;
        document.getElementById('selectedCarInfo').value = carInfo;
        document.getElementById('selectedCarId').value = selectedCarId;
      }
    }
    
    // Set default date to today
    document.getElementById('maintenanceDate').value = new Date().toISOString().split('T')[0];
  }
  
  modal.classList.add('show');
}

function hideMaintenanceModal() {
  const modal = document.getElementById('maintenanceModal');
  modal.classList.remove('show');
}

async function handleMaintenanceSubmit(e) {
  e.preventDefault();
  
  const form = document.getElementById('maintenanceForm');
  const recordId = form.dataset.recordId;
  
  // Show confirmation for edit operations
  if (recordId && !confirm(t('messages.confirmEdit') || 'Are you sure you want to save these changes?')) {
    return;
  }
  
  const data = {
    car_id: document.getElementById('selectedCarId').value,
    category_id: document.getElementById('category').value,
    description: document.getElementById('description').value,
    cost: parseFloat(document.getElementById('cost').value),
    maintenance_date: document.getElementById('maintenanceDate').value,
    vendor: document.getElementById('vendor').value || null,
    notes: document.getElementById('notes').value || null
  };
  
  try {
    if (recordId) {
      // Update existing record
      await api.updateMaintenanceRecord(recordId, data);
      showSuccess(t('messages.maintenanceUpdated'));
    } else {
      // Create new record
      await api.createMaintenanceRecord(data);
      showSuccess(t('messages.maintenanceAdded'));
    }
    
    hideMaintenanceModal();
    // Reload the page to refresh data
    showMaintenancePage();
  } catch (error) {
    console.error('Error saving maintenance record:', error);
    showError(t('messages.errorOccurred') + ': ' + error.message);
  }
}

// Global functions for button clicks
window.editMaintenance = function(recordId) {
  showMaintenanceModal(recordId);
};

window.deleteMaintenance = async function(recordId) {
  if (!confirm(t('messages.confirmDelete') || 'Are you sure you want to delete this maintenance record?')) {
    return;
  }
  
  try {
    await api.deleteMaintenanceRecord(recordId);
    showSuccess(t('messages.maintenanceDeleted'));
    // Reload the page to refresh data
    showMaintenancePage();
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    showError(t('messages.errorOccurred') + ': ' + error.message);
  }
};

window.viewCar = function(carId) {
  navigate(`/cars/${carId}`);
};

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function formatNumber(num) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
} 