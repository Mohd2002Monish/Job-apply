const express = require('express');
const { apply, checkReplies, sendFollowUp } = require('../controllers/emailController');
const { authenticate, requireAuth } = require('../middlewares/authMiddleware');
const { emailLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/apply', authenticate, requireAuth, emailLimiter, apply);
router.get('/emails/replies', authenticate, requireAuth, checkReplies);
router.post('/apply/follow-up', authenticate, requireAuth, emailLimiter, sendFollowUp);

module.exports = router;
