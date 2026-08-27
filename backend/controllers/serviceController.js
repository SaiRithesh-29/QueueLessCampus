const mongoose = require('mongoose');
const Service = require('../models/Service');

// Helper to find service by ObjectId, Code, or Name
const findService = async (identifier) => {
  if (!identifier) return null;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const found = await Service.findById(identifier);
    if (found) return found;
  }
  // Try matching by code or name
  return await Service.findOne({
    $or: [
      { code: identifier.toUpperCase() },
      { name: { $regex: new RegExp(identifier, 'i') } }
    ]
  });
};

const getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services', error: error.message });
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await findService(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch service', error: error.message });
  }
};

module.exports = { getServices, getServiceById, findService };
