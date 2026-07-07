const jwt = require('jsonwebtoken');
const User = require('../models/User');

if (!process.env.JWT_SECRET && !process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET env variable is not set. Cannot start in production without it.');
  } else {
    console.warn('⚠️  WARNING: JWT_SECRET is not set. Using insecure fallback key — set JWT_SECRET in your .env file.');
  }
}
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'jaa-super-secret-key-1337';

/**
 * Non-strict authentication middleware.
 * Attempts to parse cookie or Bearer JWT and bind the User document to req.user.
 * Does NOT block request if unauthenticated — use requireAuth for that.
 *
 * NOTE: Query-string token (?token=...) is intentionally NOT supported here.
 * Tokens in URLs end up in server access logs, browser history, and referrer headers.
 */
const authenticate = async (req, res, next) => {
  req.user = null;
  let token = req.cookies?.jaa_session_token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findOne({ email: decoded.email.toLowerCase() });
      if (user) {
        req.user = user;
      }
    } catch (err) {
      console.log('JWT Verification failed:', err.message);
      if (err.name === 'TokenExpiredError') {
        res.clearCookie('jaa_session_token');
      }
    }
  }
  next();
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated. Please sign in.' });
  }
  next();
};

const requireOwner = (req, res, next) => {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Access denied. Owner privileges required.' });
  }
  next();
};

module.exports = {
  authenticate,
  requireAuth,
  requireOwner
};
