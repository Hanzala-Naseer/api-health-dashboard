const crypto = require('crypto');
const env = require('../config/env');

/**
 * WHY these live separately from bcrypt password hashing:
 * OTPs and opaque tokens (refresh tokens, password-reset tokens, email-change
 * tokens) are high-entropy random values, not user-chosen secrets. Hashing
 * them with bcrypt would be needlessly slow for high-volume verification
 * (every /refresh call, every OTP attempt). SHA-256 is appropriate here
 * because these values already have enough entropy to resist brute force
 * (a 6-digit OTP is deliberately short-lived + attempt-limited instead —
 * see auth.service.js OTP_MAX_ATTEMPTS).
 */

/** Generates a numeric OTP of configured length, e.g. "482913". */
function generateNumericOtp(length = env.OTP_LENGTH) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return crypto.randomInt(min, max + 1).toString();
}

/** SHA-256 hash for OTPs / opaque tokens (fast, deterministic, one-way). */
function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/** Generates a cryptographically secure random token (hex string). */
function generateSecureToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString('hex');
}

/** Constant-time string comparison to prevent timing attacks on token/OTP checks. */
function safeCompare(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = {
  generateNumericOtp,
  sha256,
  generateSecureToken,
  safeCompare,
};
