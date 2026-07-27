// src/modules/authentication/helpers/oauth2Core.js

const axios = require('axios');

/**
 * OAuth2 Core — shared token fetch/cache/renewal logic.
 *
 * WHY shared: client_credentials and refresh_token grants differ only in
 * what they send to the token endpoint. Everything after that — caching,
 * expiration tracking, renewing before expiry — is identical, so it lives
 * here once instead of being duplicated across two provider files.
 *
 * Simple in-memory cache, same pattern as loginFlow.provider.js's
 * tokenCache. In production with multiple servers, each server keeps its
 * own cache and independently renews when its copy expires — that's a
 * few extra token requests, not a correctness problem.
 */
const tokenCache = new Map();

// Renew this many ms before the token's real expiry, so a check doesn't
// start using a token that expires mid-request.
const EXPIRY_SAFETY_MARGIN_MS = 30000;

// If the token endpoint doesn't return expires_in, assume this lifetime
// rather than caching forever.
const DEFAULT_TOKEN_LIFETIME_SECONDS = 3600;

async function requestToken(tokenUrl, bodyParams) {
  const response = await axios({
    method: 'POST',
    url: tokenUrl,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: bodyParams.toString(),
    timeout: 15000,
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`OAuth2 token request failed with status ${response.status}`);
  }

  const accessToken = response.data?.access_token;

  if (!accessToken) {
    throw new Error('OAuth2 token response did not include an access_token');
  }

  const expiresInSeconds = Number(response.data?.expires_in) || DEFAULT_TOKEN_LIFETIME_SECONDS;

  return {
    accessToken,
    // Some providers rotate the refresh token on every renewal — if they
    // send a new one, use it for the next refresh instead of the old one.
    refreshToken: response.data?.refresh_token || null,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };
}

function fetchClientCredentialsToken(config) {
  const { tokenUrl, clientId, clientSecret, scope, audience } = config;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    ...(scope ? { scope } : {}),
    ...(audience ? { audience } : {}),
  });

  return requestToken(tokenUrl, body);
}

function fetchRefreshToken(config, currentRefreshToken) {
  const { tokenUrl, clientId, clientSecret, scope } = config;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: currentRefreshToken,
    ...(clientId ? { client_id: clientId } : {}),
    ...(clientSecret ? { client_secret: clientSecret } : {}),
    ...(scope ? { scope } : {}),
  });

  return requestToken(tokenUrl, body);
}

function getCachedToken(cacheKey) {
  const cached = tokenCache.get(cacheKey);

  if (cached && cached.expiresAt - EXPIRY_SAFETY_MARGIN_MS > Date.now()) {
    return cached;
  }

  return null;
}

/**
 * Returns the cached entry regardless of whether the access token has
 * expired. Used only to recover a rotated refresh_token from an
 * otherwise-expired cache entry — the access token being stale doesn't
 * mean the refresh token inside it is stale too.
 */
function peekToken(cacheKey) {
  return tokenCache.get(cacheKey) || null;
}

function setCachedToken(cacheKey, tokenData) {
  tokenCache.set(cacheKey, tokenData);
}

/** Clears every cache entry for one endpoint (all its cache keys share the `${endpointId}:` prefix). */
function clearCache(endpointId) {
  const prefix = `${endpointId}:`;

  for (const key of tokenCache.keys()) {
    if (key.startsWith(prefix)) {
      tokenCache.delete(key);
    }
  }
}

function clearAllCache() {
  tokenCache.clear();
}

module.exports = {
  fetchClientCredentialsToken,
  fetchRefreshToken,
  getCachedToken,
  peekToken,
  setCachedToken,
  clearCache,
  clearAllCache,
};
