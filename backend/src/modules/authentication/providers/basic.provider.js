// src/modules/authentication/providers/basic.provider.js

const BaseAuthenticationProvider = require('./base.provider');
const { AUTH_TYPES } = require('../../../config/constants');

/**
 * BASIC Authentication Provider.
 *
 * Uses HTTP Basic Authentication (username:password Base64 encoded).
 *
 * Configuration:
 *   auth.type = 'BASIC'
 *   auth.basicUsername = 'admin'
 *   auth.basicPassword = 'password123'
 *
 * This produces:
 *   Authorization: Basic YWRtaW46cGFzc3dvcmQxMjM=
 */
class BasicAuthenticationProvider extends BaseAuthenticationProvider {
  getAuthType() {
    return AUTH_TYPES.BASIC;
  }

  supports(endpoint) {
    return endpoint?.auth?.type === this.getAuthType();
  }

  async getAuthenticationHeaders(endpoint, context) {
    const auth = endpoint?.auth || {};
    const username = auth.basicUsername;
    const password = auth.basicPassword;

    if (!username || username.trim() === '') {
      throw new Error('BASIC authentication requires a basicUsername');
    }

    if (!password || password.trim() === '') {
      throw new Error('BASIC authentication requires a basicPassword');
    }

    // Create the Basic auth header
    const credentials = `${username.trim()}:${password.trim()}`;
    const encoded = Buffer.from(credentials).toString('base64');

    return {
      Authorization: `Basic ${encoded}`,
    };
  }

  validateConfiguration(endpoint) {
    const auth = endpoint?.auth || {};
    return Boolean(
      auth.basicUsername && auth.basicUsername.trim().length > 0 &&
      auth.basicPassword && auth.basicPassword.trim().length > 0
    );
  }
}

module.exports = new BasicAuthenticationProvider();