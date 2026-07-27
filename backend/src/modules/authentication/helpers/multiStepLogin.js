// src/modules/authentication/helpers/multiStepLogin.js

const axios = require('axios');

const { extractByPath } = require('./tokenExtractor');
const { CookieJar } = require('./cookieJar');

/**
 * Multi-Step Login Engine.
 *
 * WHY: Some APIs need more than one request to authenticate — e.g.
 *   1. GET the login page, extract a CSRF token
 *   2. POST credentials + CSRF token, receive a session cookie
 *   3. GET a token using the session cookie
 * This isn't a general workflow engine — it's a fixed, ordered list of
 * HTTP steps. Each step can extract values (from the response body via
 * JSONPath-lite, a response header, or a cookie) into named variables,
 * and later steps can reference those variables via {{var.NAME}} in their
 * own url/headers/body. Cookies are carried forward automatically.
 *
 * Step shape:
 *   {
 *     name: 'login',                              // optional, for error messages
 *     url: 'https://api.example.com/auth/login',
 *     method: 'POST',                              // default GET
 *     headers: { 'X-CSRF-Token': '{{var.csrf}}' },
 *     body: { username: '...', password: '...' },
 *     extract: [
 *       { name: 'csrf', from: 'header', path: 'x-csrf-token' },
 *       { name: 'sessionId', from: 'cookie', path: 'session_id' },
 *       { name: 'token', from: 'body', path: 'data.accessToken' },
 *     ],
 *   }
 */

const VAR_PLACEHOLDER_PATTERN = /\{\{\s*var\.([\w]+)\s*\}\}/g;

function resolveVarsInString(value, vars) {
  if (typeof value !== 'string' || !value.includes('{{var.')) {
    return value;
  }

  return value.replace(VAR_PLACEHOLDER_PATTERN, (match, name) => {
    return Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match;
  });
}

function resolveVarsInObject(obj, vars) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const result = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = resolveVarsInString(value, vars);
    } else if (value && typeof value === 'object') {
      result[key] = resolveVarsInObject(value, vars);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/** Applies one step's `extract` rules to a completed response, writing into `vars`. */
function applyExtractionRules(response, extractRules, cookieJar, vars) {
  for (const rule of extractRules || []) {
    let value = null;

    if (rule.from === 'body') {
      value = extractByPath(response.data, rule.path);
    } else if (rule.from === 'header') {
      value = response.headers?.[String(rule.path).toLowerCase()] ?? null;
    } else if (rule.from === 'cookie') {
      value = cookieJar.get(rule.path);
    }

    if (value !== null && value !== undefined) {
      vars[rule.name] = value;
    }
  }
}

/**
 * Executes a sequence of login steps in order.
 *
 * @param {Array} steps - The ordered list of step configs
 * @param {Object} options - { timeout }
 * @returns {Promise<{ vars: Object, cookieHeader: string|null }>}
 * @throws {Error} - If any step doesn't return a 2xx status
 */
async function executeSteps(steps, options = {}) {
  const timeout = options.timeout || 30000;
  const cookieJar = new CookieJar();
  const vars = {};

  for (const step of steps) {
    const url = resolveVarsInString(step.url, vars);
    const headers = resolveVarsInObject(step.headers || {}, vars);
    const body = step.body !== undefined ? resolveVarsInObject(step.body, vars) : undefined;

    const cookieHeader = cookieJar.toHeader();
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    const response = await axios({
      method: (step.method || 'GET').toLowerCase(),
      url,
      headers,
      data: body,
      timeout,
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `Login step "${step.name || url}" failed with status ${response.status}`
      );
    }

    cookieJar.applyResponseHeaders(response.headers);
    applyExtractionRules(response, step.extract, cookieJar, vars);
  }

  return { vars, cookieHeader: cookieJar.toHeader() };
}

module.exports = {
  executeSteps,
  resolveVarsInString,
  resolveVarsInObject,
};
