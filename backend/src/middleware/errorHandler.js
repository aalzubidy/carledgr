const logger = require('../utils/logger');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`Error: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);
  
  // Check for specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message, error: err.message });
  }
  
  if (err.name === 'BadRequestError') {
    return res.status(400).json({ message: err.message, error: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Authentication required', error: 'Authentication required' });
  }
  
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({ message: 'Access denied', error: 'Access denied' });
  }
  
  if (err.name === 'NotFoundError') {
    return res.status(404).json({ message: 'Resource not found', error: 'Resource not found' });
  }
  
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Resource already exists', error: 'Resource already exists' });
  }
  
  // Default error response
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
    error: err.message || 'Internal Server Error'
  });
};

// Not found middleware (404)
const notFoundHandler = (req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
};

// Custom error classes
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class BadRequestError extends Error {
  constructor(message = 'Bad Request') {
    super(message);
    this.name = 'BadRequestError';
    this.statusCode = 400;
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

class ForbiddenError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  ValidationError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError
}; 