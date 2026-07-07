/**
 * countryMiddleware.js
 * Detects the user's country from request headers or body and attaches it to req.
 *
 * Priority:
 *  1. req.body.country  — explicit from client (useful in dev/testing)
 *  2. CF-IPCountry      — Cloudflare header (set automatically in production)
 *  3. X-Country-Code    — Custom header (set by any other reverse proxy)
 *  4. 'INTL'            — fallback → routes to default/Stripe gateway
 */

const detectCountry = (req, res, next) => {
  const country =
    (req.body && req.body.country) ||
    req.headers['cf-ipcountry'] ||
    req.headers['x-country-code'] ||
    'INTL';

  req.userCountry = country.toUpperCase().trim();
  next();
};

module.exports = { detectCountry };
