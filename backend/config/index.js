const fs = require('fs');
const path = require('path');

// Load configuration from JSON file
const configPath = path.join(__dirname, 'config.json');
const configJson = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Override with environment variables if present
const config = {
  app: {
    port: process.env.CL_BACKEND_PORT || process.env.PORT || configJson.app.port,
    environment: process.env.CL_BACKEND_NODE_ENV || process.env.NODE_ENV || configJson.app.environment,
    jwtSecret: process.env.CL_BACKEND_JWT_SECRET || configJson.app.jwtSecret,
    jwtExpiration: process.env.CL_BACKEND_JWT_EXPIRATION || configJson.app.jwtExpiration
  },
  database: {
    host: process.env.CL_BACKEND_DB_HOST || configJson.database.host,
    port: process.env.CL_BACKEND_DB_PORT || configJson.database.port,
    user: process.env.CL_BACKEND_DB_USER || configJson.database.user,
    password: process.env.CL_BACKEND_DB_PASSWORD || configJson.database.password,
    database: process.env.CL_BACKEND_DB_NAME || configJson.database.database,
    connectionLimit: process.env.CL_BACKEND_DB_CONNECTION_LIMIT || configJson.database.connectionLimit
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
    provider: process.env.CL_BACKEND_EMAIL_PROVIDER || configJson.email?.provider || 'smtp',
    host: process.env.CL_BACKEND_EMAIL_HOST || configJson.email?.host,
    port: process.env.CL_BACKEND_EMAIL_PORT || configJson.email?.port || 587,
    secure: process.env.CL_BACKEND_EMAIL_SECURE === 'true' || configJson.email?.secure || false,
    user: process.env.CL_BACKEND_EMAIL_USER || configJson.email?.user,
    password: process.env.CL_BACKEND_EMAIL_PASSWORD || configJson.email?.password,
    fromEmail: process.env.CL_BACKEND_EMAIL_FROM || configJson.email?.fromEmail,
    fromName: process.env.CL_BACKEND_EMAIL_FROM_NAME || configJson.email?.fromName
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
    level: process.env.CL_BACKEND_LOG_LEVEL || configJson.logging.level,
    file: process.env.CL_BACKEND_LOG_FILE || configJson.logging.file
  },
  frontend: {
    url: process.env.CL_BACKEND_FRONTEND_URL || 'https://your-carledgr-domain.com'
  }
};

module.exports = config; 