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
  const originalJson = res.json;
  const originalSend = res.send;
  let incremented = false;

  const performIncrement = () => {
    if (incremented) return;
    incremented = true;

    if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
      const updateObj = {};
      if (req.user.subscriptionTier !== 'pro') {
        updateObj.aiRequestCount = 1;
      }

      if (req.tokenUsage) {
        const pt = req.tokenUsage.prompt_tokens || 0;
        const ct = req.tokenUsage.completion_tokens || 0;
        const tt = req.tokenUsage.total_tokens || 0;
        if (pt > 0 || ct > 0 || tt > 0) {
          updateObj['tokenUsage.promptTokens'] = pt;
          updateObj['tokenUsage.completionTokens'] = ct;
          updateObj['tokenUsage.totalTokens'] = tt;
        }
      }

      if (Object.keys(updateObj).length > 0) {
        User.findByIdAndUpdate(req.user._id, { $inc: updateObj })
          .then(() => {
            console.log(`[Subscription] Incremented AI/token usage for ${req.user.email}:`, updateObj);
          })
          .catch(err => {
            console.error('Failed to increment AI/token usage:', err.message);
          });
      }
    }
  };

  res.json = function (body) {
    performIncrement();
    return originalJson.call(this, body);
  };

  res.send = function (body) {
    performIncrement();
    return originalSend.call(this, body);
  };

  next();
};

module.exports = {
  checkLimits,
  incrementAiUsage
};
