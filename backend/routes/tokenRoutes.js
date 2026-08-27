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

router.post('/', createToken);
router.get('/:id', getToken);
router.get('/:id/status', getTokenStatus);
router.post('/:id/cancel', cancelToken);
router.get('/queue/:serviceId', getQueueStatus);
router.post('/queue/:serviceId/complete', completeToken);
router.get('/analytics/:serviceId', getAnalytics);

module.exports = router;
