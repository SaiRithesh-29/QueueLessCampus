const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 3
  },
  description: {
    type: String,
    default: ''
  },
  averageServiceTime: {
    type: Number,
    default: 5,
    min: 1
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
