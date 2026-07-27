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


router.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);

router.post('/verify-otp', otpRequestLimiter, validate({ body: verifyOtpSchema }), authController.verifyOtp);

router.post('/resend-otp', otpRequestLimiter, validate({ body: resendOtpSchema }), authController.resendOtp);

router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);

router.get('/me', authenticate, authController.me);

router.post(
  '/refresh-token',
  authLimiter,
  validate({ body: refreshTokenSchema }),
  authController.refreshToken
);

router.post('/logout', authenticate, authController.logout);

router.post('/logout-all', authenticate, authController.logoutAllDevices);


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
