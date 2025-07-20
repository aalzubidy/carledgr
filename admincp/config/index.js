const fs = require('fs');
const path = require('path');

// Load configuration with priority order:
// 1. Custom config file from CL_ADMIN_CONFIG_FILE env var (highest priority)
// 2. Individual environment variables (medium priority)  
// 3. Default config/config.json file (lowest priority)

let configJson = {};

// Try to load config file (either custom or default)
const customConfigPath = process.env.CL_ADMIN_CONFIG_FILE;
if (customConfigPath && fs.existsSync(customConfigPath)) {
  // Use custom config file if specified and exists
  console.log(`Loading admin config from custom file: ${customConfigPath}`);
  configJson = JSON.parse(fs.readFileSync(customConfigPath, 'utf8'));
} else {
  // Fallback to default config file
  const defaultConfigPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(defaultConfigPath)) {
    console.log(`Loading admin config from default file: ${defaultConfigPath}`);
    configJson = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
  } else {
    console.log('No admin config file found, using environment variables only');
    configJson = {}; // Empty object, will rely on env vars and defaults
  }
}

// Build final config with environment variable overrides
const config = {
  app: {
    port: process.env.CL_ADMIN_PORT || process.env.PORT || configJson.app?.port || 3031,
    environment: process.env.CL_ADMIN_NODE_ENV || process.env.NODE_ENV || configJson.app?.environment || 'development'
  },
  database: {
    host: process.env.CL_ADMIN_DB_HOST || configJson.database?.host || 'localhost',
    port: process.env.CL_ADMIN_DB_PORT || configJson.database?.port || 3306,
    user: process.env.CL_ADMIN_DB_USER || configJson.database?.user || 'root',
    password: process.env.CL_ADMIN_DB_PASSWORD || configJson.database?.password || '',
    database: process.env.CL_ADMIN_DB_NAME || configJson.database?.database || 'carledgr',
    connectionLimit: process.env.CL_ADMIN_DB_CONNECTION_LIMIT || configJson.database?.connectionLimit || 10,
    ssl: process.env.CL_ADMIN_DB_SSL === 'true' || configJson.database?.ssl || false
  },
  email: {
    // Resend configuration (preferred)
    resendApiKey: process.env.CL_ADMIN_RESEND_API_KEY || configJson.email?.resendApiKey || '',
    fromName: process.env.CL_ADMIN_EMAIL_FROM_NAME || configJson.email?.fromName || 'CarLedgr Admin',
    fromEmail: process.env.CL_ADMIN_EMAIL_FROM || configJson.email?.fromEmail || 'admin@carledgr.com',
    
    // SMTP fallback configuration
    host: process.env.CL_ADMIN_EMAIL_HOST || configJson.email?.smtp?.host || configJson.email?.host || '',
    port: process.env.CL_ADMIN_EMAIL_PORT || configJson.email?.smtp?.port || configJson.email?.port || 587,
    secure: process.env.CL_ADMIN_EMAIL_SECURE === 'true' || configJson.email?.smtp?.secure || configJson.email?.secure || false,
    user: process.env.CL_ADMIN_EMAIL_USER || configJson.email?.smtp?.user || configJson.email?.user || '',
    password: process.env.CL_ADMIN_EMAIL_PASSWORD || configJson.email?.smtp?.password || configJson.email?.password || ''
  }
};

// Validate required configuration
if (!config.database.password) {
  console.warn('Warning: Database password not configured');
}

if (!config.email.resendApiKey && !config.email.password) {
  console.warn('Warning: No email configuration found (Resend API key or SMTP password)');
}

console.log(`Admin panel configuration loaded for ${config.app.environment} environment`);
console.log(`Database: ${config.database.host}:${config.database.port}/${config.database.database}`);
console.log(`Email: ${config.email.host}:${config.email.port} (${config.email.fromEmail})`);

module.exports = config; 