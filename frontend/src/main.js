// Main application entry point
import './style.css';
import { loadConfig } from './utils/config.js';
import { initializeI18n } from './utils/i18n.js';
import { initializeRouter, addRoute } from './utils/router.js';
import { getAuthToken } from './utils/api.js';
import { showLoginPage } from './pages/login.js';
import { showDashboard } from './pages/dashboard.js';
import { showCarsPage } from './pages/cars.js';
import { showCarDetails } from './pages/carDetails.js';
import { showMaintenancePage } from './pages/maintenance.js';
import { showReportsPage } from './pages/reports.js';
// Snackbar system will be initialized automatically

// Initialize the application
async function initializeApp() {
  try {
    // Load configuration
    const config = await loadConfig();
    
    // Initialize internationalization
    await initializeI18n(config.app.defaultLanguage);
    
    // Set up routes
    setupRoutes();
    
    // Initialize router
    initializeRouter();
    
    // Initialize snackbar system
    await import('./utils/snackbar.js');
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; color: #e74c3c;">
        <div style="text-align: center;">
          <h1>Application Error</h1>
          <p>Failed to load the application. Please refresh the page.</p>
        </div>
      </div>
    `;
  }
}

function setupRoutes() {
  // Authentication check middleware
  function requireAuth(handler) {
    return (data) => {
      const token = getAuthToken();
      if (!token) {
        showLoginPage();
        return;
      }
      handler(data);
    };
  }
  
  // Define routes
  addRoute('/', () => {
    const token = getAuthToken();
    if (token) {
      showDashboard();
    } else {
      showLoginPage();
    }
  });
  
  addRoute('/login', showLoginPage);
  addRoute('/dashboard', requireAuth(showDashboard));
  addRoute('/cars', requireAuth(showCarsPage));
  addRoute('/cars/:id', requireAuth((data) => {
    const carId = data.params?.id;
    if (carId) {
      showCarDetails(carId);
    } else {
      showCarsPage();
    }
  }));
  addRoute('/maintenance', requireAuth(showMaintenancePage));
  addRoute('/reports', requireAuth(showReportsPage));
  
  // Fallback route
  addRoute('*', () => {
    const token = getAuthToken();
    if (token) {
      showDashboard();
    } else {
      showLoginPage();
    }
  });
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeApp);
