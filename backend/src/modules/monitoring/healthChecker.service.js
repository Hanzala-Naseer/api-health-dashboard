// src/modules/monitoring/healthChecker.service.js

const axios = require('axios');
const { performance } = require('node:perf_hooks');
const requestBuilder = require('./requestBuilder.service');

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
 * Performs HTTP health check.
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
async function checkEndpoint(endpoint) {
  const start = performance.now();

  try {
    // V1.5 — Build the request with authentication
    // This automatically obtains authentication headers for LOGIN_FLOW
    // and merges them with custom headers.
    const { data: requestData, headers: requestHeaders } = await requestBuilder.buildRequest(endpoint);

    const response = await axios({
      method: endpoint.method,
      url: endpoint.url,
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

module.exports = {
  checkEndpoint,
};