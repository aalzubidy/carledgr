const fs = require('fs');
const path = require('path');

// Load configuration with priority order:
// 1. Custom config file from CL_BACKEND_CONFIG_FILE env var (highest priority)
// 2. Individual environment variables (medium priority)  
// 3. Default config/config.json file (lowest priority)

let configJson = {};

// Try to load config file (either custom or default)
const customConfigPath = process.env.CL_BACKEND_CONFIG_FILE;
if (customConfigPath && fs.existsSync(customConfigPath)) {
  // Use custom config file if specified and exists
  console.log(`Loading config from custom file: ${customConfigPath}`);
  configJson = JSON.parse(fs.readFileSync(customConfigPath, 'utf8'));
} else {
  // Fallback to default config file
  const defaultConfigPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(defaultConfigPath)) {
    console.log(`Loading config from default file: ${defaultConfigPath}`);
    configJson = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
  } else {
    console.log('No config file found, using environment variables only');
    configJson = {}; // Empty object, will rely on env vars and defaults
  }
}

// Build final config with environment variable overrides
const config = {
  app: {
    port: process.env.CL_BACKEND_PORT || process.env.PORT || configJson.app?.port || 3030,
    environment: process.env.CL_BACKEND_NODE_ENV || process.env.NODE_ENV || configJson.app?.environment || 'development',
    jwtSecret: process.env.CL_BACKEND_JWT_SECRET || configJson.app?.jwtSecret || 'your-jwt-secret-key',
    jwtExpiration: process.env.CL_BACKEND_JWT_EXPIRATION || configJson.app?.jwtExpiration || '24h'
  },
  database: {
    host: process.env.CL_BACKEND_DB_HOST || configJson.database?.host || 'localhost',
    port: process.env.CL_BACKEND_DB_PORT || configJson.database?.port || 3306,
    user: process.env.CL_BACKEND_DB_USER || configJson.database?.user || 'root',
    password: process.env.CL_BACKEND_DB_PASSWORD || configJson.database?.password || '',
    database: process.env.CL_BACKEND_DB_NAME || configJson.database?.database || 'carledgr',
    connectionLimit: process.env.CL_BACKEND_DB_CONNECTION_LIMIT || configJson.database?.connectionLimit || 10
  },
  stripe: {
    secretKey: process.env.CL_BACKEND_STRIPE_SECRET_KEY || configJson.stripe?.secretKey,
    webhookSecret: process.env.CL_BACKEND_STRIPE_WEBHOOK_SECRET || configJson.stripe?.webhookSecret,
    starterPriceId: process.env.CL_BACKEND_STRIPE_STARTER_PRICE_ID || configJson.stripe?.starterPriceId,
    professionalPriceId: process.env.CL_BACKEND_STRIPE_PROFESSIONAL_PRICE_ID || configJson.stripe?.professionalPriceId,
    businessPriceId: process.env.CL_BACKEND_STRIPE_BUSINESS_PRICE_ID || configJson.stripe?.businessPriceId,
    enterprisePriceId: process.env.CL_BACKEND_STRIPE_ENTERPRISE_PRICE_ID || configJson.stripe?.enterprisePriceId
  },
  email: {
    provider: process.env.CL_BACKEND_EMAIL_PROVIDER || configJson.email?.provider || 'resend',
    resendApiKey: process.env.CL_BACKEND_EMAIL_RESEND_API_KEY || configJson.email?.resendApiKey,
    fromEmail: process.env.CL_BACKEND_EMAIL_FROM || configJson.email?.fromEmail || 'onboarding@carledgr.com',
    fromName: process.env.CL_BACKEND_EMAIL_FROM_NAME || configJson.email?.fromName || 'CarLedgr Team',
    smtp: {
      host: process.env.CL_BACKEND_EMAIL_HOST || configJson.email?.smtp?.host,
      port: process.env.CL_BACKEND_EMAIL_PORT || configJson.email?.smtp?.port || 587,
      secure: process.env.CL_BACKEND_EMAIL_SECURE === 'true' || configJson.email?.smtp?.secure || false,
      user: process.env.CL_BACKEND_EMAIL_USER || configJson.email?.smtp?.user,
      password: process.env.CL_BACKEND_EMAIL_PASSWORD || configJson.email?.smtp?.password
    }
  },
  storage: {
    provider: process.env.CL_BACKEND_STORAGE_PROVIDER || configJson.storage?.provider || 's3',
    endpoint: process.env.CL_BACKEND_STORAGE_ENDPOINT || configJson.storage?.endpoint,
    bucket: process.env.CL_BACKEND_STORAGE_BUCKET || configJson.storage?.bucket,
    accessKeyId: process.env.CL_BACKEND_STORAGE_ACCESS_KEY || configJson.storage?.accessKeyId,
    secretAccessKey: process.env.CL_BACKEND_STORAGE_SECRET_KEY || configJson.storage?.secretAccessKey,
    region: process.env.CL_BACKEND_STORAGE_REGION || configJson.storage?.region || 'auto',
    parentFolder: process.env.CL_BACKEND_STORAGE_PARENT_FOLDER || configJson.storage?.parentFolder || '',
    cdnEndpoint: process.env.CL_BACKEND_STORAGE_CDN_ENDPOINT || configJson.storage?.cdnEndpoint,
    maxFileSize: process.env.CL_BACKEND_STORAGE_MAX_FILE_SIZE || configJson.storage?.maxFileSize || 8388608,
    allowedFileTypes: configJson.storage?.allowedFileTypes || ["image/jpeg", "image/png", "image/webp", "application/pdf"]
  },
  logging: {
    level: process.env.CL_BACKEND_LOG_LEVEL || configJson.logging?.level || 'info',
    file: process.env.CL_BACKEND_LOG_FILE || configJson.logging?.file || 'app.log'
  },
  frontend: {
    url: process.env.CL_BACKEND_FRONTEND_URL || configJson.frontend?.url || 'https://your-carledgr-domain.com'
  }
};

module.exports = config; 