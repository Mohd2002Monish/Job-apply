const express = require('express');
const { apply, checkReplies, sendFollowUp } = require('../controllers/emailController');
const { authenticate, requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/apply', authenticate, requireAuth, apply);
router.get('/emails/replies', authenticate, requireAuth, checkReplies);
router.post('/apply/follow-up', authenticate, requireAuth, sendFollowUp);

module.exports = router;
