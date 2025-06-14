// Internationalization utility
let currentLanguage = 'en';
let translations = {};

async function loadTranslations(language) {
  try {
    const response = await fetch(`/src/i18n/${language}.json`);
    const data = await response.json();
    translations[language] = data;
    return data;
  } catch (error) {
    console.error(`Failed to load translations for ${language}:`, error);
    return {};
  }
}

async function setLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  
  // Load translations for the new language if not already loaded
  if (!translations[language]) {
    await loadTranslations(language);
  }
  
  // Save to localStorage
  localStorage.setItem('language', language);
}

function getCurrentLanguage() {
  return currentLanguage;
}

function t(key, params = {}) {
  const keys = key.split('.');
  let value = translations[currentLanguage];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      value = undefined;
      break;
    }
  }
  
  if (value === undefined) {
    console.warn(`Translation missing for key: ${key} in language: ${currentLanguage}`);
    return key;
  }
  
  // Simple parameter replacement
  if (typeof value === 'string' && Object.keys(params).length > 0) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  }
  
  return value;
}

async function initializeI18n(defaultLanguage = 'en') {
  // Check for saved language preference
  const savedLanguage = localStorage.getItem('language') || defaultLanguage;
  
  // Load translations for the current language
  await loadTranslations(savedLanguage);
  
  // If not English, also load English as fallback
  if (savedLanguage !== 'en') {
    await loadTranslations('en');
  }
  
  setLanguage(savedLanguage);
}

export { initializeI18n, setLanguage, getCurrentLanguage, t, loadTranslations }; 