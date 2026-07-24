// src/modules/monitoring/requestBuilder.service.js

/**
 * requestBuilder.service.js
 *
 * WHY this was extracted from healthChecker.service.js (Feature 2):
 * The logic for turning an endpoint's configured headers/body/bodyType
 * into an actual outgoing HTTP request was previously inlined inside the
 * health checker. That made it impossible to reuse or unit-test in
 * isolation. This module has ONE job — given an endpoint-like config
 * (`{ method, headers, bodyType, body }`), produce the exact
 * `{ data, headers }` axios should send. Behavior is unchanged from the
 * original inline implementation.
 *
 * V1.5: Now also integrates with the Authentication Service.
 * Authentication headers are automatically obtained and merged with
 * custom headers. Authentication headers take precedence over custom
 * headers (if both specify the same header, authentication wins).
 *
 * No:
 * - HTTP execution
 * - Database access
 * - Error classification
 */

const authenticationService = require('../authentication');
const logger = require('../../lib/logger');

/**
 * Normalizes `headers` into a plain string->string object regardless of
 * whether it arrived as a Mongoose Map (full document) or plain object
 * (lean()). Empty/blank keys are dropped defensively.
 */
function normalizeHeaders(headers) {
  if (!headers) return {};

  const entries = headers instanceof Map ? Array.from(headers.entries()) : Object.entries(headers);

  return entries.reduce((acc, [key, value]) => {
    if (key && String(key).trim()) {
      acc[String(key).trim()] = value == null ? '' : String(value);
    }
    return acc;
  }, {});
}

/** Best-effort JSON parse — returns the original string if it isn't valid JSON. */
function tryParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Builds the axios `data` payload (and any Content-Type header it implies)
 * from the endpoint's configured bodyType/body. Returns `{ data, headers }`
 * where `headers` is the (possibly augmented) header set to send.
 *
 * NONE / GET / HEAD requests never get a body — sending one to a GET/HEAD
 * endpoint is either ignored by the server or actively rejected, so we only
 * attach it for methods that meaningfully accept one.
 */
function buildRequestBody(endpoint, headers) {
  const bodyType = endpoint.bodyType || 'NONE';
  const methodAllowsBody = !['GET', 'HEAD'].includes(String(endpoint.method || '').toUpperCase());

  if (bodyType === 'NONE' || endpoint.body == null || !methodAllowsBody) {
    return { data: undefined, headers };
  }

  const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');

  if (bodyType === 'JSON') {
    const data = typeof endpoint.body === 'string' ? tryParseJson(endpoint.body) : endpoint.body;
    if (!hasContentType) headers['Content-Type'] = 'application/json';
    return { data, headers };
  }

  if (bodyType === 'FORM_URLENCODED') {
    const obj = typeof endpoint.body === 'string' ? tryParseJson(endpoint.body) : endpoint.body;
    const data = new URLSearchParams(typeof obj === 'object' && obj ? obj : {}).toString();
    if (!hasContentType) headers['Content-Type'] = 'application/x-www-form-urlencoded';
    return { data, headers };
  }

  // TEXT — send exactly as stored, no Content-Type assumed on the user's behalf.
  const data = typeof endpoint.body === 'string' ? endpoint.body : JSON.stringify(endpoint.body);
  return { data, headers };
}

/**
 * Merges authentication headers with custom headers.
 *
 * Authentication headers take precedence — if a custom header and an
 * authentication header have the same key, the authentication header wins.
 *
 * This is important for security: if a user configures a custom
 * Authorization header and also uses STATIC_BEARER, the bearer token
 * should override the custom header.
 *
 * @param {Object} customHeaders - Headers from the endpoint config
 * @param {Object} authHeaders - Headers from the authentication service
 * @returns {Object} - Merged headers
 */
function mergeHeaders(customHeaders, authHeaders) {
  const base = normalizeHeaders(customHeaders);
  const auth = authHeaders || {};

  // Authentication headers take precedence
  return {
    ...base,
    ...auth,
  };
}

/**
 * Convenience entry point: given a raw endpoint config, returns the fully
 * resolved `{ data, headers }` axios request pieces in one call.
 *
 * V1.5: Automatically obtains authentication headers for the endpoint.
 *
 * @param {Object} endpoint - The endpoint document (with auth field)
 * @param {Object} context - Optional execution context (logger, etc.)
 * @returns {Promise<Object>} - { data, headers }
 * @throws {Error} - If authentication fails
 */
async function buildRequest(endpoint, context = { logger }) {

  console.log("========== MONITORING ENDPOINT ==========");
console.dir(endpoint, { depth: null });
console.log("=========================================");
  // Step 1: Build custom headers from the endpoint config
  const customHeaders = normalizeHeaders(endpoint.headers);

  // Step 2: Get authentication headers from the authentication service
  let authHeaders = {};

  try {
    authHeaders = await authenticationService.getAuthenticationHeaders(endpoint, context);
  } catch (error) {
    // Re-throw with context
    throw new Error(`Authentication error: ${error.message}`);
  }

  // Step 3: Merge authentication headers with custom headers
  // Authentication headers take precedence (important for security)
  const finalHeaders = mergeHeaders(customHeaders, authHeaders);

  // Step 4: Build the request body
  const { data, headers: bodyHeaders } = buildRequestBody(endpoint, finalHeaders);

  // Return the complete request configuration
  return {
    data,
    headers: bodyHeaders,
    // Also return the raw pieces for debugging or advanced use
    _authHeaders: authHeaders,
    _customHeaders: customHeaders,
  };
}

/**
 * Synchronous version of buildRequest that builds the request without
 * authentication. This is used by the health checker for endpoints that
 * don't need authentication, or for testing.
 *
 * @param {Object} endpoint - The endpoint document
 * @returns {Object} - { data, headers }
 */
function buildRequestSync(endpoint) {
  const customHeaders = normalizeHeaders(endpoint.headers);
  const { data, headers } = buildRequestBody(endpoint, customHeaders);
  return { data, headers };
}

module.exports = {
  normalizeHeaders,
  tryParseJson,
  buildRequestBody,
  mergeHeaders,
  buildRequest,
  buildRequestSync,
};