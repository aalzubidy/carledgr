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
const { sendPasswordResetEmail } = require('../utils/emailService');

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
      organizationId: user.organization_id,
      organization_name: user.organization_name
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

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name } = req.body;
    
    if (!first_name || !last_name) {
      throw new ValidationError('First name and last name are required');
    }

    await query(
      'UPDATE users SET first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [first_name, last_name, userId]
    );

    // Get updated user data
    const users = await getUserById(userId);
    
    if (users.length === 0) {
      throw new NotFoundError('User not found');
    }

    const user = users[0];

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

// Update user password
const updatePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      throw new ValidationError('Current password and new password are required');
    }

    // Get current user data
    const users = await getUserById(userId);
    
    if (users.length === 0) {
      throw new NotFoundError('User not found');
    }

    const user = users[0];

    // Verify current password
    const passwordMatch = await bcrypt.compare(current_password, user.password);
    
    if (!passwordMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await query(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    next(error);
  }
};

// Generate random password
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Forgot password - Generate temporary password and email it
const forgotPassword = async (req, res, next) => {
  try {
    const { organization, email } = req.body;
    
    if (!organization || !email) {
      throw new ValidationError('Organization name and email are required');
    }
    
    // Find organization
    const organizations = await getOrganizationByName(organization.trim());
    
    if (organizations.length === 0) {
      // For security, don't reveal that organization doesn't exist
      return res.json({ 
        message: 'If an account with that email exists in the specified organization, a password reset email has been sent.' 
      });
    }
    
    const organizationData = organizations[0];
    
    // Get user by email and organization
    const users = await getUserByEmailAndOrganization(email.trim(), organizationData.id);
    
    if (users.length === 0) {
      // For security, don't reveal that user doesn't exist
      return res.json({ 
        message: 'If an account with that email exists in the specified organization, a password reset email has been sent.' 
      });
    }
    
    const user = users[0];
    
    // Generate temporary password
    const tempPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Update user's password with temporary password
    await query(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, user.id]
    );
    
    // Send password reset email
    try {
      await sendPasswordResetEmail(organizationData.name, user.email, tempPassword);
      logger.info(`Password reset email sent to ${user.email} for organization ${organizationData.name}`);
    } catch (emailError) {
      logger.error(`Failed to send password reset email: ${emailError.message}`);
      // Still return success to user for security, but log the error
    }
    
    res.json({ 
      message: 'If an account with that email exists in the specified organization, a password reset email has been sent.' 
    });
    
  } catch (error) {
    next(error);
  }
};

// Logout (for logging purposes - JWT is stateless)
const logout = async (req, res, next) => {
  try {
    // Log the logout action
    logger.info(`User ${req.user.id} (${req.user.email}) logged out`);
    
    // Since JWT is stateless, we just return success
    // The frontend will remove the token from localStorage
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getOrganizations,
  getCurrentUser,
  getRoles,
  updateProfile,
  updatePassword,
  forgotPassword,
  logout
}; 