require('dotenv').config();
const app = require('./src/app');
const config = require('./config');
const logger = require('./src/utils/logger');
const { testConnection } = require('./src/db/connection');
const { initializeSchema } = require('./src/db/schema');

// Start the server
const startServer = async () => {
  try {
    logger.info('🚀 Starting CarLedgr Backend Server...');
    logger.info(`🌍 Environment: ${config.app.environment}`);
    logger.info(`📡 Port: ${config.app.port}`);
    
    // Test database connection
    const connected = await testConnection();
    
    if (!connected) {
      logger.error('❌ Unable to connect to the database. Exiting...');
      logger.error('💡 Please check your database configuration and credentials');
      process.exit(1);
    }
    
    // Initialize database schema
    logger.info('🔧 Initializing database schema...');
    await initializeSchema();
    
    // Start the server
    const PORT = config.app.port;
    app.listen(PORT, () => {
      logger.info('🎉 CarLedgr backend server started successfully!');
      logger.info(`🌐 Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${config.app.environment}`);
      logger.info(`📡 Server ready to accept connections`);
    });
  } catch (error) {
    logger.error(`💥 Server failed to start: ${error.message}`);
    logger.error(`📋 Stack trace: ${error.stack}`);
    logger.error('💡 Check the logs above for specific error details');
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise);
  logger.error('Reason:', reason);
  process.exit(1);
});

// Start the server
startServer(); 