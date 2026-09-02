const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  tokenNumber: {
    type: String,
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['WAITING', 'SERVING', 'COMPLETED', 'CANCELLED', 'REJECTED'],
    default: 'WAITING'
  },
  position: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  servingAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

tokenSchema.index({ service: 1, status: 1 });
tokenSchema.index({ service: 1, tokenNumber: 1 });

module.exports = mongoose.model('Token', tokenSchema);
