const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  priceINR: { type: Number, required: true, min: 0 },
  priceUSD: { type: Number, required: true, min: 0 },
  duration: {
    type: String,
    enum: ['monthly', 'yearly', 'one-time'],
    default: 'monthly'
  },
  features: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false }
}, { timestamps: true });

const Package = mongoose.model('Package', packageSchema);
module.exports = Package;
