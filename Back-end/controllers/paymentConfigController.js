/**
 * paymentConfigController.js
 * Admin CRUD for payment gateway configurations.
 * All credential values are encrypted before storage and decrypted only when needed at payment time.
 */

const PaymentConfig = require('../models/PaymentConfig');
const { encryptCredentials, decryptCredentials, maskCredentials } = require('../utils/encryptionService');

// ─── Internal helper: resolve active gateway for a given country ──────────────
/**
 * Returns decrypted credentials + gateway name for a user's country.
 * Used by paymentRoutes at checkout time — not exposed via HTTP.
 */
const getGatewayForCountry = async (countryCode) => {
  const country = (countryCode || 'INTL').toUpperCase();

  // First: find a gateway that explicitly lists this country
  let config = await PaymentConfig.findOne({
    isEnabled: true,
    countries: country,
  });

  // Fallback: use the default gateway
  if (!config) {
    config = await PaymentConfig.findOne({ isEnabled: true, isDefault: true });
  }

  if (!config) {
    throw new Error('No payment gateway is configured for this region. Please contact support.');
  }

  const credentials = decryptCredentials(config.credentials);

  return {
    gateway: config.gateway,
    isLive: config.isLive,
    displayName: config.displayName,
    supportedCurrencies: config.supportedCurrencies,
    credentials,
  };
};

// ─── Admin: List all gateway configs (credentials masked) ─────────────────────
const getPaymentConfigs = async (req, res) => {
  try {
    const configs = await PaymentConfig.find().sort({ gateway: 1 });
    const safeConfigs = configs.map((cfg) => ({
      _id: cfg._id,
      gateway: cfg.gateway,
      displayName: cfg.displayName,
      isEnabled: cfg.isEnabled,
      isLive: cfg.isLive,
      isDefault: cfg.isDefault,
      countries: cfg.countries,
      supportedCurrencies: cfg.supportedCurrencies,
      credentials: maskCredentials(cfg.credentials),
      updatedBy: cfg.updatedBy,
      updatedAt: cfg.updatedAt,
      createdAt: cfg.createdAt,
    }));
    res.json({ success: true, configs: safeConfigs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment configs: ' + err.message });
  }
};

// ─── Admin: Create or update a gateway config ─────────────────────────────────
const upsertPaymentConfig = async (req, res) => {
  try {
    const {
      gateway,
      displayName,
      isEnabled,
      isLive,
      isDefault,
      countries,
      supportedCurrencies,
      credentials, // plain-text values from admin form — we encrypt before saving
    } = req.body;

    if (!gateway || !['razorpay', 'stripe'].includes(gateway)) {
      return res.status(400).json({ error: 'gateway must be "razorpay" or "stripe".' });
    }

    let config = await PaymentConfig.findOne({ gateway });

    if (!config) {
      config = new PaymentConfig({ gateway });
    }

    if (displayName !== undefined) config.displayName = displayName;
    if (isEnabled !== undefined) config.isEnabled = Boolean(isEnabled);
    if (isLive !== undefined) config.isLive = Boolean(isLive);
    if (isDefault !== undefined) config.isDefault = Boolean(isDefault);
    if (Array.isArray(countries)) config.countries = countries.map(c => c.toUpperCase().trim());
    if (Array.isArray(supportedCurrencies)) config.supportedCurrencies = supportedCurrencies.map(c => c.toUpperCase().trim());
    if (credentials && typeof credentials === 'object') {
      // Only re-encrypt fields that were actually supplied (non-empty).
      // If admin leaves a field blank, keep the previously encrypted value.
      const existing = config.credentials || {};
      config.credentials = {
        keyId:         credentials.keyId         ? require('../utils/encryptionService').encrypt(credentials.keyId)         : existing.keyId         || '',
        keySecret:     credentials.keySecret     ? require('../utils/encryptionService').encrypt(credentials.keySecret)     : existing.keySecret     || '',
        webhookSecret: credentials.webhookSecret ? require('../utils/encryptionService').encrypt(credentials.webhookSecret) : existing.webhookSecret || '',
        planIdINR:     credentials.planIdINR     ? require('../utils/encryptionService').encrypt(credentials.planIdINR)     : existing.planIdINR     || '',
        planIdUSD:     credentials.planIdUSD     ? require('../utils/encryptionService').encrypt(credentials.planIdUSD)     : existing.planIdUSD     || '',
        priceId:       credentials.priceId       ? require('../utils/encryptionService').encrypt(credentials.priceId)       : existing.priceId       || '',
      };
    }

    config.updatedBy = req.user._id;
    await config.save();

    res.json({
      success: true,
      message: `${gateway} gateway configuration saved.`,
      config: {
        _id: config._id,
        gateway: config.gateway,
        displayName: config.displayName,
        isEnabled: config.isEnabled,
        isLive: config.isLive,
        isDefault: config.isDefault,
        countries: config.countries,
        supportedCurrencies: config.supportedCurrencies,
        credentials: maskCredentials(config.credentials),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save payment config: ' + err.message });
  }
};

// ─── Admin: Delete a gateway config ───────────────────────────────────────────
const deletePaymentConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const config = await PaymentConfig.findByIdAndDelete(id);
    if (!config) return res.status(404).json({ error: 'Payment config not found.' });
    res.json({ success: true, message: `${config.gateway} gateway config deleted.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete payment config: ' + err.message });
  }
};

// ─── Admin: Test gateway credentials live ─────────────────────────────────────
const testGatewayConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const config = await PaymentConfig.findById(id);
    if (!config) return res.status(404).json({ error: 'Payment config not found.' });

    const creds = decryptCredentials(config.credentials);

    if (config.gateway === 'razorpay') {
      if (!creds.keyId || !creds.keySecret) {
        return res.status(400).json({ success: false, error: 'Razorpay Key ID and Key Secret are required to test.' });
      }
      let Razorpay;
      try { Razorpay = require('razorpay'); } catch (_) {
        return res.status(500).json({ success: false, error: 'razorpay npm package not installed on server.' });
      }
      const rzp = new Razorpay({ key_id: creds.keyId, key_secret: creds.keySecret });
      // Fetch account details as connection test
      try {
        await rzp.orders.all({ count: 1 });
        return res.json({ success: true, message: 'Razorpay connection verified successfully.' });
      } catch (apiErr) {
        return res.json({ success: false, error: `Razorpay API error: ${apiErr.error?.description || apiErr.message}` });
      }

    } else if (config.gateway === 'stripe') {
      if (!creds.keySecret) {
        return res.status(400).json({ success: false, error: 'Stripe Secret Key is required to test.' });
      }
      let stripe;
      try { stripe = require('stripe')(creds.keySecret); } catch (_) {
        return res.status(500).json({ success: false, error: 'stripe npm package not installed on server.' });
      }
      try {
        const account = await stripe.accounts.retrieve();
        return res.json({ success: true, message: `Stripe connection verified. Account: ${account.email || account.id}` });
      } catch (apiErr) {
        return res.json({ success: false, error: `Stripe API error: ${apiErr.message}` });
      }
    }

    res.status(400).json({ success: false, error: 'Unknown gateway type.' });
  } catch (err) {
    res.status(500).json({ error: 'Test failed: ' + err.message });
  }
};

module.exports = {
  getPaymentConfigs,
  upsertPaymentConfig,
  deletePaymentConfig,
  testGatewayConnection,
  getGatewayForCountry,
};
