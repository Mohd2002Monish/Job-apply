const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { getAuthUrl, getTokensFromCode, getAuthenticatedClient, getUserInfo } = require('../utils/oauthService');
const {
  getMicrosoftAuthUrl,
  getMicrosoftTokensFromCode,
  getMicrosoftUserInfo
} = require('../utils/microsoftService');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'jaa-super-secret-key-1337';
const FRONTEND_URL = 'http://localhost:5173';

/**
 * Generate a secure JWT and attach it to an HTTP-only response cookie.
 */
const generateTokenCookie = (res, email) => {
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('jaa_session_token', token, {
    httpOnly: true,
    secure: false, // set to true in production with HTTPS
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (1 week)
    sameSite: 'lax',
    path: '/'
  });
  return token;
};

// ─── Google Auth ─────────────────────────────────────────────────────────────

const googleAuth = (req, res) => {
  try {
    const state = req.query.redirect_uri ? encodeURIComponent(req.query.redirect_uri) : undefined;
    const url = getAuthUrl(state);
    res.redirect(url);
  } catch (err) {
    console.error('Failed to generate Google auth URL:', err.message);
    res.redirect(`${FRONTEND_URL}/?auth=error&reason=${encodeURIComponent(err.message)}`);
  }
};

const googleCallback = async (req, res) => {
  const { code, error, state } = req.query;

  const baseRedirect = state ? decodeURIComponent(state) : FRONTEND_URL;

  if (error) return res.redirect(`${baseRedirect}?auth=error&reason=${encodeURIComponent(error)}`);
  if (!code) return res.redirect(`${baseRedirect}?auth=error&reason=no_code`);

  try {
    const tokens = await Promise.race([
      getTokensFromCode(code),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Token exchange timed out')), 15000)),
    ]);

    const oAuth2Client = getAuthenticatedClient(tokens);
    const userInfo = await getUserInfo(oAuth2Client);

    // Save tokens and user in MongoDB, set active provider
    await User.findOneAndUpdate(
      { email: userInfo.email.toLowerCase() },
      {
        name: userInfo.name || '',
        picture: userInfo.picture || '',
        googleTokens: tokens,
        activeProvider: 'google'
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Google user signed in: ${userInfo.email}`);
    const token = generateTokenCookie(res, userInfo.email.toLowerCase());

    const params = new URLSearchParams({
      auth: 'success',
      email: userInfo.email,
      name: userInfo.name || '',
      picture: userInfo.picture || '',
      provider: 'google',
    });

    // If it's a mobile redirect, include the JWT token in the URL
    if (state) {
      params.append('token', token);
    }

    res.redirect(`${baseRedirect}?${params.toString()}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err.message);
    const baseRedirect = state ? decodeURIComponent(state) : FRONTEND_URL;
    res.redirect(`${baseRedirect}?auth=error&reason=${encodeURIComponent(err.message)}`);
  }
};

// ─── Microsoft Auth ──────────────────────────────────────────────────────────

const microsoftAuth = (req, res) => {
  try {
    const state = req.query.redirect_uri ? encodeURIComponent(req.query.redirect_uri) : undefined;
    const url = getMicrosoftAuthUrl(state);
    res.redirect(url);
  } catch (err) {
    console.error('Failed to generate Microsoft auth URL:', err.message);
    res.redirect(`${FRONTEND_URL}/?auth=error&reason=${encodeURIComponent(err.message)}`);
  }
};

const microsoftCallback = async (req, res) => {
  const { code, error, state } = req.query;

  const baseRedirect = state ? decodeURIComponent(state) : FRONTEND_URL;

  if (error) return res.redirect(`${baseRedirect}?auth=error&reason=${encodeURIComponent(error)}`);
  if (!code) return res.redirect(`${baseRedirect}?auth=error&reason=no_code`);

  try {
    const tokens = await Promise.race([
      getMicrosoftTokensFromCode(code),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Microsoft token exchange timed out')), 15000)),
    ]);

    const userInfo = await getMicrosoftUserInfo(tokens.access_token);

    // Save tokens and user in MongoDB, set active provider
    await User.findOneAndUpdate(
      { email: userInfo.email.toLowerCase() },
      {
        name: userInfo.name || '',
        picture: '',
        microsoftTokens: tokens,
        activeProvider: 'microsoft'
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Microsoft user signed in: ${userInfo.email}`);
    const token = generateTokenCookie(res, userInfo.email.toLowerCase());

    const params = new URLSearchParams({
      auth: 'success',
      email: userInfo.email,
      name: userInfo.name || '',
      picture: '',
      provider: 'microsoft',
    });

    if (state) {
      params.append('token', token);
    }

    res.redirect(`${baseRedirect}?${params.toString()}`);
  } catch (err) {
    console.error('Microsoft OAuth callback error:', err.message);
    const baseRedirect = state ? decodeURIComponent(state) : FRONTEND_URL;
    res.redirect(`${baseRedirect}?auth=error&reason=${encodeURIComponent(err.message)}`);
  }
};

// ─── Status & Logout ─────────────────────────────────────────────────────────

const status = async (req, res) => {
  try {
    // If authMiddleware passed, req.user holds the User document
    if (!req.user) {
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      name: req.user.name || '',
      email: req.user.email || '',
      picture: req.user.picture || '',
      provider: req.user.activeProvider || 'google',
      hasResume: !!req.user.resumeFileName,
      resumeName: req.user.resumeFileName || null,
      hasResumeData: !!req.user.resumeData,
      resumeData: req.user.resumeData || null,
      hasGoogleTokens: !!req.user.googleTokens,
      hasMicrosoftTokens: !!req.user.microsoftTokens,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const logout = (req, res) => {
  res.clearCookie('jaa_session_token');
  res.json({ message: 'Logged out' });
};

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required fields.' });
    }

    const currentEmail = req.user.email.toLowerCase();
    const targetEmail = email.toLowerCase().trim();

    // If email is modified, check if it's already in use
    if (targetEmail !== currentEmail) {
      const existingUser = await User.findOne({ email: targetEmail });
      if (existingUser) {
        return res.status(400).json({ error: 'Email address is already in use by another account.' });
      }
    }

    // Process profile picture if uploaded
    if (req.file) {
      // If there's an existing local picture, try to delete it
      if (req.user.picture && req.user.picture.startsWith('/uploads/profile_pics/')) {
        const oldPath = path.join(__dirname, '..', 'public', req.user.picture);
        fs.unlink(oldPath, (err) => {
          if (err) console.error('Failed to delete old profile picture:', err.message);
        });
      }
      // Set new local path
      req.user.picture = `/uploads/profile_pics/${req.file.filename}`;
    }

    // Update name
    req.user.name = name.trim();

    // Update email and generate a new session cookie if email changed
    if (targetEmail !== currentEmail) {
      req.user.email = targetEmail;
      await req.user.save();
      
      // Update tokens / session
      generateTokenCookie(res, targetEmail);
    } else {
      await req.user.save();
    }

    res.json({
      success: true,
      user: {
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture,
        provider: req.user.activeProvider || 'google',
      }
    });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ error: 'Failed to update profile. ' + err.message });
  }
};

module.exports = {
  googleAuth,
  googleCallback,
  microsoftAuth,
  microsoftCallback,
  status,
  logout,
  updateProfile
};
