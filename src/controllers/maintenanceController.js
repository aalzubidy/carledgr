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
  getMaintenanceCategoryById,
  createMaintenanceCategory,
  updateMaintenanceCategory,
  deleteMaintenanceCategory,
  getMaintenanceRecordsByCategoryId,
  moveMaintenanceRecordsToCategory,
  deleteMaintenanceRecordsByCategory,
  getDefaultOtherCategory,
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
    
    // Clean up attachments first
    try {
      const attachmentQueries = require('../db/queries/attachmentQueries');
      const storageService = require('../utils/storageService');
      
      const storageKeys = await attachmentQueries.deleteMaintenanceAttachmentsByMaintenanceId(id);
      
      // Delete files from storage (don't fail if storage deletion fails)
      for (const storageKey of storageKeys) {
        try {
          await storageService.deleteFile(storageKey);
        } catch (storageError) {
          logger.error(`Storage deletion failed for ${storageKey}: ${storageError.message}`);
        }
      }
    } catch (attachmentError) {
      logger.error(`Attachment cleanup failed for maintenance ${id}: ${attachmentError.message}`);
      // Continue with maintenance deletion even if attachment cleanup fails
    }
    
    await deleteMaintenanceRecord(id);
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// Get maintenance categories (default + custom for organization)
const getCategories = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    const categories = await getMaintenanceCategories(organizationId);
    res.json(categories);
  } catch (error) {
    logger.error(`Error fetching maintenance categories: ${error.message}`);
    next(error);
  }
};

// Create custom maintenance category
const createCategory = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    const { category_name } = req.body;
    
    if (!category_name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const category = await createMaintenanceCategory(organizationId, category_name);
    res.status(201).json(category);
  } catch (error) {
    logger.error(`Error creating maintenance category: ${error.message}`);
    next(error);
  }
};

// Update custom maintenance category
const updateCategory = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    const { id } = req.params;
    const { category_name } = req.body;
    
    if (!category_name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const updated = await updateMaintenanceCategory(id, organizationId, category_name);
    
    if (!updated) {
      return res.status(404).json({ error: 'Category not found or not editable' });
    }
    
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    logger.error(`Error updating maintenance category: ${error.message}`);
    next(error);
  }
};

// Delete custom maintenance category
const deleteCategory = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    const { id } = req.params;
    const { action, target_category_id } = req.body;
    
    // Check if category exists and belongs to organization
    const category = await getMaintenanceCategoryById(id, organizationId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    if (category.is_default) {
      return res.status(400).json({ error: 'Cannot delete default categories' });
    }
    
    // Check if there are maintenance records using this category
    const recordCount = await getMaintenanceRecordsByCategoryId(id);
    
    if (recordCount > 0) {
      if (action === 'move' && target_category_id) {
        // Move records to target category
        await moveMaintenanceRecordsToCategory(id, target_category_id);
      } else if (action === 'delete') {
        // Delete all records in this category
        await deleteMaintenanceRecordsByCategory(id);
      } else {
        return res.status(400).json({ 
          error: 'Category has maintenance records. Please specify action: move or delete',
          record_count: recordCount
        });
      }
    }
    
    // Delete the category
    const deleted = await deleteMaintenanceCategory(id, organizationId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found or not deletable' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting maintenance category: ${error.message}`);
    next(error);
  }
};

// Move maintenance records between categories
const moveRecordsToCategory = async (req, res, next) => {
  try {
    const organizationId = req.user.organization_id;
    const { id } = req.params;
    const { target_category_id } = req.body;
    
    if (!target_category_id) {
      return res.status(400).json({ error: 'Target category ID is required' });
    }
    
    // Verify both categories exist and are accessible
    const sourceCategory = await getMaintenanceCategoryById(id, organizationId);
    const targetCategory = await getMaintenanceCategoryById(target_category_id, organizationId);
    
    if (!sourceCategory) {
      return res.status(404).json({ error: 'Source category not found' });
    }
    
    if (!targetCategory) {
      return res.status(404).json({ error: 'Target category not found' });
    }
    
    // Move records
    const movedCount = await moveMaintenanceRecordsToCategory(id, target_category_id);
    
    res.json({ 
      message: 'Maintenance records moved successfully',
      moved_count: movedCount
    });
  } catch (error) {
    logger.error(`Error moving maintenance records: ${error.message}`);
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
  moveRecordsToCategory,
  getStatistics
}; 