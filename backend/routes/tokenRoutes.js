const express = require('express');
const router = express.Router();
const {
  createToken,
  getToken,
  getQueueStatus,
  getTokenStatus,
  completeToken
} = require('../controllers/tokenController');

router.post('/', createToken);
router.get('/:id', getToken);
router.get('/:id/status', getTokenStatus);
router.get('/queue/:serviceId', getQueueStatus);
router.post('/queue/:serviceId/complete', completeToken);

module.exports = router;
