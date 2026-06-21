const Job = require('../models/Job');
const User = require('../models/User');

/**
 * Middleware to enforce Free Tier limits on creating jobs and using AI features.
 */
const checkLimits = (type) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Pro tier has unlimited access to all features
    if (req.user.subscriptionTier === 'pro') {
      return next();
    }

    if (type === 'job') {
      const jobCount = await Job.countDocuments({ userId: req.user._id });
      if (jobCount >= 5) {
        return res.status(403).json({
          success: false,
          limitExceeded: true,
          limitType: 'job',
          error: 'Job tracking limit reached (Max 5 for Free Tier). Please upgrade to Pro for unlimited access!'
        });
      }
    }

    if (type === 'ai') {
      if (req.user.aiRequestCount >= 3) {
        return res.status(403).json({
          success: false,
          limitExceeded: true,
          limitType: 'ai',
          error: 'AI usage limit reached (Max 3 for Free Tier). Please upgrade to Pro for unlimited access!'
        });
      }
    }

    next();
  } catch (err) {
    console.error('Subscription limit check error:', err.message);
    next(err);
  }
};

/**
 * Middleware to increment user AI request counts on successful endpoint executions
 */
const incrementAiUsage = async (req, res, next) => {
  try {
    if (req.user && req.user.subscriptionTier !== 'pro') {
      await User.findByIdAndUpdate(req.user._id, { $inc: { aiRequestCount: 1 } });
      console.log(`[Subscription] Incremented AI usage count for user ${req.user.email}`);
    }
    next();
  } catch (err) {
    console.error('Failed to increment AI usage count:', err.message);
    next(err);
  }
};

module.exports = {
  checkLimits,
  incrementAiUsage
};
