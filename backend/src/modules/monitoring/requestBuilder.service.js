// src/modules/monitoring/requestBuilder.service.js

/**
 * requestBuilder.service.js
 *
 * WHY this was extracted from healthChecker.service.js (Feature 2):
 * The logic for turning an endpoint's configured headers/body/bodyType
 * into an actual outgoing HTTP request was previously inlined inside the
 * health checker. That made it impossible to reuse or unit-test in
 * isolation. This module has ONE job — given an endpoint-like config
 * (`{ method, url, headers, queryParams, bodyType, body }`), produce the
 * exact `{ url, data, headers, params }` axios should send.
 *
 * V1.5: Integrates with the Authentication Service — auth headers are
 * automatically obtained and merged with custom headers (auth wins on
 * conflict).
 *
 * V2: Adds
 *   - dynamic {{placeholder}} resolution in the URL, custom headers, and
 *     query params (see helpers/templateResolver)
 *   - a query-param channel (both static endpoint.queryParams and
 *     provider-supplied auth query params, e.g. API_KEY_QUERY)
 *   - two more body types: XML and MULTIPART (fields only, no file uploads)
 *
 * No:
 * - HTTP execution
 * - Database access
 * - Error classification
 */

const crypto = require('node:crypto');
const authenticationService = require('../authentication');
const { resolveTemplateString, resolveTemplatesInObject } = require('../authentication/helpers/templateResolver');
const logger = require('../../lib/logger');

/**
 * Normalizes `headers`/`queryParams` into a plain string->string object
 * regardless of whether it arrived as a Mongoose Map (full document) or
 * plain object (lean()). Empty/blank keys are dropped defensively.
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
 * Builds a multipart/form-data body from plain text fields (no file
 * uploads — that needs streaming/binary handling this monitoring engine
 * has no use for). Boundary is random per request, same as any HTTP
 * client would generate.
 */
function buildMultipartBody(fields) {
  const boundary = `PulseOpsBoundary${crypto.randomBytes(12).toString('hex')}`;
  const entries = Object.entries(fields || {});

  const parts = entries.map(
    ([key, value]) =>
      `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
  );

  const body = parts.join('') + `--${boundary}--\r\n`;

  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
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

  if (bodyType === 'XML') {
    // Sent exactly as stored — we don't attempt to parse/validate XML here.
    const data = typeof endpoint.body === 'string' ? endpoint.body : String(endpoint.body);
    if (!hasContentType) headers['Content-Type'] = 'application/xml';
    return { data, headers };
  }

  if (bodyType === 'MULTIPART') {
    const obj = typeof endpoint.body === 'string' ? tryParseJson(endpoint.body) : endpoint.body;
    const { body, contentType } = buildMultipartBody(typeof obj === 'object' && obj ? obj : {});
    if (!hasContentType) headers['Content-Type'] = contentType;
    return { data: body, headers };
  }

  // TEXT — send exactly as stored, no Content-Type assumed on the user's behalf.
  const data = typeof endpoint.body === 'string' ? endpoint.body : JSON.stringify(endpoint.body);
  return { data, headers };
}

/**
 * Merges authentication values with custom (endpoint-configured) values.
 *
 * Authentication values take precedence — if a custom header/param and an
 * authentication header/param have the same key, authentication wins.
 *
 * This is important for security: if a user configures a custom
 * Authorization header and also uses STATIC_BEARER, the bearer token
 * should override the custom header.
 */
function mergeAuthValues(customValues, authValues) {
  return {
    ...(customValues || {}),
    ...(authValues || {}),
  };
}

/**
 * Convenience entry point: given a raw endpoint config, returns the fully
 * resolved `{ url, data, headers, params }` axios request pieces in one
 * call.
 *
 * V1.5: Automatically obtains authentication headers for the endpoint.
 * V2: Also resolves dynamic {{placeholder}} values and builds query params.
 *
 * @param {Object} endpoint - The endpoint document (with auth field)
 * @param {Object} context - Optional execution context (logger, etc.)
 * @returns {Promise<Object>} - { url, data, headers, params }
 * @throws {Error} - If authentication fails
 */
async function buildRequest(endpoint, context = { logger }) {
  // Placeholders like {{token}} aren't available at this generic layer —
  // that context only exists inside a specific auth provider (e.g. an
  // OAuth provider formatting its own header). Here we only resolve the
  // values every request has regardless of auth type.
  const templateContext = { environment: process.env.NODE_ENV || 'production' };

  // Step 1: resolve dynamic placeholders in the URL itself
  const url = resolveTemplateString(endpoint.url, templateContext);

  // Step 2: build custom headers/query params, with placeholders resolved
  const customHeaders = resolveTemplatesInObject(normalizeHeaders(endpoint.headers), templateContext);
  const customParams = resolveTemplatesInObject(normalizeHeaders(endpoint.queryParams), templateContext);

  // Step 3: get authentication headers + query params from the auth service
  let authHeaders = {};
  let authParams = {};

  try {
    authHeaders = await authenticationService.getAuthenticationHeaders(endpoint, context);
    authParams = await authenticationService.getAuthenticationQueryParams(endpoint, context);
  } catch (error) {
    // Re-throw with context
    throw new Error(`Authentication error: ${error.message}`);
  }

  // Step 4: merge (auth takes precedence over custom, for both channels)
  const finalHeaders = mergeAuthValues(customHeaders, authHeaders);
  const finalParams = mergeAuthValues(customParams, authParams);

  // Step 5: build the request body
  const { data, headers: bodyHeaders } = buildRequestBody(endpoint, finalHeaders);

  // Return the complete request configuration
  return {
    url,
    data,
    headers: bodyHeaders,
    params: finalParams,
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
 * @returns {Object} - { url, data, headers, params }
 */
function buildRequestSync(endpoint) {
  const templateContext = { environment: process.env.NODE_ENV || 'production' };
  const url = resolveTemplateString(endpoint.url, templateContext);
  const customHeaders = resolveTemplatesInObject(normalizeHeaders(endpoint.headers), templateContext);
  const params = resolveTemplatesInObject(normalizeHeaders(endpoint.queryParams), templateContext);
  const { data, headers } = buildRequestBody(endpoint, customHeaders);
  return { url, data, headers, params };
}

module.exports = {
  normalizeHeaders,
  tryParseJson,
  buildRequestBody,
  buildMultipartBody,
  mergeAuthValues,
  buildRequest,
  buildRequestSync,
};
