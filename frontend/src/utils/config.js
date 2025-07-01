// Configuration utility that prioritizes environment variables over config.json
let config = null;

async function loadConfig() {
  if (config) return config;

  try {
    // Load config.json
    const response = await fetch('/config.json');
    config = await response.json();
    
    return config;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    // Fallback configuration
    return {
      api: {
        baseUrl: 'http://localhost:3030/api',
        timeout: 10000
      },
      app: {
        name: 'CarLedgr',
        version: '1.0.0',
        defaultLanguage: 'en',
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