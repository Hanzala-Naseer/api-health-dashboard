const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('./ApiError');

/**
 * Access tokens are short-lived, signed JWTs — stateless by design so most
 * requests never touch the DB. Revocation (logout, session kill) works via
 * the `jti` claim: every access token's jti is mirrored in an AuthSession
 * row, and authenticate() (see middlewares/auth.middleware.js) rejects any
 * token whose session has been revoked/expired, even if the JWT itself is
 * still cryptographically valid.
 *
 * Refresh tokens are deliberately NOT JWTs — they're opaque random strings
 * (see utils/crypto.js generateSecureToken), hashed with SHA-256 and
 * compared against RefreshToken.tokenHash in the DB. This is the standard
 * pattern for rotation + reuse detection: a JWT can't be "deleted" from the
 * DB to invalidate it, but an opaque token's hash can.
 */

function signAccessToken({ sub, role, jti }) {
  return jwt.sign({ role }, env.JWT_ACCESS_SECRET, {
    subject: sub,
    jwtid: jti,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token expired.', 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid access token.', 'INVALID_TOKEN');
  }
}

/** Parses short duration strings ("15m", "7d", "1h", "30d") into milliseconds. */
function parseDurationToMs(duration) {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(duration);
  if (!match) throw new Error(`Invalid duration format: "${duration}"`);
  const value = Number(match[1]);
  const unitMs = { ms: 1, s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * unitMs[match[2]];
}

module.exports = { signAccessToken, verifyAccessToken, parseDurationToMs };
