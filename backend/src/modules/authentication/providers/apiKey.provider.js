// src/modules/authentication/providers/apiKey.provider.js

const BaseAuthenticationProvider = require('./base.provider');
const { AUTH_TYPES } = require('../../../config/constants');

/**
 * API_KEY Authentication Provider.
 *
 * Uses a custom header for API key authentication.
 * Users can configure which header name to use.
 *
 * Configuration:
 *   auth.type = 'API_KEY'
 *   auth.apiKeyHeader = 'X-API-Key'
 *   auth.apiKeyValue = 'abc123'
 *
 * This produces:
 *   X-API-Key: abc123
 *
 * Note: The header name is case-insensitive in HTTP, but we preserve
 * the user's specified casing for consistency.
 */
class ApiKeyAuthenticationProvider extends BaseAuthenticationProvider {
  getAuthType() {
    return AUTH_TYPES.API_KEY;
  }

  supports(endpoint) {
    return endpoint?.auth?.type === this.getAuthType();
  }

  async getAuthenticationHeaders(endpoint, context) {
    const auth = endpoint?.auth || {};
    const header = auth.apiKeyHeader;
    const value = auth.apiKeyValue;

    if (!header || header.trim() === '') {
      throw new Error('API_KEY authentication requires an apiKeyHeader');
    }

    if (!value || value.trim() === '') {
      throw new Error('API_KEY authentication requires an apiKeyValue');
    }

    return {
      [header.trim()]: value.trim(),
    };
  }

  validateConfiguration(endpoint) {
    const auth = endpoint?.auth || {};
    return Boolean(
      auth.apiKeyHeader && auth.apiKeyHeader.trim().length > 0 &&
      auth.apiKeyValue && auth.apiKeyValue.trim().length > 0
    );
  }
}

module.exports = new ApiKeyAuthenticationProvider();