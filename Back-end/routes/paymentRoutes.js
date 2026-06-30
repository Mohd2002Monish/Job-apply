const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
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

// ─── Create Razorpay Order ──────────────────────────────────────────────────
router.post('/payment/razorpay/create-order', authenticate, requireAuth, async (req, res) => {
  try {
    const { currency } = req.body; // 'INR' or 'USD'
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const selectedCurrency = currency === 'USD' ? 'USD' : 'INR';
    // India pricing: 999 INR (99900 paise). International: 12 USD (1200 cents).
    const amount = selectedCurrency === 'USD' ? 1200 : 99900; 

    const rzp = getRazorpayInstance();
    const receipt = `rc_rec_${Date.now()}`;

    if (rzp) {
      console.log(`[Razorpay] Creating real order for ${user.email} (${amount} ${selectedCurrency})`);
      const options = {
        amount,
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
        isMock: false
      });
    } else {
      // Razorpay Simulator Mode
      console.log(`[Razorpay Simulator] Creating mock order for ${user.email} (${amount} ${selectedCurrency})`);
      const mockOrderId = `order_mock_${Date.now()}`;
      return res.json({
        success: true,
        orderId: mockOrderId,
        amount,
        currency: selectedCurrency,
        key: 'rzp_test_mock_key',
        isMock: true
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
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, isMock } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (isMock || (razorpay_order_id && razorpay_order_id.startsWith('order_mock_'))) {
      console.log(`[Razorpay Simulator] Simulating success verification for user: ${user.email}`);
      user.subscriptionTier = 'pro';
      user.stripeSubscriptionId = `rzp_sub_mock_${Date.now()}`; // Re-use sub id slot for tier status check
      user.aiRequestCount = 0; // Reset limits
      await user.save();

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
