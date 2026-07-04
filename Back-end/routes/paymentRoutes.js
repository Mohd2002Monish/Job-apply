const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const Package = require('../models/Package');
const Coupon = require('../models/Coupon');
const { getPublicPackages } = require('../controllers/packageController');
const { validateCoupon } = require('../controllers/couponController');
const { authenticate, requireAuth } = require('../middlewares/authMiddleware');

let Razorpay = null;
try {
  Razorpay = require('razorpay');
} catch (e) {
  console.warn('⚠️ Razorpay module not installed. Running in simulator-ready mode.');
}

const getRazorpayInstance = () => {
  if (Razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return null;
};

// ─── Public Packages Route ──────────────────────────────────────────────────
router.get('/packages', getPublicPackages);

// ─── Validate Coupon Route ──────────────────────────────────────────────────
router.post('/payment/coupon/validate', authenticate, validateCoupon);

// ─── Create Razorpay Order ──────────────────────────────────────────────────
router.post('/payment/razorpay/create-order', authenticate, requireAuth, async (req, res) => {
  try {
    const { currency, packageId, couponCode } = req.body; // 'INR' or 'USD'
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const selectedCurrency = currency === 'USD' ? 'USD' : 'INR';

    // Determine package pricing
    let basePrice = selectedCurrency === 'USD' ? 12 : 999;
    let selectedPackage = null;

    if (packageId) {
      selectedPackage = await Package.findById(packageId);
      if (selectedPackage && selectedPackage.isActive) {
        basePrice = selectedCurrency === 'USD' ? selectedPackage.priceUSD : selectedPackage.priceINR;
      }
    }

    // Process coupon discount if provided
    let discountAmount = 0;
    let validCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
      if (coupon) {
        const check = coupon.isValidForUser(user._id);
        if (!check.valid) {
          return res.status(400).json({ error: check.reason });
        }
        validCoupon = coupon;
        if (coupon.discountType === 'percentage') {
          discountAmount = (basePrice * coupon.discountValue) / 100;
        } else {
          discountAmount = coupon.discountValue;
        }
        discountAmount = Math.min(discountAmount, basePrice);
        discountAmount = Math.round(discountAmount * 100) / 100;
      } else {
        return res.status(400).json({ error: 'Invalid coupon code.' });
      }
    }

    const finalPayablePrice = Math.max(0, Math.round((basePrice - discountAmount) * 100) / 100);
    // Convert to smallest currency unit (paise for INR, cents for USD)
    const amountInSubunits = Math.round(finalPayablePrice * 100);

    const rzp = getRazorpayInstance();
    const receipt = `rc_rec_${Date.now()}`;

    if (rzp && amountInSubunits > 0) {
      console.log(`[Razorpay] Creating real order for ${user.email} (${amountInSubunits} ${selectedCurrency} sub-units)`);
      const options = {
        amount: amountInSubunits,
        currency: selectedCurrency,
        receipt,
        payment_capture: 1
      };
      
      const order = await rzp.orders.create(options);
      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        isMock: false,
        couponCode: validCoupon ? validCoupon.code : null,
        discountAmount,
        originalPrice: basePrice,
        finalPrice: finalPayablePrice
      });
    } else {
      // Razorpay Simulator Mode (or 100% discount free order)
      console.log(`[Razorpay Simulator] Creating mock order for ${user.email} (${amountInSubunits} ${selectedCurrency} sub-units)`);
      const mockOrderId = `order_mock_${Date.now()}`;
      return res.json({
        success: true,
        orderId: mockOrderId,
        amount: amountInSubunits,
        currency: selectedCurrency,
        key: 'rzp_test_mock_key',
        isMock: true,
        couponCode: validCoupon ? validCoupon.code : null,
        discountAmount,
        originalPrice: basePrice,
        finalPrice: finalPayablePrice
      });
    }
  } catch (err) {
    console.error('Razorpay order creation error:', err.message);
    res.status(500).json({ error: 'Failed to create payment order. ' + err.message });
  }
});

// ─── Verify Payment Signature ───────────────────────────────────────────────
router.post('/payment/razorpay/verify', authenticate, requireAuth, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, isMock, couponCode } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const applyCouponRecord = async (orderId) => {
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
        if (coupon && coupon.usedCount < coupon.maxUses) {
          coupon.usedCount += 1;
          coupon.usedBy.push({
            user: user._id,
            usedAt: new Date(),
            orderId: orderId || ''
          });
          await coupon.save();
          console.log(`[Coupon] Incremented usage for ${coupon.code}. Used: ${coupon.usedCount}/${coupon.maxUses}`);
        }
      }
    };

    if (isMock || (razorpay_order_id && razorpay_order_id.startsWith('order_mock_'))) {
      console.log(`[Razorpay Simulator] Simulating success verification for user: ${user.email}`);
      user.subscriptionTier = 'pro';
      user.stripeSubscriptionId = `rzp_sub_mock_${Date.now()}`;
      user.aiRequestCount = 0;
      await user.save();

      await applyCouponRecord(razorpay_order_id);

      return res.json({ success: true, message: 'Payment successfully simulated! Pro tier active.' });
    }

    // Real signature validation
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Razorpay secret key not configured on server.' });
    }

    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      user.subscriptionTier = 'pro';
      user.stripeSubscriptionId = `rzp_sub_real_${Date.now()}`;
      user.aiRequestCount = 0;
      await user.save();

      await applyCouponRecord(razorpay_order_id);

      console.log(`[Razorpay] Verified real payment for user: ${user.email}`);
      res.json({ success: true, message: 'Payment verified and Pro subscription activated!' });
    } else {
      res.status(400).json({ error: 'Invalid payment signature verification failed.' });
    }
  } catch (err) {
    console.error('Razorpay verification error:', err.message);
    res.status(500).json({ error: 'Verification failed. ' + err.message });
  }
});

// ─── Cancel Subscription / Downgrade ────────────────────────────────────────
router.post('/payment/razorpay/cancel', authenticate, requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.subscriptionTier = 'free';
    user.stripeSubscriptionId = '';
    user.aiRequestCount = 0;
    await user.save();

    console.log(`[Subscription] Cancelled Pro subscription for user: ${user.email}`);
    res.json({ success: true, message: 'Subscription cancelled successfully.', tier: 'free' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
