// Login page component
import { t, setLanguage, getCurrentLanguage } from '../utils/i18n.js';
import { api } from '../utils/api.js';
import { navigate } from '../utils/router.js';
import { showSuccess, showError } from '../utils/snackbar.js';

export function showLoginPage() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="login-container">
      <div class="language-selector">
        <select id="languageSelect">
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="ar">العربية</option>
        </select>
      </div>
      
      <form class="login-form" id="loginForm" onsubmit="return false;">
        <h1>${t('app.title')}</h1>
        
        <div class="form-group">
          <label for="organization">${t('auth.organization')}</label>
          <input 
            type="text" 
            id="organization" 
            class="form-control" 
            required
            placeholder="${t('auth.organization')}"
          >
        </div>
        
        <div class="form-group">
          <label for="email">${t('auth.email')}</label>
          <input 
            type="email" 
            id="email" 
            class="form-control" 
            required
            placeholder="${t('auth.email')}"
          >
        </div>
        
        <div class="form-group">
          <label for="password">${t('auth.password')}</label>
          <input 
            type="password" 
            id="password" 
            class="form-control" 
            required
            placeholder="${t('auth.password')}"
          >
        </div>
        
        <button type="submit" class="btn btn-primary btn-block">
          ${t('auth.loginButton')}
        </button>
      </form>
    </div>
  `;
  
  // Set up event listeners
  setupLoginEventListeners();
}

function setupLoginEventListeners() {
  // Language selector
  const languageSelect = document.getElementById('languageSelect');
  languageSelect.value = getCurrentLanguage();
  
  languageSelect.addEventListener('change', async (e) => {
    const newLanguage = e.target.value;
    await setLanguage(newLanguage);
    
    // Reload the login page with new language
    showLoginPage();
  });
  
  // Login form
  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const credentials = {
    organization: document.getElementById('organization').value.trim(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value
  };
  
  // Basic client-side validation
  if (!credentials.organization) {
    showError('Organization is required');
    return false;
  }
  
  if (!credentials.email) {
    showError('Email is required');
    return false;
  }
  
  if (!credentials.password) {
    showError('Password is required');
    return false;
  }
  
  // Disable form during login
  const submitButton = e.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = t('common.loading');
  
  try {
    const response = await api.login(credentials);
    
    if (response && response.token) {
      showSuccess(t('auth.loginSuccess'));
      // Small delay to show success message before navigation
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } else {
      throw new Error(t('auth.loginError'));
    }
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error.message || t('auth.loginError');
    showError(errorMessage);
  } finally {
    // Re-enable form
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
  
  return false;
} 