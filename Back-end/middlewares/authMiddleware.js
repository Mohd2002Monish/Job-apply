const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'jaa-super-secret-key-1337';

/**
 * Non-strict authentication middleware.
 * Attempts to parse cookie JWT and bind the User document to req.user.
 * Does NOT block request if unauthenticated.
 */
const authenticate = async (req, res, next) => {
  req.user = null;
  let token = req.cookies?.jaa_session_token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token && req.query.token) {
    token = req.query.token;
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
      // Clean invalid cookie if expired to avoid header bloat
      if (err.name === 'TokenExpiredError') {
        res.clearCookie('jaa_session_token');
      }
    }
  }
  next();
};

/**
 * Strict authentication middleware.
 * Guarantees that req.user is populated, otherwise aborts with 401 Unauthorized.
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated. Please sign in.' });
  }
  next();
};

module.exports = {
  authenticate,
  requireAuth
};
