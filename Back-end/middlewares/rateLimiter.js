const rateLimit = require('express-rate-limit');

// Global rate limiter (100 requests per 15 minutes per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.ip || '';
    return ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('localhost') || ip === '::ffff:127.0.0.1';
  },
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
  }
});

// Strict AI operations rate limiter (5 requests per 1 minute per IP)
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    error: 'Rate limit exceeded. You can perform at most 5 AI operations per minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.ip || '';
    return ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('localhost') || ip === '::ffff:127.0.0.1';
  },
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
  }
});

// Email sending rate limiter (3 email triggers per 1 minute per IP)
const emailLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3,
  message: {
    success: false,
    error: 'Rate limit exceeded. You can send at most 3 outreach emails per minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.ip || '';
    return ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('localhost') || ip === '::ffff:127.0.0.1';
  },
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
  }
});

module.exports = {
  globalLimiter,
  aiLimiter,
  emailLimiter
};
