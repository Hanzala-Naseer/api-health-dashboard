// src/modules/authentication/providers/loginFlow.provider.js

const axios = require('axios');
const { performance } = require('node:perf_hooks');

const BaseAuthenticationProvider = require('./base.provider');
const { AUTH_TYPES } = require('../../../config/constants');
const { extractTokenOrNull } = require('../helpers/tokenExtractor');
const multiStepLogin = require('../helpers/multiStepLogin');

// Simple in-memory token cache
// In production, this should be replaced with Redis or another distributed cache
const tokenCache = new Map();

/**
 * LOGIN_FLOW Authentication Provider.
 *
 * Two modes, both configured under auth.loginConfig:
 *
 * SINGLE-STEP (original, unchanged):
 *   auth.loginConfig.loginUrl = 'https://api.example.com/auth/login'
 *   auth.loginConfig.method = 'POST'
 *   auth.loginConfig.headers = { 'Content-Type': 'application/json' }
 *   auth.loginConfig.body = { 'email': 'user@example.com', 'password': 'secret' }
 *   auth.loginConfig.tokenPath = 'data.accessToken'
 *   auth.loginConfig.asBearer = true
 *   auth.loginConfig.cacheTtlSeconds = 0 // 0 = no caching
 *
 * MULTI-STEP (V2 — CSRF/session flows, e.g. login page -> CSRF -> login ->
 * session -> token):
 *   auth.loginConfig.steps = [ ... ]        // see helpers/multiStepLogin.js
 *   auth.loginConfig.tokenVariable = 'token' // which extracted var becomes the auth token
 *   auth.loginConfig.forwardCookies = false  // if true, also send the session
 *                                             // cookie jar on the monitored request
 *   auth.loginConfig.asBearer / cacheTtlSeconds reused from above
 *
 * This produces:
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 *   (+ Cookie: ... if forwardCookies is set)
 */
class LoginFlowAuthenticationProvider extends BaseAuthenticationProvider {
  getAuthType() {
    return AUTH_TYPES.LOGIN_FLOW;
  }

  supports(endpoint) {
    return endpoint?.auth?.type === this.getAuthType();
  }

  async getAuthenticationHeaders(endpoint, context) {
    const config = endpoint?.auth?.loginConfig;

    if (!config) {
      throw new Error('LOGIN_FLOW authentication requires loginConfig');
    }

    if (Array.isArray(config.steps) && config.steps.length > 0) {
      return this._getMultiStepHeaders(endpoint, config, context);
    }

    return this._getSingleStepHeaders(endpoint, config, context);
  }

  /**
   * Multi-step flow: runs the configured steps, caches the resulting
   * session (token + cookie jar) if cacheTtlSeconds is set.
   */
  async _getMultiStepHeaders(endpoint, config, context) {
    const asBearer = config.asBearer !== false;
    const tokenVariable = config.tokenVariable || 'token';
    const cacheKey = `${endpoint._id}:multistep`;

    if (config.cacheTtlSeconds && config.cacheTtlSeconds > 0) {
      const cached = tokenCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return this._buildHeaders(cached.token, asBearer, config.forwardCookies ? cached.cookieHeader : null);
      }
    }

    const { vars, cookieHeader } = await multiStepLogin.executeSteps(config.steps, { timeout: 30000 });

    const token = vars[tokenVariable];

    if (context?.logger) {
      context.logger.debug(
        `[LoginFlow] Multi-step login for endpoint ${endpoint._id} completed (${config.steps.length} steps)`
      );
    }

    if (!token) {
      throw new Error(`Multi-step login did not produce a "${tokenVariable}" variable`);
    }

    if (config.cacheTtlSeconds && config.cacheTtlSeconds > 0) {
      tokenCache.set(cacheKey, {
        token,
        cookieHeader,
        expiresAt: Date.now() + config.cacheTtlSeconds * 1000,
      });
    }

    return this._buildHeaders(token, asBearer, config.forwardCookies ? cookieHeader : null);
  }

  /** Original single-step flow, unchanged apart from removing debug logging. */
  async _getSingleStepHeaders(endpoint, config, context) {
    const { loginUrl, method = 'POST', headers = {}, body, tokenPath = 'data.accessToken', asBearer = true } = config;

    // Validate required fields
    if (!loginUrl || loginUrl.trim() === '') {
      throw new Error('LOGIN_FLOW authentication requires a loginUrl');
    }

    if (!body || Object.keys(body).length === 0) {
      throw new Error('LOGIN_FLOW authentication requires a login body');
    }

    // Check cache if TTL is set
    const cacheKey = `${endpoint._id}:${loginUrl}`;
    if (config.cacheTtlSeconds && config.cacheTtlSeconds > 0) {
      const cached = tokenCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        // Return cached token
        return this._formatToken(cached.token, asBearer);
      }
    }

    // Execute login request
    const start = performance.now();

    try {
      const response = await axios({
        method: method.toLowerCase(),
        url: loginUrl.trim(),
        headers: this._normalizeHeaders(headers),
        data: body,
        timeout: 30000, // 30 second timeout for login requests
        validateStatus: () => true, // Don't throw on non-2xx responses
      });

      const responseTime = Math.round(performance.now() - start);

      // Log login attempt (without exposing secrets)
      if (context?.logger) {
        context.logger.debug(
          `[LoginFlow] Login attempt to ${loginUrl} completed in ${responseTime}ms with status ${response.status}`
        );
      }

      // Check if login was successful (2xx)
      if (response.status < 200 || response.status >= 300) {
        throw new Error(
          `Login failed with status ${response.status}: ${response.statusText || 'Unknown error'}`
        );
      }

      // Extract token from response
      const token = extractTokenOrNull(response.data, tokenPath);

      if (!token) {
        throw new Error(
          `Failed to extract token from login response using path: ${tokenPath}`
        );
      }

      // Cache token if TTL is configured
      if (config.cacheTtlSeconds && config.cacheTtlSeconds > 0) {
        tokenCache.set(cacheKey, {
          token,
          expiresAt: Date.now() + config.cacheTtlSeconds * 1000,
        });
      }

      return this._formatToken(token, asBearer);
    } catch (error) {
      // Re-throw with a clear message
      if (error.response) {
        // The request was made and the server responded with a non-2xx status
        throw new Error(
          `Login failed (${error.response.status}): ${error.response.data?.message || error.message}`
        );
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error(`Login request failed: ${error.message}`);
      } else {
        // Something happened in setting up the request
        throw new Error(`Login error: ${error.message}`);
      }
    }
  }

  /**
   * Formats the token as a header value, optionally adding a Cookie header
   * alongside it (multi-step flows with forwardCookies enabled).
   *
   * @param {string} token - The raw token
   * @param {boolean} asBearer - Whether to format as Bearer token
   * @param {string|null} cookieHeader - Optional Cookie header to include
   * @returns {Object} - Headers object
   */
  _buildHeaders(token, asBearer, cookieHeader) {
    const headers = this._formatToken(token, asBearer);

    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    return headers;
  }

  /**
   * Formats the token as a header value.
   *
   * @param {string} token - The raw token
   * @param {boolean} asBearer - Whether to format as Bearer token
   * @returns {Object} - Headers object
   */
  _formatToken(token, asBearer) {
    if (asBearer) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    return {
      Authorization: token,
    };
  }

  /**
   * Normalizes headers for the login request.
   *
   * @param {Object} headers - Headers from the endpoint config
   * @returns {Object} - Normalized headers
   */
  _normalizeHeaders(headers) {
    if (!headers) {
      return { 'Content-Type': 'application/json' };
    }

    // If headers is a Map, convert to plain object
    if (headers instanceof Map) {
      return Object.fromEntries(headers);
    }

    // If headers is a plain object, return as-is
    if (typeof headers === 'object' && headers !== null) {
      return { ...headers };
    }

    // Default fallback
    return { 'Content-Type': 'application/json' };
  }

  validateConfiguration(endpoint) {
    const config = endpoint?.auth?.loginConfig;

    if (!config) {
      return false;
    }

    if (Array.isArray(config.steps) && config.steps.length > 0) {
      return config.steps.every((step) => Boolean(step.url));
    }

    return Boolean(
      config.loginUrl && config.loginUrl.trim().length > 0 &&
      config.body && Object.keys(config.body).length > 0 &&
      config.tokenPath && config.tokenPath.trim().length > 0
    );
  }

  /**
   * Clears the token cache for a specific endpoint.
   *
   * @param {string} endpointId - The endpoint ID
   */
  clearCache(endpointId) {
    const keyPrefix = `${endpointId}:`;
    for (const key of tokenCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        tokenCache.delete(key);
      }
    }
  }

  /**
   * Clears all token cache entries.
   */
  clearAllCache() {
    tokenCache.clear();
  }
}

module.exports = new LoginFlowAuthenticationProvider();