const { query } = require('../connection');

// Get organization by name
const getOrganizationByName = async (name) => {
  return query('SELECT * FROM organizations WHERE name = ?', [name]);
};

// Get user by email and organization with role information
const getUserByEmailAndOrganization = async (email, organizationId) => {
  return query(`
    SELECT u.*, r.role_name 
    FROM users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.email = ? AND u.organization_id = ?
  `, [email, organizationId]);
};

// Get all organizations (for organization dropdown in login form)
const getAllOrganizations = async () => {
  return query('SELECT id, name FROM organizations ORDER BY name');
};

// Get all user roles
const getAllRoles = async () => {
  return query('SELECT * FROM user_roles ORDER BY id');
};

// Get user by ID with role information
const getUserById = async (userId) => {
  return query(`
    SELECT u.*, r.role_name 
    FROM users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.id = ?
  `, [userId]);
};

// Get all users by organization with role information
const getUsersByOrganization = async (organizationId) => {
  return query(`
    SELECT u.id, u.email, u.first_name, u.last_name, u.role_id, u.created_at, u.updated_at, r.role_name 
    FROM users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.organization_id = ?
    ORDER BY u.created_at DESC
  `, [organizationId]);
};

// Create new user
const createUser = async (userData) => {
  const { id, organization_id, email, password, first_name, last_name, role_id } = userData;
  return query(
    'INSERT INTO users (id, organization_id, email, password, first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, organization_id, email, password, first_name, last_name, role_id]
  );
};

// Update user information (excluding password)
const updateUser = async (userId, userData) => {
  const { email, first_name, last_name, role_id } = userData;
  return query(
    'UPDATE users SET email = ?, first_name = ?, last_name = ?, role_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [email, first_name, last_name, role_id, userId]
  );
};

// Delete user
const deleteUser = async (userId) => {
  return query('DELETE FROM users WHERE id = ?', [userId]);
};

// Check if user exists by email in organization (excluding specific user ID)
const checkUserEmailExists = async (email, organizationId, excludeUserId = null) => {
  let sql = 'SELECT id FROM users WHERE email = ? AND organization_id = ?';
  const params = [email, organizationId];
  
  if (excludeUserId) {
    sql += ' AND id != ?';
    params.push(excludeUserId);
  }
  
  const result = await query(sql, params);
  return result.length > 0;
};

module.exports = {
  getOrganizationByName,
  getUserByEmailAndOrganization,
  getAllOrganizations,
  getAllRoles,
  getUserById,
  getUsersByOrganization,
  createUser,
  updateUser,
  deleteUser,
  checkUserEmailExists
}; 