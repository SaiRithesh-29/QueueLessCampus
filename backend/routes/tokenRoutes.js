const express = require('express');
const router = express.Router();
const {
  createToken,
  getToken,
  getQueueStatus,
  getTokenStatus,
  completeToken,
  rejectToken,
  cancelToken,
  holdService,
  getAnalytics,
  getAllAnalytics
} = require('../controllers/tokenController');
const { protect, authorize } = require('../middleware/auth');

// Public routes - view queue status, token status
router.get('/queue/:serviceId', getQueueStatus);
router.get('/analytics/all', getAllAnalytics);
router.get('/analytics/:serviceId', getAnalytics);
router.get('/:id/status', getTokenStatus);
router.get('/:id', getToken);

// Protected routes - require authentication
router.post('/', protect, createToken);
router.post('/:id/cancel', protect, cancelToken);

// Staff-only routes
router.post('/queue/:serviceId/complete', protect, authorize('staff', 'admin'), completeToken);
router.post('/queue/:serviceId/reject', protect, authorize('staff', 'admin'), rejectToken);
router.post('/queue/:serviceId/hold', protect, authorize('staff', 'admin'), holdService);

module.exports = router;
