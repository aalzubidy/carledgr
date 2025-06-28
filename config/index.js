const fs = require('fs');
const path = require('path');

// Load configuration from JSON file
const configPath = path.join(__dirname, 'config.json');
const configJson = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Override with environment variables if present
const config = {
  app: {
    port: process.env.PORT || configJson.app.port,
    environment: process.env.NODE_ENV || configJson.app.environment,
    jwtSecret: process.env.JWT_SECRET || configJson.app.jwtSecret,
    jwtExpiration: process.env.JWT_EXPIRATION || configJson.app.jwtExpiration
  },
  database: {
    host: process.env.DB_HOST || configJson.database.host,
    port: process.env.DB_PORT || configJson.database.port,
    user: process.env.DB_USER || configJson.database.user,
    password: process.env.DB_PASSWORD || configJson.database.password,
    database: process.env.DB_NAME || configJson.database.database,
    connectionLimit: process.env.DB_CONNECTION_LIMIT || configJson.database.connectionLimit
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || configJson.stripe?.secretKey,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || configJson.stripe?.webhookSecret,
    starterPriceId: process.env.STRIPE_STARTER_PRICE_ID || configJson.stripe?.starterPriceId,
    professionalPriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || configJson.stripe?.professionalPriceId,
    businessPriceId: process.env.STRIPE_BUSINESS_PRICE_ID || configJson.stripe?.businessPriceId,
    enterprisePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || configJson.stripe?.enterprisePriceId
  },
  email: {
    provider: process.env.EMAIL_PROVIDER || configJson.email?.provider || 'smtp',
    host: process.env.EMAIL_HOST || configJson.email?.host,
    port: process.env.EMAIL_PORT || configJson.email?.port || 587,
    secure: process.env.EMAIL_SECURE === 'true' || configJson.email?.secure || false,
    user: process.env.EMAIL_USER || configJson.email?.user,
    password: process.env.EMAIL_PASSWORD || configJson.email?.password,
    fromEmail: process.env.EMAIL_FROM || configJson.email?.fromEmail,
    fromName: process.env.EMAIL_FROM_NAME || configJson.email?.fromName
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || configJson.storage?.provider || 'digitalocean',
    endpoint: process.env.STORAGE_ENDPOINT || configJson.storage?.endpoint,
    bucket: process.env.STORAGE_BUCKET || configJson.storage?.bucket,
    accessKeyId: process.env.STORAGE_ACCESS_KEY || configJson.storage?.accessKeyId,
    secretAccessKey: process.env.STORAGE_SECRET_KEY || configJson.storage?.secretAccessKey,
    region: process.env.STORAGE_REGION || configJson.storage?.region,
    cdnEndpoint: process.env.STORAGE_CDN_ENDPOINT || configJson.storage?.cdnEndpoint,
    maxFileSize: process.env.STORAGE_MAX_FILE_SIZE || configJson.storage?.maxFileSize || 8388608,
    allowedFileTypes: configJson.storage?.allowedFileTypes || ["image/jpeg", "image/png", "image/webp", "application/pdf"]
  },
  logging: {
    level: process.env.LOG_LEVEL || configJson.logging.level,
    file: process.env.LOG_FILE || configJson.logging.file
  }
};

module.exports = config; 