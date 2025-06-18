const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');
const logger = require('../utils/logger');
const { 
  getOrganizationByName,
  getUserByEmailAndOrganization,
  getAllOrganizations,
  getAllRoles,
  getUserById
} = require('../db/queries/authQueries');
const { query } = require('../db/connection');
const { ValidationError, UnauthorizedError, NotFoundError } = require('../middleware/errorHandler');

// Login user
const login = async (req, res, next) => {
  try {
    const { organization, email, password } = req.body;
    
    // Find organization
    const organizations = await getOrganizationByName(organization);
    
    if (organizations.length === 0) {
      throw new NotFoundError('Organization not found');
    }
    
    const organizationId = organizations[0].id;
    
    // Get user by email and organization
    const users = await getUserByEmailAndOrganization(email, organizationId);
    
    if (users.length === 0) {
      throw new UnauthorizedError('Invalid email or password');
    }
    
    const user = users[0];
    
    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role_name,
        role_id: user.role_id,
        organization_id: user.organization_id 
      }, 
      config.app.jwtSecret, 
      { expiresIn: config.app.jwtExpiration }
    );
    
    // Return user info and token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_name,
        roleId: user.role_id,
        organizationId: user.organization_id
      },
      token
    });
    
  } catch (error) {
    next(error);
  }
};

// Register new user (for admin/org admin use)
const register = async (req, res, next) => {
  try {
    const { organization_id, email, password, first_name, last_name, role_id = 3 } = req.body;
    
    // Check if user already exists
    const existingUsers = await getUserByEmailAndOrganization(email, organization_id);
    
    if (existingUsers.length > 0) {
      throw new ValidationError('User with this email already exists in this organization');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const userId = uuidv4();
    await query(
      'INSERT INTO users (id, organization_id, email, password, first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, organization_id, email, hashedPassword, first_name, last_name, role_id]
    );
    
    // Get the created user with role information
    const users = await getUserById(userId);
    
    if (users.length === 0) {
      throw new Error('Failed to create user');
    }
    
    const user = users[0];
    
    // Return user info (without password)
    res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role_name,
      roleId: user.role_id,
      organizationId: user.organization_id,
      createdAt: user.created_at
    });
    
  } catch (error) {
    next(error);
  }
};

// Get organizations for login dropdown
const getOrganizations = async (req, res, next) => {
  try {
    const organizations = await getAllOrganizations();
    res.json(organizations);
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getCurrentUser = async (req, res, next) => {
  try {
    // User is attached to req by the authentication middleware
    if (!req.user) {
      throw new UnauthorizedError();
    }
    
    // Get fresh user data with role information
    const users = await getUserById(req.user.id);
    
    if (users.length === 0) {
      throw new NotFoundError('User not found');
    }
    
    const user = users[0];
    
    // Return user info
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role_name,
      roleId: user.role_id,
      organizationId: user.organization_id
    });
    
  } catch (error) {
    next(error);
  }
};

// Get all roles (for admin use)
const getRoles = async (req, res, next) => {
  try {
    const roles = await getAllRoles();
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getOrganizations,
  getCurrentUser,
  getRoles
}; 