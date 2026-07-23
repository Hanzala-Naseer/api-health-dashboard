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

// HealthCheck.status has two extra values beyond ApiEndpoint.currentStatus —
// TIMEOUT and ERROR are specific failure reasons rather than states, but the
// raw HealthCheck record keeps them distinct (see HealthCheck.model.js).
export const HEALTH_CHECK_STATUS = ['UP', 'DOWN', 'DEGRADED', 'TIMEOUT', 'ERROR'];

export const ALERT_SEVERITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const ALERT_TYPE = ['DOWNTIME', 'SLOW_RESPONSE', 'SSL_EXPIRY', 'STATUS_MISMATCH', 'RECOVERY', 'OTHER'];
