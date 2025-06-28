const { pool } = require('../connection');
const { v4: uuidv4 } = require('uuid');

// Expense Attachment Queries
const createExpenseAttachment = async (expenseId, fileData, uploadedBy) => {
  const id = uuidv4();
  const query = `
    INSERT INTO expense_attachments 
    (id, expense_id, file_name, file_size, file_type, storage_url, storage_key, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.execute(query, [
    id,
    expenseId,
    fileData.fileName,
    fileData.fileSize,
    fileData.fileType,
    fileData.storageUrl,
    fileData.storageKey,
    uploadedBy
  ]);
  
  return { id, ...fileData };
};

const getExpenseAttachments = async (expenseId) => {
  const query = `
    SELECT ea.*, CONCAT(u.first_name, ' ', u.last_name) as uploader_name
    FROM expense_attachments ea
    LEFT JOIN users u ON ea.uploaded_by = u.id
    WHERE ea.expense_id = ?
    ORDER BY ea.uploaded_at DESC
  `;
  
  const [rows] = await pool.execute(query, [expenseId]);
  return rows;
};

const deleteExpenseAttachment = async (attachmentId) => {
  const query = 'SELECT storage_key FROM expense_attachments WHERE id = ?';
  const [rows] = await pool.execute(query, [attachmentId]);
  
  if (rows.length === 0) {
    throw new Error('Attachment not found');
  }
  
  const deleteQuery = 'DELETE FROM expense_attachments WHERE id = ?';
  await pool.execute(deleteQuery, [attachmentId]);
  
  return rows[0].storage_key;
};

const deleteExpenseAttachmentsByExpenseId = async (expenseId) => {
  const query = 'SELECT storage_key FROM expense_attachments WHERE expense_id = ?';
  const [rows] = await pool.execute(query, [expenseId]);
  
  if (rows.length > 0) {
    const deleteQuery = 'DELETE FROM expense_attachments WHERE expense_id = ?';
    await pool.execute(deleteQuery, [expenseId]);
  }
  
  return rows.map(row => row.storage_key);
};

// Maintenance Attachment Queries
const createMaintenanceAttachment = async (maintenanceId, fileData, uploadedBy) => {
  const id = uuidv4();
  const query = `
    INSERT INTO maintenance_attachments 
    (id, maintenance_id, file_name, file_size, file_type, storage_url, storage_key, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.execute(query, [
    id,
    maintenanceId,
    fileData.fileName,
    fileData.fileSize,
    fileData.fileType,
    fileData.storageUrl,
    fileData.storageKey,
    uploadedBy
  ]);
  
  return { id, ...fileData };
};

const getMaintenanceAttachments = async (maintenanceId) => {
  const query = `
    SELECT ma.*, CONCAT(u.first_name, ' ', u.last_name) as uploader_name
    FROM maintenance_attachments ma
    LEFT JOIN users u ON ma.uploaded_by = u.id
    WHERE ma.maintenance_id = ?
    ORDER BY ma.uploaded_at DESC
  `;
  
  const [rows] = await pool.execute(query, [maintenanceId]);
  return rows;
};

const deleteMaintenanceAttachment = async (attachmentId) => {
  const query = 'SELECT storage_key FROM maintenance_attachments WHERE id = ?';
  const [rows] = await pool.execute(query, [attachmentId]);
  
  if (rows.length === 0) {
    throw new Error('Attachment not found');
  }
  
  const deleteQuery = 'DELETE FROM maintenance_attachments WHERE id = ?';
  await pool.execute(deleteQuery, [attachmentId]);
  
  return rows[0].storage_key;
};

const deleteMaintenanceAttachmentsByMaintenanceId = async (maintenanceId) => {
  const query = 'SELECT storage_key FROM maintenance_attachments WHERE maintenance_id = ?';
  const [rows] = await pool.execute(query, [maintenanceId]);
  
  if (rows.length > 0) {
    const deleteQuery = 'DELETE FROM maintenance_attachments WHERE maintenance_id = ?';
    await pool.execute(deleteQuery, [maintenanceId]);
  }
  
  return rows.map(row => row.storage_key);
};

// Helper query to check if records have attachments (for UI indicators)
const getRecordsWithAttachments = async (recordType, organizationId) => {
  let query;
  
  if (recordType === 'expense') {
    query = `
      SELECT DISTINCT e.id, COUNT(ea.id) as attachment_count
      FROM organization_expenses e
      LEFT JOIN expense_attachments ea ON e.id = ea.expense_id
      WHERE e.organization_id = ?
      GROUP BY e.id
      HAVING attachment_count > 0
    `;
  } else if (recordType === 'maintenance') {
    query = `
      SELECT DISTINCT mr.id, COUNT(ma.id) as attachment_count
      FROM maintenance_records mr
      LEFT JOIN maintenance_attachments ma ON mr.id = ma.maintenance_id
      LEFT JOIN cars c ON mr.car_id = c.id
      WHERE c.organization_id = ?
      GROUP BY mr.id
      HAVING attachment_count > 0
    `;
  } else {
    throw new Error('Invalid record type');
  }
  
  const [rows] = await pool.execute(query, [organizationId]);
  return rows.reduce((acc, row) => {
    acc[row.id] = row.attachment_count;
    return acc;
  }, {});
};

module.exports = {
  // Expense attachments
  createExpenseAttachment,
  getExpenseAttachments,
  deleteExpenseAttachment,
  deleteExpenseAttachmentsByExpenseId,
  
  // Maintenance attachments
  createMaintenanceAttachment,
  getMaintenanceAttachments,
  deleteMaintenanceAttachment,
  deleteMaintenanceAttachmentsByMaintenanceId,
  
  // Helper
  getRecordsWithAttachments
}; 