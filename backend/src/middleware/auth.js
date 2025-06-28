const jwt = require('jsonwebtoken');
const config = require('../../config');
const logger = require('../utils/logger');
const { getUserById } = require('../db/queries/authQueries');

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
      // Check if user still exists and is active, get role information
      const users = await getUserById(user.id);
      
      if (users.length === 0) {
        return res.status(403).json({ error: 'User no longer exists' });
      }
      
      // Attach user information to request with role data
      req.user = users[0];
      next();
    } catch (error) {
      logger.error(`Authentication error: ${error.message}`);
      return res.status(500).json({ error: 'Internal server error during authentication' });
    }
  });
};

// Check if user is owner (replaces admin check)
const isOwner = (req, res, next) => {
  if (!req.user || req.user.role_id !== 1) {
    return res.status(403).json({ error: 'Owner access required' });
  }
  next();
};

// Check if user belongs to the same organization
const isSameOrganization = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const requestedOrgId = req.params.organizationId || req.body.organization_id;
  
  if (!requestedOrgId || req.user.organization_id !== requestedOrgId) {
    return res.status(403).json({ error: 'Access denied: different organization' });
  }
  
  next();
};

// Legacy admin check (for backward compatibility)
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role_id !== 1) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = {
  authenticateJWT,
  isAdmin,
  isOwner,
  isSameOrganization
}; 