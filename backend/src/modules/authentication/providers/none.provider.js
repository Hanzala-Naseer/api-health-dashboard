// src/modules/authentication/providers/none.provider.js

const BaseAuthenticationProvider = require('./base.provider');
const { AUTH_TYPES } = require('../../../config/constants');

/**
 * NONE Authentication Provider.
 *
 * No authentication headers are added. This is the default for public endpoints.
 */
class NoneAuthenticationProvider extends BaseAuthenticationProvider {
  getAuthType() {
    return AUTH_TYPES.NONE;
  }

  supports(endpoint) {
    return !endpoint?.auth || endpoint.auth.type === AUTH_TYPES.NONE;
  }

  async getAuthenticationHeaders(endpoint, context) {
    // No headers needed for NONE authentication
    return {};
  }

  validateConfiguration(endpoint) {
    // Always valid
    return true;
  }
}

module.exports = new NoneAuthenticationProvider();