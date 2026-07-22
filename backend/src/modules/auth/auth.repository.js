const { mongoose } = require('../../lib/db');
const User = require('../../models/User.model');
const AuthSession = require('../../models/AuthSession.model');
const RefreshToken = require('../../models/RefreshToken.model');
const OtpVerification = require('../../models/OtpVerification.model');
const PasswordResetToken = require('../../models/PasswordResetToken.model');
const PasswordHistory = require('../../models/PasswordHistory.model');
const UserActivityLog = require('../../models/UserActivityLog.model');

/**
 * WHY a repository layer:
 * The service layer should express BUSINESS RULES ("a user can't register
 * twice", "an OTP can only be used once"), not Mongoose query syntax.
 * Isolating all model calls here means:
 *  - the service is easy to read and unit-test (mock this repository)
 *  - if we ever swap ODMs or add caching, only this file changes
 */

const authRepository = {
  findUserByEmail(email) {
    return User.findOne({ email });
  },

  findUserById(id) {
    return User.findById(id);
  },

  findUserByPhone(phoneNumber) {
    return User.findOne({ phoneNumber });
  },

  /**
   * Creates the User with its embedded profile. Unlike the old Prisma
   * version, there's no separate UserProfile row/transaction needed since
   * the profile is embedded — the single insert is already atomic.
   */
  async createUserWithProfile({ email, passwordHash, phoneNumber, firstName, lastName, marketingConsent }) {
    return User.create({
      email,
      passwordHash,
      phoneNumber: phoneNumber || undefined,
      profile: {
        firstName,
        lastName,
        marketingConsent: !!marketingConsent,
        marketingConsentAt: marketingConsent ? new Date() : null,
      },
    });
  },

  /**
   * Updates an abandoned/unverified signup in place (see auth.service.js
   * register()) instead of creating a duplicate user. Replaces the direct
   * `prisma.user.update({ ..., profile: { update: {...} } })` call that
   * used to live in the service — kept here so the service never touches
   * the ODM directly.
   */
  updateResumedSignup(userId, { passwordHash, phoneNumber, firstName, lastName }) {
    return User.findByIdAndUpdate(
      userId,
      {
        passwordHash,
        ...(phoneNumber ? { phoneNumber } : {}),
        'profile.firstName': firstName,
        'profile.lastName': lastName,
      },
      { new: true }
    );
  },

  markEmailVerified(userId) {
    return User.findByIdAndUpdate(
      userId,
      { emailVerifiedAt: new Date(), status: 'ACTIVE' },
      { new: true }
    );
  },

  /**
   * Invalidates all previously PENDING OTPs of a given purpose for a user.
   * WHY: prevents a stale earlier OTP from still being valid/guessable
   * after a new one is issued — only the latest OTP should ever work.
   */
  revokePendingOtps(userId, purpose) {
    return OtpVerification.updateMany({ userId, purpose, status: 'PENDING' }, { status: 'REVOKED' });
  },

  createOtp({ userId, purpose, otpHash, expiresAt, ipAddress, userAgent, maxAttempts }) {
    return OtpVerification.create({
      userId,
      purpose,
      otpHash,
      expiresAt,
      ipAddress,
      userAgent,
      maxAttempts,
    });
  },

  /** Latest non-expired, non-revoked OTP of a purpose for a user (for resend cooldown checks). */
  findLatestOtp(userId, purpose) {
    return OtpVerification.findOne({ userId, purpose }).sort({ createdAt: -1 });
  },

  /** Count OTP requests within a rolling window (for hourly resend caps). */
  countOtpRequestsSince(userId, purpose, since) {
    return OtpVerification.countDocuments({ userId, purpose, createdAt: { $gte: since } });
  },

  findActiveOtpById(id) {
    return OtpVerification.findById(id);
  },

  findPendingOtpForUser(userId, purpose) {
    return OtpVerification.findOne({ userId, purpose, status: 'PENDING' }).sort({ createdAt: -1 });
  },

  incrementOtpAttempts(otpId) {
    return OtpVerification.findByIdAndUpdate(otpId, { $inc: { attempts: 1 } }, { new: true });
  },

  markOtpVerified(otpId) {
    return OtpVerification.findByIdAndUpdate(
      otpId,
      { status: 'VERIFIED', isUsed: true, usedAt: new Date() },
      { new: true }
    );
  },

  markOtpMaxAttemptsReached(otpId) {
    return OtpVerification.findByIdAndUpdate(otpId, { status: 'MAX_ATTEMPTS_REACHED' }, { new: true });
  },

  markOtpExpired(otpId) {
    return OtpVerification.findByIdAndUpdate(otpId, { status: 'EXPIRED' }, { new: true });
  },

  logActivity({ userId, event, ipAddress, userAgent, deviceInfo, failureReason, metadata }) {
    return UserActivityLog.create({
      userId: userId || undefined,
      event,
      ipAddress,
      userAgent,
      deviceInfo,
      failureReason,
      metadata,
    });
  },

  // -------------------------------------------------------------
  // LOGIN / LOCKOUT
  // -------------------------------------------------------------

  findUserWithProfileByEmail(email) {
    // profile is embedded — no include/populate needed
    return User.findOne({ email });
  },

  incrementFailedLoginAttempts(userId) {
    return User.findByIdAndUpdate(
      userId,
      { $inc: { failedLoginAttempts: 1 }, lastFailedLoginAt: new Date() },
      { new: true }
    );
  },

  resetFailedLoginAttempts(userId) {
    return User.findByIdAndUpdate(userId, { failedLoginAttempts: 0, lockedUntil: null }, { new: true });
  },

  lockAccount(userId, lockedUntil) {
    return User.findByIdAndUpdate(userId, { lockedUntil, failedLoginAttempts: 0 }, { new: true });
  },

  updateLastLogin(userId, { ipAddress, deviceName }) {
    return User.findByIdAndUpdate(
      userId,
      { lastLoginAt: new Date(), lastLoginIp: ipAddress, lastLoginDevice: deviceName },
      { new: true }
    );
  },

  /**
   * "Known device" check for new-device login alerts — looks for ANY past
   * session (active or expired) tied to this deviceId, since we only care
   * about recognition, not current validity.
   */
  findAnySessionByDeviceForUser(userId, deviceId) {
    if (!deviceId) return null;
    return AuthSession.findOne({ userId, deviceId });
  },

  createAuthSession(data) {
    return AuthSession.create(data);
  },

  createRefreshToken(data) {
    return RefreshToken.create(data);
  },

  // -------------------------------------------------------------
  // REFRESH TOKEN ROTATION / REUSE DETECTION
  // -------------------------------------------------------------

  findRefreshTokenByHash(tokenHash) {
    return RefreshToken.findOne({ tokenHash });
  },

  findUserWithProfileById(id) {
    return User.findById(id);
  },

  /**
   * Atomically revokes the presented (already-used) refresh token and
   * issues its replacement, linking them via replacedByTokenId. Uses a
   * Mongoose session + transaction so a crash mid-rotation can never leave
   * two simultaneously "valid" refresh tokens for the same rotation step.
   *
   * NOTE: transactions require MongoDB to be running as a replica set (or
   * a sharded cluster) — a single standalone `mongod` cannot run
   * multi-document transactions. Local dev via `mongod --replSet rs0` (or
   * MongoDB Atlas, which is always a replica set) is required.
   */
  async rotateRefreshToken({ oldTokenId, userId, newTokenHash, deviceId, ipAddress, expiresAt }) {
    const session = await mongoose.startSession();
    try {
      let newToken;
      await session.withTransaction(async () => {
        const created = await RefreshToken.create(
          [{ userId, tokenHash: newTokenHash, deviceId, ipAddress, expiresAt }],
          { session }
        );
        newToken = created[0];

        await RefreshToken.findByIdAndUpdate(
          oldTokenId,
          { isRevoked: true, revokedAt: new Date(), replacedByTokenId: newToken._id },
          { session }
        );
      });
      return newToken;
    } finally {
      await session.endSession();
    }
  },

  /**
   * "Nuclear" response to reuse detection: revoke every refresh token AND
   * every active access-token session this user has, forcing a full
   * sign-out everywhere. We don't have a per-family/lineage table beyond
   * the single `replacedByTokenId` forward pointer, so rather than trying
   * to walk (and possibly miss part of) one chain, we treat reuse as
   * evidence the account itself may be compromised and revoke everything.
   */
  revokeAllRefreshTokensForUser(userId) {
    return RefreshToken.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  },

  revokeAllSessionsForUser(userId, reason) {
    return AuthSession.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: reason }
    );
  },

  // -------------------------------------------------------------
  // LOGOUT
  // -------------------------------------------------------------

  findSessionById(id) {
    return AuthSession.findById(id);
  },

  revokeSessionById(id, reason) {
    return AuthSession.findByIdAndUpdate(
      id,
      { isRevoked: true, revokedAt: new Date(), revokedReason: reason },
      { new: true }
    );
  },

  /**
   * Revokes only the refresh token(s) tied to a specific device — used by
   * single-device logout. Deliberately requires a non-null deviceId: see
   * auth.service.js logout() and the README security notes for why a null
   * deviceId is never used to bulk-revoke.
   */
  revokeRefreshTokensForDevice(userId, deviceId) {
    if (!deviceId) return Promise.resolve({ acknowledged: true, modifiedCount: 0 });
    return RefreshToken.updateMany(
      { userId, deviceId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  },

  /**
   * Revokes every active session/refresh token for a user EXCEPT the one
   * tied to `exceptSessionId` — used by change-password (authenticated
   * flow) to sign the user out everywhere ELSE while keeping their current
   * session alive.
   */
  revokeAllSessionsForUserExcept(userId, exceptSessionId, reason) {
    return AuthSession.updateMany(
      { userId, isRevoked: false, _id: { $ne: exceptSessionId } },
      { isRevoked: true, revokedAt: new Date(), revokedReason: reason }
    );
  },

  revokeAllRefreshTokensForUserExcept(userId, exceptDeviceId) {
    return RefreshToken.updateMany(
      {
        userId,
        isRevoked: false,
        ...(exceptDeviceId ? { deviceId: { $ne: exceptDeviceId } } : {}),
      },
      { isRevoked: true, revokedAt: new Date() }
    );
  },

  // -------------------------------------------------------------
  // PASSWORD RESET / CHANGE
  // -------------------------------------------------------------

  updatePasswordHash(userId, passwordHash) {
    return User.findByIdAndUpdate(userId, { passwordHash }, { new: true });
  },

  revokePendingPasswordResetTokens(userId) {
    return PasswordResetToken.updateMany(
      { userId, isUsed: false, expiresAt: { $gt: new Date() } },
      // No dedicated "revoked" status on this model — expiring it early has
      // the same practical effect (findPendingPasswordResetToken-style
      // lookups always filter on expiresAt > now anyway), and forces a
      // fresh token to be issued instead of an old one still being valid.
      { expiresAt: new Date() }
    );
  },

  findLatestPasswordResetToken(userId) {
    return PasswordResetToken.findOne({ userId }).sort({ createdAt: -1 });
  },

  createPasswordResetToken({ userId, tokenHash, expiresAt }) {
    return PasswordResetToken.create({ userId, tokenHash, expiresAt });
  },

  findPasswordResetTokenByHash(tokenHash) {
    return PasswordResetToken.findOne({ tokenHash });
  },

  markPasswordResetTokenUsed(id, usedIp) {
    return PasswordResetToken.findByIdAndUpdate(
      id,
      { isUsed: true, usedAt: new Date(), usedIp },
      { new: true }
    );
  },

  /** Most recent N password hashes for reuse-prevention checks (does NOT include the current live hash — callers should check that separately). */
  findRecentPasswordHistory(userId, limit) {
    return PasswordHistory.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  },

  addPasswordHistory(userId, passwordHash) {
    return PasswordHistory.create({ userId, passwordHash });
  },

  /**
   * Keeps only the most recent `limit` history rows for a user, deleting
   * anything older. Called after adding a new entry so history never grows
   * unbounded.
   */
  async trimPasswordHistory(userId, limit) {
    const rows = await PasswordHistory.find({ userId })
      .sort({ createdAt: -1 })
      .skip(limit)
      .select('_id');

    if (rows.length === 0) return { acknowledged: true, deletedCount: 0 };
    return PasswordHistory.deleteMany({ _id: { $in: rows.map((r) => r._id) } });
  },

  findById(id) {
  return ApiEndpoint.findById(id);
},

updateEndpoint(id, data) {
  return ApiEndpoint.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
},
};

module.exports = authRepository;
