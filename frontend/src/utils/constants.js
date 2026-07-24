// // Mirrors backend enums exactly (endpoint.validation.js / ApiEndpoint.model.js)
// // so form <select> options and filters never send a value the backend rejects.

// export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

// export const ENDPOINT_STATUS = ['UP', 'DOWN', 'DEGRADED', 'UNKNOWN'];

// export const ENDPOINT_STATUS_LABELS = {
//   UP: 'Online',
//   DOWN: 'Offline',
//   DEGRADED: 'Slow',
//   UNKNOWN: 'Unknown',
// };

// // HealthCheck.status has two extra values beyond ApiEndpoint.currentStatus —
// // TIMEOUT and ERROR are specific failure reasons rather than states, but the
// // raw HealthCheck record keeps them distinct (see HealthCheck.model.js).
// export const HEALTH_CHECK_STATUS = ['UP', 'DOWN', 'DEGRADED', 'TIMEOUT', 'ERROR'];

// export const ALERT_SEVERITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// export const ALERT_TYPE = ['DOWNTIME', 'SLOW_RESPONSE', 'SSL_EXPIRY', 'STATUS_MISMATCH', 'RECOVERY', 'OTHER'];


// Mirrors backend enums exactly (endpoint.validation.js / ApiEndpoint.model.js)
// so form <select> options and filters never send a value the backend rejects.

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export const ENDPOINT_STATUS = ['UP', 'DOWN', 'DEGRADED', 'UNKNOWN'];

export const ENDPOINT_STATUS_LABELS = {
  UP: 'Online',
  DOWN: 'Offline',
  DEGRADED: 'Slow',
  UNKNOWN: 'Unknown',
};

// HealthCheck.status has two extra values beyond ApiEndpoint.currentStatus â€”
// TIMEOUT and ERROR are specific failure reasons rather than states, but the
// raw HealthCheck record keeps them distinct (see HealthCheck.model.js).
export const HEALTH_CHECK_STATUS = ['UP', 'DOWN', 'DEGRADED', 'TIMEOUT', 'ERROR'];

export const ALERT_SEVERITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const ALERT_TYPE = ['DOWNTIME', 'SLOW_RESPONSE', 'SSL_EXPIRY', 'STATUS_MISMATCH', 'RECOVERY', 'OTHER'];

// ============================================================
// V1.5 — Authentication Types (mirrors backend)
// ============================================================

/**
 * Authentication types supported by PulseOps monitoring.
 * Mirrors src/config/constants.js in the backend.
 */
export const AUTH_TYPES = ['NONE', 'STATIC_BEARER', 'API_KEY', 'BASIC', 'LOGIN_FLOW'];

export const AUTH_TYPE_LABELS = {
  NONE: 'None (Public)',
  STATIC_BEARER: 'Static Bearer Token',
  API_KEY: 'API Key',
  BASIC: 'Basic Authentication',
  LOGIN_FLOW: 'Login Flow (Auto-login)',
};

export const AUTH_TYPE_DESCRIPTIONS = {
  NONE: 'No authentication required — public endpoint.',
  STATIC_BEARER: 'Send a static Bearer token in the Authorization header.',
  API_KEY: 'Send an API key in a custom header.',
  BASIC: 'Send username and password via Basic Authentication.',
  LOGIN_FLOW: 'Automatically login before each check and use the returned token.',
};

export const LOGIN_HTTP_METHODS = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];