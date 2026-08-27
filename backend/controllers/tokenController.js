const Token = require('../models/Token');
const Service = require('../models/Service');

const generateTokenNumber = async (service) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastToken = await Token.findOne({
    service: service._id,
    createdAt: { $gte: today }
  }).sort({ createdAt: -1 });

  let nextNum = 1;
  if (lastToken) {
    const lastNum = parseInt(lastToken.tokenNumber.split('-')[1], 10);
    nextNum = lastNum + 1;
  }

  return `${service.code}-${String(nextNum).padStart(3, '0')}`;
};

const createToken = async (req, res) => {
  try {
    const { serviceId } = req.body;

    if (!serviceId) {
      return res.status(400).json({ message: 'Service ID is required' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const tokenNumber = await generateTokenNumber(service);

    const activeCount = await Token.countDocuments({
      service: serviceId,
      status: { $in: ['WAITING', 'SERVING'] }
    });

    const currentlyServing = await Token.findOne({
      service: serviceId,
      status: 'SERVING'
    });

    const tokenStatus = currentlyServing ? 'WAITING' : 'SERVING';

    const token = await Token.create({
      tokenNumber,
      service: serviceId,
      status: tokenStatus,
      position: activeCount + 1,
      servingAt: tokenStatus === 'SERVING' ? new Date() : null
    });

    const populated = await token.populate('service');

    const io = req.app.get('io');
    if (io) {
      io.emit('queue:update', { serviceId });
    }

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
    const service = await Service.findById(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const servingToken = await Token.findOne({
      service: req.params.serviceId,
      status: 'SERVING'
    });

    const waitingTokens = await Token.find({
      service: req.params.serviceId,
      status: 'WAITING'
    }).sort({ createdAt: 1 });

    const completedToday = await Token.countDocuments({
      service: req.params.serviceId,
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

    const avgTime = serviceDoc.averageServiceTime || 5;

    let estimatedWait = 0;
    if (token.status === 'SERVING') {
      estimatedWait = 0;
    } else if (token.status === 'WAITING') {
      estimatedWait = peopleAhead * avgTime;
    }

    res.json({
      token,
      serving: servingToken,
      peopleAhead,
      estimatedWait,
      isServing: token.status === 'SERVING',
      isCompleted: token.status === 'COMPLETED'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch token status', error: error.message });
  }
};

const completeToken = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const currentToken = await Token.findOne({
      service: serviceId,
      status: 'SERVING'
    });

    if (!currentToken) {
      return res.status(400).json({ message: 'No token currently being served' });
    }

    currentToken.status = 'COMPLETED';
    currentToken.completedAt = new Date();
    await currentToken.save();

    const nextToken = await Token.findOne({
      service: serviceId,
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
    if (io) {
      io.emit('queue:update', { serviceId });
      if (newServing) {
        io.emit('token:serving', { tokenId: newServing._id, tokenNumber: newServing.tokenNumber });
      }
    }

    res.json({
      completed: currentToken,
      newServing,
      message: newServing
        ? `Token ${currentToken.tokenNumber} completed. ${newServing.tokenNumber} is now being served.`
        : `Token ${currentToken.tokenNumber} completed. No more tokens in queue.`
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete token', error: error.message });
  }
};

module.exports = {
  createToken,
  getToken,
  getQueueStatus,
  getTokenStatus,
  completeToken
};
