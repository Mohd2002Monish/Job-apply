/**
 * encryptionService.js
 * AES-256-GCM symmetric encryption for sensitive credentials stored in MongoDB.
 *
 * REQUIRES: ENCRYPTION_KEY env var — 32-byte hex string.
 * Generate once with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;   // 128-bit IV
const TAG_LENGTH = 16;  // 128-bit auth tag

const getKey = () => {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length < 64) {
    throw new Error(
      'ENCRYPTION_KEY is missing or too short. Generate with: ' +
      'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(hex.slice(0, 64), 'hex'); // take first 32 bytes (64 hex chars)
};

/**
 * Encrypts a plain-text string.
 * Returns a single base64 string: iv:authTag:ciphertext
 */
const encrypt = (plainText) => {
  if (!plainText) return '';
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: base64(iv):base64(authTag):base64(ciphertext)
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
};

/**
 * Decrypts a ciphertext string produced by encrypt().
 */
const decrypt = (cipherText) => {
  if (!cipherText) return '';
  try {
    const key = getKey();
    const [ivB64, tagB64, encB64] = cipherText.split(':');
    if (!ivB64 || !tagB64 || !encB64) return cipherText; // not encrypted (legacy plain value)
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    const encBuffer = Buffer.from(encB64, 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encBuffer) + decipher.final('utf8');
  } catch (err) {
    console.error('[encryptionService] Decryption failed:', err.message);
    return '';
  }
};

/**
 * Returns a safely masked version of a credential for display in the admin UI.
 * Example: 'rzp_live_abcdef1234' → 'rzp_live_****1234'
 */
const mask = (value) => {
  if (!value || value.length < 8) return '****';
  const decrypted = (() => {
    try { return decrypt(value); } catch (_) { return value; }
  })();
  if (!decrypted || decrypted.length < 8) return '****';
  const visible = decrypted.slice(-4);
  const prefix = decrypted.slice(0, Math.min(8, decrypted.length - 4));
  return `${prefix}****${visible}`;
};

/**
 * Encrypts all credential fields on a credentials object.
 * Fields with empty string values are left as empty string.
 */
const encryptCredentials = (creds = {}) => ({
  keyId:         creds.keyId         ? encrypt(creds.keyId)         : '',
  keySecret:     creds.keySecret     ? encrypt(creds.keySecret)     : '',
  webhookSecret: creds.webhookSecret ? encrypt(creds.webhookSecret) : '',
  planIdINR:     creds.planIdINR     ? encrypt(creds.planIdINR)     : '',
  planIdUSD:     creds.planIdUSD     ? encrypt(creds.planIdUSD)     : '',
  priceId:       creds.priceId       ? encrypt(creds.priceId)       : '',
});

/**
 * Decrypts all credential fields.
 */
const decryptCredentials = (creds = {}) => ({
  keyId:         decrypt(creds.keyId),
  keySecret:     decrypt(creds.keySecret),
  webhookSecret: decrypt(creds.webhookSecret),
  planIdINR:     decrypt(creds.planIdINR),
  planIdUSD:     decrypt(creds.planIdUSD),
  priceId:       decrypt(creds.priceId),
});

/**
 * Returns masked credentials safe to send to the admin UI.
 */
const maskCredentials = (creds = {}) => ({
  keyId:         creds.keyId         ? mask(creds.keyId)         : '',
  keySecret:     creds.keySecret     ? '••••••••••••••••'         : '',
  webhookSecret: creds.webhookSecret ? '••••••••••••••••'         : '',
  planIdINR:     creds.planIdINR     ? mask(creds.planIdINR)     : '',
  planIdUSD:     creds.planIdUSD     ? mask(creds.planIdUSD)     : '',
  priceId:       creds.priceId       ? mask(creds.priceId)       : '',
});

module.exports = { encrypt, decrypt, mask, encryptCredentials, decryptCredentials, maskCredentials };
