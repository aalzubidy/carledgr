const storageService = require('../utils/storageService');
const attachmentQueries = require('../db/queries/attachmentQueries');
const logger = require('../utils/logger');

// Upload file for expense
const uploadExpenseAttachment = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    // Upload to storage
    const fileData = await storageService.uploadFile(file, 'expense', expenseId);
    
    // Save to database
    const attachment = await attachmentQueries.createExpenseAttachment(
      expenseId,
      fileData,
      userId
    );

    res.status(201).json({
      success: true,
      data: attachment,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    logger.error(`Upload expense attachment failed: ${error.message}`);
    
    // Handle storage service configuration errors gracefully
    if (error.message.includes('Storage service not configured')) {
      return res.status(503).json({
        success: false,
        message: 'File attachments are temporarily unavailable. Please contact support. You can still save your record without an attachment.',
        code: 'STORAGE_UNAVAILABLE'
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || 'File upload failed'
    });
  }
};

// Upload file for maintenance record
const uploadMaintenanceAttachment = async (req, res) => {
  try {
    const { maintenanceId } = req.params;
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    // Upload to storage
    const fileData = await storageService.uploadFile(file, 'maintenance', maintenanceId);
    
    // Save to database
    const attachment = await attachmentQueries.createMaintenanceAttachment(
      maintenanceId,
      fileData,
      userId
    );

    res.status(201).json({
      success: true,
      data: attachment,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    logger.error(`Upload maintenance attachment failed: ${error.message}`);
    
    if (error.message.includes('Storage service not configured')) {
      return res.status(503).json({
        success: false,
        message: 'File attachments are temporarily unavailable. Please contact support. You can still save your record without an attachment.',
        code: 'STORAGE_UNAVAILABLE'
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || 'File upload failed'
    });
  }
};

// Get attachments for expense
const getExpenseAttachments = async (req, res) => {
  try {
    const { expenseId } = req.params;
    
    const attachments = await attachmentQueries.getExpenseAttachments(expenseId);
    
    res.json({
      success: true,
      data: attachments
    });

  } catch (error) {
    logger.error(`Get expense attachments failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attachments'
    });
  }
};

// Get attachments for maintenance record
const getMaintenanceAttachments = async (req, res) => {
  try {
    const { maintenanceId } = req.params;
    
    const attachments = await attachmentQueries.getMaintenanceAttachments(maintenanceId);
    
    res.json({
      success: true,
      data: attachments
    });

  } catch (error) {
    logger.error(`Get maintenance attachments failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attachments'
    });
  }
};

// Delete expense attachment
const deleteExpenseAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    // Get storage key and delete from database
    const storageKey = await attachmentQueries.deleteExpenseAttachment(attachmentId);
    
    // Delete from storage (don't fail if storage deletion fails)
    try {
      await storageService.deleteFile(storageKey);
    } catch (storageError) {
      logger.error(`Storage deletion failed (continuing anyway): ${storageError.message}`);
    }

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });

  } catch (error) {
    logger.error(`Delete expense attachment failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete attachment'
    });
  }
};

// Delete maintenance attachment
const deleteMaintenanceAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    // Get storage key and delete from database
    const storageKey = await attachmentQueries.deleteMaintenanceAttachment(attachmentId);
    
    // Delete from storage (don't fail if storage deletion fails)
    try {
      await storageService.deleteFile(storageKey);
    } catch (storageError) {
      logger.error(`Storage deletion failed (continuing anyway): ${storageError.message}`);
    }

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });

  } catch (error) {
    logger.error(`Delete maintenance attachment failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete attachment'
    });
  }
};

// Download/view attachment (generates signed URL)
const downloadAttachment = async (req, res) => {
  try {
    const { type, recordId, attachmentId } = req.params;
    let storageKey;

    // Get attachment details based on type
    if (type === 'expense') {
      const attachments = await attachmentQueries.getExpenseAttachments(recordId);
      const attachment = attachments.find(a => a.id === attachmentId);
      if (!attachment) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found'
        });
      }
      storageKey = attachment.storage_key;
    } else if (type === 'maintenance') {
      const attachments = await attachmentQueries.getMaintenanceAttachments(recordId);
      const attachment = attachments.find(a => a.id === attachmentId);
      if (!attachment) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found'
        });
      }
      storageKey = attachment.storage_key;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid attachment type'
      });
    }

    // Generate signed URL
    const signedUrl = await storageService.getSignedUrl(storageKey);
    
    res.json({
      success: true,
      data: {
        downloadUrl: signedUrl
      }
    });

  } catch (error) {
    logger.error(`Download attachment failed: ${error.message}`);
    
    if (error.message.includes('Storage service not configured')) {
      return res.status(503).json({
        success: false,
        message: 'File download is temporarily unavailable. Please contact support.',
        code: 'STORAGE_UNAVAILABLE'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate download link'
    });
  }
};

// Get records with attachments (for UI indicators)
const getRecordsWithAttachments = async (req, res) => {
  try {
    const { type } = req.params;
    const organizationId = req.user.organization_id;
    
    const recordsWithAttachments = await attachmentQueries.getRecordsWithAttachments(
      type,
      organizationId
    );
    
    res.json({
      success: true,
      data: recordsWithAttachments
    });

  } catch (error) {
    logger.error(`Get records with attachments failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attachment indicators'
    });
  }
};

module.exports = {
  uploadExpenseAttachment,
  uploadMaintenanceAttachment,
  getExpenseAttachments,
  getMaintenanceAttachments,
  deleteExpenseAttachment,
  deleteMaintenanceAttachment,
  downloadAttachment,
  getRecordsWithAttachments
}; 