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
export const AUTH_TYPES = [
  'NONE',
  'STATIC_BEARER',
  'API_KEY',
  'BASIC',
  'LOGIN_FLOW',
  'API_KEY_QUERY',
  'HMAC',
  'OAUTH2_CLIENT_CREDENTIALS',
  'OAUTH2_REFRESH_TOKEN',
];

export const AUTH_TYPE_LABELS = {
  NONE: 'None (Public)',
  STATIC_BEARER: 'Static Bearer Token',
  API_KEY: 'API Key (Header)',
  BASIC: 'Basic Authentication',
  LOGIN_FLOW: 'Login Flow (Auto-login)',
  API_KEY_QUERY: 'API Key (Query Param)',
  HMAC: 'HMAC Signed Request',
  OAUTH2_CLIENT_CREDENTIALS: 'OAuth2 (Client Credentials)',
  OAUTH2_REFRESH_TOKEN: 'OAuth2 (Refresh Token)',
};

export const AUTH_TYPE_DESCRIPTIONS = {
  NONE: 'No authentication required — public endpoint.',
  STATIC_BEARER: 'Send a static Bearer token in the Authorization header.',
  API_KEY: 'Send an API key in a custom header.',
  BASIC: 'Send username and password via Basic Authentication.',
  LOGIN_FLOW: 'Automatically login before each check and use the returned token. Supports multi-step flows with CSRF tokens and session cookies.',
  API_KEY_QUERY: 'Send an API key as a query string parameter (e.g. ?api_key=...).',
  HMAC: 'Sign each request with an HMAC-SHA256 signature computed from a shared secret.',
  OAUTH2_CLIENT_CREDENTIALS: 'Exchange a client ID and secret for an access token, cached and renewed automatically.',
  OAUTH2_REFRESH_TOKEN: 'Exchange a pre-obtained refresh token for an access token, cached and renewed automatically.',
};

export const LOGIN_HTTP_METHODS = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];

// ============================================================
// V2 — Request Body Types
// ============================================================

export const BODY_TYPES = ['NONE', 'JSON', 'TEXT', 'FORM_URLENCODED', 'XML', 'MULTIPART'];

export const BODY_TYPE_LABELS = {
  NONE: 'No Body',
  JSON: 'JSON',
  TEXT: 'Raw Text',
  FORM_URLENCODED: 'Form URL-Encoded',
  XML: 'Raw XML',
  MULTIPART: 'Multipart Form (fields only)',
};

// ============================================================
// V2 — Response Validation Rules
// ============================================================

export const VALIDATION_RULE_TYPES = [
  'HEADER_EXISTS',
  'HEADER_EQUALS',
  'BODY_CONTAINS',
  'BODY_NOT_CONTAINS',
  'REGEX',
  'JSONPATH_EQUALS',
  'JSONPATH_EXISTS',
  'MIN_SIZE',
  'MAX_SIZE',
  'MAX_RESPONSE_TIME',
];

export const VALIDATION_RULE_LABELS = {
  HEADER_EXISTS: 'Header Exists',
  HEADER_EQUALS: 'Header Equals',
  BODY_CONTAINS: 'Body Contains',
  BODY_NOT_CONTAINS: 'Body Does Not Contain',
  REGEX: 'Body Matches Regex',
  JSONPATH_EQUALS: 'JSON Path Equals',
  JSONPATH_EXISTS: 'JSON Path Exists',
  MIN_SIZE: 'Minimum Response Size (bytes)',
  MAX_SIZE: 'Maximum Response Size (bytes)',
  MAX_RESPONSE_TIME: 'Maximum Response Time (ms)',
};

/**
 * Which fields each validation rule type needs, and what to send them as.
 * Used to drive the dynamic rule-editor form — see ValidationRulesEditor.jsx.
 */
export const VALIDATION_RULE_FIELDS = {
  HEADER_EXISTS: [{ name: 'header', label: 'Header Name', type: 'text', placeholder: 'Content-Type' }],
  HEADER_EQUALS: [
    { name: 'header', label: 'Header Name', type: 'text', placeholder: 'Content-Type' },
    { name: 'value', label: 'Expected Value', type: 'text', placeholder: 'application/json' },
  ],
  BODY_CONTAINS: [{ name: 'value', label: 'Text', type: 'text', placeholder: '"status":"ok"' }],
  BODY_NOT_CONTAINS: [{ name: 'value', label: 'Text', type: 'text', placeholder: 'error' }],
  REGEX: [{ name: 'pattern', label: 'Pattern', type: 'text', placeholder: '"count":\\d+' }],
  JSONPATH_EQUALS: [
    { name: 'path', label: 'JSON Path', type: 'text', placeholder: 'data.status' },
    { name: 'value', label: 'Expected Value', type: 'text', placeholder: 'ok' },
  ],
  JSONPATH_EXISTS: [{ name: 'path', label: 'JSON Path', type: 'text', placeholder: 'data.items[0].id' }],
  MIN_SIZE: [{ name: 'bytes', label: 'Bytes', type: 'number', placeholder: '100' }],
  MAX_SIZE: [{ name: 'bytes', label: 'Bytes', type: 'number', placeholder: '50000' }],
  MAX_RESPONSE_TIME: [{ name: 'ms', label: 'Milliseconds', type: 'number', placeholder: '2000' }],
};

// ============================================================
// V2 — Multi-step Login Flow (extraction sources)
// ============================================================

export const LOGIN_STEP_EXTRACT_SOURCES = ['body', 'header', 'cookie'];