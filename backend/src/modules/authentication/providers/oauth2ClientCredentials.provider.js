// src/modules/authentication/providers/oauth2ClientCredentials.provider.js

const BaseAuthenticationProvider = require('./base.provider');
const { AUTH_TYPES } = require('../../../config/constants');
const oauth2Core = require('../helpers/oauth2Core');

/**
 * OAUTH2_CLIENT_CREDENTIALS Authentication Provider.
 *
 * Standard OAuth2 client_credentials grant: exchange a client_id +
 * client_secret for an access token at a token endpoint, cache it, and
 * transparently renew it before it expires.
 *
 * Configuration:
 *   auth.type = 'OAUTH2_CLIENT_CREDENTIALS'
 *   auth.oauth2Config.tokenUrl = 'https://auth.example.com/oauth/token'
 *   auth.oauth2Config.clientId = '...'
 *   auth.oauth2Config.clientSecret = '...'
 *   auth.oauth2Config.scope = 'read write'       // optional
 *   auth.oauth2Config.audience = '...'           // optional
 */
class OAuth2ClientCredentialsProvider extends BaseAuthenticationProvider {
  getAuthType() {
    return AUTH_TYPES.OAUTH2_CLIENT_CREDENTIALS;
  }

  supports(endpoint) {
    return endpoint?.auth?.type === this.getAuthType();
  }

  async getAuthenticationHeaders(endpoint, context) {
    const config = endpoint?.auth?.oauth2Config;

    if (!config) {
      throw new Error('OAUTH2_CLIENT_CREDENTIALS authentication requires oauth2Config');
    }

    if (!config.tokenUrl || config.tokenUrl.trim() === '') {
      throw new Error('OAUTH2_CLIENT_CREDENTIALS authentication requires a tokenUrl');
    }

    if (!config.clientId || !config.clientSecret) {
      throw new Error('OAUTH2_CLIENT_CREDENTIALS authentication requires clientId and clientSecret');
    }

    const cacheKey = `${endpoint._id}:${config.tokenUrl}:${config.clientId}`;

    let token = oauth2Core.getCachedToken(cacheKey);

    if (!token) {
      token = await oauth2Core.fetchClientCredentialsToken(config);
      oauth2Core.setCachedToken(cacheKey, token);
    }

    return {
      Authorization: `Bearer ${token.accessToken}`,
    };
  }

  validateConfiguration(endpoint) {
    const config = endpoint?.auth?.oauth2Config;

    return Boolean(
      config &&
      config.tokenUrl && config.tokenUrl.trim().length > 0 &&
      config.clientId &&
      config.clientSecret
    );
  }

  clearCache(endpointId) {
    oauth2Core.clearCache(endpointId);
  }

  clearAllCache() {
    oauth2Core.clearAllCache();
  }
}

module.exports = new OAuth2ClientCredentialsProvider();
