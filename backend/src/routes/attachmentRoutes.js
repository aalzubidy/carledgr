const express = require('express');
const multer = require('multer');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');
const { authenticateJWT } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png', 
      'image/webp',
      'application/pdf'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

// Upload middleware wrapper
const uploadMiddleware = (req, res, next) => {
  upload.single('attachment')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum size is 8MB.'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files. Only one file allowed.'
          });
        }
      }
      
      if (err.message && err.message.includes('not allowed')) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'File upload error'
      });
    }
    next();
  });
};

// Expense attachment routes
router.post('/expenses/:expenseId/upload', authenticateJWT, uploadMiddleware, attachmentController.uploadExpenseAttachment);
router.get('/expenses/:expenseId/attachments', authenticateJWT, attachmentController.getExpenseAttachments);
router.delete('/expenses/attachments/:attachmentId', authenticateJWT, attachmentController.deleteExpenseAttachment);

// Maintenance attachment routes
router.post('/maintenance/:maintenanceId/upload', authenticateJWT, uploadMiddleware, attachmentController.uploadMaintenanceAttachment);
router.get('/maintenance/:maintenanceId/attachments', authenticateJWT, attachmentController.getMaintenanceAttachments);
router.delete('/maintenance/attachments/:attachmentId', authenticateJWT, attachmentController.deleteMaintenanceAttachment);

// Download attachment route
router.get('/download/:type/:recordId/:attachmentId', authenticateJWT, attachmentController.downloadAttachment);

// Get records with attachments
router.get('/indicators/:type', authenticateJWT, attachmentController.getRecordsWithAttachments);

// Test route
router.get('/test', authenticateJWT, (req, res) => {
  res.json({ message: 'Attachment routes working' });
});

module.exports = router; 