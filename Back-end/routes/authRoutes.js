const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  googleAuth,
  googleCallback,
  microsoftAuth,
  microsoftCallback,
  status,
  logout,
  updateProfile
} = require('../controllers/authController');
const { authenticate, requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

// ─── Multer (profile picture uploads) ──────────────────────────────────────────
const profilePicsDir = path.join(__dirname, '..', 'public', 'uploads', 'profile_pics');
if (!fs.existsSync(profilePicsDir)) fs.mkdirSync(profilePicsDir, { recursive: true });

const profilePicStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profilePicsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile_${req.user._id}_${Date.now()}${ext}`);
  },
});

const profilePicUpload = multer({
  storage: profilePicStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Only JPEG, PNG, or WebP images allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/microsoft', microsoftAuth);
router.get('/microsoft/callback', microsoftCallback);
router.get('/status', authenticate, status);
router.post('/logout', logout);
router.post('/profile/update', authenticate, requireAuth, profilePicUpload.single('picture'), updateProfile);

module.exports = router;
