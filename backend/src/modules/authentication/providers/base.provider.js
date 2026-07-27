// src/modules/authentication/providers/base.provider.js

/**
 * Base Authentication Provider.
 *
 * Defines the contract that all authentication providers must implement.
 *
 * Each provider must implement:
 *   - getAuthenticationHeaders(endpoint): Promise<Object>
 *     Returns an object of headers to merge into the request.
 *
 *   - getAuthType(): string
 *     Returns the authentication type this provider handles.
 *
 *   - supports(endpoint): boolean
 *     Returns true if this provider can handle the given endpoint's auth config.
 *
 * This is an abstract class — do not instantiate directly.
 */
class BaseAuthenticationProvider {
  /**
   * Returns the authentication type this provider handles.
   * @returns {string} - One of: NONE, STATIC_BEARER, API_KEY, BASIC, LOGIN_FLOW
   */
  getAuthType() {
    throw new Error('getAuthType() must be implemented by subclass');
  }

  /**
   * Checks if this provider supports the given endpoint.
   * @param {Object} endpoint - The endpoint document (with auth field)
   * @returns {boolean}
   */
  supports(endpoint) {
    return endpoint?.auth?.type === this.getAuthType();
  }

  /**
   * Gets authentication headers for the given endpoint.
   *
   * This is the main method that providers implement.
   *
   * @param {Object} endpoint - The endpoint document (with auth field)
   * @param {Object} context - Execution context (logger, etc.)
   * @returns {Promise<Object>} - Headers to merge (e.g., { Authorization: 'Bearer ...' })
   * @throws {Error} - If authentication fails
   */
  async getAuthenticationHeaders(endpoint, context) {
    throw new Error('getAuthenticationHeaders() must be implemented by subclass');
  }

  /**
   * Gets authentication query parameters for the given endpoint.
   *
   * Optional — most auth types are header-based, so the default
   * implementation returns nothing. Only providers that authenticate via
   * the query string (e.g. API Key as a query param) override this.
   *
   * @param {Object} endpoint - The endpoint document (with auth field)
   * @param {Object} context - Execution context (logger, etc.)
   * @returns {Promise<Object>} - Query params to merge (e.g., { api_key: '...' })
   */
  async getAuthenticationQueryParams(endpoint, context) {
    return {};
  }

  /**
   * Validates that the endpoint has the required configuration for this provider.
   * @param {Object} endpoint - The endpoint document
   * @returns {boolean}
   */
  validateConfiguration(endpoint) {
    // Default implementation: always valid (override if needed)
    return true;
  }
}

module.exports = BaseAuthenticationProvider;