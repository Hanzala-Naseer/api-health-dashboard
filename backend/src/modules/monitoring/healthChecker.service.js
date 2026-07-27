// src/modules/monitoring/healthChecker.service.js

const axios = require('axios');
const { performance } = require('node:perf_hooks');
const requestBuilder = require('./requestBuilder.service');
const responseValidator = require('./responseValidator.service');
const authenticationService = require('../authentication');
const env = require('../../config/env');
const logger = require('../../lib/logger');

// Only these errorTypes are worth retrying — they're transient network
// problems. HTTP_ERROR (unexpected status code), AUTHENTICATION_FAILED and
// TOKEN_EXTRACTION_FAILED are configuration/response problems that will
// fail the exact same way on a retry, so we don't waste time on them.
const RETRYABLE_ERROR_TYPES = new Set([
  'TIMEOUT',
  'DNS_ERROR',
  'CONNECTION_ERROR',
  'UNKNOWN_ERROR',
]);

// Auth types that cache a token across checks. A 401 from these could
// mean the cached token was revoked/expired early (not just "wrong
// status code"), so it's worth one transparent re-auth + retry before
// treating it as a real failure.
const TOKEN_CACHING_AUTH_TYPES = new Set([
  'LOGIN_FLOW',
  'OAUTH2_CLIENT_CREDENTIALS',
  'OAUTH2_REFRESH_TOKEN',
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates standardized failed health check response.
 *
 * Keeps response format consistent for:
 * - TIMEOUT
 * - DNS_ERROR
 * - CONNECTION_ERROR
 * - SSL_ERROR
 * - UNKNOWN_ERROR
 * - AUTHENTICATION_FAILED (V1.5)
 * - TOKEN_EXTRACTION_FAILED (V1.5)
 */
function createErrorResponse(errorType, errorMessage, status = 'ERROR') {
  return {
    status,
    statusCode: null,
    responseTime: null,
    responseSize: null,
    responseHeaders: null,
    errorType,
    errorMessage,
  };
}

/**
 * Converts Node/Axios errors into application level categories.
 *
 * Axios gives technical errors:
 *
 * ENOTFOUND
 * ECONNREFUSED
 * ETIMEDOUT
 * CERT_HAS_EXPIRED
 *
 * We convert them into business friendly errors
 * which Alert System can understand.
 *
 * V1.5: Also handles authentication errors that come from the
 * request builder or from the monitored endpoint itself.
 */
function classifyError(error) {
  // V1.5 — Authentication errors from the request builder
  if (error.message && error.message.startsWith('Authentication error:')) {
    return createErrorResponse(
      'AUTHENTICATION_FAILED',
      error.message.replace('Authentication error: ', ''),
      'DOWN'
    );
  }

  // V1.5 — Token extraction errors from the request builder
  if (error.message && error.message.includes('Failed to extract token')) {
    return createErrorResponse(
      'TOKEN_EXTRACTION_FAILED',
      error.message,
      'DOWN'
    );
  }

  // V1.5 — Login request failed (non-2xx response)
  if (error.message && error.message.startsWith('Login failed')) {
    return createErrorResponse(
      'AUTHENTICATION_FAILED',
      error.message,
      'DOWN'
    );
  }

  // Original error classification
  /*
   * Request timeout
   */
  if (
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT'
  ) {
    return createErrorResponse(
      'TIMEOUT',
      'Request exceeded timeout limit',
      'TIMEOUT'
    );
  }

  /*
   * DNS resolution failed
   */
  if (
    error.code === 'ENOTFOUND'
  ) {
    return createErrorResponse(
      'DNS_ERROR',
      'Domain could not be resolved'
    );
  }

  /*
   * Server refused connection
   */
  if (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ECONNRESET'
  ) {
    return createErrorResponse(
      'CONNECTION_ERROR',
      'Connection could not be established'
    );
  }

  /*
   * SSL certificate problems
   */
  if (
    error.code === 'CERT_HAS_EXPIRED' ||
    error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
  ) {
    return createErrorResponse(
      'SSL_ERROR',
      'SSL certificate validation failed'
    );
  }

  /*
   * Unknown network/application error
   */
  return createErrorResponse(
    'UNKNOWN_ERROR',
    error.message
  );
}

/**
 * Performs a single HTTP health check attempt.
 *
 * Responsibilities:
 *
 * 1. Build the request (including authentication)
 * 2. Execute HTTP request.
 * 3. Measure response metrics.
 * 4. Determine endpoint health.
 * 5. Normalize technical errors.
 *
 * V1.5: Authentication is now handled by requestBuilder.
 * The health checker no longer needs to know about auth types.
 *
 * No:
 * - Database access
 * - Repository calls
 * - Alert logic
 * - Scheduler logic
 */
async function performCheck(endpoint, options = {}) {
  const start = performance.now();

  try {
    // V1.5 — Build the request with authentication
    // This automatically obtains authentication headers for LOGIN_FLOW
    // and merges them with custom headers.
    // V2 — Also resolves dynamic {{placeholder}} values and query params.
    const { url, data: requestData, headers: requestHeaders, params } = await requestBuilder.buildRequest(endpoint);
    
    console.log("=== REQUEST DEBUG ===");
console.log("Method:", endpoint.method);
console.log("URL:", url);
console.log("Query Params:", params);
console.log("Timeout:", endpoint.timeout);
console.log("Headers:", requestHeaders);
console.log("Body:", requestData);
console.log("=====================");
    const response = await axios({
      method: endpoint.method,
      url,
      params,
      timeout: endpoint.timeout,
      headers: requestHeaders,
      data: requestData,

      /*
       * Axios normally throws for:
       *
       * 404
       * 500
       *
       * We disable that because monitoring
       * decides health itself.
       */
      validateStatus: () => true,
    });

    

    const responseTime = Math.round(performance.now() - start);

    const responseBody = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data);

    const responseSize = Number(response.headers['content-length'])
      || Buffer.byteLength(responseBody, 'utf8');

    const isHealthy = response.status === endpoint.expectedStatus;

    // A 401 on a token-caching auth type could just mean our cached token
    // was revoked or expired earlier than we tracked — not a real outage.
    // Clear the cache and retry once, transparently, before calling it DOWN.
    if (
      !isHealthy &&
      response.status === 401 &&
      !options.authRecoveryAttempted &&
      TOKEN_CACHING_AUTH_TYPES.has(endpoint?.auth?.type)
    ) {
      logger.warn(`Got 401 for ${endpoint.name} — clearing cached auth token and retrying once`);
      authenticationService.clearCache(endpoint._id);
      return performCheck(endpoint, { authRecoveryAttempted: true });
    }

    // Status code matched — now check any configured content/header/timing
    // assertions. These only run once the status itself is already right,
    // since a wrong-status response failing a body-content rule too would
    // just produce a confusing, redundant error message.
    if (isHealthy && Array.isArray(endpoint.validationRules) && endpoint.validationRules.length > 0) {
      const validation = responseValidator.validateResponse(
        { headers: response.headers, data: response.data, responseBody, responseSize, responseTime },
        endpoint.validationRules
      );

      if (!validation.valid) {
        return {
          status: 'DOWN',
          statusCode: response.status,
          responseTime,
          responseSize,
          responseHeaders: response.headers,
          errorType: 'VALIDATION_FAILED',
          errorMessage: validation.reason,
        };
      }
    }

    return {
      status: isHealthy ? 'UP' : 'DOWN',
      statusCode: response.status,
      responseTime,
      responseSize,
      responseHeaders: response.headers,
      errorType: isHealthy ? null : 'HTTP_ERROR',
      errorMessage: isHealthy ? null : `Unexpected status code ${response.status}`,
    };
  } catch (error) {
    // V1.5 — Check if this is an authentication error
    // Authentication errors are classified as DOWN with specific error types
    return classifyError(error);
  }
}

/**
 * Performs a health check with retries for transient network failures.
 *
 * Retries use exponential backoff (baseDelay, baseDelay*2, baseDelay*4, ...).
 * A permanent failure (wrong status code, auth failure, etc.) returns
 * immediately on the first attempt — retrying it would just fail the same
 * way and delay the whole scheduler cycle for nothing.
 *
 * The returned result carries a `retryCount` (attempts beyond the first)
 * for scheduler metrics. It isn't part of the HealthCheck schema and is
 * dropped automatically when the result is persisted.
 */
async function checkEndpoint(endpoint) {
  const maxRetries = env.SCHEDULER_RETRY_COUNT;

  let result;
  let attempt = 0;

  while (attempt <= maxRetries) {
    result = await performCheck(endpoint);

    const canRetry = attempt < maxRetries && RETRYABLE_ERROR_TYPES.has(result.errorType);

    if (!canRetry) {
      break;
    }

    const backoffMs = env.SCHEDULER_RETRY_BASE_DELAY_MS * 2 ** attempt;
    attempt += 1;

    logger.warn(
      `Retrying health check → ${endpoint.name} (attempt ${attempt}/${maxRetries}) in ${backoffMs}ms — ${result.errorType}`
    );

    await sleep(backoffMs);
  }

  result.retryCount = attempt;

  return result;
}

module.exports = {
  checkEndpoint,
};