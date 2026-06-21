const express = require('express');
const {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  updateUserSubscription
} = require('../controllers/adminController');
const { authenticate, requireAuth, requireOwner } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/stats', authenticate, requireAuth, requireOwner, getAdminStats);
router.get('/users', authenticate, requireAuth, requireOwner, getAdminUsers);
router.patch('/users/:id/role', authenticate, requireAuth, requireOwner, updateUserRole);
router.patch('/users/:id/tier', authenticate, requireAuth, requireOwner, updateUserSubscription);

module.exports = router;
