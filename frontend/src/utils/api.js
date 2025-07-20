// API utility for making HTTP requests
import { loadConfig } from './config.js';
import { showWarning } from './snackbar.js';

let apiConfig = null;

async function getApiConfig() {
  if (!apiConfig) {
    const config = await loadConfig();
    apiConfig = config.api;
  }
  return apiConfig;
}

function getAuthToken() {
  return localStorage.getItem('authToken');
}

function setAuthToken(token) {
  localStorage.setItem('authToken', token);
}

function removeAuthToken() {
  localStorage.removeItem('authToken');
}

async function makeRequest(endpoint, options = {}) {
  const config = await getApiConfig();
  const url = `${config.baseUrl}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: config.timeout
  };
  
  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }
  
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), finalOptions.timeout);
    
    const response = await fetch(url, {
      ...finalOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorData = {};
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          // If it's not JSON, try to get the text response
          const textResponse = await response.text();
          console.warn('Non-JSON error response:', textResponse);
          errorData = { message: textResponse || `HTTP ${response.status}: ${response.statusText}` };
        }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      // Handle authentication errors specifically
      if (response.status === 401 || response.status === 403) {
        // Only redirect if we're not on the login page
        if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
          removeAuthToken();
          showWarning('Your session has expired. Redirecting to login...');
          // Immediate redirect for better UX
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        }
        throw new Error(errorData.message || 'Authentication failed');
      }
      
      // Handle validation errors (400)
      if (response.status === 400) {
        throw new Error(errorData.message || 'Invalid request data');
      }
      
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Handle successful responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (parseError) {
        console.warn('Failed to parse JSON response:', parseError);
        return { success: true };
      }
    }
    
    // For non-JSON responses, return a simple success indicator
    return { success: true };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    // Handle authentication errors
    if (error.message.includes('401') || error.message.includes('Unauthorized') || 
        error.message.includes('jwt expired') || error.message.includes('Session expired') ||
        error.message.includes('Invalid or expired token')) {
      if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
        removeAuthToken();
        showWarning('Your session has expired. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
      return;
    }
    
    throw error;
  }
}

// API methods
const api = {
  // Authentication
  async login(credentials) {
    const response = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  async forgotPassword(data) {
    return makeRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  async logout() {
    try {
      await makeRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeAuthToken();
    }
  },
  
  // Dashboard
  async getDashboardSummary() {
    return makeRequest('/dashboard/summary');
  },
  
  async getTopSoldModels() {
    return makeRequest('/dashboard/top-sold-models');
  },
  
  // Cars
  async getCars(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return makeRequest(`/cars${queryString ? `?${queryString}` : ''}`);
  },
  
  async getCar(id) {
    return makeRequest(`/cars/${id}`);
  },
  
  async createCar(carData) {
    return makeRequest('/cars', {
      method: 'POST',
      body: JSON.stringify(carData)
    });
  },
  
  async updateCar(id, carData) {
    return makeRequest(`/cars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(carData)
    });
  },
  
  async deleteCar(id) {
    return makeRequest(`/cars/${id}`, {
      method: 'DELETE'
    });
  },
  
  // Maintenance
  async getMaintenanceRecords(carId) {
    return makeRequest(`/maintenance/car/${carId}`);
  },
  
  async getAllMaintenanceRecords() {
    return makeRequest('/maintenance');
  },
  
  async getMaintenanceRecord(id) {
    return makeRequest(`/maintenance/${id}`);
  },
  
  async createMaintenanceRecord(maintenanceData) {
    return makeRequest('/maintenance', {
      method: 'POST',
      body: JSON.stringify(maintenanceData)
    });
  },
  
  async updateMaintenanceRecord(id, maintenanceData) {
    return makeRequest(`/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(maintenanceData)
    });
  },
  
  async deleteMaintenanceRecord(id) {
    return makeRequest(`/maintenance/${id}`, {
      method: 'DELETE'
    });
  },
  
  async getMaintenanceCategories() {
    return makeRequest('/maintenance/categories');
  },

  async createMaintenanceCategory(categoryData) {
    return makeRequest('/maintenance/categories', {
      method: 'POST',
      body: JSON.stringify({ category_name: categoryData.name })
    });
  },

  async updateMaintenanceCategory(id, categoryData) {
    return makeRequest(`/maintenance/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ category_name: categoryData.name })
    });
  },

  async deleteMaintenanceCategory(id, data = {}) {
    return makeRequest(`/maintenance/categories/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(data)
    });
  },

  async moveMaintenanceRecordsToCategory(fromCategoryId, toCategoryId) {
    return makeRequest(`/maintenance/categories/${fromCategoryId}/move`, {
      method: 'POST',
      body: JSON.stringify({ target_category_id: toCategoryId })
    });
  },
  
  // Reports
  async getInventoryReport(dateRange = {}) {
    const params = new URLSearchParams();
    if (dateRange.start) params.append('start_date', dateRange.start);
    if (dateRange.end) params.append('end_date', dateRange.end);
    return makeRequest(`/reports/inventory${params.toString() ? `?${params.toString()}` : ''}`);
  },
  
  async getSalesReport(dateRange = {}) {
    const params = new URLSearchParams();
    if (dateRange.start) params.append('start_date', dateRange.start);
    if (dateRange.end) params.append('end_date', dateRange.end);
    return makeRequest(`/reports/sales${params.toString() ? `?${params.toString()}` : ''}`);
  },
  
  async getMaintenanceReport(dateRange = {}, categoryId = null) {
    const params = new URLSearchParams();
    if (dateRange.start) params.append('start_date', dateRange.start);
    if (dateRange.end) params.append('end_date', dateRange.end);
    if (categoryId) params.append('category_id', categoryId);
    return makeRequest(`/reports/maintenance${params.toString() ? `?${params.toString()}` : ''}`);
  },
  
  async getProfitReport(dateRange = {}) {
    const params = new URLSearchParams();
    if (dateRange.start) params.append('start_date', dateRange.start);
    if (dateRange.end) params.append('end_date', dateRange.end);
    return makeRequest(`/reports/profit${params.toString() ? `?${params.toString()}` : ''}`);
  },

  // Expense Categories
  async getExpenseCategories() {
    return makeRequest('/expenses/categories');
  },

  async createExpenseCategory(categoryData) {
    return makeRequest('/expenses/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  },

  async updateExpenseCategory(id, categoryData) {
    return makeRequest(`/expenses/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
  },

  async deleteExpenseCategory(id, data = {}) {
    return makeRequest(`/expenses/categories/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(data)
    });
  },

  async moveExpensesToCategory(fromCategoryId, toCategoryId) {
    return makeRequest(`/expenses/categories/${fromCategoryId}/move`, {
      method: 'POST',
      body: JSON.stringify({ target_category_id: toCategoryId })
    });
  },

  // Expenses
  async getExpenses(params = {}) {
    const queryString = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key]) {
        queryString.append(key, params[key]);
      }
    });
    return makeRequest(`/expenses${queryString.toString() ? `?${queryString.toString()}` : ''}`);
  },

  async getExpense(id) {
    return makeRequest(`/expenses/${id}`);
  },

  async createExpense(expenseData) {
    return makeRequest('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData)
    });
  },

  async updateExpense(id, expenseData) {
    return makeRequest(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData)
    });
  },

  async deleteExpense(id) {
    return makeRequest(`/expenses/${id}`, {
      method: 'DELETE'
    });
  },

  async getExpenseSummary(params = {}) {
    const queryString = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key]) {
        queryString.append(key, params[key]);
      }
    });
    return makeRequest(`/expenses/summary${queryString.toString() ? `?${queryString.toString()}` : ''}`);
  },

  // User management and roles
  async getCurrentUser() {
    return makeRequest('/auth/me');
  },

  async getRoles() {
    return makeRequest('/auth/roles');
  },

  async getOrganizations() {
    return makeRequest('/auth/organizations');
  },

  async createUser(userData) {
    return makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async updateProfile(profileData) {
    return makeRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  async updatePassword(passwordData) {
    return makeRequest('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });
  },

  // User Management (Owner only)
  async getOrganizationUsers() {
    return makeRequest('/users');
  },

  async getUserRoles() {
    return makeRequest('/users/roles');
  },

  async createOrganizationUser(userData) {
    return makeRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async updateOrganizationUser(id, userData) {
    return makeRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  async deleteOrganizationUser(id) {
    return makeRequest(`/users/${id}`, {
      method: 'DELETE'
    });
  },

  // Attachments
  async uploadExpenseAttachment(expenseId, file) {
    const formData = new FormData();
    formData.append('attachment', file);
    
    // For FormData, we need to handle the request differently
    const config = await getApiConfig();
    const token = getAuthToken();
    const url = `${config.baseUrl}/attachments/expenses/${expenseId}/upload`;
    
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type - let browser set it for FormData with boundary
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData
      });
      
      if (!response.ok) {
        let errorData = {};
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const textResponse = await response.text();
            errorData = { message: textResponse || `HTTP ${response.status}: ${response.statusText}` };
          }
        } catch (parseError) {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.message || 'Upload failed');
      }
      
      return await response.json();
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
          removeAuthToken();
          showWarning('Your session has expired. Redirecting to login...');
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        }
        return;
      }
      throw error;
    }
  },

  async getExpenseAttachments(expenseId) {
    const response = await makeRequest(`/attachments/expenses/${expenseId}/attachments`);
    return response.data;
  },

  async deleteExpenseAttachment(attachmentId) {
    return makeRequest(`/attachments/expenses/attachments/${attachmentId}`, {
      method: 'DELETE'
    });
  },

  async uploadMaintenanceAttachment(maintenanceId, file) {
    const formData = new FormData();
    formData.append('attachment', file);
    
    // For FormData, we need to handle the request differently
    const config = await getApiConfig();
    const token = getAuthToken();
    const url = `${config.baseUrl}/attachments/maintenance/${maintenanceId}/upload`;
    
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type - let browser set it for FormData with boundary
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData
      });
      
      if (!response.ok) {
        let errorData = {};
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const textResponse = await response.text();
            errorData = { message: textResponse || `HTTP ${response.status}: ${response.statusText}` };
          }
        } catch (parseError) {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.message || 'Upload failed');
      }
      
      return await response.json();
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
          removeAuthToken();
          showWarning('Your session has expired. Redirecting to login...');
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        }
        return;
      }
      throw error;
    }
  },

  async getMaintenanceAttachments(maintenanceId) {
    const response = await makeRequest(`/attachments/maintenance/${maintenanceId}/attachments`);
    return response.data;
  },

  async deleteMaintenanceAttachment(attachmentId) {
    return makeRequest(`/attachments/maintenance/attachments/${attachmentId}`, {
      method: 'DELETE'
    });
  },

  async getRecordsWithAttachments(type) {
    const response = await makeRequest(`/attachments/indicators/${type}`);
    return response.data;
  },

  async downloadAttachment(type, recordId, attachmentId) {
    const response = await makeRequest(`/attachments/download/${type}/${recordId}/${attachmentId}`);
    return response.data;
  },

  // License information
  async getLicenseInfo() {
    const response = await makeRequest('/licenses');
    return response;
  },

  // License information with car count (for settings page - works with inactive licenses)
  async getLicenseInfoWithUsage() {
    const response = await makeRequest('/licenses/with-usage');
    return response;
  },

  // Stripe Customer Portal
  async createPortalSession(returnUrl) {
    return makeRequest('/stripe/create-portal-session', {
      method: 'POST',
      body: JSON.stringify({ return_url: returnUrl })
    });
  },

  // Internal Analytics
  async trackEvent(eventData) {
    try {
      return makeRequest('/analytics/track', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });
    } catch (error) {
      // Don't let analytics errors break the app
      console.log('Analytics tracking failed:', error);
    }
  }
};

export { api, getAuthToken, setAuthToken, removeAuthToken }; 