const express = require('express');
const {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  updateUserSubscription
} = require('../controllers/adminController');
const {
  getAdminPackages,
  createPackage,
  updatePackage,
  deletePackage
} = require('../controllers/packageController');
const {
  getAdminCoupons,
  createCoupon,
  toggleCouponActive,
  deleteCoupon
} = require('../controllers/couponController');
const { authenticate, requireAuth, requireOwner } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/stats', authenticate, requireAuth, requireOwner, getAdminStats);
router.get('/users', authenticate, requireAuth, requireOwner, getAdminUsers);
router.patch('/users/:id/role', authenticate, requireAuth, requireOwner, updateUserRole);
router.patch('/users/:id/tier', authenticate, requireAuth, requireOwner, updateUserSubscription);

// Packages Management (Owner Only)
router.get('/packages', authenticate, requireAuth, requireOwner, getAdminPackages);
router.post('/packages', authenticate, requireAuth, requireOwner, createPackage);
router.put('/packages/:id', authenticate, requireAuth, requireOwner, updatePackage);
router.delete('/packages/:id', authenticate, requireAuth, requireOwner, deletePackage);

// Coupons Management (Owner Only)
router.get('/coupons', authenticate, requireAuth, requireOwner, getAdminCoupons);
router.post('/coupons', authenticate, requireAuth, requireOwner, createCoupon);
router.patch('/coupons/:id/toggle', authenticate, requireAuth, requireOwner, toggleCouponActive);
router.delete('/coupons/:id', authenticate, requireAuth, requireOwner, deleteCoupon);

module.exports = router;
