const { UnauthorizedError, ForbiddenError } = require('./errorHandler');

// Role hierarchy: owner (1) > manager (2) > operator (3)
const ROLES = {
  OWNER: 1,
  MANAGER: 2,
  OPERATOR: 3
};

// Check if user has required role or higher
const requireRole = (requiredRoleId) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userRoleId = req.user.role_id;
      
      // Lower role_id means higher permission (owner=1, manager=2, operator=3)
      if (userRoleId > requiredRoleId) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Specific role checkers
const requireOwner = requireRole(ROLES.OWNER);
const requireManager = requireRole(ROLES.MANAGER);
const requireOperator = requireRole(ROLES.OPERATOR);

// Check if user can access settings (owners only)
const requireSettings = (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role_id !== ROLES.OWNER) {
      throw new ForbiddenError('Only owners can access settings');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user can access expenses (owners and managers)
const requireExpenseAccess = (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role_id > ROLES.MANAGER) {
      throw new ForbiddenError('Operators cannot access expense features');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Organization isolation middleware - ensures users only access their org data
const requireOrganization = (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Add organization_id to request for use in queries
    req.organizationId = req.user.organization_id;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  ROLES,
  requireRole,
  requireOwner,
  requireManager,
  requireOperator,
  requireSettings,
  requireExpenseAccess,
  requireOrganization
}; 