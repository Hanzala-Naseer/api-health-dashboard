/**
 * Centralized environment configuration.
 *
 * WHY: Scattering `process.env.X` across the codebase makes it impossible to
 * know what config exists, and typos silently become `undefined` at runtime.
 * Instead we validate the entire environment ONCE at boot with zod. If
 * anything required is missing/malformed, the process fails fast with a
 * clear error instead of misbehaving in production.
 */

require('dotenv').config();
const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  APP_NAME: z.string().default('PulseOps'),
  CLIENT_URL: z.string().url(),
  API_BASE_URL: z.string().url(),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN_REMEMBER_ME: z.string().default('30d'),
  JWT_ISSUER: z.string().default('pulseOps-api'),
  JWT_AUDIENCE: z.string().default('pulseOps-client'),

  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  BCRYPT_SALT_ROUNDS: z.coerce.number().min(10).max(15).default(12),

  OTP_LENGTH: z.coerce.number().min(4).max(10).default(6),
  OTP_EXPIRY_MINUTES: z.coerce.number().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60),
  OTP_MAX_RESEND_PER_HOUR: z.coerce.number().default(5),

  MAX_FAILED_LOGIN_ATTEMPTS: z.coerce.number().default(5),
  ACCOUNT_LOCK_DURATION_MINUTES: z.coerce.number().default(30),

  PASSWORD_RESET_TOKEN_EXPIRY_MINUTES: z.coerce.number().default(30),
  PASSWORD_RESET_REQUEST_COOLDOWN_SECONDS: z.coerce.number().default(60),
  PASSWORD_HISTORY_LIMIT: z.coerce.number().default(5),

  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().default(15),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().default(15),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(10),

  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
  .string()
  .default("false")
  .transform((val) => val.toLowerCase() === "true"),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM_NAME: z.string().default('PulseOps'),
  EMAIL_FROM_ADDRESS: z.string().default('no-reply@pulseops.app'),

  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z.string().optional().default(''),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('debug'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

module.exports = env;
