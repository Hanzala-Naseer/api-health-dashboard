// src/modules/authentication/providers/staticBearer.provider.js

const BaseAuthenticationProvider = require('./base.provider');
const { AUTH_TYPES } = require('../../../config/constants');

/**
 * STATIC_BEARER Authentication Provider.
 *
 * Uses a statically configured Bearer token.
 * This is the existing behavior — we're just moving it into the new architecture.
 *
 * Configuration:
 *   auth.type = 'STATIC_BEARER'
 *   auth.staticToken = 'eyJhbGciOiJIUzI1NiIs...'
 *
 * This produces:
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 */
class StaticBearerAuthenticationProvider extends BaseAuthenticationProvider {
  getAuthType() {
    return AUTH_TYPES.STATIC_BEARER;
  }

  supports(endpoint) {
    return endpoint?.auth?.type === this.getAuthType();
  }

  async getAuthenticationHeaders(endpoint, context) {
    const token = endpoint?.auth?.staticToken;

    if (!token || token.trim() === '') {
      throw new Error('STATIC_BEARER authentication requires a staticToken');
    }

    return {
      Authorization: `Bearer ${token.trim()}`,
    };
  }

  validateConfiguration(endpoint) {
    const auth = endpoint?.auth || {};
    return Boolean(auth.staticToken && auth.staticToken.trim().length > 0);
  }
}

module.exports = new StaticBearerAuthenticationProvider();