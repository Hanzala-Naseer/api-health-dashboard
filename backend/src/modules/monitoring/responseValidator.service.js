// src/modules/monitoring/responseValidator.service.js

const { extractByPath } = require('../authentication/helpers/tokenExtractor');

/**
 * Response Validator — configurable assertions run against a completed
 * HTTP response, beyond the basic expectedStatus check.
 *
 * WHY: A 200 status code doesn't always mean "healthy" — an API can
 * return 200 with an empty body, a stale cached error page, or a
 * response missing a field the caller actually depends on. This lets
 * users assert on the things that actually matter for their API.
 *
 * Rules are evaluated in order; the first failing rule stops evaluation
 * and its reason is returned (matches how a person would read down a
 * checklist — no need to report every subsequent rule too).
 *
 * Supported rule types:
 *   HEADER_EXISTS       { header }
 *   HEADER_EQUALS       { header, value }
 *   BODY_CONTAINS       { value }
 *   BODY_NOT_CONTAINS   { value }
 *   REGEX               { pattern }          — tested against the raw body
 *   JSONPATH_EQUALS     { path, value }
 *   JSONPATH_EXISTS     { path }
 *   MIN_SIZE            { bytes }
 *   MAX_SIZE            { bytes }
 *   MAX_RESPONSE_TIME   { ms }
 *
 * Security: regex patterns are length-capped and only tested against a
 * bounded slice of the body. This doesn't fully eliminate catastrophic
 * backtracking risk from a pathological pattern, but it bounds the
 * worst case to a fixed amount of work per check rather than unbounded
 * input size — a full sandboxed regex engine is more than this needs.
 */

const MAX_REGEX_PATTERN_LENGTH = 200;
const MAX_REGEX_BODY_SLICE = 50000;

/**
 * Runs every configured rule against a response. Returns the first
 * failure, or { valid: true } if everything passes (including when
 * there are no rules at all).
 *
 * @param {Object} response - { headers, data, responseBody, responseSize, responseTime }
 * @param {Array} rules - Configured validation rules
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateResponse(response, rules) {
  if (!Array.isArray(rules) || rules.length === 0) {
    return { valid: true };
  }

  for (const rule of rules) {
    const result = validateRule(response, rule);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

function validateRule(response, rule) {
  switch (rule.type) {
    case 'HEADER_EXISTS':
      return validateHeaderExists(response, rule);
    case 'HEADER_EQUALS':
      return validateHeaderEquals(response, rule);
    case 'BODY_CONTAINS':
      return validateBodyContains(response, rule);
    case 'BODY_NOT_CONTAINS':
      return validateBodyNotContains(response, rule);
    case 'REGEX':
      return validateRegex(response, rule);
    case 'JSONPATH_EQUALS':
      return validateJsonPathEquals(response, rule);
    case 'JSONPATH_EXISTS':
      return validateJsonPathExists(response, rule);
    case 'MIN_SIZE':
      return validateMinSize(response, rule);
    case 'MAX_SIZE':
      return validateMaxSize(response, rule);
    case 'MAX_RESPONSE_TIME':
      return validateMaxResponseTime(response, rule);
    default:
      // Unknown rule type — don't fail the check over a config typo,
      // just skip it. The endpoint validation layer should catch this
      // before it's ever saved anyway.
      return { valid: true };
  }
}

function getHeader(response, name) {
  const key = String(name).toLowerCase();
  return response.headers?.[key];
}

function validateHeaderExists(response, rule) {
  const value = getHeader(response, rule.header);
  return value !== undefined && value !== null
    ? { valid: true }
    : { valid: false, reason: `Expected header "${rule.header}" to be present` };
}

function validateHeaderEquals(response, rule) {
  const value = getHeader(response, rule.header);
  return value === rule.value
    ? { valid: true }
    : { valid: false, reason: `Expected header "${rule.header}" to equal "${rule.value}" (got "${value ?? ''}")` };
}

function validateBodyContains(response, rule) {
  const body = response.responseBody || '';
  return body.includes(rule.value)
    ? { valid: true }
    : { valid: false, reason: `Expected response body to contain "${rule.value}"` };
}

function validateBodyNotContains(response, rule) {
  const body = response.responseBody || '';
  return !body.includes(rule.value)
    ? { valid: true }
    : { valid: false, reason: `Expected response body to NOT contain "${rule.value}"` };
}

function validateRegex(response, rule) {
  const pattern = String(rule.pattern || '').slice(0, MAX_REGEX_PATTERN_LENGTH);
  const body = (response.responseBody || '').slice(0, MAX_REGEX_BODY_SLICE);

  let regex;
  try {
    regex = new RegExp(pattern);
  } catch {
    return { valid: false, reason: `Invalid regex pattern "${pattern}"` };
  }

  return regex.test(body)
    ? { valid: true }
    : { valid: false, reason: `Response body did not match pattern "${pattern}"` };
}

function validateJsonPathEquals(response, rule) {
  const value = extractByPath(response.data, rule.path);
  // Loose equality on purpose — a numeric field like `"count": 5` vs a
  // configured value of "5" is the same assertion to a non-developer user.
  // eslint-disable-next-line eqeqeq
  return value == rule.value
    ? { valid: true }
    : { valid: false, reason: `Expected "${rule.path}" to equal "${rule.value}" (got "${JSON.stringify(value)}")` };
}

function validateJsonPathExists(response, rule) {
  const value = extractByPath(response.data, rule.path);
  return value !== null && value !== undefined
    ? { valid: true }
    : { valid: false, reason: `Expected "${rule.path}" to exist in the response` };
}

function validateMinSize(response, rule) {
  return response.responseSize >= rule.bytes
    ? { valid: true }
    : { valid: false, reason: `Expected response size >= ${rule.bytes} bytes (got ${response.responseSize})` };
}

function validateMaxSize(response, rule) {
  return response.responseSize <= rule.bytes
    ? { valid: true }
    : { valid: false, reason: `Expected response size <= ${rule.bytes} bytes (got ${response.responseSize})` };
}

function validateMaxResponseTime(response, rule) {
  return response.responseTime <= rule.ms
    ? { valid: true }
    : { valid: false, reason: `Expected response time <= ${rule.ms}ms (got ${response.responseTime}ms)` };
}

module.exports = {
  validateResponse,
};
