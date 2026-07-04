const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  maxUses: {
    type: Number,
    required: true,
    default: 100,
    min: 1
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxUsesPerUser: {
    type: Number,
    default: 1,
    min: 1
  },
  expiresAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date, default: Date.now },
    orderId: { type: String, default: '' }
  }]
}, { timestamps: true });

// Helper instance method to check if coupon is valid
couponSchema.methods.isValidForUser = function(userId) {
  if (!this.isActive) return { valid: false, reason: 'Coupon is inactive.' };
  if (this.expiresAt && new Date() > new Date(this.expiresAt)) {
    return { valid: false, reason: 'Coupon has expired.' };
  }
  if (this.usedCount >= this.maxUses) {
    return { valid: false, reason: 'Coupon usage limit has been reached.' };
  }
  if (userId) {
    const userUsageCount = this.usedBy.filter(item => item.user && item.user.toString() === userId.toString()).length;
    if (userUsageCount >= this.maxUsesPerUser) {
      return { valid: false, reason: 'You have already used this coupon maximum allowed times.' };
    }
  }
  return { valid: true };
};

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
