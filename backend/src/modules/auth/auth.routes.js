const { Router } = require('express');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authLimiter, otpRequestLimiter } = require('../../middlewares/rateLimiter.middleware');
const {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require('../../validations/auth.validation');
const authController = require('./auth.controller');

const router = Router();

/**
 * FEATURE 1: Registration + Email OTP Verification
 * (Login, refresh, logout, password reset, OAuth, etc. are added in
 * subsequent features on this same router — see README "Roadmap".)
 */

router.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);

router.post('/verify-otp', otpRequestLimiter, validate({ body: verifyOtpSchema }), authController.verifyOtp);

router.post('/resend-otp', otpRequestLimiter, validate({ body: resendOtpSchema }), authController.resendOtp);

/**
 * FEATURE 2: Login + Session Issuance
 * (Refresh token rotation / reuse detection and logout are next.)
 */
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);

router.get('/me', authenticate, authController.me);

/**
 * FEATURE 3: Refresh Token Rotation + Reuse Detection
 * Not behind `authenticate` — the whole point is to work when the access
 * token has already expired. Rate-limited like other auth endpoints since
 * it's still a credential-bearing operation.
 */
router.post(
  '/refresh-token',
  authLimiter,
  validate({ body: refreshTokenSchema }),
  authController.refreshToken
);

/**
 * FEATURE 4: Logout (current device) / Logout All Devices
 * Both require `authenticate` — logout needs to know WHO and WHICH
 * session, not just "clear whatever cookie is present".
 */
router.post('/logout', authenticate, authController.logout);

router.post('/logout-all', authenticate, authController.logoutAllDevices);

/**
 * FEATURE 5: Forgot Password / Reset Password / Change Password
 */
router.post(
  '/forgot-password',
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword
);

router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  authController.changePassword
);

module.exports = router;
