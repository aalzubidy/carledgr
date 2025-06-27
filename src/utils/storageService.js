const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const config = require('../../config');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class StorageService {
  constructor() {
    this.isConfigured = this.checkConfiguration();
    
    if (this.isConfigured) {
      // Configure AWS SDK v3 for Digital Ocean Spaces
      this.s3Client = new S3Client({
        endpoint: config.storage.endpoint,
        region: config.storage.region,
        credentials: {
          accessKeyId: config.storage.accessKeyId,
          secretAccessKey: config.storage.secretAccessKey,
        },
        forcePathStyle: false, // Use subdomain/virtual calling format for DigitalOcean Spaces
      });
    }
  }

  checkConfiguration() {
    const required = ['endpoint', 'bucket', 'accessKeyId', 'secretAccessKey', 'region'];
    const missing = required.filter(key => !config.storage?.[key]);
    
    if (missing.length > 0) {
      logger.warn(`Storage service not configured. Missing: ${missing.join(', ')}`);
      return false;
    }
    
    return true;
  }

  validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > config.storage.maxFileSize) {
      errors.push(`File size exceeds limit of ${Math.round(config.storage.maxFileSize / 1024 / 1024)}MB`);
    }

    // Check file type
    if (!config.storage.allowedFileTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} not allowed. Allowed types: ${config.storage.allowedFileTypes.join(', ')}`);
    }

    // Basic file validation
    if (!file.originalname || file.originalname.trim() === '') {
      errors.push('File name is required');
    }

    // Check for potentially dangerous file extensions
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    if (!allowedExtensions.includes(ext)) {
      errors.push(`File extension ${ext} not allowed`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  generateStorageKey(recordType, recordId, originalFilename) {
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    const ext = path.extname(originalFilename);
    const sanitizedName = path.basename(originalFilename, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);
    
    return `${recordType}/${recordId}/${timestamp}-${uuid}-${sanitizedName}${ext}`;
  }

  async uploadFile(file, recordType, recordId) {
    if (!this.isConfigured) {
      throw new Error('Storage service not configured. Please contact support.');
    }

    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    try {
      const storageKey = this.generateStorageKey(recordType, recordId, file.originalname);
      
      const uploadCommand = new PutObjectCommand({
        Bucket: config.storage.bucket,
        Key: storageKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private', // Keep files private
        Metadata: {
          'original-name': file.originalname,
          'uploaded-by': 'carfin-app',
          'record-type': recordType,
          'record-id': recordId
        }
      });

      await this.s3Client.send(uploadCommand);
      
      // Generate the storage URL
      const storageUrl = `${config.storage.endpoint}/${config.storage.bucket}/${storageKey}`;
      
      logger.info(`File uploaded successfully: ${storageKey}`);
      
      return {
        storageKey,
        storageUrl,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype
      };
      
    } catch (error) {
      logger.error(`File upload failed: ${error.message}`);
      throw new Error('File upload failed. Please try again or contact support.');
    }
  }

  async deleteFile(storageKey) {
    if (!this.isConfigured) {
      logger.warn('Storage service not configured, skipping file deletion');
      return;
    }

    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: config.storage.bucket,
        Key: storageKey
      });

      await this.s3Client.send(deleteCommand);
      logger.info(`File deleted successfully: ${storageKey}`);
      
    } catch (error) {
      logger.error(`File deletion failed: ${error.message}`);
      // Don't throw error for deletion failures - log and continue
    }
  }

  async getSignedUrl(storageKey, expiresIn = 3600) {
    if (!this.isConfigured) {
      throw new Error('Storage service not configured');
    }

    try {
      const getObjectCommand = new GetObjectCommand({
        Bucket: config.storage.bucket,
        Key: storageKey
      });

      const signedUrl = await getSignedUrl(this.s3Client, getObjectCommand, {
        expiresIn: expiresIn // 1 hour by default
      });
      
      return signedUrl;
      
    } catch (error) {
      logger.error(`Failed to generate signed URL: ${error.message}`);
      throw new Error('Failed to generate file access URL');
    }
  }

  async checkFileExists(storageKey) {
    if (!this.isConfigured) {
      return false;
    }

    try {
      const headCommand = new HeadObjectCommand({
        Bucket: config.storage.bucket,
        Key: storageKey
      });
      
      await this.s3Client.send(headCommand);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }
}

module.exports = new StorageService(); 