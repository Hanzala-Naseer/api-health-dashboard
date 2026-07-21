const mongoose = require('mongoose');
const { USER_ROLES, USER_STATUS } = require('../config/constants');

/**
 * WHY the profile is EMBEDDED here instead of a separate collection:
 * The original Prisma schema modeled `UserProfile` as a 1:1 relation, but
 * every read in the auth flow immediately does `include: { profile: true }`
 * — it's never queried independently. Embedding it as a subdocument keeps
 * the exact same access pattern the service layer already relies on
 * (`user.profile?.firstName`, `user.profile?.lastName`, ...) with zero
 * extra queries/populates, which is the simplest, most direct Mongoose
 * equivalent of "always-joined 1:1 data".
 *
 * NOTE ON `passwordHash`: the Mongoose model requirements call for
 * "password excluded by default" (i.e. `select: false`). We deliberately
 * did NOT do that here — the existing service layer (login, change
 * password, reset password, reuse checks) reads `user.passwordHash`
 * directly from the same document returned by a plain `findOne`/`findById`
 * call, exactly like the old Prisma client did. Adding `select: false`
 * would require touching every one of those call sites to add
 * `.select('+passwordHash')`, which conflicts with the "minimize file
 * changes" migration goal. If you want that hardening later, add
 * `select: false` below and update `authRepository` accordingly.
 */
const userSchema = new mongoose.Schema(
  {
    // --- Identity ---
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // allows many docs with no phoneNumber while still enforcing uniqueness when present
      default: undefined,
    },
    emailVerifiedAt: { type: Date, default: null },
    phoneVerifiedAt: { type: Date, default: null },

    // --- Auth ---
    passwordHash: { type: String, required: true },
    passwordChangedAt: { type: Date, default: Date.now },

    // --- Role & Status ---
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.MEMBER,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.PENDING_EMAIL_VERIFICATION,
    },

    // --- Security / suspension ---
    isSuspended: { type: Boolean, default: false },
    suspendedAt: { type: Date, default: null },
    suspendedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    suspendReason: { type: String, default: null },

    // --- Brute force / lockout ---
    failedLoginAttempts: { type: Number, default: 0 },
    lastFailedLoginAt: { type: Date, default: null },
    lockedUntil: { type: Date, default: null },

    // --- Last login tracking ---
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },
    lastLoginDevice: { type: String, default: null },

    // --- Soft delete ---
    deletedAt: { type: Date, default: null },
    deletedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deleteReason: { type: String, default: null },

    // --- Embedded profile (see WHY note above) ---
    profile: {
      firstName: { type: String, trim: true, default: null },
      lastName: { type: String, trim: true, default: null },
      marketingConsent: { type: Boolean, default: false },
      marketingConsentAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true, // createdAt / updatedAt, mirrors Prisma's @default(now())/@updatedAt
  }
);

// --- Indexes (mirrors the @@index / @unique directives on the Prisma model) ---
// NOTE: email's unique index is already declared via `unique: true` on the
// field above — not repeated here to avoid a duplicate-index warning.
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ isSuspended: 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ deletedAt: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
