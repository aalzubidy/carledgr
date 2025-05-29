const { query } = require('../connection');

// Get organization by name
const getOrganizationByName = async (name) => {
  return query('SELECT * FROM organizations WHERE name = ?', [name]);
};

// Get user by email and organization
const getUserByEmailAndOrganization = async (email, organizationId) => {
  return query(
    'SELECT * FROM users WHERE email = ? AND organization_id = ?',
    [email, organizationId]
  );
};

// Get all organizations (for organization dropdown in login form)
const getAllOrganizations = async () => {
  return query('SELECT id, name FROM organizations ORDER BY name');
};

module.exports = {
  getOrganizationByName,
  getUserByEmailAndOrganization,
  getAllOrganizations
}; 