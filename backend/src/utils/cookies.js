const env = require('../config/env');
const { COOKIE_NAMES } = require('../config/constants');

/**
 * WHY centralized here: cookie security options (httpOnly, secure, sameSite,
 * domain) must be IDENTICAL between the call that sets a cookie and the
 * call that clears it — mismatched options silently fail to clear cookies
 * in some browsers. Also, this is the one place that decides cookie
 * scoping, so it's auditable in one read instead of scattered across
 * login/logout/refresh controllers.
 */

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE, // must be true in production (HTTPS only)
    sameSite: env.COOKIE_SAMESITE,
    domain: env.NODE_ENV === 'production' ? env.COOKIE_DOMAIN : undefined,
    path: '/',
  };
}

function setAccessTokenCookie(res, token, expiresAt) {
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, token, { ...baseCookieOptions(), expires: expiresAt });
}

function setRefreshTokenCookie(res, token, expiresAt) {
  // Scoped to /api/v1/auth only — the browser will never send the refresh
  // cookie to unrelated endpoints, shrinking the attack surface if an
  // unrelated route ever had an XSS/SSRF issue.
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, {
    ...baseCookieOptions(),
    expires: expiresAt,
    path: '/api/v1/auth',
  });
}

function clearAuthCookies(res) {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, baseCookieOptions());
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { ...baseCookieOptions(), path: '/api/v1/auth' });
}

module.exports = { setAccessTokenCookie, setRefreshTokenCookie, clearAuthCookies };
