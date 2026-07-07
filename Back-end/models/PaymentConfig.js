const mongoose = require('mongoose');

const paymentConfigSchema = new mongoose.Schema({
  gateway: {
    type: String,
    enum: ['razorpay', 'stripe'],
    required: true,
    unique: true,
  },
  displayName: { type: String, default: '' },
  isEnabled: { type: Boolean, default: false },
  isLive: { type: Boolean, default: false },         // false = sandbox/test mode
  isDefault: { type: Boolean, default: false },       // used when no country match
  countries: [{ type: String, uppercase: true, trim: true }], // ISO 3166-1 alpha-2
  supportedCurrencies: [{ type: String, uppercase: true, trim: true }],

  // All credential values are stored AES-256-GCM encrypted.
  // Never query or return these in plain text — use encryptionService.decrypt().
  credentials: {
    keyId:         { type: String, default: '' }, // Razorpay key_id / Stripe publishable key
    keySecret:     { type: String, default: '' }, // Razorpay key_secret / Stripe secret key
    webhookSecret: { type: String, default: '' }, // Webhook signing secret
    planIdINR:     { type: String, default: '' }, // Razorpay subscription plan (INR)
    planIdUSD:     { type: String, default: '' }, // Razorpay subscription plan (USD)
    priceId:       { type: String, default: '' }, // Stripe price ID for subscription
  },

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

// Only one gateway can be the default
paymentConfigSchema.pre('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

const PaymentConfig = mongoose.model('PaymentConfig', paymentConfigSchema);
module.exports = PaymentConfig;
