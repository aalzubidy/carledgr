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

module.exports = {
  getOrganizationByName,
  getUserByEmailAndOrganization,
  getAllOrganizations,
  getAllRoles,
  getUserById
}; 