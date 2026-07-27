// src/modules/authentication/providers/apiKeyQuery.provider.js

const BaseAuthenticationProvider = require('./base.provider');
const { AUTH_TYPES } = require('../../../config/constants');

/**
 * API_KEY_QUERY Authentication Provider.
 *
 * Some APIs accept the key as a query string parameter instead of a
 * header — e.g. ?api_key=..., ?apikey=..., ?token=.... The parameter
 * name is configurable so it isn't hardcoded to one convention.
 *
 * Configuration:
 *   auth.type = 'API_KEY_QUERY'
 *   auth.apiKeyQueryParam = 'api_key'   // e.g. "apikey", "token"
 *   auth.apiKeyValue = 'abc123'
 *
 * This produces a query param, not a header:
 *   ?api_key=abc123
 */
class ApiKeyQueryAuthenticationProvider extends BaseAuthenticationProvider {
  getAuthType() {
    return AUTH_TYPES.API_KEY_QUERY;
  }

  supports(endpoint) {
    return endpoint?.auth?.type === this.getAuthType();
  }

  // Query-param auth doesn't add any headers — everything happens via
  // getAuthenticationQueryParams below.
  async getAuthenticationHeaders(endpoint, context) {
    return {};
  }

  async getAuthenticationQueryParams(endpoint, context) {
    const auth = endpoint?.auth || {};
    const param = auth.apiKeyQueryParam;
    const value = auth.apiKeyValue;

    if (!param || param.trim() === '') {
      throw new Error('API_KEY_QUERY authentication requires an apiKeyQueryParam');
    }

    if (!value || value.trim() === '') {
      throw new Error('API_KEY_QUERY authentication requires an apiKeyValue');
    }

    return {
      [param.trim()]: value.trim(),
    };
  }

  validateConfiguration(endpoint) {
    const auth = endpoint?.auth || {};
    return Boolean(
      auth.apiKeyQueryParam && auth.apiKeyQueryParam.trim().length > 0 &&
      auth.apiKeyValue && auth.apiKeyValue.trim().length > 0
    );
  }
}

module.exports = new ApiKeyQueryAuthenticationProvider();
