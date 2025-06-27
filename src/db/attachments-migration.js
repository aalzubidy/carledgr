const { pool } = require('./connection');
const logger = require('../utils/logger');

// SQL statements to create attachment tables
const createAttachmentTables = [
  // Expense Attachments table
  `CREATE TABLE IF NOT EXISTS expense_attachments (
    id VARCHAR(36) PRIMARY KEY,
    expense_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    storage_url VARCHAR(500) NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    uploaded_by VARCHAR(36) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id) REFERENCES organization_expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_expense_id (expense_id),
    INDEX idx_uploaded_by (uploaded_by)
  )`,

  // Maintenance Attachments table
  `CREATE TABLE IF NOT EXISTS maintenance_attachments (
    id VARCHAR(36) PRIMARY KEY,
    maintenance_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    storage_url VARCHAR(500) NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    uploaded_by VARCHAR(36) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (maintenance_id) REFERENCES maintenance_records(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_maintenance_id (maintenance_id),
    INDEX idx_uploaded_by (uploaded_by)
  )`
];

// Run the migration
async function runAttachmentsMigration() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    logger.info('Starting attachments migration...');
    
    // Create attachment tables
    for (const statement of createAttachmentTables) {
      await connection.execute(statement);
      logger.info('Attachment table created successfully');
    }
    
    await connection.commit();
    logger.info('Attachments migration completed successfully');
    
  } catch (error) {
    await connection.rollback();
    logger.error(`Attachments migration failed: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  runAttachmentsMigration()
    .then(() => {
      console.log('✅ Attachments migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Attachments migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runAttachmentsMigration }; 