// src/modules/authentication/helpers/templateResolver.js

const crypto = require('node:crypto');
const env = require('../../../config/env');

/**
 * Template Resolver — replaces {{placeholder}} tokens in header/query
 * values immediately before a request is sent.
 *
 * Supported placeholders:
 *   {{timestamp}}    -> current time, unix milliseconds
 *   {{unix}}         -> current time, unix seconds
 *   {{isoDate}}      -> current time, ISO 8601 string
 *   {{uuid}}         -> a random UUID v4
 *   {{token}}        -> context.token (e.g. an OAuth/login token a provider already fetched)
 *   {{environment}}  -> context.environment (e.g. "production", "staging")
 *   {{env.KEY}}      -> process.env.KEY, but ONLY if KEY is on the
 *                       ALLOWED_TEMPLATE_ENV_VARS allowlist (see config/env.js)
 *
 * Security: {{env.*}} is deliberately NOT a blanket process.env passthrough.
 * Without the allowlist, a user could reference {{env.MONGODB_URI}} or
 * {{env.JWT_ACCESS_SECRET}} in a header sent to an endpoint they control
 * and read the server's own secrets back out of the response. Anything not
 * explicitly allowed throws instead of silently resolving to an empty
 * string, so misconfiguration is visible rather than hidden.
 */

const ALLOWED_ENV_KEYS = new Set(
  env.ALLOWED_TEMPLATE_ENV_VARS
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
);

const PLACEHOLDER_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

/** Returns the resolved value for one placeholder key, or null if unknown. */
function resolvePlaceholder(key, context) {
  switch (key) {
    case 'timestamp':
      return String(Date.now());
    case 'unix':
      return String(Math.floor(Date.now() / 1000));
    case 'isoDate':
      return new Date().toISOString();
    case 'uuid':
      return crypto.randomUUID();
    case 'token':
      return context.token != null ? String(context.token) : '';
    case 'environment':
      return context.environment || '';
    default:
      break;
  }

  if (key.startsWith('env.')) {
    const varName = key.slice('env.'.length);

    if (!ALLOWED_ENV_KEYS.has(varName)) {
      throw new Error(`Template placeholder "env.${varName}" is not on the allowed env var list`);
    }

    return process.env[varName] ?? '';
  }

  // Unrecognized placeholder — leave it untouched rather than guessing,
  // so a typo like {{tmestamp}} is obvious in the outgoing request.
  return null;
}

/**
 * Resolves every {{placeholder}} in a single string value.
 * Strings without "{{" are returned unchanged (cheap common case).
 */
function resolveTemplateString(value, context = {}) {
  if (typeof value !== 'string' || !value.includes('{{')) {
    return value;
  }

  return value.replace(PLACEHOLDER_PATTERN, (match, key) => {
    const resolved = resolvePlaceholder(key.trim(), context);
    return resolved === null ? match : resolved;
  });
}

/**
 * Resolves placeholders across every string value in a flat object
 * (headers, query params). Non-string values pass through untouched.
 */
function resolveTemplatesInObject(obj, context = {}) {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    result[key] = typeof value === 'string' ? resolveTemplateString(value, context) : value;
  }

  return result;
}

module.exports = {
  resolveTemplateString,
  resolveTemplatesInObject,
};
