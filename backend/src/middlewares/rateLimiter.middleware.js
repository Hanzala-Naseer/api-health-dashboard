const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * WHY per-route limiters instead of one global limiter:
 * Auth endpoints (register, login, OTP) are brute-force / enumeration
 * targets and need much tighter limits than general API traffic. A single
 * global limiter would either be too loose for auth or too strict for
 * normal browsing.
 *
 * NOTE: In-memory store is fine for a single instance / development. In a
 * multi-instance production deployment, swap the `store` option for a
 * Redis-backed store (rate-limit-redis) so limits are shared across
 * instances — the rest of this module is unaffected by that change.
 */
function buildLimiter({ windowMinutes, max, message, keyGenerator }) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => req.ip),
    handler: (req, res, next) => {
      next(ApiError.tooManyRequests(message || 'Too many requests, please try again later.', 'RATE_LIMITED'));
    },
  });
}

// General API traffic
const globalLimiter = buildLimiter({
  windowMinutes: env.RATE_LIMIT_WINDOW_MINUTES,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests. Please slow down.',
});

// Tight limiter for register/login/forgot-password style endpoints
const authLimiter = buildLimiter({
  windowMinutes: env.AUTH_RATE_LIMIT_WINDOW_MINUTES,
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many authentication attempts. Please try again later.',
});

// Very tight limiter for OTP requests — combines IP with email to stop both
// a single IP hammering many accounts and one account being hammered from
// rotating IPs (the OTP resend cooldown in the service layer covers the
// latter case with DB-backed precision; this is the first line of defense).
const otpRequestLimiter = buildLimiter({
  windowMinutes: 15,
  max: 8,
  message: 'Too many OTP requests. Please try again later.',
  keyGenerator: (req) => `${req.ip}:${(req.body && req.body.email) || 'unknown'}`,
});

module.exports = { globalLimiter, authLimiter, otpRequestLimiter };
