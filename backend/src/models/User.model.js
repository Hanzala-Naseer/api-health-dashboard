// const mongoose = require('mongoose');
// const { USER_ROLES, USER_STATUS } = require('../config/constants');
// const userSchema = new mongoose.Schema(
//   {
//     // --- Identity ---
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },
//     phoneNumber: {
//       type: String,
//       trim: true,
//       unique: true,
//       sparse: true, // allows many docs with no phoneNumber while still enforcing uniqueness when present
//       default: undefined,
//     },
//     emailVerifiedAt: { type: Date, default: null },
//     phoneVerifiedAt: { type: Date, default: null },

//     // --- Auth ---
//     passwordHash: { type: String, required: true },
//     passwordChangedAt: { type: Date, default: Date.now },

//     // --- Role & Status ---
//     role: {
//       type: String,
//       enum: Object.values(USER_ROLES),
//       default: USER_ROLES.MEMBER,
//     },
//     status: {
//       type: String,
//       enum: Object.values(USER_STATUS),
//       default: USER_STATUS.PENDING_EMAIL_VERIFICATION,
//     },

//     // --- Security / suspension ---
//     isSuspended: { type: Boolean, default: false },
//     suspendedAt: { type: Date, default: null },
//     suspendedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
//     suspendReason: { type: String, default: null },

//     // --- Brute force / lockout ---
//     failedLoginAttempts: { type: Number, default: 0 },
//     lastFailedLoginAt: { type: Date, default: null },
//     lockedUntil: { type: Date, default: null },

//     // --- Last login tracking ---
//     lastLoginAt: { type: Date, default: null },
//     lastLoginIp: { type: String, default: null },
//     lastLoginDevice: { type: String, default: null },

//     // --- Soft delete ---
//     deletedAt: { type: Date, default: null },
//     deletedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
//     deleteReason: { type: String, default: null },

//     profile: {
//       firstName: { type: String, trim: true, default: null },
//       lastName: { type: String, trim: true, default: null },
//       marketingConsent: { type: Boolean, default: false },
//       marketingConsentAt: { type: Date, default: null },
//     },
//   },
//   {
//     timestamps: true, // createdAt / updatedAt, mirrors Prisma's @default(now())/@updatedAt
//   }
// );

// // --- Indexes (mirrors the @@index / @unique directives on the Prisma model) ---
// // NOTE: email's unique index is already declared via `unique: true` on the
// // field above — not repeated here to avoid a duplicate-index warning.
// userSchema.index({ role: 1 });
// userSchema.index({ status: 1 });
// userSchema.index({ isSuspended: 1 });
// userSchema.index({ createdAt: 1 });
// userSchema.index({ deletedAt: 1 });

// module.exports = mongoose.models.User || mongoose.model('User', userSchema);



const mongoose = require('mongoose');
const { USER_ROLES, USER_STATUS } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    // -------------------------------------------------------------------------
    // Identity
    // -------------------------------------------------------------------------

    firstName: {
      type: String,
      trim: true,
      default: null,
    },

    lastName: {
      type: String,
      trim: true,
      default: null,
    },

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

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    phoneVerifiedAt: {
      type: Date,
      default: null,
    },

    // -------------------------------------------------------------------------
    // Marketing
    // -------------------------------------------------------------------------

    marketingConsent: {
      type: Boolean,
      default: false,
    },

    marketingConsentAt: {
      type: Date,
      default: null,
    },

    // -------------------------------------------------------------------------
    // Authentication
    // -------------------------------------------------------------------------

    passwordHash: {
      type: String,
      required: true,
    },

    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },

    // -------------------------------------------------------------------------
    // Role & Status
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // Security / Suspension
    // -------------------------------------------------------------------------

    isSuspended: {
      type: Boolean,
      default: false,
    },

    suspendedAt: {
      type: Date,
      default: null,
    },

    suspendedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    suspendReason: {
      type: String,
      default: null,
    },

    // -------------------------------------------------------------------------
    // Brute Force Protection
    // -------------------------------------------------------------------------

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lastFailedLoginAt: {
      type: Date,
      default: null,
    },

    lockedUntil: {
      type: Date,
      default: null,
    },

    // -------------------------------------------------------------------------
    // Login Tracking
    // -------------------------------------------------------------------------

    lastLoginAt: {
      type: Date,
      default: null,
    },

    lastLoginIp: {
      type: String,
      default: null,
    },

    lastLoginDevice: {
      type: String,
      default: null,
    },

    // -------------------------------------------------------------------------
    // Soft Delete
    // -------------------------------------------------------------------------

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    deleteReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// -----------------------------------------------------------------------------
// Indexes
// -----------------------------------------------------------------------------

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ isSuspended: 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ deletedAt: 1 });

// -----------------------------------------------------------------------------
// Virtuals
// -----------------------------------------------------------------------------

userSchema.virtual('fullName').get(function () {
  return `${this.firstName ?? ''} ${this.lastName ?? ''}`.trim();
});

userSchema.set('toJSON', {
  virtuals: true,
});

userSchema.set('toObject', {
  virtuals: true,
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);