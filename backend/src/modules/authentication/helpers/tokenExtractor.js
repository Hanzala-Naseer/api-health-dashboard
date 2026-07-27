// src/modules/authentication/helpers/tokenExtractor.js

/**
 * Path Extractor — JSONPath-lite path resolution.
 *
 * WHY:
 * Different authentication providers (and, later, response validation
 * rules) return values at different paths, including inside arrays.
 * Users need to configure their own path without PulseOps hardcoding
 * every possible response shape.
 *
 * Supported syntax: dot notation with optional bracket array indices.
 *   "data.accessToken"       -> response.data.accessToken
 *   "token"                  -> response.token
 *   "data.items[0].token"    -> response.data.items[0].token
 *   "items[0][1]"            -> response.items[0][1]
 *
 * This is intentionally NOT full JSONPath (no wildcards, filters, or
 * recursive descent) — endpoints only ever need to point at one exact
 * field in one exact response shape, so a small, predictable resolver is
 * easier to reason about than a general-purpose query language.
 *
 * Security:
 * - Extracted values are never logged by this module
 * - If the path cannot be resolved, null is returned (no silent failures
 *   further up the chain — callers decide what a missing value means)
 */

/**
 * Resolves any path (dot notation + [n] array indices) to its raw value.
 * Returns null if any segment along the way doesn't exist.
 *
 * @param {Object} obj - The object to extract from
 * @param {string} path - e.g. "data.items[0].token"
 * @returns {*} - The raw resolved value, or null if not found
 */
function extractByPath(obj, path) {
  if (!obj || typeof obj !== 'object') {
    return null;
  }

  if (!path || typeof path !== 'string' || path.trim() === '') {
    return null;
  }

  // Turn "items[0].token" into "items.0.token" so it's a plain dot walk.
  const normalizedPath = path.trim().replace(/\[(\d+)\]/g, '.$1');
  const keys = normalizedPath.split('.').filter(Boolean);

  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return null;
    }

    current = current[key];
  }

  return current === undefined ? null : current;
}

/**
 * Extracts a token and validates it's a non-empty string.
 * Kept separate from extractByPath because token extraction specifically
 * only ever makes sense for string values.
 *
 * @param {Object} obj - The response object to extract from
 * @param {string} path - Dot/bracket-notation path (e.g., "data.accessToken")
 * @returns {string|null} - The extracted token, or null if not found
 */
function extractToken(obj, path) {
  const value = extractByPath(obj, path);

  if (typeof value !== 'string') {
    return null;
  }

  // Trim the token — some APIs return tokens with surrounding whitespace.
  return value.trim();
}

/**
 * Extracts a token and validates it's not empty.
 *
 * @param {Object} obj - The response object
 * @param {string} path - Dot/bracket-notation path
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
  extractByPath,
  extractToken,
  extractTokenOrNull,
};