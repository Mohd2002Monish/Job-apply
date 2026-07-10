const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Job = require('../models/Job');
const { getAuthUrl, getTokensFromCode, getAuthenticatedClient, getUserInfo } = require('../utils/oauthService');
const {
  getMicrosoftAuthUrl,
  getMicrosoftTokensFromCode,
  getMicrosoftUserInfo
} = require('../utils/microsoftService');

if (!process.env.JWT_SECRET && !process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET env variable is not set. Server cannot start in production without it.');
  } else {
    console.warn('⚠️  WARNING: JWT_SECRET is not set. Using insecure fallback key. Set JWT_SECRET in your .env file.');
  }
}
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'jaa-super-secret-key-1337';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Validates that a redirect URI is an allowed origin.
 * Prevents open-redirect attacks via the OAuth state parameter.
 */
const ALLOWED_REDIRECT_ORIGINS = (() => {
  const base = [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'];
  // Also allow the mobile app scheme if configured
  if (process.env.MOBILE_REDIRECT_SCHEME) base.push(process.env.MOBILE_REDIRECT_SCHEME);
  return base;
})();

const isSafeRedirectUri = (uri) => {
  if (!uri) return false;
  try {
    const parsed = new URL(uri);
    return ALLOWED_REDIRECT_ORIGINS.some(allowed => {
      try {
        const allowedParsed = new URL(allowed);
        // For custom schemes (mobile) match scheme only
        if (allowedParsed.protocol !== 'http:' && allowedParsed.protocol !== 'https:') {
          return parsed.protocol === allowedParsed.protocol;
        }
        return parsed.origin === allowedParsed.origin;
      } catch (_) { return false; }
    });
  } catch (_) {
    return false;
  }
};

/**
 * Generate a secure JWT and attach it to an HTTP-only response cookie.
 */
const generateTokenCookie = (res, email) => {
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('jaa_session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
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

const handleUserSignIn = async (email, userInfo, tokens, provider, isOwner, req, res) => {
  let user = await User.findOne({ email });
  const isNewUser = !user;

  if (isNewUser) {
    let referralCode;
    let attempts = 0;
    while (attempts < 5) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const existing = await User.findOne({ referralCode: code });
      if (!existing) {
        referralCode = code;
        break;
      }
      attempts++;
    }
    if (!referralCode) {
      referralCode = `${email.split('@')[0].toUpperCase().substring(0, 4)}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }

    user = new User({
      email,
      name: userInfo.name || '',
      picture: userInfo.picture || '',
      activeProvider: provider,
      role: isOwner ? 'owner' : 'user',
      referralCode
    });

    if (provider === 'google') {
      user.googleTokens = tokens;
    } else {
      user.microsoftTokens = tokens;
    }

    if (req.cookies && req.cookies.jaa_referred_by) {
      const referrer = await User.findOne({ referralCode: req.cookies.jaa_referred_by });
      if (referrer) {
        user.referredBy = referrer._id;
      }
    }
    await user.save();
    console.log(`🆕 New ${provider} user registered: ${email}`);
  } else {
    user.name = userInfo.name || user.name || '';
    if (userInfo.picture) user.picture = userInfo.picture;
    user.activeProvider = provider;
    if (isOwner) user.role = 'owner';

    if (provider === 'google') {
      user.googleTokens = tokens;
    } else {
      user.microsoftTokens = tokens;
    }

    if (!user.referralCode) {
      let referralCode;
      let attempts = 0;
      while (attempts < 5) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        const existing = await User.findOne({ referralCode: code });
        if (!existing) {
          referralCode = code;
          break;
        }
        attempts++;
      }
      user.referralCode = referralCode || `${email.split('@')[0].toUpperCase().substring(0, 4)}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }
    await user.save();
    console.log(`✅ Existing ${provider} user logged in: ${email}`);
  }

  if (req.cookies && req.cookies.jaa_referred_by) {
    res.clearCookie('jaa_referred_by', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
  }

  return user;
};

const googleCallback = async (req, res) => {
  const { code, error, state } = req.query;

  // Validate the state/redirect URI against the allowlist to prevent open redirect.
  // Falls back to FRONTEND_URL if the state is missing or not in the allowlist.
  const decodedState = state ? decodeURIComponent(state) : null;
  const baseRedirect = (decodedState && isSafeRedirectUri(decodedState)) ? decodedState : FRONTEND_URL;

  if (error) return res.redirect(`${baseRedirect}?auth=error&reason=${encodeURIComponent(error)}`);
  if (!code) return res.redirect(`${baseRedirect}?auth=error&reason=no_code`);

  try {
    const tokens = await Promise.race([
      getTokensFromCode(code),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Token exchange timed out')), 15000)),
    ]);

    const oAuth2Client = getAuthenticatedClient(tokens);
    const userInfo = await getUserInfo(oAuth2Client);

    const ownerEmail = process.env.OWNER_EMAIL ? process.env.OWNER_EMAIL.toLowerCase().trim() : '';
    const isOwner = ownerEmail && userInfo.email.toLowerCase().trim() === ownerEmail;

    const user = await handleUserSignIn(
      userInfo.email.toLowerCase(),
      userInfo,
      tokens,
      'google',
      isOwner,
      req,
      res
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

    // If it's a mobile redirect (state is a validated allowed URI), include the JWT in the URL.
    // NOTE: Tokens in URLs land in server access logs and browser history. This is an accepted
    // tradeoff for mobile deep-link auth flows. Only do this when state passed allowlist validation.
    if (decodedState && isSafeRedirectUri(decodedState)) {
      params.append('token', token);
    }

    res.redirect(`${baseRedirect}?${params.toString()}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err.message);
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

  // Validate the state/redirect URI against the allowlist to prevent open redirect.
  // Falls back to FRONTEND_URL if the state is missing or not in the allowlist.
  const decodedState = state ? decodeURIComponent(state) : null;
  const baseRedirect = (decodedState && isSafeRedirectUri(decodedState)) ? decodedState : FRONTEND_URL;

  if (error) return res.redirect(`${baseRedirect}?auth=error&reason=${encodeURIComponent(error)}`);
  if (!code) return res.redirect(`${baseRedirect}?auth=error&reason=no_code`);

  try {
    const tokens = await Promise.race([
      getMicrosoftTokensFromCode(code),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Microsoft token exchange timed out')), 15000)),
    ]);

    const userInfo = await getMicrosoftUserInfo(tokens.access_token);

    const ownerEmail = process.env.OWNER_EMAIL ? process.env.OWNER_EMAIL.toLowerCase().trim() : '';
    const isOwner = ownerEmail && userInfo.email.toLowerCase().trim() === ownerEmail;

    const user = await handleUserSignIn(
      userInfo.email.toLowerCase(),
      userInfo,
      tokens,
      'microsoft',
      isOwner,
      req,
      res
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

    // If it's a mobile redirect (state is a validated allowed URI), include the JWT in the URL.
    // NOTE: Tokens in URLs land in server access logs and browser history. This is an accepted
    // tradeoff for mobile deep-link auth flows. Only do this when state passed allowlist validation.
    if (decodedState && isSafeRedirectUri(decodedState)) {
      params.append('token', token);
    }

    res.redirect(`${baseRedirect}?${params.toString()}`);
  } catch (err) {
    console.error('Microsoft OAuth callback error:', err.message);
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

    const referralConversions = await User.countDocuments({
      referredBy: req.user._id,
      subscriptionTier: 'pro'
    });

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
      subscriptionTier: req.user.subscriptionTier || 'free',
      stripeSubscriptionId: req.user.stripeSubscriptionId || '',
      aiRequestCount: req.user.aiRequestCount || 0,
      role: req.user.role || 'user',
      tokenUsage: req.user.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      jobCount: await Job.countDocuments({ userId: req.user._id }),
      referralCode: req.user.referralCode || '',
      referralClicks: req.user.referralClicks || 0,
      referralConversions,
      aiModelPreference: req.user.aiModelPreference || 'gemini-2.5-flash',
      preferences: req.user.preferences || {
        aiModelForResume: 'gemini-1.5-pro',
        aiModelForCoverLetter: 'gemini-1.5-pro',
        aiModelForOutreach: 'gpt-4o',
        aiModelForInterview: 'gemini-2.5-flash',
        defaultResumeTemplate: 'profile-classic',
        defaultCoverLetterLength: 'medium',
        defaultEmailWordCount: 100
      },
      onboardingCompleted: req.user.onboardingCompleted || (req.user.resumes && req.user.resumes.length > 0) || !!req.user.resumeFileName || false,
      targetProfile: req.user.targetProfile || {
        targetRole: '',
        targetLocation: '',
        workStyle: 'remote',
        experienceLevel: 'fresher'
      }
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
    const { name, email, aiModelPreference, preferences } = req.body;
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
    if (aiModelPreference) {
      req.user.aiModelPreference = aiModelPreference.trim();
    }
    if (preferences) {
      let parsedPrefs = preferences;
      if (typeof preferences === 'string') {
        try {
          parsedPrefs = JSON.parse(preferences);
        } catch (e) {
          console.error('Failed to parse preferences JSON string:', e.message);
        }
      }
      req.user.preferences = {
        ...(req.user.preferences || {}),
        ...parsedPrefs
      };
    }

    // Update email and generate a new session cookie if email changed
    if (targetEmail !== currentEmail) {
      req.user.email = targetEmail;
      await req.user.save();
      
      // Update tokens / session
      generateTokenCookie(res, targetEmail);
    } else {
      await req.user.save();
    }

    const referralConversions = await User.countDocuments({
      referredBy: req.user._id,
      subscriptionTier: 'pro'
    });

    res.json({
      success: true,
      user: {
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture,
        provider: req.user.activeProvider || 'google',
        subscriptionTier: req.user.subscriptionTier || 'free',
        stripeSubscriptionId: req.user.stripeSubscriptionId || '',
        aiRequestCount: req.user.aiRequestCount || 0,
        role: req.user.role || 'user',
        tokenUsage: req.user.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        referralCode: req.user.referralCode || '',
        referralClicks: req.user.referralClicks || 0,
        referralConversions,
        aiModelPreference: req.user.aiModelPreference || 'gemini-2.5-flash',
        preferences: req.user.preferences || {
          aiModelForResume: 'gemini-1.5-pro',
          aiModelForCoverLetter: 'gemini-1.5-pro',
          aiModelForOutreach: 'gpt-4o',
          aiModelForInterview: 'gemini-2.5-flash',
          defaultResumeTemplate: 'profile-classic',
          defaultCoverLetterLength: 'medium',
          defaultEmailWordCount: 100
        },
        onboardingCompleted: req.user.onboardingCompleted || (req.user.resumes && req.user.resumes.length > 0) || !!req.user.resumeFileName || false,
        targetProfile: req.user.targetProfile || {
          targetRole: '',
          targetLocation: '',
          workStyle: 'remote',
          experienceLevel: 'fresher'
        }
      }
    });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ error: 'Failed to update profile. ' + err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const onboard = async (req, res) => {
  try {
    const { name, experienceLevel, targetRole, workStyle, targetLocation } = req.body;
    const user = req.user;

    if (name) {
      user.name = name.trim();
    }

    user.targetProfile = {
      ...(user.targetProfile || {}),
      targetRole: (targetRole || '').trim(),
      targetLocation: (targetLocation || '').trim(),
      workStyle: workStyle || 'remote',
      experienceLevel: experienceLevel || 'fresher'
    };

    // Handle optional resume upload & parsing
    if (req.file) {
      const fs = require('fs');
      const { parseResume } = require('../utils/resumeParser');
      const { structureResume } = require('../utils/resumeStructurer');

      let rawText = '';
      try {
        rawText = await parseResume(req.file.path);
      } catch (parseErr) {
        console.error('Onboarding resume parse error:', parseErr.message);
        try { fs.unlinkSync(req.file.path); } catch (_) {}
        return res.status(422).json({ error: `Could not parse resume: ${parseErr.message}` });
      }

      let resumeData = null;
      try {
        resumeData = await structureResume(rawText);
      } catch (aiErr) {
        console.error('Onboarding AI structuring error:', aiErr.message);
        try { fs.unlinkSync(req.file.path); } catch (_) {}
        return res.status(500).json({ error: `AI structuring failed: ${aiErr.message}` });
      }

      const newResume = {
        id: Date.now().toString(),
        title: req.file.originalname.split('.')[0] || "My Resume",
        rawText,
        resumeData,
        resumeFileName: req.file.originalname,
        resumePath: req.file.path,
        lastParsedAt: new Date()
      };

      user.resumes.push(newResume);
      user.activeResumeId = newResume.id;

      // Sync root fields
      user.rawText = rawText;
      user.resumeData = resumeData;
      user.resumeFileName = req.file.originalname;
      user.resumePath = req.file.path;
      user.lastParsedAt = newResume.lastParsedAt;
    }

    user.onboardingCompleted = true;
    await user.save();

    const referralConversions = await User.countDocuments({
      referredBy: user._id,
      subscriptionTier: 'pro'
    });

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture,
        provider: user.activeProvider || 'google',
        subscriptionTier: user.subscriptionTier || 'free',
        stripeCustomerId: user.stripeCustomerId || '',
        aiRequestCount: user.aiRequestCount || 0,
        role: user.role || 'user',
        tokenUsage: user.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        referralCode: user.referralCode || '',
        referralClicks: user.referralClicks || 0,
        referralConversions,
        aiModelPreference: user.aiModelPreference || 'gemini-2.5-flash',
        preferences: user.preferences,
        onboardingCompleted: user.onboardingCompleted,
        targetProfile: user.targetProfile
      }
    });
  } catch (err) {
    console.error('Onboarding error:', err.message);
    res.status(500).json({ error: 'Failed to save onboarding data: ' + err.message });
  }
};

module.exports = {
  googleAuth,
  googleCallback,
  microsoftAuth,
  microsoftCallback,
  status,
  logout,
  updateProfile,
  getProfile,
  onboard
};
