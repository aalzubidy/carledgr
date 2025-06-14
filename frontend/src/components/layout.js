// Layout component for authenticated pages
import { t, setLanguage, getCurrentLanguage } from '../utils/i18n.js';
import { api } from '../utils/api.js';
import { navigate } from '../utils/router.js';
import { showToast } from '../utils/toast.js';

export function createLayout(content, activeRoute = '') {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="app-container">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <h1>${t('app.name')}</h1>
          <div class="language-selector">
            <select id="languageSelect">
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        </div>
        
        <nav class="sidebar-nav">
          <a href="/dashboard" class="nav-item ${activeRoute === 'dashboard' ? 'active' : ''}" data-route="/dashboard">
            ${t('navigation.dashboard')}
          </a>
          <a href="/cars" class="nav-item ${activeRoute === 'cars' ? 'active' : ''}" data-route="/cars">
            ${t('navigation.cars')}
          </a>
          <a href="/maintenance" class="nav-item ${activeRoute === 'maintenance' ? 'active' : ''}" data-route="/maintenance">
            ${t('navigation.maintenance')}
          </a>
          <a href="/reports" class="nav-item ${activeRoute === 'reports' ? 'active' : ''}" data-route="/reports">
            ${t('navigation.reports')}
          </a>
          <a href="#" class="nav-item" id="logoutBtn">
            ${t('auth.logout')}
          </a>
        </nav>
      </aside>
      
      <main class="main-content">
        ${content}
      </main>
    </div>
  `;
  
  setupLayoutEventListeners();
}

function setupLayoutEventListeners() {
  // Language selector
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.value = getCurrentLanguage();
    
    languageSelect.addEventListener('change', async (e) => {
      const newLanguage = e.target.value;
      await setLanguage(newLanguage);
      
      // Reload the current page with new language
      window.location.reload();
    });
  }
  
  // Navigation links
  const navLinks = document.querySelectorAll('.nav-item[data-route]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const route = e.target.getAttribute('data-route');
      navigate(route);
    });
  });
  
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Mobile sidebar toggle (if needed)
  setupMobileSidebar();
}

async function handleLogout(e) {
  e.preventDefault();
  
  try {
    await api.logout();
    showToast(t('auth.logout') + ' ' + t('common.success'), 'success');
    navigate('/login');
  } catch (error) {
    console.error('Logout error:', error);
    // Even if logout fails on server, clear local storage and redirect
    navigate('/login');
  }
}

function setupMobileSidebar() {
  // Add mobile menu toggle if screen is small
  if (window.innerWidth <= 768) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      const menuToggle = document.createElement('button');
      menuToggle.innerHTML = '☰';
      menuToggle.className = 'mobile-menu-toggle';
      menuToggle.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1001;
        background: #3498db;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 18px;
      `;
      
      menuToggle.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
      });
      
      document.body.appendChild(menuToggle);
    }
  }
}

export function showLoading() {
  return `
    <div class="loading">
      <div class="spinner"></div>
      <p>${t('common.loading')}</p>
    </div>
  `;
}

export function showEmptyState(message, icon = '📭') {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h3>${message}</h3>
    </div>
  `;
} 