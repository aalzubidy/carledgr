const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { 
  getUsersByOrganization,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  checkUserEmailExists,
  getAllRoles
} = require('../db/queries/authQueries');
const { ValidationError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

// Get all users in the organization
const getOrganizationUsers = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    const users = await getUsersByOrganization(organizationId);
    
    // Remove password from response
    const safeUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role_name,
      roleId: user.role_id,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));
    
    res.json(safeUsers);
  } catch (error) {
    next(error);
  }
};

// Create new user
const createOrganizationUser = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, role_id = 3 } = req.body;
    const organizationId = req.user.organization_id;
    
    // Validation
    if (!email || !password || !first_name || !last_name) {
      throw new ValidationError('Email, password, first name, and last name are required');
    }
    
    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }
    
    // Check if email already exists in organization
    const emailExists = await checkUserEmailExists(email, organizationId);
    if (emailExists) {
      throw new ValidationError('User with this email already exists in this organization');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = uuidv4();
    await createUser({
      id: userId,
      organization_id: organizationId,
      email,
      password: hashedPassword,
      first_name,
      last_name,
      role_id: parseInt(role_id)
    });
    
    // Get created user with role information
    const users = await getUserById(userId);
    if (users.length === 0) {
      throw new Error('Failed to create user');
    }
    
    const user = users[0];
    
    res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role_name,
      roleId: user.role_id,
      createdAt: user.created_at
    });
    
  } catch (error) {
    next(error);
  }
};

// Update user
const updateOrganizationUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, first_name, last_name, role_id } = req.body;
    const organizationId = req.user.organization_id;
    
    // Validation
    if (!email || !first_name || !last_name) {
      throw new ValidationError('Email, first name, and last name are required');
    }
    
    // Check if user exists and belongs to organization
    const users = await getUserById(id);
    if (users.length === 0) {
      throw new NotFoundError('User not found');
    }
    
    const user = users[0];
    if (user.organization_id !== organizationId) {
      throw new ForbiddenError('Cannot modify users from other organizations');
    }
    
    // Prevent owner from demoting themselves
    if (user.id === req.user.id && parseInt(role_id) !== 1) {
      throw new ValidationError('Cannot change your own role from owner');
    }
    
    // Check if email already exists (excluding current user)
    const emailExists = await checkUserEmailExists(email, organizationId, id);
    if (emailExists) {
      throw new ValidationError('User with this email already exists in this organization');
    }
    
    // Update user
    await updateUser(id, {
      email,
      first_name,
      last_name,
      role_id: parseInt(role_id)
    });
    
    // Get updated user with role information
    const updatedUsers = await getUserById(id);
    const updatedUser = updatedUsers[0];
    
    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      role: updatedUser.role_name,
      roleId: updatedUser.role_id,
      updatedAt: updatedUser.updated_at
    });
    
  } catch (error) {
    next(error);
  }
};

// Delete user
const deleteOrganizationUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organization_id;
    
    // Check if user exists and belongs to organization
    const users = await getUserById(id);
    if (users.length === 0) {
      throw new NotFoundError('User not found');
    }
    
    const user = users[0];
    if (user.organization_id !== organizationId) {
      throw new ForbiddenError('Cannot delete users from other organizations');
    }
    
    // Prevent owner from deleting themselves
    if (user.id === req.user.id) {
      throw new ValidationError('Cannot delete your own account');
    }
    
    // Delete user
    await deleteUser(id);
    
    res.status(204).send();
    
  } catch (error) {
    next(error);
  }
};

// Get user roles
const getUserRoles = async (req, res, next) => {
  try {
    const roles = await getAllRoles();
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrganizationUsers,
  createOrganizationUser,
  updateOrganizationUser,
  deleteOrganizationUser,
  getUserRoles
}; 