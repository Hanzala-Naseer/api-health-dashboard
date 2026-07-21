const { z } = require('zod');

/**
 * Strong password policy:
 * - min 8 chars (NIST 800-63B allows shorter with checks, but SaaS norm is 8-12 min)
 * - at least 1 uppercase, 1 lowercase, 1 digit, 1 special character
 * - max 128 chars (defends against bcrypt DoS on absurdly long inputs)
 * WHY here (not in the service): validation belongs at the boundary, so bad
 * input never reaches business logic, and every route reuses the same rule.
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

const emailSchema = z.string().trim().toLowerCase().email('Invalid email address');

const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{4,10}$/, 'OTP must be numeric');

const cuidSchema = z.string().cuid('Invalid identifier');

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number (use E.164 format, e.g. +923001234567)')
    .optional(),
  marketingConsent: z.boolean().optional().default(false),
});

const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  purpose: z.enum(['REGISTRATION', 'EMAIL_CHANGE', 'TWO_FACTOR_AUTH', 'ACCOUNT_RECOVERY']).default('REGISTRATION'),
});

const resendOtpSchema = z.object({
  email: emailSchema,
  purpose: z.enum(['REGISTRATION', 'EMAIL_CHANGE', 'TWO_FACTOR_AUTH', 'ACCOUNT_RECOVERY']).default('REGISTRATION'),
});

const loginSchema = z.object({
  email: emailSchema,
  // Intentionally NOT reusing the strong-password regex here: policy
  // changes over time shouldn't lock out existing users at login. Only
  // presence/length is enforced; the actual credential check is the bcrypt
  // compare in the service layer.
  password: z.string().min(1, 'Password is required').max(128),
  rememberMe: z.boolean().optional().default(false),
});

const refreshTokenSchema = z.object({
  // Optional: the httpOnly cookie is the primary path for browser clients.
  // This lets mobile/API clients that can't rely on cookies pass it explicitly.
  refreshToken: z.string().min(1).optional(),
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from your current password',
    path: ['newPassword'],
  });

module.exports = {
  passwordSchema,
  emailSchema,
  otpSchema,
  cuidSchema,
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
