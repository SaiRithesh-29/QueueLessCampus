const mongoose = require('mongoose');
const Service = require('../models/Service');
const Token = require('../models/Token');

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

// Enrich a service with live queue info
const enrichService = async (service) => {
  const serving = await Token.findOne({
    service: service._id,
    status: 'SERVING'
  });

  const waitingCount = await Token.countDocuments({
    service: service._id,
    status: 'WAITING'
  });

  return {
    ...service.toObject(),
    serving: serving,
    waitingCount
  };
};

const getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    const enriched = await Promise.all(services.map((s) => enrichService(s)));
    res.json(enriched);
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
    const enriched = await enrichService(service);
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch service', error: error.message });
  }
};

const toggleServiceStatus = async (req, res) => {
  try {
    const service = await findService(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const newStatus = !service.isOpen;
    service.isOpen = newStatus;
    await service.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('service:update', {
        serviceId: service._id,
        isOpen: newStatus
      });
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update service status', error: error.message });
  }
};

module.exports = { getServices, getServiceById, toggleServiceStatus, findService };
