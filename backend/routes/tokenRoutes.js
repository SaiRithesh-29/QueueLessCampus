const express = require('express');
const router = express.Router();
const {
  createToken,
  getToken,
  getQueueStatus,
  getTokenStatus,
  completeToken,
  cancelToken,
  getAnalytics
} = require('../controllers/tokenController');
const { protect, authorize } = require('../middleware/auth');

// Public routes - view queue status, token status
router.get('/queue/:serviceId', getQueueStatus);
router.get('/analytics/:serviceId', getAnalytics);
router.get('/:id/status', getTokenStatus);
router.get('/:id', getToken);

// Protected routes - require authentication
router.post('/', protect, createToken);
router.post('/:id/cancel', protect, cancelToken);

// Staff-only routes
router.post('/queue/:serviceId/complete', protect, authorize('staff', 'admin'), completeToken);

module.exports = router;
