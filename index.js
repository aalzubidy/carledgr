require('dotenv').config();
const app = require('./src/app');
const config = require('./config');
const logger = require('./src/utils/logger');
const { testConnection } = require('./src/db/connection');
const { initializeSchema } = require('./src/db/schema');

// Start the server
const startServer = async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    
    if (!connected) {
      logger.error('Unable to connect to the database. Exiting...');
      process.exit(1);
    }
    
    // Initialize database schema
    await initializeSchema();
    
    // Start the server
    const PORT = config.app.port;
    app.listen(PORT, () => {
      logger.info(`CarFin backend server running on port ${PORT}`);
      logger.info(`Environment: ${config.app.environment}`);
    });
  } catch (error) {
    logger.error(`Server failed to start: ${error.message}`);
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