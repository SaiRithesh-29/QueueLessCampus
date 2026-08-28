const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  toggleServiceStatus
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getServices);
router.get('/:id', getServiceById);
router.post('/:id/toggle', protect, authorize('staff', 'admin'), toggleServiceStatus);

module.exports = router;
