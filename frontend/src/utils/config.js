// Configuration utility that prioritizes environment variables over config.json
let config = null;

async function loadConfig() {
  if (config) return config;

  try {
    // Load config.json as fallback
    const response = await fetch('/config.json');
    const jsonConfig = await response.json();
    
    // Override with environment variables if available
    config = {
      api: {
        baseUrl: import.meta.env.VITE_API_BASE_URL || jsonConfig.api.baseUrl,
        timeout: jsonConfig.api.timeout
      },
      app: {
        name: import.meta.env.VITE_APP_NAME || jsonConfig.app.name,
        version: jsonConfig.app.version,
        defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE || jsonConfig.app.defaultLanguage,
        supportedLanguages: jsonConfig.app.supportedLanguages
      },
      ui: jsonConfig.ui
    };
    
    return config;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    // Fallback configuration
    return {
      api: {
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030/api',
        timeout: 10000
      },
      app: {
        name: import.meta.env.VITE_APP_NAME || 'CarFin',
        version: '1.0.0',
        defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE || 'en',
        supportedLanguages: ['en', 'ar']
      },
      ui: {
        itemsPerPage: 10,
        maxItemsPerPage: 100,
        theme: 'light'
      }
    };
  }
}

export { loadConfig }; 