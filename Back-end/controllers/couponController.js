const Coupon = require('../models/Coupon');
const Package = require('../models/Package');

// Validate coupon for user during checkout
const validateCoupon = async (req, res) => {
  try {
    const { code, packageId, currency } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code is required.' });

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid coupon code.' });
    }

    const userId = req.user ? req.user._id : null;
    const check = coupon.isValidForUser(userId);
    if (!check.valid) {
      return res.status(400).json({ error: check.reason });
    }

    let originalPrice = currency === 'USD' ? 12 : 999;
    if (packageId) {
      const pkg = await Package.findById(packageId);
      if (pkg) {
        originalPrice = currency === 'USD' ? pkg.priceUSD : pkg.priceINR;
      }
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (originalPrice * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, originalPrice);
    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalPrice = Math.max(0, Math.round((originalPrice - discountAmount) * 100) / 100);

    res.json({
      success: true,
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxUses: coupon.maxUses,
        usedCount: coupon.usedCount,
        remainingUses: coupon.maxUses - coupon.usedCount
      },
      originalPrice,
      discountAmount,
      finalPrice,
      currency: currency === 'USD' ? 'USD' : 'INR'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to validate coupon: ' + err.message });
  }
};

// Admin: Get all coupons
const getAdminCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupons: ' + err.message });
  }
};

// Admin: Create new coupon
const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, maxUses, maxUsesPerUser, expiresAt } = req.body;
    if (!code || discountValue === undefined) {
      return res.status(400).json({ error: 'Coupon code and discountValue are required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ error: `Coupon code '${cleanCode}' already exists.` });
    }

    const newCoupon = new Coupon({
      code: cleanCode,
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      maxUses: maxUses ? Number(maxUses) : 100,
      maxUsesPerUser: maxUsesPerUser ? Number(maxUsesPerUser) : 1,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true
    });

    await newCoupon.save();
    res.status(201).json({ success: true, coupon: newCoupon, message: 'Coupon created successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create coupon: ' + err.message });
  }
};

// Admin: Toggle active state of coupon
const toggleCouponActive = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });

    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({ success: true, coupon, message: `Coupon is now ${coupon.isActive ? 'active' : 'inactive'}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update coupon: ' + err.message });
  }
};

// Admin: Delete coupon
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await Coupon.findByIdAndDelete(id);
    res.json({ success: true, message: 'Coupon deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete coupon: ' + err.message });
  }
};

module.exports = {
  validateCoupon,
  getAdminCoupons,
  createCoupon,
  toggleCouponActive,
  deleteCoupon
};
