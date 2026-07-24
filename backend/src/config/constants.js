

// const COOKIE_NAMES = {
//   ACCESS_TOKEN: 'gk_access_token',
//   REFRESH_TOKEN: 'gk_refresh_token',
// };

// const TOKEN_TYPES = {
//   ACCESS: 'access',
//   REFRESH: 'refresh',
//   API: 'api',
// };

// // Mirrors enum OTP_PURPOSE in models/OtpVerification.model.js
// const OTP_PURPOSE = {
//   REGISTRATION: 'REGISTRATION',
//   PASSWORD_RESET: 'PASSWORD_RESET',
//   EMAIL_CHANGE: 'EMAIL_CHANGE',
//   PHONE_VERIFICATION: 'PHONE_VERIFICATION',
//   TWO_FACTOR_AUTH: 'TWO_FACTOR_AUTH',
//   SUSPICIOUS_LOGIN_CONFIRM: 'SUSPICIOUS_LOGIN_CONFIRM',
//   ACCOUNT_RECOVERY: 'ACCOUNT_RECOVERY',
// };

// // Mirrors enum OTP_STATUS in models/OtpVerification.model.js
// const OTP_STATUS = {
//   PENDING: 'PENDING',
//   VERIFIED: 'VERIFIED',
//   EXPIRED: 'EXPIRED',
//   MAX_ATTEMPTS_REACHED: 'MAX_ATTEMPTS_REACHED',
//   REVOKED: 'REVOKED',
// };

// // Mirrors enum USER_STATUS in models/User.model.js
// const USER_STATUS = {
//   PENDING_EMAIL_VERIFICATION: 'PENDING_EMAIL_VERIFICATION',
//   ACTIVE: 'ACTIVE',
//   SUSPENDED: 'SUSPENDED',
//   LOCKED: 'LOCKED',
//   DEACTIVATED: 'DEACTIVATED',
//   DELETED: 'DELETED',
// };

// // Mirrors enum USER_ROLES in models/User.model.js
// const USER_ROLES = {
//   MEMBER: 'MEMBER',
//   ADMIN: 'ADMIN',
  
// };

// // Activity log event names written into UserActivityLog.event
// // (kept as free-text in the schema, so we standardize values here)
// const ACTIVITY_EVENTS = {
//   USER_REGISTERED: 'USER_REGISTERED',
//   EMAIL_VERIFICATION_OTP_SENT: 'EMAIL_VERIFICATION_OTP_SENT',
//   EMAIL_VERIFICATION_OTP_RESENT: 'EMAIL_VERIFICATION_OTP_RESENT',
//   EMAIL_VERIFIED: 'EMAIL_VERIFIED',
//   EMAIL_VERIFICATION_FAILED: 'EMAIL_VERIFICATION_FAILED',
//   LOGIN_SUCCESS: 'LOGIN_SUCCESS',
//   LOGIN_FAILED: 'LOGIN_FAILED',
//   NEW_DEVICE_LOGIN_DETECTED: 'NEW_DEVICE_LOGIN_DETECTED',
//   LOGOUT: 'LOGOUT',
//   LOGOUT_ALL_DEVICES: 'LOGOUT_ALL_DEVICES',
//   PASSWORD_CHANGED: 'PASSWORD_CHANGED',
//   PASSWORD_CHANGE_FAILED: 'PASSWORD_CHANGE_FAILED',
//   PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
//   PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
//   ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
//   TOKEN_REFRESHED: 'TOKEN_REFRESHED',
//   REFRESH_TOKEN_REUSE_DETECTED: 'REFRESH_TOKEN_REUSE_DETECTED',
// };

// module.exports = {
//   COOKIE_NAMES,
//   TOKEN_TYPES,
//   OTP_PURPOSE,
//   OTP_STATUS,
//   USER_STATUS,
//   USER_ROLES,
//   ACTIVITY_EVENTS,
// };


// src/config/constants.js

/**
 * Application-wide constants.
 * WHY: Magic strings ("access", "REGISTRATION", etc.) scattered across the
 * codebase are a maintenance hazard. Centralizing them means renaming or
 * auditing usages is a single grep, and typos are caught by requiring
 * these constants instead of retyping strings.
 */

const COOKIE_NAMES = {
  ACCESS_TOKEN: 'gk_access_token',
  REFRESH_TOKEN: 'gk_refresh_token',
};

const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  API: 'api',
};

// Mirrors enum OTP_PURPOSE in models/OtpVerification.model.js
const OTP_PURPOSE = {
  REGISTRATION: 'REGISTRATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
  EMAIL_CHANGE: 'EMAIL_CHANGE',
  PHONE_VERIFICATION: 'PHONE_VERIFICATION',
  TWO_FACTOR_AUTH: 'TWO_FACTOR_AUTH',
  SUSPICIOUS_LOGIN_CONFIRM: 'SUSPICIOUS_LOGIN_CONFIRM',
  ACCOUNT_RECOVERY: 'ACCOUNT_RECOVERY',
};

// Mirrors enum OTP_STATUS in models/OtpVerification.model.js
const OTP_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  EXPIRED: 'EXPIRED',
  MAX_ATTEMPTS_REACHED: 'MAX_ATTEMPTS_REACHED',
  REVOKED: 'REVOKED',
};

// Mirrors enum USER_STATUS in models/User.model.js
const USER_STATUS = {
  PENDING_EMAIL_VERIFICATION: 'PENDING_EMAIL_VERIFICATION',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  LOCKED: 'LOCKED',
  DEACTIVATED: 'DEACTIVATED',
  DELETED: 'DELETED',
};

// Mirrors enum USER_ROLES in models/User.model.js
const USER_ROLES = {
  MEMBER: 'MEMBER',
  ADMIN: 'ADMIN',
  
};

// Activity log event names written into UserActivityLog.event
// (kept as free-text in the schema, so we standardize values here)
const ACTIVITY_EVENTS = {
  USER_REGISTERED: 'USER_REGISTERED',
  EMAIL_VERIFICATION_OTP_SENT: 'EMAIL_VERIFICATION_OTP_SENT',
  EMAIL_VERIFICATION_OTP_RESENT: 'EMAIL_VERIFICATION_OTP_RESENT',
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',
  EMAIL_VERIFICATION_FAILED: 'EMAIL_VERIFICATION_FAILED',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  NEW_DEVICE_LOGIN_DETECTED: 'NEW_DEVICE_LOGIN_DETECTED',
  LOGOUT: 'LOGOUT',
  LOGOUT_ALL_DEVICES: 'LOGOUT_ALL_DEVICES',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_CHANGE_FAILED: 'PASSWORD_CHANGE_FAILED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  REFRESH_TOKEN_REUSE_DETECTED: 'REFRESH_TOKEN_REUSE_DETECTED',
};

// ============================================================
// V1.5 — Authentication Types
// ============================================================

/**
 * Authentication types supported by PulseOps monitoring.
 *
 * NONE         — No authentication (public endpoints)
 * STATIC_BEARER — Static Bearer token (existing behavior)
 * API_KEY       — API key authentication (header-based)
 * BASIC         — Basic authentication (username:password)
 * LOGIN_FLOW    — Automatic login flow (new in V1.5)
 */
const AUTH_TYPES = {
  NONE: 'NONE',
  STATIC_BEARER: 'STATIC_BEARER',
  API_KEY: 'API_KEY',
  BASIC: 'BASIC',
  LOGIN_FLOW: 'LOGIN_FLOW',
};

/** Default authentication type when none is specified. */
const AUTH_TYPE_DEFAULT = AUTH_TYPES.NONE;

/**
 * Default configuration for LOGIN_FLOW authentication.
 */
const LOGIN_FLOW_DEFAULTS = {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  tokenPath: 'data.accessToken',
};

module.exports = {
  COOKIE_NAMES,
  TOKEN_TYPES,
  OTP_PURPOSE,
  OTP_STATUS,
  USER_STATUS,
  USER_ROLES,
  ACTIVITY_EVENTS,
  AUTH_TYPES,
  AUTH_TYPE_DEFAULT,
  LOGIN_FLOW_DEFAULTS,
};