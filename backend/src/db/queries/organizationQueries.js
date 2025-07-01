const { query } = require('../connection');

// Get all organizations
const getAllOrganizations = async () => {
  return query('SELECT * FROM organizations ORDER BY name');
};

// Get organization by ID
const getOrganizationById = async (id) => {
  return query('SELECT * FROM organizations WHERE id = ?', [id]);
};

// Create organization
const createOrganization = async (organization) => {
  const { id, name, address, phone, email } = organization;
  
  return query(
    'INSERT INTO organizations (id, name, address, phone, email) VALUES (?, ?, ?, ?, ?)',
    [id, name, address, phone, email]
  );
};

// Update organization
const updateOrganization = async (id, organization) => {
  const { name, address, phone, email } = organization;
  
  return query(
    'UPDATE organizations SET name = ?, address = ?, phone = ?, email = ? WHERE id = ?',
    [name, address, phone, email, id]
  );
};

// Delete organization
const deleteOrganization = async (id) => {
  return query('DELETE FROM organizations WHERE id = ?', [id]);
};

// Check if organization name exists
const checkOrganizationNameExists = async (name) => {
  const result = await query('SELECT id FROM organizations WHERE LOWER(name) = LOWER(?)', [name]);
  return result.length > 0;
};

module.exports = {
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  checkOrganizationNameExists
}; 