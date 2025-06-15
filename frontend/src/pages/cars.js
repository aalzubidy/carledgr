// Cars page component
import { t } from '../utils/i18n.js';
import { api } from '../utils/api.js';
import { createLayout, showLoading, showEmptyState } from '../components/layout.js';
import { showSuccess, showError, showWarning } from '../utils/snackbar.js';
import { navigate } from '../utils/router.js';
import vinDecoder from '../utils/vinDecoder.js';

let carsData = [];
let filteredCars = [];
let sortColumn = '';
let sortDirection = 'asc';

export async function showCarsPage() {
  // Show loading state
  createLayout(showLoading(), 'cars');
  
  try {
    // Fetch cars data
    carsData = await api.getCars();
    filteredCars = [...carsData];
    
    // Render cars page with data
    const content = renderCarsContent();
    createLayout(content, 'cars');
    
    // Set up event listeners
    setupCarsEventListeners();
  } catch (error) {
    console.error('Failed to load cars:', error);
    showError(t('messages.errorOccurred') + ': ' + error.message);
    
    // Show error state
    const errorContent = `
      <div class="dashboard-header">
        <h1>${t('cars.title')}</h1>
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

function renderCarsContent() {
  return `
    <div class="table-container">
      <div class="table-header">
        <h2>${t('cars.title')}</h2>
        <div class="table-controls">
          <div class="search-box">
            <input 
              type="text" 
              id="searchInput" 
              placeholder="${t('cars.search')}"
              value=""
            >
          </div>
          <button class="btn btn-primary" id="addCarBtn">
            ${t('cars.addCar')}
          </button>
        </div>
      </div>
      <div class="table-wrapper">
        ${renderCarsTable()}
      </div>
    </div>
  `;
}

function renderCarsTable() {
  if (filteredCars.length === 0) {
    return showEmptyState(t('cars.noResults'), '🚗');
  }
  
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th class="sortable" data-column="vin">${t('cars.vin')} ${getSortIcon('vin')}</th>
          <th class="sortable" data-column="make">${t('cars.make')} ${getSortIcon('make')}</th>
          <th class="sortable" data-column="model">${t('cars.model')} ${getSortIcon('model')}</th>
          <th class="sortable" data-column="year">${t('cars.year')} ${getSortIcon('year')}</th>
          <th class="sortable" data-column="color">${t('cars.color')} ${getSortIcon('color')}</th>
          <th class="sortable" data-column="mileage">${t('cars.mileage')} ${getSortIcon('mileage')}</th>
          <th class="sortable" data-column="purchase_price">${t('cars.purchasePrice')} ${getSortIcon('purchase_price')}</th>
          <th class="sortable" data-column="sale_price">${t('cars.salePrice')} ${getSortIcon('sale_price')}</th>
          <th class="sortable" data-column="status">${t('cars.status')} ${getSortIcon('status')}</th>
          <th>${t('common.actions')}</th>
        </tr>
      </thead>
      <tbody>
        ${filteredCars.map(car => `
          <tr data-car-id="${car.id}" class="car-row">
            <td>${car.vin}</td>
            <td>${car.make}</td>
            <td>${car.model}</td>
            <td>${car.year}</td>
            <td>${car.color || '-'}</td>
            <td>${car.mileage ? formatNumber(car.mileage) + ' mi' : '-'}</td>
            <td>$${formatNumber(car.purchase_price)}</td>
            <td>${car.sale_price ? '$' + formatNumber(car.sale_price) : '-'}</td>
            <td><span class="status-badge status-${car.status}">${t('status.' + car.status)}</span></td>
            <td>
              <button class="btn btn-sm btn-secondary edit-car-btn" data-car-id="${car.id}">
                ${t('common.edit')}
              </button>
              <button class="btn btn-sm btn-danger delete-car-btn" data-car-id="${car.id}">
                ${t('common.delete')}
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function getSortIcon(column) {
  if (sortColumn !== column) return '';
  return sortDirection === 'asc' ? '↑' : '↓';
}

function setupCarsEventListeners() {
  // Search functionality
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
  
  // Add car button
  const addCarBtn = document.getElementById('addCarBtn');
  if (addCarBtn) {
    addCarBtn.addEventListener('click', () => showCarModal());
  }
  
  // Sort functionality
  const sortableHeaders = document.querySelectorAll('.sortable');
  sortableHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const column = header.getAttribute('data-column');
      handleSort(column);
    });
  });
  
  // Car row clicks (navigate to car details)
  const carRows = document.querySelectorAll('.car-row');
  carRows.forEach(row => {
    row.addEventListener('click', (e) => {
      // Don't navigate if clicking on action buttons
      if (e.target.classList.contains('btn')) return;
      
      const carId = row.getAttribute('data-car-id');
      navigate(`/cars/${carId}`);
    });
  });
  
  // Edit car buttons
  const editBtns = document.querySelectorAll('.edit-car-btn');
  editBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const carId = btn.getAttribute('data-car-id');
      const car = carsData.find(c => c.id === carId);
      showCarModal(car);
    });
  });
  
  // Delete car buttons
  const deleteBtns = document.querySelectorAll('.delete-car-btn');
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const carId = btn.getAttribute('data-car-id');
      handleDeleteCar(carId);
    });
  });
}

function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  
  filteredCars = carsData.filter(car => {
    return (
      car.vin.toLowerCase().includes(searchTerm) ||
      car.make.toLowerCase().includes(searchTerm) ||
      car.model.toLowerCase().includes(searchTerm) ||
      car.year.toString().includes(searchTerm) ||
      (car.color && car.color.toLowerCase().includes(searchTerm)) ||
      car.status.toLowerCase().includes(searchTerm)
    );
  });
  
  // Re-render table
  const tableWrapper = document.querySelector('.table-wrapper');
  if (tableWrapper) {
    tableWrapper.innerHTML = renderCarsTable();
    setupCarsEventListeners();
  }
}

function handleSort(column) {
  if (sortColumn === column) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn = column;
    sortDirection = 'asc';
  }
  
  filteredCars.sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];
    
    // Handle null/undefined values
    if (aVal == null) aVal = '';
    if (bVal == null) bVal = '';
    
    // Convert to string for comparison
    aVal = aVal.toString().toLowerCase();
    bVal = bVal.toString().toLowerCase();
    
    if (sortDirection === 'asc') {
      return aVal.localeCompare(bVal);
    } else {
      return bVal.localeCompare(aVal);
    }
  });
  
  // Re-render table
  const tableWrapper = document.querySelector('.table-wrapper');
  if (tableWrapper) {
    tableWrapper.innerHTML = renderCarsTable();
    setupCarsEventListeners();
  }
}

function showCarModal(car = null) {
  const isEdit = car !== null;
  const modalTitle = isEdit ? t('cars.editCar') : t('cars.addCar');
  
  const modalHtml = `
    <div class="modal-overlay" id="carModal">
      <div class="modal">
        <div class="modal-header">
          <h2>${modalTitle}</h2>
          <button class="modal-close" onclick="document.getElementById('carModal').remove()">×</button>
        </div>
        <div class="modal-body">
          <form id="carForm">
            <div class="form-row">
              <div class="form-group">
                <label for="vin">${t('cars.vin')}</label>
                <input type="text" id="vin" class="form-control" required value="${car?.vin || ''}" placeholder="Enter VIN to auto-populate fields">
                <small style="display: block; margin-top: 5px; color: #666;">
                  ${isEdit ? '' : 'Enter a VIN number to automatically populate make, model, year, and color'}
                </small>
              </div>
              <div class="form-group">
                <label for="make">${t('cars.make')}</label>
                <input type="text" id="make" class="form-control" required value="${car?.make || ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="model">${t('cars.model')}</label>
                <input type="text" id="model" class="form-control" required value="${car?.model || ''}">
              </div>
              <div class="form-group">
                <label for="year">${t('cars.year')}</label>
                <input type="number" id="year" class="form-control" required value="${car?.year || ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="color">${t('cars.color')}</label>
                <input type="text" id="color" class="form-control" value="${car?.color || ''}">
              </div>
              <div class="form-group">
                <label for="mileage">${t('cars.mileage')}</label>
                <input type="number" id="mileage" class="form-control" min="0" value="${car?.mileage || ''}" placeholder="e.g., 50000">
              </div>
            </div>
            ${isEdit ? `
            <div class="form-row single">
              <div class="form-group">
                <label for="status">${t('cars.status')}</label>
                <select id="status" class="form-select">
                  <option value="in_stock" ${car?.status === 'in_stock' ? 'selected' : ''}>${t('status.in_stock')}</option>
                  <option value="sold" ${car?.status === 'sold' ? 'selected' : ''}>${t('status.sold')}</option>
                  <option value="pending" ${car?.status === 'pending' ? 'selected' : ''}>${t('status.pending')}</option>
                </select>
              </div>
            </div>
            ` : ''}
            <div class="form-row">
              <div class="form-group">
                <label for="purchase_date">${t('cars.purchaseDate')}</label>
                <input type="date" id="purchase_date" class="form-control" required value="${car?.purchase_date ? car.purchase_date.split('T')[0] : ''}">
              </div>
              <div class="form-group">
                <label for="purchase_price">${t('cars.purchasePrice')}</label>
                <input type="number" step="0.01" id="purchase_price" class="form-control" required value="${car?.purchase_price || ''}">
              </div>
            </div>
            ${isEdit ? `
            <div class="form-row">
              <div class="form-group">
                <label for="sale_date">${t('cars.saleDate')}</label>
                <input type="date" id="sale_date" class="form-control" value="${car?.sale_date ? car.sale_date.split('T')[0] : ''}">
              </div>
              <div class="form-group">
                <label for="sale_price">${t('cars.salePrice')}</label>
                <input type="number" step="0.01" id="sale_price" class="form-control" value="${car?.sale_price || ''}">
              </div>
            </div>
            ` : ''}
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('carModal').remove()">
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
  
  // Set up VIN decoding for new cars
  if (!car) {
    setupVINDecoding();
  }
  
  // Set up form submission
  const saveBtn = document.getElementById('saveCarBtn');
  saveBtn.addEventListener('click', () => handleSaveCar(car?.id));
}

function setupVINDecoding() {
  const vinInput = document.getElementById('vin');
  let decodeTimeout;
  
  vinInput.addEventListener('input', async (e) => {
    const vin = e.target.value.trim();
    
    // Clear previous timeout
    if (decodeTimeout) {
      clearTimeout(decodeTimeout);
    }
    
    // Only decode if we have a reasonable length VIN
    if (vin.length >= 17) {
      // Add visual feedback
      vinInput.style.borderColor = '#ffc107';
      vinInput.style.backgroundColor = '#fff3cd';
      
      // Decode with a small delay to avoid too many API calls
      decodeTimeout = setTimeout(async () => {
        try {
          const decoded = await vinDecoder.decode(vin);
          
          if (decoded.isValid) {
            // Populate fields with decoded data
            if (decoded.make) {
              document.getElementById('make').value = decoded.make;
            }
            if (decoded.model) {
              document.getElementById('model').value = decoded.model;
            }
            if (decoded.year) {
              document.getElementById('year').value = decoded.year;
            }
            if (decoded.color) {
              document.getElementById('color').value = decoded.color;
            }
            
            // Success visual feedback
            vinInput.style.borderColor = '#28a745';
            vinInput.style.backgroundColor = '#d4edda';
            
            // Show success message
            showSuccess('VIN decoded successfully!');
            
            // Reset styles after a delay
            setTimeout(() => {
              vinInput.style.borderColor = '';
              vinInput.style.backgroundColor = '';
            }, 2000);
          } else {
            throw new Error('Invalid VIN format');
          }
        } catch (error) {
          console.warn('VIN decode error:', error);
          
          // Error visual feedback
          vinInput.style.borderColor = '#dc3545';
          vinInput.style.backgroundColor = '#f8d7da';
          
          // Show error message
          if (vin.length === 17) {
            showWarning('Could not decode VIN. Please check the VIN number or enter details manually.');
          }
          
          // Reset styles after a delay
          setTimeout(() => {
            vinInput.style.borderColor = '';
            vinInput.style.backgroundColor = '';
          }, 3000);
        }
      }, 1000); // 1 second delay
    } else {
      // Reset visual feedback for incomplete VIN
      vinInput.style.borderColor = '';
      vinInput.style.backgroundColor = '';
    }
  });
  
  // Also trigger on paste
  vinInput.addEventListener('paste', (e) => {
    setTimeout(() => {
      vinInput.dispatchEvent(new Event('input'));
    }, 100);
  });
}

async function handleSaveCar(carId = null) {
  // Show confirmation for edit operations
  if (carId && !confirm(t('messages.confirmEdit') || 'Are you sure you want to save these changes?')) {
    return;
  }
  
  const form = document.getElementById('carForm');
  const formData = new FormData(form);
  
  const carData = {
    vin: document.getElementById('vin').value,
    make: document.getElementById('make').value,
    model: document.getElementById('model').value,
    year: parseInt(document.getElementById('year').value),
    color: document.getElementById('color').value,
    mileage: document.getElementById('mileage').value ? parseInt(document.getElementById('mileage').value) : null,
    purchase_date: document.getElementById('purchase_date').value,
    purchase_price: parseFloat(document.getElementById('purchase_price').value)
  };
  
  // Only include sale data and status for edit mode
  if (carId) {
    // Get status from custom dropdown
    const status = document.getElementById('status').value;
    carData.status = status;
    const saleDateEl = document.getElementById('sale_date');
    const salePriceEl = document.getElementById('sale_price');
    if (saleDateEl) carData.sale_date = saleDateEl.value || null;
    if (salePriceEl) carData.sale_price = salePriceEl.value ? parseFloat(salePriceEl.value) : null;
  }
  
  try {
    if (carId) {
      await api.updateCar(carId, carData);
      showSuccess(t('messages.carUpdated'));
    } else {
      await api.createCar(carData);
      showSuccess(t('messages.carAdded'));
    }
    
    // Close modal and refresh data
    document.getElementById('carModal').remove();
    showCarsPage();
  } catch (error) {
    showError(error.message);
  }
}

async function handleDeleteCar(carId) {
  if (confirm(t('messages.confirmDelete'))) {
    try {
      await api.deleteCar(carId);
      showSuccess(t('messages.carDeleted'));
      showCarsPage();
    } catch (error) {
      showError(error.message);
    }
  }
}

function formatNumber(num) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
} 