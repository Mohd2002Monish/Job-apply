const express = require('express');
const User = require('../models/User');
const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Referral Redirect ───────────────────────────────────────────────────────
router.get('/r/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    // Find owner of referral code and increment clicks
    const referrer = await User.findOneAndUpdate(
      { referralCode: code.toUpperCase() },
      { $inc: { referralClicks: 1 } },
      { new: true }
    );

    if (referrer) {
      console.log(`[Referral] Click recorded for referrer: ${referrer.email} (code: ${code})`);
      // Set referred_by cookie to track registration
      res.cookie('jaa_referred_by', code.toUpperCase(), {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: false, // set to true in production
        sameSite: 'lax',
        path: '/'
      });
    } else {
      console.log(`[Referral] Click with invalid code: ${code}`);
    }

    // Redirect to frontend
    res.redirect(`${FRONTEND_URL}/`);
  } catch (err) {
    console.error('Referral redirect error:', err.message);
    res.redirect(`${FRONTEND_URL}/`);
  }
});

module.exports = router;
