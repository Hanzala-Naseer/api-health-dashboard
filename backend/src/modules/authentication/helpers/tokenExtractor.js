// src/modules/authentication/helpers/tokenExtractor.js

/**
 * Token Extractor — Dot-notation path resolution.
 *
 * WHY:
 * Different authentication providers return tokens at different paths.
 * Users need to configure their own token path without PulseOps hardcoding
 * every possible response shape.
 *
 * Examples:
 *   "data.accessToken"      -> response.data.accessToken
 *   "token"                 -> response.token
 *   "payload.jwt"           -> response.payload.jwt
 *   "result.auth.token"     -> response.result.auth.token
 *
 * Security:
 * - Extracted tokens are never logged
 * - If the path cannot be resolved, null is returned (no silent failures)
 *
 * @param {Object} obj - The response object to extract from
 * @param {string} path - Dot-notation path (e.g., "data.accessToken")
 * @returns {string|null} - The extracted token, or null if not found
 */
function extractToken(obj, path) {
  if (!obj || typeof obj !== 'object') {
    return null;
  }

  if (!path || typeof path !== 'string' || path.trim() === '') {
    return null;
  }

  const keys = path.trim().split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return null;
    }

    if (typeof current !== 'object') {
      return null;
    }

    current = current[key];
  }

  // Return null if the extracted value is not a string
  if (typeof current !== 'string') {
    return null;
  }

  // Return the token, but trim it (some APIs return tokens with whitespace)
  return current.trim();
}

/**
 * Extracts a token and validates it's not empty.
 *
 * @param {Object} obj - The response object
 * @param {string} path - Dot-notation path
 * @returns {string|null} - The extracted token, or null if empty/invalid
 */
function extractTokenOrNull(obj, path) {
  const token = extractToken(obj, path);

  if (!token || token.length === 0) {
    return null;
  }

  return token;
}

module.exports = {
  extractToken,
  extractTokenOrNull,
};