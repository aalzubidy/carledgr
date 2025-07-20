const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/connection');
const { generateRandomPassword, hashPassword } = require('../utils/passwordUtils');
const { sendTempPasswordEmail } = require('../utils/emailService');

// Get all users with organization info
router.get('/', async (req, res) => {
  try {
    const { organization_id } = req.query;

    let sql = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.created_at,
        u.updated_at,
        u.organization_id,
        o.name as organization_name,
        r.role_name,
        r.id as role_id
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      JOIN user_roles r ON u.role_id = r.id
    `;

    let params = [];
    if (organization_id) {
      sql += ' WHERE u.organization_id = ?';
      params.push(organization_id);
    }

    sql += ' ORDER BY o.name, u.created_at DESC';

    const users = await query(sql, params);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Get single user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [user] = await query(`
      SELECT 
        u.*,
        o.name as organization_name,
        r.role_name,
        r.id as role_id
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      JOIN user_roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { organization_id, email, first_name, last_name, role_id, send_email = true } = req.body;

    // Validate required fields
    if (!organization_id || !email || !first_name || !last_name || !role_id) {
      return res.status(400).json({
        success: false,
        message: 'Organization, email, first name, last name, and role are required'
      });
    }

    // Check if email already exists
    const [existingUser] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Check if organization exists
    const [organization] = await query('SELECT id, name FROM organizations WHERE id = ?', [organization_id]);
    if (!organization) {
      return res.status(400).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Check if role exists
    const [role] = await query('SELECT id, role_name FROM user_roles WHERE id = ?', [role_id]);
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Generate random password
    const tempPassword = generateRandomPassword(12);
    const hashedPassword = await hashPassword(tempPassword);

    const userId = uuidv4();

    // Create user
    await query(`
      INSERT INTO users (id, organization_id, email, password, first_name, last_name, role_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [userId, organization_id, email, hashedPassword, first_name, last_name, role_id]);

    // Send email with temporary password if requested
    let emailResult = null;
    if (send_email) {
      try {
        emailResult = await sendTempPasswordEmail(
          email,
          `${first_name} ${last_name}`,
          tempPassword,
          organization.name
        );
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the user creation if email fails
        emailResult = { error: emailError.message };
      }
    }

    // Fetch the created user with full info
    const [createdUser] = await query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.created_at,
        u.organization_id,
        o.name as organization_name,
        r.role_name,
        r.id as role_id
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      JOIN user_roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [userId]);

    const response = {
      success: true,
      message: 'User created successfully',
      data: createdUser,
      temp_password: tempPassword // Include in response for admin reference
    };

    if (send_email) {
      response.email_sent = !emailResult?.error;
      if (emailResult?.error) {
        response.email_error = emailResult.error;
      }
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, first_name, last_name, role_id, organization_id } = req.body;

    // Check if user exists
    const [existingUser] = await query('SELECT id, email FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if new email already exists
    if (email && email !== existingUser.email) {
      const [emailExists] = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Validate organization if being changed
    if (organization_id) {
      const [organization] = await query('SELECT id FROM organizations WHERE id = ?', [organization_id]);
      if (!organization) {
        return res.status(400).json({
          success: false,
          message: 'Organization not found'
        });
      }
    }

    // Validate role if being changed
    if (role_id) {
      const [role] = await query('SELECT id FROM user_roles WHERE id = ?', [role_id]);
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role not found'
        });
      }
    }

    // Update user
    await query(`
      UPDATE users 
      SET email = ?, first_name = ?, last_name = ?, role_id = ?, organization_id = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      email || existingUser.email,
      first_name,
      last_name,
      role_id,
      organization_id,
      id
    ]);

    // Fetch updated user
    const [updatedUser] = await query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.created_at,
        u.updated_at,
        u.organization_id,
        o.name as organization_name,
        r.role_name,
        r.id as role_id
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      JOIN user_roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// Reset user password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { send_email = true } = req.body;

    // Check if user exists
    const [user] = await query(`
      SELECT u.*, o.name as organization_name
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `, [id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new random password
    const tempPassword = generateRandomPassword(12);
    const hashedPassword = await hashPassword(tempPassword);

    // Update user password
    await query('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, id]);

    // Send email with new password if requested
    let emailResult = null;
    if (send_email) {
      try {
        emailResult = await sendTempPasswordEmail(
          user.email,
          `${user.first_name} ${user.last_name}`,
          tempPassword,
          user.organization_name
        );
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        emailResult = { error: emailError.message };
      }
    }

    const response = {
      success: true,
      message: 'Password reset successfully',
      temp_password: tempPassword // Include in response for admin reference
    };

    if (send_email) {
      response.email_sent = !emailResult?.error;
      if (emailResult?.error) {
        response.email_error = emailResult.error;
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [existingUser] = await query(`
      SELECT u.email, u.first_name, u.last_name, o.name as organization_name
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `, [id]);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user
    await query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `User "${existingUser.first_name} ${existingUser.last_name}" (${existingUser.email}) deleted successfully from ${existingUser.organization_name}`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// Get user roles for dropdown
router.get('/data/roles', async (req, res) => {
  try {
    const roles = await query('SELECT id, role_name FROM user_roles ORDER BY id');

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roles',
      error: error.message
    });
  }
});

module.exports = router; 