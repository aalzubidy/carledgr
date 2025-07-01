const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { 
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  checkOrganizationNameExists
} = require('../db/queries/organizationQueries');
const { NotFoundError } = require('../middleware/errorHandler');

// Get all organizations
const getAll = async (req, res, next) => {
  try {
    const organizations = await getAllOrganizations();
    res.json(organizations);
  } catch (error) {
    next(error);
  }
};

// Get organization by ID
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizations = await getOrganizationById(id);
    
    if (organizations.length === 0) {
      throw new NotFoundError('Organization not found');
    }
    
    res.json(organizations[0]);
  } catch (error) {
    next(error);
  }
};

// Create organization
const create = async (req, res, next) => {
  try {
    const { name, address, phone, email } = req.body;
    const id = uuidv4();
    
    await createOrganization({ id, name, address, phone, email });
    
    const organizations = await getOrganizationById(id);
    
    if (organizations.length === 0) {
      throw new Error('Failed to create organization');
    }
    
    res.status(201).json(organizations[0]);
  } catch (error) {
    next(error);
  }
};

// Update organization
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email } = req.body;
    
    // Check if organization exists
    const organizations = await getOrganizationById(id);
    
    if (organizations.length === 0) {
      throw new NotFoundError('Organization not found');
    }
    
    const existingOrg = organizations[0];
    
    // Update with new values or keep existing ones
    const updatedOrg = {
      name: name || existingOrg.name,
      address: address !== undefined ? address : existingOrg.address,
      phone: phone !== undefined ? phone : existingOrg.phone,
      email: email !== undefined ? email : existingOrg.email
    };
    
    await updateOrganization(id, updatedOrg);
    
    const updatedOrganizations = await getOrganizationById(id);
    res.json(updatedOrganizations[0]);
  } catch (error) {
    next(error);
  }
};

// Delete organization
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if organization exists
    const organizations = await getOrganizationById(id);
    
    if (organizations.length === 0) {
      throw new NotFoundError('Organization not found');
    }
    
    await deleteOrganization(id);
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// Check if organization name exists
const checkNameExists = async (req, res, next) => {
  try {
    const { name } = req.params;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Organization name is required',
        exists: false 
      });
    }
    
    const exists = await checkOrganizationNameExists(name.trim());
    
    res.json({ 
      exists,
      name: name.trim()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  checkNameExists
}; 