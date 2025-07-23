const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const carRoutes = require('./routes/carRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const userRoutes = require('./routes/userRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const licenseRoutes = require('./routes/licenseRoutes');
const licenseTierRoutes = require('./routes/licenseTierRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Create Express app
const app = express();

// CORS middleware (before other middleware)
app.use(cors({
  origin: [
    'https://carledgr.com',
    'https://www.carledgr.com',
    'https://app.carledgr.com',
    'https://demo.carledgr.com',
    'http://localhost:5050',
    'http://127.0.0.1:5050',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Stripe webhook route FIRST (needs raw body before JSON parsing)
app.use('/api/stripe', stripeRoutes);

// Body parsing middleware (needed for most other routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Other API routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/license-tiers', licenseTierRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { testConnection } = require('./db/connection');
    const { query } = require('./db/connection');
    
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      return res.status(503).json({ 
        status: 'error', 
        database: 'disconnected',
        message: 'Database connection failed'
      });
    }
    
    // Test database tables exist
    const tables = await query("SHOW TABLES");
    const hasUserRoles = await query("SELECT COUNT(*) as count FROM user_roles");
    
    res.status(200).json({ 
      status: 'ok',
      database: 'connected',
      tables: tables.length,
      userRoles: hasUserRoles[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      database: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app; 