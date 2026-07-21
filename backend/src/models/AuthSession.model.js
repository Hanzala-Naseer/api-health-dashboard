const mongoose = require('mongoose');

/**
 * Mirrors an access token's `jti` so it can be revoked server-side before
 * its natural JWT expiry (logout, logout-all, admin action). See
 * middlewares/auth.middleware.js `authenticate` for how this is enforced.
 */
const authSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Token (JWT jti)
    token: { type: String, required: true, unique: true },
    tokenType: { type: String, enum: ['access', 'refresh', 'api'], default: 'access' },

    // Device fingerprinting
    deviceId: { type: String, default: null },
    deviceName: { type: String, default: null },
    deviceType: { type: String, default: null }, // mobile | tablet | desktop | unknown
    osName: { type: String, default: null },
    osVersion: { type: String, default: null },
    browserName: { type: String, default: null },
    browserVersion: { type: String, default: null },

    // Location
    ipAddress: { type: String, default: null },
    ipCountry: { type: String, default: null },
    ipCity: { type: String, default: null },
    ipLatitude: { type: Number, default: null },
    ipLongitude: { type: Number, default: null },

    // Security
    isRevoked: { type: Boolean, default: false },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: null },
    revokedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Usage
    expiresAt: { type: Date, required: true },
    lastUsedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Prisma model only had createdAt
  }
);

// NOTE: token's unique index is already declared via `unique: true` above.
authSessionSchema.index({ userId: 1 });
authSessionSchema.index({ expiresAt: 1 });
authSessionSchema.index({ isRevoked: 1 });
authSessionSchema.index({ deviceId: 1 });

module.exports = mongoose.models.AuthSession || mongoose.model('AuthSession', authSessionSchema);
