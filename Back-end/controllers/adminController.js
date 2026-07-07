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
 * Uses MongoDB aggregation to avoid N+1 queries and supports pagination.
 */
const getAdminUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Aggregate in MongoDB to get jobCount and referralConversions in one pass
    const usersAggregation = await User.aggregate([
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: 'userId',
          as: 'userJobs'
        }
      },
      {
        $addFields: {
          jobCount: { $size: '$userJobs' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'referredBy',
          as: 'referrals'
        }
      },
      {
        $addFields: {
          referralConversions: {
            $size: {
              $filter: {
                input: '$referrals',
                as: 'ref',
                cond: { $eq: ['$$ref.subscriptionTier', 'pro'] }
              }
            }
          }
        }
      },
      {
        $project: {
          userJobs: 0,
          referrals: 0
        }
      }
    ]);

    const totalUsers = await User.countDocuments({});

    res.json({
      success: true,
      users: usersAggregation,
      meta: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit)
      }
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
