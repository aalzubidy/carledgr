const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const {
  getMaintenanceRecordsByCar,
  getMaintenanceRecordsByOrganization,
  getMaintenanceRecordById,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  associateMaintenanceCategories,
  getMaintenanceCategories,
  createMaintenanceCategory,
  updateMaintenanceCategory,
  deleteMaintenanceCategory,
  getMaintenanceStatistics
} = require('../db/queries/maintenanceQueries');
const { getCarById } = require('../db/queries/carQueries');
const { NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

// Get all maintenance records for the organization
const getAllMaintenance = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    
    const maintenanceRecords = await getMaintenanceRecordsByOrganization(organizationId);
    res.json(maintenanceRecords);
  } catch (error) {
    next(error);
  }
};

// Get maintenance records for a car
const getMaintenanceByCarId = async (req, res, next) => {
  try {
    const { carId } = req.params;
    
    // Check if car exists and belongs to user's organization
    const cars = await getCarById(carId);
    
    if (cars.length === 0) {
      throw new NotFoundError('Car not found');
    }
    
    const car = cars[0];
    
    if (car.organization_id !== req.user.organization_id && req.user.role !== 'admin') {
      throw new ForbiddenError('You do not have access to this car');
    }
    
    const maintenanceRecords = await getMaintenanceRecordsByCar(carId);
    res.json(maintenanceRecords);
  } catch (error) {
    next(error);
  }
};

// Get maintenance record by ID
const getMaintenanceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const records = await getMaintenanceRecordById(id);
    
    if (records.length === 0) {
      throw new NotFoundError('Maintenance record not found');
    }
    
    const record = records[0];
    
    // Check if the car belongs to user's organization
    const cars = await getCarById(record.car_id);
    
    if (cars.length === 0) {
      throw new NotFoundError('Car not found');
    }
    
    const car = cars[0];
    
    if (car.organization_id !== req.user.organization_id && req.user.role !== 'admin') {
      throw new ForbiddenError('You do not have access to this maintenance record');
    }
    
    // Add category information
    if (record.category_name) {
      record.category = {
        id: record.category_id,
        name: record.category_name
      };
    }
    
    // Remove the category_name field
    delete record.category_name;
    
    res.json(record);
  } catch (error) {
    next(error);
  }
};

// Create maintenance record
const createMaintenance = async (req, res, next) => {
  try {
    const { car_id, category_id, description, cost, maintenance_date, vendor, notes } = req.body;
    
    // Check if car exists and belongs to user's organization
    const cars = await getCarById(car_id);
    
    if (cars.length === 0) {
      throw new NotFoundError('Car not found');
    }
    
    const car = cars[0];
    
    if (car.organization_id !== req.user.organization_id && req.user.role !== 'admin') {
      throw new ForbiddenError('You do not have access to this car');
    }
    
    const id = uuidv4();
    
    await createMaintenanceRecord({
      id,
      car_id,
      category_id,
      description,
      cost,
      maintenance_date,
      vendor,
      notes
    });
    
    const records = await getMaintenanceRecordById(id);
    
    if (records.length === 0) {
      throw new Error('Failed to create maintenance record');
    }
    
    const record = records[0];
    
    // Add category information
    if (record.category_name) {
      record.category = {
        id: record.category_id,
        name: record.category_name
      };
    }
    
    // Remove the category_name field
    delete record.category_name;
    
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

// Update maintenance record
const updateMaintenance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category_id, description, cost, maintenance_date, vendor, notes } = req.body;
    
    // Check if record exists
    const records = await getMaintenanceRecordById(id);
    
    if (records.length === 0) {
      throw new NotFoundError('Maintenance record not found');
    }
    
    const record = records[0];
    
    // Check if the car belongs to user's organization
    const cars = await getCarById(record.car_id);
    
    if (cars.length === 0) {
      throw new NotFoundError('Car not found');
    }
    
    const car = cars[0];
    
    if (car.organization_id !== req.user.organization_id && req.user.role !== 'admin') {
      throw new ForbiddenError('You do not have access to this maintenance record');
    }
    
    // Update with new values or keep existing ones
    const updatedRecord = {
      category_id: category_id || record.category_id,
      description: description || record.description,
      cost: cost !== undefined ? cost : record.cost,
      maintenance_date: maintenance_date || record.maintenance_date,
      vendor: vendor !== undefined ? vendor : record.vendor,
      notes: notes !== undefined ? notes : record.notes
    };
    
    await updateMaintenanceRecord(id, updatedRecord);
    
    const updatedRecords = await getMaintenanceRecordById(id);
    const newRecord = updatedRecords[0];
    
    // Add category information
    if (newRecord.category_name) {
      newRecord.category = {
        id: newRecord.category_id,
        name: newRecord.category_name
      };
    }
    
    // Remove the category_name field
    delete newRecord.category_name;
    
    res.json(newRecord);
  } catch (error) {
    next(error);
  }
};

// Delete maintenance record
const deleteMaintenance = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if record exists
    const records = await getMaintenanceRecordById(id);
    
    if (records.length === 0) {
      throw new NotFoundError('Maintenance record not found');
    }
    
    const record = records[0];
    
    // Check if the car belongs to user's organization
    const cars = await getCarById(record.car_id);
    
    if (cars.length === 0) {
      throw new NotFoundError('Car not found');
    }
    
    const car = cars[0];
    
    if (car.organization_id !== req.user.organization_id && req.user.role !== 'admin') {
      throw new ForbiddenError('You do not have access to this maintenance record');
    }
    
    await deleteMaintenanceRecord(id);
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// Get maintenance categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await getMaintenanceCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// Create maintenance category
const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const id = uuidv4();
    
    await createMaintenanceCategory({ id, name });
    
    res.status(201).json({ id, name });
  } catch (error) {
    next(error);
  }
};

// Update maintenance category
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    await updateMaintenanceCategory(id, name);
    
    res.json({ id, name });
  } catch (error) {
    next(error);
  }
};

// Delete maintenance category
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await deleteMaintenanceCategory(id);
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// Get maintenance statistics
const getStatistics = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    
    const statistics = await getMaintenanceStatistics(organizationId);
    res.json(statistics);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMaintenance,
  getMaintenanceByCarId,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getStatistics
}; 