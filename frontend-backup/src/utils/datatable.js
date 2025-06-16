// DataTable utility for enhanced table functionality
import { t } from './i18n.js';

export class DataTable {
  constructor(containerId, data, columns, options = {}) {
    this.containerId = containerId;
    this.originalData = [...data];
    this.data = [...data];
    this.columns = columns;
    this.options = {
      pageSize: 10,
      searchable: true,
      sortable: true,
      pagination: true,
      ...options
    };
    
    this.currentPage = 1;
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.searchTerm = '';
    
    this.render();
    this.setupEventListeners();
  }
  
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    container.innerHTML = `
      <div class="datatable-container">
        ${this.options.searchable ? this.renderSearchBox() : ''}
        <div class="datatable-wrapper">
          ${this.renderTable()}
        </div>
        ${this.options.pagination ? this.renderPagination() : ''}
        <div class="datatable-info">
          ${this.renderInfo()}
        </div>
      </div>
    `;
  }
  
  renderSearchBox() {
    return `
      <div class="datatable-search">
        <div class="search-box">
          <input type="text" 
                 id="${this.containerId}-search" 
                 placeholder="${t('common.search')}..." 
                 value="${this.searchTerm}">
        </div>
      </div>
    `;
  }
  
  renderTable() {
    const paginatedData = this.getPaginatedData();
    
    if (paginatedData.length === 0) {
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
            ${this.columns.map(col => `
              <th class="${col.sortable !== false && this.options.sortable ? 'sortable' : ''}" 
                  data-column="${col.key}">
                ${col.title}
                ${this.getSortIcon(col.key)}
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${paginatedData.map(row => `
            <tr>
              ${this.columns.map(col => `
                <td>${this.formatCellValue(row, col)}</td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
  
  renderPagination() {
    const totalPages = Math.ceil(this.data.length / this.options.pageSize);
    
    if (totalPages <= 1) return '';
    
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(totalPages, this.currentPage + 2);
    
    let pagination = `
      <div class="datatable-pagination">
        <button class="btn btn-sm btn-secondary" 
                ${this.currentPage === 1 ? 'disabled' : ''} 
                data-page="1">
          ${t('common.first') || 'First'}
        </button>
        <button class="btn btn-sm btn-secondary" 
                ${this.currentPage === 1 ? 'disabled' : ''} 
                data-page="${this.currentPage - 1}">
          ${t('common.previous')}
        </button>
    `;
    
    for (let i = startPage; i <= endPage; i++) {
      pagination += `
        <button class="btn btn-sm ${i === this.currentPage ? 'btn-primary' : 'btn-secondary'}" 
                data-page="${i}">
          ${i}
        </button>
      `;
    }
    
    pagination += `
        <button class="btn btn-sm btn-secondary" 
                ${this.currentPage === totalPages ? 'disabled' : ''} 
                data-page="${this.currentPage + 1}">
          ${t('common.next')}
        </button>
        <button class="btn btn-sm btn-secondary" 
                ${this.currentPage === totalPages ? 'disabled' : ''} 
                data-page="${totalPages}">
          ${t('common.last') || 'Last'}
        </button>
      </div>
    `;
    
    return pagination;
  }
  
  renderInfo() {
    const start = (this.currentPage - 1) * this.options.pageSize + 1;
    const end = Math.min(this.currentPage * this.options.pageSize, this.data.length);
    const total = this.data.length;
    const originalTotal = this.originalData.length;
    
    let info = `${t('common.showing') || 'Showing'} ${start} ${t('common.to') || 'to'} ${end} ${t('common.of') || 'of'} ${total} ${t('common.entries') || 'entries'}`;
    
    if (total !== originalTotal) {
      info += ` (${t('common.filtered') || 'filtered'} ${t('common.from') || 'from'} ${originalTotal} ${t('common.total') || 'total'} ${t('common.entries') || 'entries'})`;
    }
    
    return info;
  }
  
  formatCellValue(row, column) {
    let value = this.getNestedValue(row, column.key);
    
    if (column.render) {
      return column.render(value, row);
    }
    
    if (column.type === 'currency') {
      return `$${this.formatNumber(value || 0)}`;
    }
    
    if (column.type === 'date') {
      return value ? new Date(value).toLocaleDateString() : '-';
    }
    
    if (column.type === 'status') {
      return `<span class="status-badge status-${value}">${t('status.' + value) || value}</span>`;
    }
    
    return value || '-';
  }
  
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  formatNumber(num) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  }
  
  getSortIcon(column) {
    if (!this.options.sortable) return '';
    
    if (this.sortColumn !== column) return ' ↕';
    return this.sortDirection === 'asc' ? ' ↑' : ' ↓';
  }
  
  getPaginatedData() {
    if (!this.options.pagination) return this.data;
    
    const start = (this.currentPage - 1) * this.options.pageSize;
    const end = start + this.options.pageSize;
    return this.data.slice(start, end);
  }
  
  setupEventListeners() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    // Search functionality
    const searchInput = container.querySelector(`#${this.containerId}-search`);
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.search(e.target.value);
      });
    }
    
    // Sort functionality
    container.addEventListener('click', (e) => {
      if (e.target.classList.contains('sortable')) {
        const column = e.target.dataset.column;
        this.sort(column);
      }
      
      // Pagination
      if (e.target.dataset.page) {
        const page = parseInt(e.target.dataset.page);
        this.goToPage(page);
      }
    });
  }
  
  search(term) {
    this.searchTerm = term.toLowerCase();
    this.data = this.originalData.filter(row => {
      return this.columns.some(col => {
        if (col.searchable === false) return false;
        const value = this.getNestedValue(row, col.key);
        return value && value.toString().toLowerCase().includes(this.searchTerm);
      });
    });
    
    this.currentPage = 1;
    this.render();
    this.setupEventListeners();
  }
  
  sort(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    this.data.sort((a, b) => {
      let aVal = this.getNestedValue(a, column);
      let bVal = this.getNestedValue(b, column);
      
      // Handle null/undefined values
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';
      
      // Handle different data types
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return this.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (aVal instanceof Date && bVal instanceof Date) {
        return this.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      // String comparison
      aVal = aVal.toString().toLowerCase();
      bVal = bVal.toString().toLowerCase();
      
      if (this.sortDirection === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });
    
    this.render();
    this.setupEventListeners();
  }
  
  goToPage(page) {
    const totalPages = Math.ceil(this.data.length / this.options.pageSize);
    
    if (page < 1 || page > totalPages) return;
    
    this.currentPage = page;
    this.render();
    this.setupEventListeners();
  }
  
  updateData(newData) {
    this.originalData = [...newData];
    this.data = [...newData];
    this.currentPage = 1;
    this.render();
    this.setupEventListeners();
  }
  
  refresh() {
    this.render();
    this.setupEventListeners();
  }
} 