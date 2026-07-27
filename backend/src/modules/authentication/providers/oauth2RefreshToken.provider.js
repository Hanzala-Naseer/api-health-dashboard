// src/modules/authentication/providers/oauth2RefreshToken.provider.js

const BaseAuthenticationProvider = require('./base.provider');
const { AUTH_TYPES } = require('../../../config/constants');
const oauth2Core = require('../helpers/oauth2Core');

/**
 * OAUTH2_REFRESH_TOKEN Authentication Provider.
 *
 * For APIs where PulseOps is handed a long-lived refresh token up front
 * (rather than a client_id/secret) and exchanges it for short-lived
 * access tokens as needed. The access token is cached and renewed the
 * same way as OAUTH2_CLIENT_CREDENTIALS; the difference is only in what
 * gets sent to the token endpoint.
 *
 * If the token endpoint rotates refresh tokens (returns a new
 * refresh_token with each renewal), the rotated one is cached and used
 * for the next renewal instead of the originally configured one — so we
 * don't keep requesting new tokens with an already-superseded refresh
 * token.
 *
 * Configuration:
 *   auth.type = 'OAUTH2_REFRESH_TOKEN'
 *   auth.oauth2Config.tokenUrl = 'https://auth.example.com/oauth/token'
 *   auth.oauth2Config.refreshToken = '...'
 *   auth.oauth2Config.clientId = '...'      // optional, some providers require it
 *   auth.oauth2Config.clientSecret = '...'  // optional
 *   auth.oauth2Config.scope = 'read write'  // optional
 */
class OAuth2RefreshTokenProvider extends BaseAuthenticationProvider {
  getAuthType() {
    return AUTH_TYPES.OAUTH2_REFRESH_TOKEN;
  }

  supports(endpoint) {
    return endpoint?.auth?.type === this.getAuthType();
  }

  async getAuthenticationHeaders(endpoint, context) {
    const config = endpoint?.auth?.oauth2Config;

    if (!config) {
      throw new Error('OAUTH2_REFRESH_TOKEN authentication requires oauth2Config');
    }

    if (!config.tokenUrl || config.tokenUrl.trim() === '') {
      throw new Error('OAUTH2_REFRESH_TOKEN authentication requires a tokenUrl');
    }

    if (!config.refreshToken || config.refreshToken.trim() === '') {
      throw new Error('OAUTH2_REFRESH_TOKEN authentication requires a refreshToken');
    }

    const cacheKey = `${endpoint._id}:${config.tokenUrl}:refresh`;

    let token = oauth2Core.getCachedToken(cacheKey);

    if (!token) {
      // Use the rotated refresh token from a previous renewal if we have
      // one cached, otherwise fall back to the originally configured one.
      const cached = oauth2Core.peekToken(cacheKey);
      const refreshTokenToUse = cached?.refreshToken || config.refreshToken;

      token = await oauth2Core.fetchRefreshToken(config, refreshTokenToUse);
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
      config.refreshToken && config.refreshToken.trim().length > 0
    );
  }

  clearCache(endpointId) {
    oauth2Core.clearCache(endpointId);
  }

  clearAllCache() {
    oauth2Core.clearAllCache();
  }
}

module.exports = new OAuth2RefreshTokenProvider();
