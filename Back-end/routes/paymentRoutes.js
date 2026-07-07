/**
 * paymentRoutes.js — Unified Payment Gateway Router
 *
 * Automatically selects Razorpay (India) or Stripe (International) based on
 * the user's country, using gateway credentials stored in MongoDB (admin-managed).
 *
 * Routes:
 *   GET  /packages                        — Public: list packages
 *   POST /payment/coupon/validate          — Validate coupon code
 *   POST /payment/create-order             — Create order for Razorpay or Stripe
 *   POST /payment/verify                   — Verify Razorpay payment signature
 *   POST /payment/webhook/:gateway         — Webhook for subscription lifecycle events
 *   POST /payment/cancel                   — Cancel/downgrade subscription
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const Package = require('../models/Package');
const Coupon = require('../models/Coupon');
const { getPublicPackages } = require('../controllers/packageController');
const { validateCoupon } = require('../controllers/couponController');
const { getGatewayForCountry } = require('../controllers/paymentConfigController');
const { authenticate, requireAuth } = require('../middlewares/authMiddleware');
const { detectCountry } = require('../middlewares/countryMiddleware');

// ─── Optional SDK lazy-loaders ─────────────────────────────────────────────────
let Razorpay = null;
try { Razorpay = require('razorpay'); } catch (_) {
  console.warn('⚠️  razorpay npm package not installed. Razorpay live payments unavailable.');
}

const getStripe = (secretKey) => {
  try { return require('stripe')(secretKey); } catch (_) { return null; }
};

// ─── Public Packages Route ──────────────────────────────────────────────────
router.get('/packages', getPublicPackages);

// ─── Validate Coupon Route ──────────────────────────────────────────────────
router.post('/payment/coupon/validate', authenticate, validateCoupon);

// ─── Create Order (Razorpay or Stripe, selected by country) ─────────────────
router.post('/payment/create-order', authenticate, requireAuth, detectCountry, async (req, res) => {
  try {
    const { currency, packageId, couponCode } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Resolve gateway for user's country
    let gatewayConfig;
    try {
      gatewayConfig = await getGatewayForCountry(req.userCountry);
    } catch (err) {
      // If no gateway is configured in DB, fall back to Razorpay env vars (legacy)
      console.warn('[Payment] No DB gateway config found, using .env fallback:', err.message);
      gatewayConfig = null;
    }

    // Determine pricing
    const selectedCurrency = currency === 'USD' ? 'USD' : 'INR';
    let basePrice = selectedCurrency === 'USD' ? 12 : 999;

    if (packageId) {
      const pkg = await Package.findById(packageId);
      if (pkg && pkg.isActive) {
        basePrice = selectedCurrency === 'USD' ? pkg.priceUSD : pkg.priceINR;
      }
    }

    // Process coupon
    let discountAmount = 0;
    let validCoupon = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
      if (!coupon) return res.status(400).json({ error: 'Invalid coupon code.' });
      const check = coupon.isValidForUser(user._id);
      if (!check.valid) return res.status(400).json({ error: check.reason });
      validCoupon = coupon;
      discountAmount = coupon.discountType === 'percentage'
        ? (basePrice * coupon.discountValue) / 100
        : coupon.discountValue;
      discountAmount = Math.min(Math.round(discountAmount * 100) / 100, basePrice);
    }

    const finalPrice = Math.max(0, Math.round((basePrice - discountAmount) * 100) / 100);
    const amountInSubunits = Math.round(finalPrice * 100);
    const receipt = `rc_rec_${Date.now()}`;

    // ── STRIPE path ──────────────────────────────────────────────────────────
    const useStripe = gatewayConfig && gatewayConfig.gateway === 'stripe';
    if (useStripe) {
      const { credentials, isLive } = gatewayConfig;
      const stripe = getStripe(credentials.keySecret);

      if (stripe && amountInSubunits > 0) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'subscription',
          line_items: [{
            price: credentials.priceId || process.env.STRIPE_PRICE_ID,
            quantity: 1,
          }],
          success_url: `${frontendUrl}/?upgrade=success`,
          cancel_url: `${frontendUrl}/?upgrade=cancel`,
          customer_email: user.email,
          metadata: { userId: String(user._id), couponCode: validCoupon?.code || '' },
        });
        return res.json({
          success: true,
          gateway: 'stripe',
          sessionUrl: session.url,
          isMock: false,
          discountAmount,
          originalPrice: basePrice,
          finalPrice,
        });
      } else {
        // Stripe simulator
        console.log(`[Stripe Simulator] Mock session for ${user.email}`);
        return res.json({
          success: true,
          gateway: 'stripe',
          sessionUrl: `http://localhost:3000/stripe/mock-success?userId=${user._id}`,
          isMock: true,
          discountAmount,
          originalPrice: basePrice,
          finalPrice,
        });
      }
    }

    // ── RAZORPAY path (default) ──────────────────────────────────────────────
    const rzpKeyId = gatewayConfig?.credentials?.keyId || process.env.RAZORPAY_KEY_ID;
    const rzpKeySecret = gatewayConfig?.credentials?.keySecret || process.env.RAZORPAY_KEY_SECRET;
    const rzp = Razorpay && rzpKeyId && rzpKeySecret
      ? new Razorpay({ key_id: rzpKeyId, key_secret: rzpKeySecret })
      : null;

    if (rzp && amountInSubunits > 0) {
      console.log(`[Razorpay] Creating order for ${user.email} (${amountInSubunits} ${selectedCurrency})`);
      const order = await rzp.orders.create({
        amount: amountInSubunits,
        currency: selectedCurrency,
        receipt,
        payment_capture: 1,
      });
      return res.json({
        success: true,
        gateway: 'razorpay',
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: rzpKeyId,
        isMock: false,
        couponCode: validCoupon?.code || null,
        discountAmount,
        originalPrice: basePrice,
        finalPrice,
      });
    } else {
      // Razorpay simulator
      console.log(`[Razorpay Simulator] Mock order for ${user.email} (${amountInSubunits} ${selectedCurrency})`);
      return res.json({
        success: true,
        gateway: 'razorpay',
        orderId: `order_mock_${Date.now()}`,
        amount: amountInSubunits,
        currency: selectedCurrency,
        key: 'rzp_test_mock_key',
        isMock: true,
        couponCode: validCoupon?.code || null,
        discountAmount,
        originalPrice: basePrice,
        finalPrice,
      });
    }
  } catch (err) {
    console.error('Payment order creation error:', err.message);
    res.status(500).json({ error: 'Failed to create payment order. ' + err.message });
  }
});

// ─── Verify Razorpay Payment Signature ──────────────────────────────────────
router.post('/payment/verify', authenticate, requireAuth, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, couponCode } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const recordCoupon = async (orderId) => {
      if (!couponCode) return;
      const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
      if (coupon && coupon.usedCount < coupon.maxUses) {
        coupon.usedCount += 1;
        coupon.usedBy.push({ user: user._id, usedAt: new Date(), orderId: orderId || '' });
        await coupon.save();
      }
    };

    // Mock path — only trust server-side order ID prefix, never the client flag
    const isMockOrder = razorpay_order_id?.startsWith('order_mock_');
    if (isMockOrder) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(400).json({ error: 'Mock payments are not allowed in production.' });
      }
      user.subscriptionTier = 'pro';
      user.razorpaySubscriptionId = `rzp_sub_mock_${Date.now()}`;
      user.aiRequestCount = 0;
      await user.save();
      await recordCoupon(razorpay_order_id);
      return res.json({ success: true, message: 'Payment simulated! Pro tier active.' });
    }

    // Real HMAC verification — use DB credentials or .env fallback
    let secret = process.env.RAZORPAY_KEY_SECRET;
    try {
      const cfg = await getGatewayForCountry('IN');
      if (cfg.gateway === 'razorpay' && cfg.credentials.keySecret) {
        secret = cfg.credentials.keySecret;
      }
    } catch (_) { /* use .env fallback */ }

    if (!secret) {
      return res.status(500).json({ error: 'Razorpay secret key not configured.' });
    }

    const expected = crypto.createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected === razorpay_signature) {
      user.subscriptionTier = 'pro';
      user.razorpaySubscriptionId = `rzp_sub_${Date.now()}`;
      user.aiRequestCount = 0;
      await user.save();
      await recordCoupon(razorpay_order_id);
      console.log(`[Razorpay] Payment verified for ${user.email}`);
      res.json({ success: true, message: 'Payment verified. Pro subscription activated!' });
    } else {
      res.status(400).json({ error: 'Payment signature verification failed.' });
    }
  } catch (err) {
    console.error('Verify error:', err.message);
    res.status(500).json({ error: 'Verification failed. ' + err.message });
  }
});

// ─── Webhook: Razorpay subscription lifecycle events ────────────────────────
router.post('/payment/webhook/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Fetch Razorpay webhook secret from DB config or .env
    let webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    try {
      const cfg = await getGatewayForCountry('IN');
      if (cfg.gateway === 'razorpay' && cfg.credentials.webhookSecret) {
        webhookSecret = cfg.credentials.webhookSecret;
      }
    } catch (_) { /* use .env fallback */ }

    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'];
      const expectedSig = crypto.createHmac('sha256', webhookSecret)
        .update(req.body)
        .digest('hex');
      if (signature !== expectedSig) {
        return res.status(400).json({ error: 'Webhook signature invalid.' });
      }
    }

    const event = JSON.parse(req.body.toString());
    const eventType = event.event;
    console.log(`[Razorpay Webhook] ${eventType}`);

    if (eventType === 'subscription.activated' || eventType === 'payment.captured') {
      const subscriptionId = event.payload?.subscription?.entity?.id;
      const customerId = event.payload?.payment?.entity?.contact;
      if (subscriptionId) {
        await User.findOneAndUpdate(
          { razorpaySubscriptionId: subscriptionId },
          { subscriptionTier: 'pro' }
        );
      }
    }

    if (eventType === 'subscription.cancelled' || eventType === 'subscription.completed') {
      const subscriptionId = event.payload?.subscription?.entity?.id;
      if (subscriptionId) {
        await User.findOneAndUpdate(
          { razorpaySubscriptionId: subscriptionId },
          { subscriptionTier: 'free', razorpaySubscriptionId: '' }
        );
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Razorpay Webhook] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Webhook: Stripe subscription lifecycle events ───────────────────────────
router.post('/payment/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    let webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    try {
      const cfg = await getGatewayForCountry('US');
      if (cfg.gateway === 'stripe') {
        if (cfg.credentials.webhookSecret) webhookSecret = cfg.credentials.webhookSecret;
        if (cfg.credentials.keySecret) stripeSecretKey = cfg.credentials.keySecret;
      }
    } catch (_) { /* use .env fallback */ }

    if (!stripeSecretKey) return res.status(200).json({ received: true, mock: true });

    const stripe = getStripe(stripeSecretKey);
    if (!stripe) return res.status(200).json({ received: true, mock: true });

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], webhookSecret);
    } catch (err) {
      return res.status(400).send(`Stripe webhook error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          subscriptionTier: 'pro',
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
        });
        console.log(`[Stripe Webhook] Pro activated for userId: ${userId}`);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      await User.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        { subscriptionTier: 'free', stripeSubscriptionId: '' }
      );
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Cancel Subscription / Downgrade ────────────────────────────────────────
router.post('/payment/cancel', authenticate, requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.subscriptionTier = 'free';
    user.razorpaySubscriptionId = '';
    user.stripeSubscriptionId = '';
    user.aiRequestCount = 0;
    await user.save();

    console.log(`[Subscription] Cancelled Pro for ${user.email}`);
    res.json({ success: true, message: 'Subscription cancelled.', tier: 'free' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
