const jwt = require('jsonwebtoken');
const config = require('../../config');
const logger = require('../utils/logger');
const { query } = require('../db/connection');

// Verify JWT token middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, config.app.jwtSecret, async (err, user) => {
    if (err) {
      logger.error(`JWT verification failed: ${err.message}`);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    try {
      // Check if user still exists and is active
      const users = await query('SELECT * FROM users WHERE id = ?', [user.id]);
      
      if (users.length === 0) {
        return res.status(403).json({ error: 'User no longer exists' });
      }
      
      // Attach user information to request
      req.user = users[0];
      next();
    } catch (error) {
      logger.error(`Authentication error: ${error.message}`);
      return res.status(500).json({ error: 'Internal server error during authentication' });
    }
  });
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Check if user belongs to the same organization or is admin
const isSameOrganizationOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role === 'admin') {
    return next();
  }
  
  const requestedOrgId = req.params.organizationId || req.body.organization_id;
  
  if (!requestedOrgId || req.user.organization_id !== requestedOrgId) {
    return res.status(403).json({ error: 'Access denied: different organization' });
  }
  
  next();
};

// Check if user is organization admin or admin
const isOrgAdminOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role === 'admin' || req.user.role === 'org_admin') {
    return next();
  }
  
  return res.status(403).json({ error: 'Organization admin or admin access required' });
};

module.exports = {
  authenticateJWT,
  isAdmin,
  isSameOrganizationOrAdmin,
  isOrgAdminOrAdmin
}; 