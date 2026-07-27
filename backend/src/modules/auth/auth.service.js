const env = require('../../config/env');
const logger = require('../../lib/logger');
const ApiError = require('../../utils/ApiError');
const { hashPassword, comparePassword } = require('../../utils/password');
const { generateNumericOtp, generateSecureToken, sha256, safeCompare } = require('../../utils/crypto');
const { signAccessToken, parseDurationToMs } = require('../../utils/tokens');
const { sendEmail } = require('../../emails/mailer');
const otpEmail = require('../../emails/templates/otpEmail');
const welcomeEmail = require('../../emails/templates/welcomeEmail');
const newDeviceLoginEmail = require('../../emails/templates/newDeviceLoginEmail');
const accountLockedEmail = require('../../emails/templates/accountLockedEmail');
const suspiciousTokenReuseEmail = require('../../emails/templates/suspiciousTokenReuseEmail');
const passwordResetEmail = require('../../emails/templates/passwordResetEmail');
const passwordChangedEmail = require('../../emails/templates/passwordChangedEmail');
const { OTP_PURPOSE, OTP_STATUS, USER_STATUS, ACTIVITY_EVENTS } = require('../../config/constants');
const authRepository = require('./auth.repository');

/**
 * ---------------------------------------------------------------------
 * REGISTRATION
 * ---------------------------------------------------------------------
 * Flow:
 *  1. Reject if a VERIFIED/active account already owns this email (409).
 *  2. If an UNVERIFIED account already owns this email (abandoned signup),
 *     reuse it instead of creating a duplicate row — just issue a fresh OTP.
 *     WHY: otherwise a user who mistyped their OTP and closed the tab is
 *     permanently stuck re-registering with "email already in use".
 *  3. Hash password with bcrypt (never store plaintext).
 *  4. Create User (status=PENDING_EMAIL_VERIFICATION) + UserProfile atomically.
 *  5. Issue an OTP for REGISTRATION purpose and email it.
 *  6. Log the registration as a UserActivityLog event (audit trail).
 *
 * We deliberately do NOT log the user in at this point (no tokens issued) —
 * an unverified email must not grant a session. This closes a common SaaS
 * hole where "register" silently doubles as "login".
 */
async function register({ email, password, firstName, lastName, phoneNumber }, requestContext) {
  const existingUser = await authRepository.findUserByEmail(email);

  if (existingUser && existingUser.status !== USER_STATUS.PENDING_EMAIL_VERIFICATION) {
    throw ApiError.conflict('An account with this email already exists.', 'EMAIL_ALREADY_REGISTERED');
  }

  if (existingUser && existingUser.emailVerifiedAt) {
    // Defensive: verified but status somehow not advanced — treat as taken.
    throw ApiError.conflict('An account with this email already exists.', 'EMAIL_ALREADY_REGISTERED');
  }

  if (phoneNumber) {
    const phoneOwner = await authRepository.findUserByPhone(phoneNumber);
    if (phoneOwner && phoneOwner.id !== existingUser?.id) {
      throw ApiError.conflict('This phone number is already in use.', 'PHONE_ALREADY_REGISTERED');
    }
  }

  const passwordHash = await hashPassword(password);
  let user;

  if (existingUser) {
    // Abandoned/unverified signup — update it rather than creating a duplicate.
    user = await authRepository.updateResumedSignup(existingUser.id, {
      passwordHash,
      phoneNumber: phoneNumber || existingUser.phoneNumber,
      firstName,
      lastName,
    });
  } else {
    user = await authRepository.createUserWithProfile({
      email,
      passwordHash,
      phoneNumber,
      firstName,
      lastName,
    });
  }

  await authRepository.logActivity({
    userId: user.id,
    event: ACTIVITY_EVENTS.USER_REGISTERED,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
    deviceInfo: JSON.stringify({
      deviceType: requestContext.deviceType,
      osName: requestContext.osName,
      browserName: requestContext.browserName,
    }),
    metadata: { email },
  });

  await issueAndSendOtp(user, OTP_PURPOSE.REGISTRATION, requestContext, {
    activityEvent: ACTIVITY_EVENTS.EMAIL_VERIFICATION_OTP_SENT,
  });

  return {
    id: user.id,
    email: user.email,
    status: user.status,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

/**
 * ---------------------------------------------------------------------
 * OTP ISSUANCE (shared by register + resend)
 * ---------------------------------------------------------------------
 * Generates a numeric OTP, hashes it (SHA-256 — see utils/crypto.js for
 * why bcrypt is intentionally NOT used here), revokes prior pending OTPs
 * of the same purpose so only the newest one is valid, persists it, and
 * emails it. Never returns or logs the raw OTP outside of the dev-mode
 * email fallback.
 */
async function issueAndSendOtp(user, purpose, requestContext, { activityEvent } = {}) {
  await authRepository.revokePendingOtps(user.id, purpose);

  const rawOtp = generateNumericOtp();

  console.log("");
   console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("");
    console.log(rawOtp);
      console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("");


 
  const otpHash = sha256(rawOtp);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  await authRepository.createOtp({
    userId: user.id,
    purpose,
    otpHash,
    expiresAt,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
    maxAttempts: env.OTP_MAX_ATTEMPTS,
  });

  const template = otpEmail({
    firstName: user.firstName,
    otp: rawOtp,
    purposeLabel: purpose === OTP_PURPOSE.REGISTRATION ? 'verify your email' : 'continue',
    expiryMinutes: env.OTP_EXPIRY_MINUTES,
  });

  await sendEmail({ to: user.email, subject: template.subject, html: template.html, text: template.text });

  if (activityEvent) {
    await authRepository.logActivity({
      userId: user.id,
      event: activityEvent,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadata: { purpose },
    });
  }
}

/**
 * ---------------------------------------------------------------------
 * VERIFY OTP
 * ---------------------------------------------------------------------
 * Security considerations:
 *  - Look up the LATEST PENDING OTP for (user, purpose) only — an old,
 *    revoked, or already-verified OTP can never be replayed.
 *  - Expiry is checked server-side against `expiresAt`, not client input.
 *  - Attempts are capped (OTP_MAX_ATTEMPTS); once reached the OTP is
 *    permanently invalidated (MAX_ATTEMPTS_REACHED) — the user must
 *    request a new one. This bounds brute force to `maxAttempts` guesses
 *    per code (a 6-digit code = 1,000,000 possibilities; 5 attempts is a
 *    negligible fraction).
 *  - Comparison uses a timing-safe equality check.
 *  - Do not reveal whether the account exists at all if email isn't found
 *    (generic error) to avoid user enumeration.
 */
async function verifyOtp({ email, otp, purpose }, requestContext) {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw ApiError.badRequest('Invalid or expired verification code.', 'INVALID_OTP');
  }

  const pendingOtp = await authRepository.findPendingOtpForUser(user.id, purpose);

  if (!pendingOtp) {
    throw ApiError.badRequest('No pending verification code found. Please request a new one.', 'OTP_NOT_FOUND');
  }

  if (pendingOtp.expiresAt.getTime() < Date.now()) {
    await authRepository.markOtpExpired(pendingOtp.id);
    throw ApiError.badRequest('Verification code has expired. Please request a new one.', 'OTP_EXPIRED');
  }

  if (pendingOtp.attempts >= pendingOtp.maxAttempts) {
    await authRepository.markOtpMaxAttemptsReached(pendingOtp.id);
    throw ApiError.badRequest(
      'Too many incorrect attempts. Please request a new verification code.',
      'OTP_MAX_ATTEMPTS_REACHED'
    );
  }

  const submittedHash = sha256(otp);
  const isMatch = safeCompare(submittedHash, pendingOtp.otpHash);

  if (!isMatch) {
    const updated = await authRepository.incrementOtpAttempts(pendingOtp.id);

    await authRepository.logActivity({
      userId: user.id,
      event: ACTIVITY_EVENTS.EMAIL_VERIFICATION_FAILED,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      failureReason: 'INVALID_OTP',
      metadata: { purpose, attempts: updated.attempts },
    });

    if (updated.attempts >= updated.maxAttempts) {
      await authRepository.markOtpMaxAttemptsReached(pendingOtp.id);
      throw ApiError.badRequest(
        'Too many incorrect attempts. Please request a new verification code.',
        'OTP_MAX_ATTEMPTS_REACHED'
      );
    }

    const remaining = updated.maxAttempts - updated.attempts;
    throw ApiError.badRequest(
      `Incorrect verification code. ${remaining} attempt(s) remaining.`,
      'INVALID_OTP'
    );
  }

  await authRepository.markOtpVerified(pendingOtp.id);

  let updatedUser = user;
  if (purpose === OTP_PURPOSE.REGISTRATION) {
    updatedUser = await authRepository.markEmailVerified(user.id);

    const welcome = welcomeEmail({ firstName: user.
firstName });
    await sendEmail({ to: user.email, subject: welcome.subject, html: welcome.html, text: welcome.text });
  }

  await authRepository.logActivity({
    userId: user.id,
    event: ACTIVITY_EVENTS.EMAIL_VERIFIED,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
    metadata: { purpose },
  });

  logger.info(`Email verified for user ${user.id} (${user.email})`);

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    status: updatedUser.status,
    emailVerifiedAt: updatedUser.emailVerifiedAt,
  };
}

/**
 * ---------------------------------------------------------------------
 * RESEND OTP
 * ---------------------------------------------------------------------
 * Security considerations:
 *  - Always returns a generic success-shaped message even if the email
 *    doesn't exist or is already verified, to prevent user enumeration
 *    via response differences.
 *  - Enforces a cooldown between resends (OTP_RESEND_COOLDOWN_SECONDS) to
 *    stop rapid-fire re-triggering of email sends.
 *  - Enforces an hourly cap (OTP_MAX_RESEND_PER_HOUR) independent of the
 *    IP-based rate limiter, so the limit holds even across IPs/devices.
 */
async function resendOtp({ email, purpose }, requestContext) {
  const genericResponse = {
    message: 'If an account with this email exists and is not yet verified, a new code has been sent.',
  };

  const user = await authRepository.findUserByEmail(email);
  if (!user) return genericResponse;

  if (purpose === OTP_PURPOSE.REGISTRATION && user.emailVerifiedAt) {
    return genericResponse; // already verified — say nothing more specific
  }

  const latestOtp = await authRepository.findLatestOtp(user.id, purpose);
  if (latestOtp) {
    const secondsSinceLast = (Date.now() - latestOtp.createdAt.getTime()) / 1000;
    if (secondsSinceLast < env.OTP_RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(env.OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast);
      throw ApiError.tooManyRequests(
        `Please wait ${waitSeconds}s before requesting another code.`,
        'OTP_RESEND_COOLDOWN'
      );
    }
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const requestsInLastHour = await authRepository.countOtpRequestsSince(user.id, purpose, oneHourAgo);
  if (requestsInLastHour >= env.OTP_MAX_RESEND_PER_HOUR) {
    throw ApiError.tooManyRequests(
      'You have requested too many codes recently. Please try again later.',
      'OTP_HOURLY_LIMIT_REACHED'
    );
  }

  await issueAndSendOtp(user, purpose, requestContext, {
    activityEvent: ACTIVITY_EVENTS.EMAIL_VERIFICATION_OTP_RESENT,
  });

  return genericResponse;
}

/**
 * ---------------------------------------------------------------------
 * LOGIN
 * ---------------------------------------------------------------------
 * Flow:
 *  1. Look up user by email. Unknown email -> generic 401 (no enumeration).
 *  2. Reject early if the account is currently locked (lockedUntil in the
 *     future) — don't even attempt a password compare.
 *  3. Reject based on account status (pending verification / suspended /
 *     deactivated / deleted) with status-specific messages EXCEPT for
 *     DELETED, which returns the same generic 401 as "wrong password" so a
 *     deleted account can't be distinguished from a nonexistent one.
 *  4. bcrypt-compare the password.
 *     - Wrong password: increment failedLoginAttempts. If that reaches
 *       MAX_FAILED_LOGIN_ATTEMPTS, lock the account for
 *       ACCOUNT_LOCK_DURATION_MINUTES, email a security alert, and return
 *       423-style "locked" instead of "invalid credentials" — this is
 *       standard SaaS UX (GitHub/Slack do the same) and doesn't enable
 *       enumeration since it only fires after 5 confirmed wrong-password
 *       attempts against a real account.
 *  5. On success: reset the failure counter, record lastLogin*, detect
 *     whether this is a device we've never seen for this user (only
 *     possible if the client sends X-Device-Id), issue an access token
 *     (JWT, mirrored into an AuthSession row for revocation) and a refresh
 *     token (opaque random, hashed into RefreshToken for rotation), and
 *     log LOGIN_SUCCESS.
 *  6. "Remember me" only affects the refresh token's lifetime (30d vs 7d);
 *     the access token lifetime never changes, since it's the DB-backed
 *     refresh flow — not a long-lived access JWT — that should carry trust
 *     over time.
 */
async function login({ email, password, rememberMe }, requestContext) {
  const invalidCredentials = () =>
    ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');

  const user = await authRepository.findUserWithProfileByEmail(email);

  if (!user) {
    await authRepository.logActivity({
      event: ACTIVITY_EVENTS.LOGIN_FAILED,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      failureReason: 'USER_NOT_FOUND',
      metadata: { email },
    });
    throw invalidCredentials();
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    await authRepository.logActivity({
      userId: user.id,
      event: ACTIVITY_EVENTS.LOGIN_FAILED,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      failureReason: 'ACCOUNT_LOCKED',
    });
    throw ApiError.forbidden(
      `Account is temporarily locked. Try again in ${minutesLeft} minute(s).`,
      'ACCOUNT_LOCKED'
    );
  }

  if (user.status === USER_STATUS.PENDING_EMAIL_VERIFICATION) {
    throw ApiError.forbidden('Please verify your email before logging in.', 'EMAIL_NOT_VERIFIED');
  }
  if (user.status === USER_STATUS.SUSPENDED || user.isSuspended) {
    throw ApiError.forbidden(
      user.suspendReason ? `Account suspended: ${user.suspendReason}` : 'Account is suspended.',
      'ACCOUNT_SUSPENDED'
    );
  }
  if (user.status === USER_STATUS.DEACTIVATED) {
    throw ApiError.forbidden('This account has been deactivated.', 'ACCOUNT_DEACTIVATED');
  }
  if (user.status === USER_STATUS.LOCKED) {
    throw ApiError.forbidden('Account is locked. Please contact support.', 'ACCOUNT_LOCKED');
  }
  if (user.status === USER_STATUS.DELETED || user.deletedAt) {
    throw invalidCredentials();
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    const updated = await authRepository.incrementFailedLoginAttempts(user.id);

    await authRepository.logActivity({
      userId: user.id,
      event: ACTIVITY_EVENTS.LOGIN_FAILED,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      failureReason: 'INVALID_PASSWORD',
      metadata: { attempts: updated.failedLoginAttempts },
    });

    if (updated.failedLoginAttempts >= env.MAX_FAILED_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + env.ACCOUNT_LOCK_DURATION_MINUTES * 60 * 1000);
      await authRepository.lockAccount(user.id, lockedUntil);

      await authRepository.logActivity({
        userId: user.id,
        event: ACTIVITY_EVENTS.ACCOUNT_LOCKED,
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
        metadata: { lockDurationMinutes: env.ACCOUNT_LOCK_DURATION_MINUTES },
      });

      const lockedEmailTemplate = accountLockedEmail({
        firstName: user.
  firstName,
        lockDurationMinutes: env.ACCOUNT_LOCK_DURATION_MINUTES,
        ipAddress: requestContext.ipAddress,
      });
      await sendEmail({
        to: user.email,
        subject: lockedEmailTemplate.subject,
        html: lockedEmailTemplate.html,
        text: lockedEmailTemplate.text,
      });

      throw ApiError.forbidden(
        `Too many failed attempts. Account locked for ${env.ACCOUNT_LOCK_DURATION_MINUTES} minutes.`,
        'ACCOUNT_LOCKED'
      );
    }

    const remaining = env.MAX_FAILED_LOGIN_ATTEMPTS - updated.failedLoginAttempts;
    throw ApiError.unauthorized(
      `Invalid email or password. ${remaining} attempt(s) remaining before lockout.`,
      'INVALID_CREDENTIALS'
    );
  }

  // --- Success ---
  const knownSession = await authRepository.findAnySessionByDeviceForUser(
    user.id,
    requestContext.deviceId
  );
  const isNewDevice = Boolean(requestContext.deviceId) && !knownSession;

  await authRepository.resetFailedLoginAttempts(user.id);
  await authRepository.updateLastLogin(user.id, {
    ipAddress: requestContext.ipAddress,
    deviceName: requestContext.deviceName || requestContext.browserName,
  });

  const accessJti = generateSecureToken(16);
  const accessToken = signAccessToken({ sub: user.id, role: user.role, jti: accessJti });
  const accessExpiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_ACCESS_EXPIRES_IN));

  const rawRefreshToken = generateSecureToken(48);
  const refreshTokenHash = sha256(rawRefreshToken);
  const refreshTtlMs = rememberMe
    ? parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN_REMEMBER_ME)
    : parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN);
  const refreshExpiresAt = new Date(Date.now() + refreshTtlMs);

  await authRepository.createAuthSession({
    userId: user.id,
    token: accessJti,
    tokenType: 'access',
    deviceId: requestContext.deviceId,
    deviceName: requestContext.deviceName,
    deviceType: requestContext.deviceType,
    osName: requestContext.osName,
    osVersion: requestContext.osVersion,
    browserName: requestContext.browserName,
    browserVersion: requestContext.browserVersion,
    ipAddress: requestContext.ipAddress,
    expiresAt: accessExpiresAt,
  });

  await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash: refreshTokenHash,
    deviceId: requestContext.deviceId,
    ipAddress: requestContext.ipAddress,
    expiresAt: refreshExpiresAt,
  });

  await authRepository.logActivity({
    userId: user.id,
    event: ACTIVITY_EVENTS.LOGIN_SUCCESS,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
    deviceInfo: JSON.stringify({
      deviceType: requestContext.deviceType,
      osName: requestContext.osName,
      browserName: requestContext.browserName,
    }),
  });

  if (isNewDevice) {
    await authRepository.logActivity({
      userId: user.id,
      event: ACTIVITY_EVENTS.NEW_DEVICE_LOGIN_DETECTED,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    });

    const newDeviceTemplate = newDeviceLoginEmail({
      firstName: user.
firstName,
      deviceName: requestContext.deviceName,
      browserName: requestContext.browserName,
      osName: requestContext.osName,
      ipAddress: requestContext.ipAddress,
      loginTime: new Date().toUTCString(),
    });
    await sendEmail({
      to: user.email,
      subject: newDeviceTemplate.subject,
      html: newDeviceTemplate.html,
      text: newDeviceTemplate.text,
    });
  }

  logger.info(`User ${user.id} (${user.email}) logged in successfully`);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      firstName: user.
firstName,
      lastName: user.lastName,
    },
    accessToken,
    accessExpiresAt,
    refreshToken: rawRefreshToken,
    refreshExpiresAt,
  };
}

/**
 * ---------------------------------------------------------------------
 * REFRESH ACCESS TOKEN (rotation + reuse detection)
 * ---------------------------------------------------------------------
 * Flow:
 *  1. Hash the presented refresh token, look it up by hash (never by raw
 *     value — the DB never stores the raw token, mirroring OTP handling).
 *  2. Not found at all -> the token is forged/garbage -> 401.
 *  3. Found but `isRevoked` -> REUSE DETECTED. A refresh token is only ever
 *     revoked by being rotated (or by logout). If it's presented again
 *     after that, either:
 *       a) the legitimate client retried a request weirdly (rare, harmless), or
 *       b) an attacker stole a token from an earlier point in time and the
 *          legitimate user has since rotated past it (likely theft).
 *     We can't distinguish (a) from (b) with certainty, so we treat it as
 *     (b): revoke every refresh token and every session this user has
 *     (full sign-out everywhere), log a REFRESH_TOKEN_REUSE_DETECTED
 *     security event, and email a security alert. This is the standard
 *     industry response (Auth0, GitHub do the same).
 *  4. Found, not revoked, but expired -> 401, require a fresh login.
 *  5. Valid -> ROTATE atomically: revoke this token, mint + store a new
 *     one (same user/device/ip lineage via replacedByTokenId), issue a new
 *     access token (new jti + AuthSession row) so the old access token's
 *     session stays independently revocable until its own natural expiry.
 */
async function refreshAccessToken(rawRefreshToken, requestContext) {
  if (!rawRefreshToken) {
    throw ApiError.unauthorized('No refresh token provided.', 'NO_REFRESH_TOKEN');
  }

  const tokenHash = sha256(rawRefreshToken);
  const existingToken = await authRepository.findRefreshTokenByHash(tokenHash);

  if (!existingToken) {
    throw ApiError.unauthorized('Invalid refresh token.', 'INVALID_REFRESH_TOKEN');
  }

  if (existingToken.isRevoked && existingToken.replacedByTokenId) {
    // Revoked AND superseded by a newer token via rotation — this is the
    // real reuse signal: someone presented a token from an earlier point
    // in the rotation chain after it was already rotated past. A token
    // revoked WITHOUT a replacement (logout, admin action, or an earlier
    // reuse nuke) falls through to the plain "revoked" branch below instead
    // — presenting an intentionally-logged-out token isn't an attack, and
    // treating it as one would trigger a false "you've been signed out
    // everywhere" alert email every time a client retries after logout.
    await authRepository.revokeAllRefreshTokensForUser(existingToken.userId);
    await authRepository.revokeAllSessionsForUser(existingToken.userId, 'REFRESH_TOKEN_REUSE_DETECTED');

    await authRepository.logActivity({
      userId: existingToken.userId,
      event: ACTIVITY_EVENTS.REFRESH_TOKEN_REUSE_DETECTED,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadata: { reusedTokenId: existingToken.id },
    });

    const compromisedUser = await authRepository.findUserWithProfileById(existingToken.userId);
    if (compromisedUser) {
      const alertTemplate = suspiciousTokenReuseEmail({
        firstName: compromisedUser.
  firstName,
        ipAddress: requestContext.ipAddress,
      });
      await sendEmail({
        to: compromisedUser.email,
        subject: alertTemplate.subject,
        html: alertTemplate.html,
        text: alertTemplate.text,
      });
    }

    logger.warn(`Refresh token reuse detected for user ${existingToken.userId} — all sessions revoked`);

    throw ApiError.unauthorized(
      'This session is no longer valid. You have been signed out of all devices for security. Please log in again.',
      'REFRESH_TOKEN_REUSE_DETECTED'
    );
  }

  if (existingToken.isRevoked) {
    // Revoked by logout / logout-all / admin action / a prior reuse nuke —
    // legitimate, expected state. No alert, no account-wide nuke, just a
    // normal "please log in again".
    throw ApiError.unauthorized('This session has ended. Please log in again.', 'REFRESH_TOKEN_REVOKED');
  }

  if (existingToken.expiresAt.getTime() < Date.now()) {
    throw ApiError.unauthorized('Refresh token expired. Please log in again.', 'REFRESH_TOKEN_EXPIRED');
  }

  const user = await authRepository.findUserWithProfileById(existingToken.userId);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists.', 'USER_NOT_FOUND');
  }

  const blockedStatuses = [USER_STATUS.SUSPENDED, USER_STATUS.DEACTIVATED, USER_STATUS.LOCKED, USER_STATUS.DELETED];
  if (blockedStatuses.includes(user.status) || user.isSuspended) {
    throw ApiError.forbidden('Account is not active.', 'ACCOUNT_NOT_ACTIVE');
  }

  const newRawRefreshToken = generateSecureToken(48);
  const newRefreshTokenHash = sha256(newRawRefreshToken);
  // Rotated tokens preserve the ORIGINAL token's remaining lifetime rather
  // than resetting a fresh full TTL — otherwise a client that refreshes
  // constantly could stay logged in forever, defeating "remember me"'s
  // upper bound.
  const refreshExpiresAt = existingToken.expiresAt;

  const newRefreshToken = await authRepository.rotateRefreshToken({
    oldTokenId: existingToken.id,
    userId: user.id,
    newTokenHash: newRefreshTokenHash,
    deviceId: existingToken.deviceId,
    ipAddress: requestContext.ipAddress,
    expiresAt: refreshExpiresAt,
  });

  const accessJti = generateSecureToken(16);
  const accessToken = signAccessToken({ sub: user.id, role: user.role, jti: accessJti });
  const accessExpiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_ACCESS_EXPIRES_IN));

  await authRepository.createAuthSession({
    userId: user.id,
    token: accessJti,
    tokenType: 'access',
    deviceId: existingToken.deviceId,
    ipAddress: requestContext.ipAddress,
    expiresAt: accessExpiresAt,
  });

  await authRepository.logActivity({
    userId: user.id,
    event: ACTIVITY_EVENTS.TOKEN_REFRESHED,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
    metadata: { rotatedFromTokenId: existingToken.id, newTokenId: newRefreshToken.id },
  });

  return {
    accessToken,
    accessExpiresAt,
    refreshToken: newRawRefreshToken,
    refreshExpiresAt,
  };
}

/**
 * ---------------------------------------------------------------------
 * LOGOUT (current device)
 * ---------------------------------------------------------------------
 * Revokes the access-token session identified by `sessionId` (set by the
 * `authenticate` middleware from the JWT's `jti`) so the current access
 * token stops working immediately, even before it naturally expires.
 *
 * Also revokes the refresh token tied to the SAME device as that session,
 * so the client can't silently mint a new access token via /refresh-token
 * right after "logging out". See auth.repository.js
 * revokeRefreshTokensForDevice for why this only happens when a deviceId
 * is known.
 */
async function logout(userId, sessionId, requestContext) {
  const session = await authRepository.findSessionById(sessionId);

  if (session && !session.isRevoked) {
    await authRepository.revokeSessionById(sessionId, 'USER_LOGOUT');
  }

  if (session?.deviceId) {
    await authRepository.revokeRefreshTokensForDevice(userId, session.deviceId);
  }

  await authRepository.logActivity({
    userId,
    event: ACTIVITY_EVENTS.LOGOUT,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
  });

  logger.info(`User ${userId} logged out (session ${sessionId})`);
}

/**
 * ---------------------------------------------------------------------
 * LOGOUT ALL DEVICES
 * ---------------------------------------------------------------------
 * Revokes EVERY access-token session and EVERY refresh token for the user,
 * regardless of device. Used for "sign out everywhere" (e.g. after a
 * password change, or the user manually choosing it from a security page).
 * This is the same nuclear operation reuse detection performs internally,
 * just triggered voluntarily instead of by a security event.
 */
async function logoutAllDevices(userId, requestContext) {
  await authRepository.revokeAllSessionsForUser(userId, 'USER_LOGOUT_ALL_DEVICES');
  await authRepository.revokeAllRefreshTokensForUser(userId);

  await authRepository.logActivity({
    userId,
    event: ACTIVITY_EVENTS.LOGOUT_ALL_DEVICES,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
  });

  logger.info(`User ${userId} logged out of all devices`);
}

/**
 * ---------------------------------------------------------------------
 * SHARED: PASSWORD REUSE CHECK
 * ---------------------------------------------------------------------
 * Used by both reset-password and change-password. Checks the candidate
 * new password against the user's CURRENT live password hash plus their
 * last PASSWORD_HISTORY_LIMIT historical hashes. bcrypt-compares are run
 * sequentially (not Promise.all) so we can short-circuit on the first
 * match instead of always paying for every comparison.
 */
async function assertPasswordNotReused(userId, currentPasswordHash, newPassword) {
  if (await comparePassword(newPassword, currentPasswordHash)) {
    throw ApiError.badRequest(
      'New password must be different from your current password.',
      'PASSWORD_REUSE_NOT_ALLOWED'
    );
  }

  const history = await authRepository.findRecentPasswordHistory(userId, env.PASSWORD_HISTORY_LIMIT);
  for (const entry of history) {
    // eslint-disable-next-line no-await-in-loop
    if (await comparePassword(newPassword, entry.passwordHash)) {
      throw ApiError.badRequest(
        `You can't reuse one of your last ${env.PASSWORD_HISTORY_LIMIT} passwords. Please choose a different one.`,
        'PASSWORD_REUSE_NOT_ALLOWED'
      );
    }
  }
}

/** Records the password being replaced into history, then prunes old entries beyond the configured limit. */
async function recordPasswordHistory(userId, outgoingPasswordHash) {
  await authRepository.addPasswordHistory(userId, outgoingPasswordHash);
  await authRepository.trimPasswordHistory(userId, env.PASSWORD_HISTORY_LIMIT);
}

/**
 * ---------------------------------------------------------------------
 * FORGOT PASSWORD (request a reset link)
 * ---------------------------------------------------------------------
 * Always returns the same generic message regardless of whether the email
 * exists, is unverified, or is suspended — no enumeration. DB-backed
 * cooldown (independent of the IP rate limiter) stops rapid re-triggering
 * of reset emails for one account. Any previously-issued, still-valid
 * reset token is invalidated the moment a new one is requested, so only
 * the newest link ever works.
 */
async function forgotPassword({ email }, requestContext) {
  const genericResponse = {
    message: 'If an account with this email exists, a password reset link has been sent.',
  };

  const user = await authRepository.findUserWithProfileByEmail(email);
  if (!user) return genericResponse;

  const blockedStatuses = [USER_STATUS.SUSPENDED, USER_STATUS.DEACTIVATED, USER_STATUS.DELETED];
  if (blockedStatuses.includes(user.status) || user.isSuspended || user.deletedAt) {
    // Don't reveal account state via a different response, but don't send
    // a reset link to an account that can't log in anyway.
    return genericResponse;
  }

  const latestToken = await authRepository.findLatestPasswordResetToken(user.id);
  if (latestToken) {
    const secondsSinceLast = (Date.now() - latestToken.createdAt.getTime()) / 1000;
    if (secondsSinceLast < env.PASSWORD_RESET_REQUEST_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(env.PASSWORD_RESET_REQUEST_COOLDOWN_SECONDS - secondsSinceLast);
      throw ApiError.tooManyRequests(
        `Please wait ${waitSeconds}s before requesting another reset link.`,
        'PASSWORD_RESET_COOLDOWN'
      );
    }
  }

  await authRepository.revokePendingPasswordResetTokens(user.id);

  const rawToken = generateSecureToken(32);
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await authRepository.createPasswordResetToken({ userId: user.id, tokenHash, expiresAt });

  const template = passwordResetEmail({ firstName: user.firstName, rawToken });
  await sendEmail({ to: user.email, subject: template.subject, html: template.html, text: template.text });

  await authRepository.logActivity({
    userId: user.id,
    event: ACTIVITY_EVENTS.PASSWORD_RESET_REQUESTED,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
  });

  return genericResponse;
}

/**
 * ---------------------------------------------------------------------
 * RESET PASSWORD (consume the emailed token — unauthenticated flow)
 * ---------------------------------------------------------------------
 * The user isn't logged in when this runs (that's the whole point of
 * "forgot" password), so there's no "current session" to preserve —
 * unlike change-password, this revokes EVERY session and refresh token
 * for the account. If an attacker's session was active, this kicks them
 * out too.
 */
async function resetPassword({ token, newPassword }, requestContext) {
  const tokenHash = sha256(token);
  const resetToken = await authRepository.findPasswordResetTokenByHash(tokenHash);

  if (!resetToken) {
    throw ApiError.badRequest('Invalid or expired reset link.', 'INVALID_RESET_TOKEN');
  }
  if (resetToken.isUsed) {
    throw ApiError.badRequest('This reset link has already been used.', 'RESET_TOKEN_ALREADY_USED');
  }
  if (resetToken.expiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest('This reset link has expired. Please request a new one.', 'RESET_TOKEN_EXPIRED');
  }

  const user = await authRepository.findUserWithProfileById(resetToken.userId);
  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset link.', 'INVALID_RESET_TOKEN');
  }

  await assertPasswordNotReused(user.id, user.passwordHash, newPassword);

  const newPasswordHash = await hashPassword(newPassword);
  await recordPasswordHistory(user.id, user.passwordHash);
  await authRepository.updatePasswordHash(user.id, newPasswordHash);
  await authRepository.markPasswordResetTokenUsed(resetToken.id, requestContext.ipAddress);

  await authRepository.revokeAllSessionsForUser(user.id, 'PASSWORD_RESET');
  await authRepository.revokeAllRefreshTokensForUser(user.id);

  await authRepository.logActivity({
    userId: user.id,
    event: ACTIVITY_EVENTS.PASSWORD_RESET_COMPLETED,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
  });

  const confirmationTemplate = passwordChangedEmail({
    firstName: user.firstName,
    ipAddress: requestContext.ipAddress,
  });
  await sendEmail({
    to: user.email,
    subject: confirmationTemplate.subject,
    html: confirmationTemplate.html,
    text: confirmationTemplate.text,
  });

  logger.info(`Password reset completed for user ${user.id}`);

  return { message: 'Password reset successfully. Please log in with your new password.' };
}

/**
 * ---------------------------------------------------------------------
 * CHANGE PASSWORD (authenticated flow — user knows their current password)
 * ---------------------------------------------------------------------
 * Unlike reset-password, the caller IS logged in right now, so we preserve
 * their current session (`currentSessionId`/`currentDeviceId`) and only
 * revoke every OTHER session/device — friendlier than forcing them to
 * immediately re-log-in on the device they're actively using.
 */
async function changePassword({ userId, currentSessionId, currentPassword, newPassword }, requestContext) {
  const user = await authRepository.findUserWithProfileById(userId);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists.', 'USER_NOT_FOUND');
  }

  const currentPasswordMatches = await comparePassword(currentPassword, user.passwordHash);
  if (!currentPasswordMatches) {
    await authRepository.logActivity({
      userId,
      event: ACTIVITY_EVENTS.PASSWORD_CHANGE_FAILED,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      failureReason: 'INVALID_CURRENT_PASSWORD',
    });
    throw ApiError.unauthorized('Current password is incorrect.', 'INVALID_CURRENT_PASSWORD');
  }

  await assertPasswordNotReused(user.id, user.passwordHash, newPassword);

  const newPasswordHash = await hashPassword(newPassword);
  await recordPasswordHistory(user.id, user.passwordHash);
  await authRepository.updatePasswordHash(user.id, newPasswordHash);

  // Look up the current session to find its deviceId, so we can spare that
  // one device's refresh token from the "sign out everywhere else" sweep.
  const currentSession = await authRepository.findSessionById(currentSessionId);
  const currentDeviceId = currentSession?.deviceId || null;

  await authRepository.revokeAllSessionsForUserExcept(user.id, currentSessionId, 'PASSWORD_CHANGED');
  await authRepository.revokeAllRefreshTokensForUserExcept(user.id, currentDeviceId);

  await authRepository.logActivity({
    userId,
    event: ACTIVITY_EVENTS.PASSWORD_CHANGED,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
  });

  const confirmationTemplate = passwordChangedEmail({
    firstName: user.firstName,
    ipAddress: requestContext.ipAddress,
  });
  await sendEmail({
    to: user.email,
    subject: confirmationTemplate.subject,
    html: confirmationTemplate.html,
    text: confirmationTemplate.text,
  });

  logger.info(`Password changed for user ${userId}`);

  return { message: 'Password changed successfully. You have been signed out of all other devices.' };
}

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  issueAndSendOtp,
  login,
  refreshAccessToken,
  logout,
  logoutAllDevices,
  forgotPassword,
  resetPassword,
  changePassword,
};
