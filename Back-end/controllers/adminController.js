const User = require('../models/User');
const Job = require('../models/Job');

/**
 * Aggregates and returns database metrics.
 */
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const proUsers = await User.countDocuments({ subscriptionTier: 'pro' });
    const totalJobs = await Job.countDocuments({});

    const tokenSums = await User.aggregate([
      {
        $group: {
          _id: null,
          promptTokens: { $sum: "$tokenUsage.promptTokens" },
          completionTokens: { $sum: "$tokenUsage.completionTokens" },
          totalTokens: { $sum: "$tokenUsage.totalTokens" }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        proUsers,
        totalJobs,
        promptTokens: tokenSums[0]?.promptTokens || 0,
        completionTokens: tokenSums[0]?.completionTokens || 0,
        totalTokens: tokenSums[0]?.totalTokens || 0
      }
    });
  } catch (err) {
    console.error('Failed to fetch admin stats:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Returns a list of all users and their metadata.
 */
const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    const usersWithJobCount = await Promise.all(
      users.map(async (u) => {
        const jobCount = await Job.countDocuments({ userId: u._id });
        return {
          _id: u._id,
          name: u.name || '',
          email: u.email,
          picture: u.picture || '',
          activeProvider: u.activeProvider || 'google',
          subscriptionTier: u.subscriptionTier || 'free',
          aiRequestCount: u.aiRequestCount || 0,
          role: u.role || 'user',
          tokenUsage: u.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          createdAt: u.createdAt,
          jobCount
        };
      })
    );

    res.json({
      success: true,
      users: usersWithJobCount
    });
  } catch (err) {
    console.error('Failed to fetch admin users:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates a user's administrative role.
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'owner'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role value' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Owner email protection: Cannot demote the original OWNER_EMAIL owner via UI
    const ownerEmail = process.env.OWNER_EMAIL ? process.env.OWNER_EMAIL.toLowerCase().trim() : '';
    if (targetUser.email.toLowerCase().trim() === ownerEmail && role !== 'owner') {
      return res.status(400).json({ error: 'Cannot demote the primary owner configured via OWNER_EMAIL env.' });
    }

    targetUser.role = role;
    await targetUser.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: {
        _id: targetUser._id,
        email: targetUser.email,
        role: targetUser.role
      }
    });
  } catch (err) {
    console.error('Failed to update user role:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates a user's subscription tier.
 */
const updateUserSubscription = async (req, res) => {
  try {
    const { subscriptionTier } = req.body;
    if (!['free', 'pro'].includes(subscriptionTier)) {
      return res.status(400).json({ error: 'Invalid subscription tier value' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    targetUser.subscriptionTier = subscriptionTier;
    await targetUser.save();

    res.json({
      success: true,
      message: 'User subscription tier updated successfully',
      user: {
        _id: targetUser._id,
        email: targetUser.email,
        subscriptionTier: targetUser.subscriptionTier
      }
    });
  } catch (err) {
    console.error('Failed to update user subscription:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  updateUserSubscription
};
