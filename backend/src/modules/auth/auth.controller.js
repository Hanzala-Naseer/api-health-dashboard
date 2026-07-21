const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const { getRequestContext } = require('../../utils/requestContext');
const { setAccessTokenCookie, setRefreshTokenCookie, clearAuthCookies } = require('../../utils/cookies');
const { COOKIE_NAMES } = require('../../config/constants');
const authService = require('./auth.service');

/**
 * WHY controllers stay this thin:
 * A controller's only job is: parse the (already-validated) request,
 * call the service, shape the HTTP response. No database calls, no password
 * hashing, no email sending here — that all lives in the service so it can
 * be reused (e.g. by an admin-created-user flow, a CLI script, a queue
 * worker) without depending on Express at all.
 */

const register = asyncHandler(async (req, res) => {
  const requestContext = getRequestContext(req);
  const user = await authService.register(req.body, requestContext);

  return new ApiResponse(
    201,
    'Registration successful. Please check your email for a verification code.',
    { user }
  ).send(res);
});

const verifyOtp = asyncHandler(async (req, res) => {
  const requestContext = getRequestContext(req);
  const result = await authService.verifyOtp(req.body, requestContext);

  return new ApiResponse(200, 'Email verified successfully.', { user: result }).send(res);
});

const resendOtp = asyncHandler(async (req, res) => {
  const requestContext = getRequestContext(req);
  const result = await authService.resendOtp(req.body, requestContext);

  return new ApiResponse(200, result.message).send(res);
});

const login = asyncHandler(async (req, res) => {
  const requestContext = getRequestContext(req);
  const { user, accessToken, accessExpiresAt, refreshToken, refreshExpiresAt } = await authService.login(
    req.body,
    requestContext
  );

  // Set httpOnly cookies for browser clients...
  setAccessTokenCookie(res, accessToken, accessExpiresAt);
  setRefreshTokenCookie(res, refreshToken, refreshExpiresAt);

  // ...and also return the access token in the body for mobile/API clients
  // that can't (or don't want to) rely on cookies. The refresh token is
  // NEVER returned in the body — cookie-only, to keep it out of JS-reachable
  // storage (localStorage/sessionStorage) entirely.
  return new ApiResponse(200, 'Login successful.', {
    user,
    accessToken,
    accessExpiresAt,
  }).send(res);
});

const me = asyncHandler(async (req, res) => {
  return new ApiResponse(200, 'Current user retrieved.', { user: req.user }).send(res);
});

const refreshToken = asyncHandler(async (req, res) => {
  const requestContext = getRequestContext(req);

  // Accept the refresh token from the httpOnly cookie (browser clients) or
  // an explicit body field (mobile/API clients that don't use cookies).
  const presentedToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] || req.body?.refreshToken;

  const result = await authService.refreshAccessToken(presentedToken, requestContext);

  setAccessTokenCookie(res, result.accessToken, result.accessExpiresAt);
  setRefreshTokenCookie(res, result.refreshToken, result.refreshExpiresAt);

  return new ApiResponse(200, 'Access token refreshed.', {
    accessToken: result.accessToken,
    accessExpiresAt: result.accessExpiresAt,
  }).send(res);
});

const logout = asyncHandler(async (req, res) => {
  const requestContext = getRequestContext(req);
  await authService.logout(req.user.id, req.sessionId, requestContext);

  clearAuthCookies(res);

  return new ApiResponse(200, 'Logged out successfully.').send(res);
});

const logoutAllDevices = asyncHandler(async (req, res) => {
  const requestContext = getRequestContext(req);
  await authService.logoutAllDevices(req.user.id, requestContext);

  clearAuthCookies(res);

  return new ApiResponse(200, 'Logged out of all devices successfully.').send(res);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const requestContext = getRequestContext(req);
  const result = await authService.forgotPassword(req.body, requestContext);

  return new ApiResponse(200, result.message).send(res);
});

const resetPassword = asyncHandler(async (req, res) => {
  const requestContext = getRequestContext(req);
  const result = await authService.resetPassword(req.body, requestContext);

  return new ApiResponse(200, result.message).send(res);
});

const changePassword = asyncHandler(async (req, res) => {
  const requestContext = getRequestContext(req);
  const result = await authService.changePassword(
    {
      userId: req.user.id,
      currentSessionId: req.sessionId,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    },
    requestContext
  );

  // The current device's cookies are still valid (we deliberately preserved
  // this session), so nothing to clear/reset here.
  return new ApiResponse(200, result.message).send(res);
});

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  me,
  refreshToken,
  logout,
  logoutAllDevices,
  forgotPassword,
  resetPassword,
  changePassword,
};
