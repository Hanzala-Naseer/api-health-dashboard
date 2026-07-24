/**
 * WHY this lives in one shared place:
 * Both the Endpoint module (Feature 1 metadata) and the frontend-warning
 * preparation in the Scheduler (Feature 5) need the exact same definition
 * of "which HTTP methods mutate state". Duplicating this list per-module
 * risks drift (e.g. one place forgetting DELETE). Centralizing it here
 * means there is exactly one source of truth.
 *
 * This is READ-ONLY classification metadata — it never blocks or alters
 * request execution. GET/HEAD/OPTIONS are SAFE, everything else that can
 * mutate server state is STATE_CHANGING.
 */

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Returns 'SAFE' or 'STATE_CHANGING' for a given HTTP method.
 * Unknown/missing methods default to 'SAFE' (matches HTTP semantics where
 * unrecognized methods should not be assumed to mutate state).
 */
function getMethodCategory(method) {
  const normalized = String(method || '').toUpperCase();
  return STATE_CHANGING_METHODS.includes(normalized) ? 'STATE_CHANGING' : 'SAFE';
}

function isStateChangingMethod(method) {
  return getMethodCategory(method) === 'STATE_CHANGING';
}

module.exports = {
  STATE_CHANGING_METHODS,
  getMethodCategory,
  isStateChangingMethod,
};
