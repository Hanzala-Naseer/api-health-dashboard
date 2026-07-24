// src/modules/authentication/authentication.service.js

const logger = require('../../lib/logger');
const { AUTH_TYPES } = require('../../config/constants');

// Import all providers
const NoneProvider = require('./providers/none.provider');
const StaticBearerProvider = require('./providers/staticBearer.provider');
const ApiKeyProvider = require('./providers/apiKey.provider');
const BasicProvider = require('./providers/basic.provider');
const LoginFlowProvider = require('./providers/loginFlow.provider');

/**
 * Authentication Service — V1.5
 *
 * This is the single entry point for all authentication logic.
 *
 * Flow:
 *   1. Given an endpoint, determine its auth type
 *   2. Select the appropriate provider
 *   3. Get authentication headers from the provider
 *   4. Return headers for merging into the request
 *
 * Usage in monitoring:
 *   const authHeaders = await authenticationService.getAuthenticationHeaders(endpoint);
 *   const finalHeaders = { ...customHeaders, ...authHeaders };
 *
 * Security:
 *   - Authentication secrets are never logged or exposed in responses
 *   - LoginFlow tokens are cached (if configured) to reduce login requests
 *   - Errors are caught and re-thrown with clear messages
 */
class AuthenticationService {
  constructor() {
    // Map auth types to provider instances
    this.providers = new Map([
      [AUTH_TYPES.NONE, NoneProvider],
      [AUTH_TYPES.STATIC_BEARER, StaticBearerProvider],
      [AUTH_TYPES.API_KEY, ApiKeyProvider],
      [AUTH_TYPES.BASIC, BasicProvider],
      [AUTH_TYPES.LOGIN_FLOW, LoginFlowProvider],
    ]);

    // Default provider for unknown types
    this.defaultProvider = NoneProvider;
  }

  /**
   * Gets the appropriate provider for the given endpoint.
   *
   * @param {Object} endpoint - The endpoint document (with auth field)
   * @returns {Object} - The provider instance
   */
  getProvider(endpoint) {
    const authType = endpoint?.auth?.type || AUTH_TYPES.NONE;
    const provider = this.providers.get(authType);

    if (!provider) {
      // Unknown auth type — fall back to NONE
      logger.warn(`Unknown auth type: ${authType}. Falling back to NONE.`);
      return this.defaultProvider;
    }

    // Validate that the provider supports this endpoint's configuration
    if (!provider.validateConfiguration(endpoint)) {
      logger.warn(
        `Invalid configuration for auth type: ${authType}. Falling back to NONE.`
      );
      return this.defaultProvider;
    }

    return provider;
  }

  /**
   * Gets authentication headers for the given endpoint.
   *
   * @param {Object} endpoint - The endpoint document (with auth field)
   * @param {Object} context - Optional execution context (logger, etc.)
   * @returns {Promise<Object>} - Headers to merge into the request
   * @throws {Error} - If authentication fails
   */
  async getAuthenticationHeaders(endpoint, context = { logger }) {
    const authType = endpoint?.auth?.type || AUTH_TYPES.NONE;

    // If no authentication is configured, return empty headers
    if (authType === AUTH_TYPES.NONE || !endpoint?.auth) {
      return {};
    }

    const provider = this.getProvider(endpoint);

    try {
      const headers = await provider.getAuthenticationHeaders(endpoint, context);

      // Ensure we always return an object
      return headers || {};
    } catch (error) {
      // Log the error without exposing secrets
      logger.error(
        `Authentication failed for endpoint ${endpoint._id || 'unknown'} (${authType}): ${error.message}`
      );

      // Re-throw with a clean message
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Checks if the endpoint has valid authentication configuration.
   *
   * @param {Object} endpoint - The endpoint document
   * @returns {boolean}
   */
  hasValidAuthentication(endpoint) {
    const authType = endpoint?.auth?.type || AUTH_TYPES.NONE;

    if (authType === AUTH_TYPES.NONE) {
      return true;
    }

    const provider = this.providers.get(authType);
    if (!provider) {
      return false;
    }

    return provider.validateConfiguration(endpoint);
  }

  /**
   * Gets the authentication type for an endpoint.
   *
   * @param {Object} endpoint - The endpoint document
   * @returns {string} - The authentication type
   */
  getAuthType(endpoint) {
    return endpoint?.auth?.type || AUTH_TYPES.NONE;
  }

  /**
   * Checks if an endpoint uses LOGIN_FLOW authentication.
   *
   * @param {Object} endpoint - The endpoint document
   * @returns {boolean}
   */
  isLoginFlow(endpoint) {
    return this.getAuthType(endpoint) === AUTH_TYPES.LOGIN_FLOW;
  }

  /**
   * Clears the token cache for a specific endpoint (LOGIN_FLOW only).
   *
   * @param {string} endpointId - The endpoint ID
   */
  clearCache(endpointId) {
    LoginFlowProvider.clearCache(endpointId);
  }

  /**
   * Clears all token cache entries.
   */
  clearAllCache() {
    LoginFlowProvider.clearAllCache();
  }
}

// Export a singleton instance
module.exports = new AuthenticationService();