const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { testConnection } = require('./db/connection');
const { testEmailConfig } = require('./utils/emailService');

// Import routes
const organizationsRouter = require('./routes/organizations');
const usersRouter = require('./routes/users');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/organizations', organizationsRouter);
app.use('/api/users', usersRouter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    const emailConfigured = await testEmailConfig();

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbConnected ? 'connected' : 'disconnected',
        email: emailConfigured ? 'configured' : 'not configured'
      },
      config: {
        environment: config.app.environment,
        port: config.app.port,
        database: {
          host: config.database.host,
          port: config.database.port,
          database: config.database.database
        },
        email: {
          host: config.email.host,
          port: config.email.port,
          from: config.email.fromEmail
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: config.app.environment === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting CarLedgr Admin Panel...');
    console.log(`Environment: ${config.app.environment}`);
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed - some features may not work');
    }

    // Test email configuration
    const emailConfigured = await testEmailConfig();
    if (!emailConfigured) {
      console.warn('⚠️  Email configuration failed - password emails will not be sent');
    }

    // Start listening
    app.listen(config.app.port, () => {
      console.log(`🎯 Admin panel running on http://localhost:${config.app.port}`);
      console.log(`📊 Dashboard: http://localhost:${config.app.port}`);
      console.log(`🔧 Health check: http://localhost:${config.app.port}/api/health`);
      console.log('');
      console.log('🏢 Organization Management: Create, view, edit, and delete organizations');
      console.log('👥 User Management: Create users with automatic email notifications');
      console.log('📄 License Management: Assign and manage license tiers');
      console.log('');
      console.log('💡 Tip: Create a config.json file in the config/ directory to customize settings');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer(); 