const Token = require('../models/Token');
const Service = require('../models/Service');
const { findService } = require('./serviceController');

const generateTokenNumber = async (service) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastToken = await Token.findOne({
    service: service._id,
    createdAt: { $gte: today }
  }).sort({ createdAt: -1 });

  let nextNum = 1;
  if (lastToken) {
    const parts = lastToken.tokenNumber.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${service.code}-${String(nextNum).padStart(3, '0')}`;
};

// Emit real-time queue update for a service
const emitQueueUpdate = (io, serviceId) => {
  if (io) {
    io.to(`service:${serviceId}`).emit('queue:update', { serviceId });
    io.emit('queue:update', { serviceId });
  }
};

const createToken = async (req, res) => {
  try {
    const { serviceId } = req.body;

    if (!serviceId) {
      return res.status(400).json({ message: 'Service ID or identifier is required' });
    }

    const service = await findService(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (!service.isOpen) {
      return res.status(400).json({
        message: `${service.name} is currently closed. No new tokens can be generated right now.`
      });
    }

    const actualServiceId = service._id;
    const tokenNumber = await generateTokenNumber(service);

    const activeCount = await Token.countDocuments({
      service: actualServiceId,
      status: { $in: ['WAITING', 'SERVING'] }
    });

    const currentlyServing = await Token.findOne({
      service: actualServiceId,
      status: 'SERVING'
    });

    const tokenStatus = currentlyServing ? 'WAITING' : 'SERVING';

    const token = await Token.create({
      tokenNumber,
      service: actualServiceId,
      status: tokenStatus,
      position: activeCount + 1,
      servingAt: tokenStatus === 'SERVING' ? new Date() : null
    });

    const populated = await token.populate('service');

    const io = req.app.get('io');
    emitQueueUpdate(io, actualServiceId);

    res.status(201).json({
      token: populated,
      position: activeCount + 1,
      estimatedWait: currentlyServing ? (activeCount) * (service.averageServiceTime || 5) : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create token', error: error.message });
  }
};

const getToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id).populate('service');
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }
    res.json(token);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch token', error: error.message });
  }
};

const getQueueStatus = async (req, res) => {
  try {
    const service = await findService(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const actualServiceId = service._id;

    const servingToken = await Token.findOne({
      service: actualServiceId,
      status: 'SERVING'
    });

    const waitingTokens = await Token.find({
      service: actualServiceId,
      status: 'WAITING'
    }).sort({ createdAt: 1 });

    const completedToday = await Token.countDocuments({
      service: actualServiceId,
      status: 'COMPLETED',
      completedAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    res.json({
      service,
      serving: servingToken,
      waiting: waitingTokens,
      waitingCount: waitingTokens.length,
      completedToday
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch queue status', error: error.message });
  }
};

const getTokenStatus = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id).populate('service');
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    const serviceDoc = await Service.findById(token.service._id);

    const servingToken = await Token.findOne({
      service: token.service._id,
      status: 'SERVING'
    });

    const peopleAhead = await Token.countDocuments({
      service: token.service._id,
      status: 'SERVING',
      createdAt: { $lt: token.createdAt }
    }) + await Token.countDocuments({
      service: token.service._id,
      status: 'WAITING',
      createdAt: { $lt: token.createdAt }
    });

    const peopleBehind = await Token.countDocuments({
      service: token.service._id,
      status: 'WAITING',
      createdAt: { $gt: token.createdAt }
    });

    const avgTime = serviceDoc ? (serviceDoc.averageServiceTime || 5) : 5;

    let estimatedWait = 0;
    if (token.status === 'SERVING') {
      estimatedWait = 0;
    } else if (token.status === 'WAITING') {
      estimatedWait = peopleAhead * avgTime;
    }

    res.json({
      token: {
        _id: token._id,
        tokenNumber: token.tokenNumber,
        status: token.status,
        position: token.position,
        createdAt: token.createdAt,
        servingAt: token.servingAt,
        completedAt: token.completedAt
      },
      service: serviceDoc,
      serving: servingToken,
      peopleAhead,
      peopleBehind,
      estimatedWait,
      isServing: token.status === 'SERVING',
      isCompleted: token.status === 'COMPLETED',
      isCancelled: token.status === 'CANCELLED',
      status: token.status
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch token status', error: error.message });
  }
};

const completeToken = async (req, res) => {
  try {
    const service = await findService(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const actualServiceId = service._id;

    const currentToken = await Token.findOne({
      service: actualServiceId,
      status: 'SERVING'
    });

    if (!currentToken) {
      return res.status(400).json({ message: 'No token currently being served' });
    }

    // Prevent completing an already completed token (double-serving guard)
    currentToken.status = 'COMPLETED';
    currentToken.completedAt = new Date();
    await currentToken.save();

    const completedToken = currentToken;

    const nextToken = await Token.findOne({
      service: actualServiceId,
      status: 'WAITING'
    }).sort({ createdAt: 1 });

    let newServing = null;
    if (nextToken) {
      nextToken.status = 'SERVING';
      nextToken.servingAt = new Date();
      await nextToken.save();
      newServing = nextToken;
    }

    const io = req.app.get('io');
    emitQueueUpdate(io, actualServiceId);

    if (newServing) {
      io.emit('token:serving', {
        serviceId: actualServiceId,
        tokenId: newServing._id,
        tokenNumber: newServing.tokenNumber
      });
    }

    io.emit('token:completed', {
      serviceId: actualServiceId,
      tokenId: completedToken._id,
      tokenNumber: completedToken.tokenNumber
    });

    res.json({
      completed: completedToken,
      newServing,
      message: newServing
        ? `Token ${completedToken.tokenNumber} completed. ${newServing.tokenNumber} is now being served.`
        : `Token ${completedToken.tokenNumber} completed. No more tokens in queue.`
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete token', error: error.message });
  }
};

const cancelToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    if (token.status === 'COMPLETED' || token.status === 'CANCELLED') {
      return res.status(400).json({
        message: `Token has already been ${token.status.toLowerCase()} and cannot be cancelled.`
      });
    }

    if (token.status === 'SERVING') {
      return res.status(400).json({ message: 'Token is currently being served and cannot be cancelled.' });
    }

    token.status = 'CANCELLED';
    token.position = 0;
    await token.save();

    const io = req.app.get('io');
    emitQueueUpdate(io, token.service);

    res.json({ message: 'Token cancelled successfully', token });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel token', error: error.message });
  }
};

// Analytics for a service dashboard
const getAnalytics = async (req, res) => {
  try {
    const service = await findService(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const actualServiceId = service._id;
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));

    const tokensServed = await Token.countDocuments({
      service: actualServiceId,
      status: 'COMPLETED',
      completedAt: { $gte: startOfDay }
    });

    const currentlyWaiting = await Token.countDocuments({
      service: actualServiceId,
      status: 'WAITING'
    });

    const currentlyServing = await Token.findOne({
      service: actualServiceId,
      status: 'SERVING'
    });

    let averageWait = 0;
    if (tokensServed > 0) {
      const completedTokens = await Token.find({
        service: actualServiceId,
        status: 'COMPLETED',
        completedAt: { $gte: startOfDay }
      });
      const waitTimes = completedTokens
        .filter((t) => t.servingAt && t.createdAt)
        .map((t) => (t.servingAt.getTime() - t.createdAt.getTime()) / 60000);
      if (waitTimes.length > 0) {
        averageWait = Math.round((waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) * 10) / 10;
      }
    }

    let averageService = 0;
    if (tokensServed > 0) {
      const completedTokens = await Token.find({
        service: actualServiceId,
        status: 'COMPLETED',
        completedAt: { $gte: startOfDay }
      });
      const serviceTimes = completedTokens
        .filter((t) => t.completedAt && t.servingAt)
        .map((t) => (t.completedAt.getTime() - t.servingAt.getTime()) / 60000);
      if (serviceTimes.length > 0) {
        averageService = Math.round((serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length) * 10) / 10;
      }
    }

    res.json({
      service,
      tokensServed,
      currentlyWaiting,
      currentlyServing: currentlyServing ? currentlyServing.tokenNumber : null,
      averageWait,
      averageService
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};

module.exports = {
  createToken,
  getToken,
  getQueueStatus,
  getTokenStatus,
  completeToken,
  cancelToken,
  getAnalytics
};
