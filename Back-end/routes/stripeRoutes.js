const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, requireAuth } = require('../middlewares/authMiddleware');

let stripe = null;
try {
  stripe = require('stripe');
} catch (e) {
  console.warn('⚠️ Stripe module not installed. Running in simulator-ready mode.');
}

const getStripeInstance = () => {
  if (stripe && process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'YOUR_STRIPE_SECRET_KEY_HERE') {
    return stripe(process.env.STRIPE_SECRET_KEY);
  }
  return null;
};

// ─── Create Checkout Session ──────────────────────────────────────────────────
router.post('/stripe/checkout', authenticate, requireAuth, async (req, res) => {
  try {
    const stripeInstance = getStripeInstance();
    const user = await User.findById(req.user._id);

    if (stripeInstance) {
      console.log(`[Stripe] Creating real checkout session for: ${user.email}`);
      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: process.env.STRIPE_PRICE_ID || 'price_123',
          quantity: 1
        }],
        mode: 'subscription',
        success_url: `http://localhost:5173/?upgrade=success`,
        cancel_url: `http://localhost:5173/?upgrade=cancel`,
        customer_email: user.email,
        metadata: { userId: String(user._id) }
      });
      return res.json({ success: true, url: session.url });
    } else {
      // Mock Sandbox upgrade URL simulation
      console.log(`[Stripe Simulator] Generating mock checkout redirection for: ${user.email}`);
      const mockSuccessUrl = `http://localhost:3000/stripe/mock-success?userId=${user._id}`;
      return res.json({ success: true, url: mockSuccessUrl });
    }
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: 'Failed to create subscription checkout. ' + err.message });
  }
});

// ─── Sandbox Mode Mock Success Redirect ───────────────────────────────────────
router.get('/stripe/mock-success', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).send('User ID required');

    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    user.subscriptionTier = 'pro';
    user.stripeSubscriptionId = `mock_sub_${Date.now()}`;
    user.aiRequestCount = 0; // Reset count
    await user.save();

    console.log(`[Stripe Simulator] Upgraded user ${user.email} to PRO tier successfully`);
    // Redirect back to frontend dashboard with success banner flag
    res.redirect('http://localhost:5173/?upgrade=success');
  } catch (err) {
    res.status(500).send('Simulation error: ' + err.message);
  }
});

// ─── Downgrade to Free Tier (Simulate cancellation) ──────────────────────────
router.post('/stripe/cancel-subscription', authenticate, requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.subscriptionTier = 'free';
    user.aiRequestCount = 0; // Reset usage
    user.stripeSubscriptionId = '';
    await user.save();

    console.log(`[Subscription] Cancelled premium status for user ${user.email}`);
    res.json({ success: true, message: 'Subscription cancelled successfully.', tier: 'free' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Webhook Listener ─────────────────────────────────────────────────────────
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripeInstance = getStripeInstance();
  if (!stripeInstance) {
    // Simulator dummy response
    return res.status(200).json({ received: true, mock: true });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature validation failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const subscriptionId = session.subscription;
      const customerId = session.customer;

      if (userId) {
        await User.findByIdAndUpdate(userId, {
          subscriptionTier: 'pro',
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          aiRequestCount: 0 // Reset usage limits
        });
        console.log(`[Webhook] User ${userId} upgraded to PRO tier via Stripe`);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const user = await User.findOne({ stripeSubscriptionId: subscription.id });
      if (user) {
        user.subscriptionTier = 'free';
        user.stripeSubscriptionId = '';
        await user.save();
        console.log(`[Webhook] User ${user._id} downgraded to FREE tier via Stripe`);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    res.status(500).send('Webhook processor failed');
  }
});

module.exports = router;
