const mongoose = require('mongoose');

/**
 * Opaque, hashed refresh tokens — never store the raw token (see
 * utils/crypto.js). `replacedByTokenId` links a rotation chain so reuse of
 * an already-rotated token can be detected (see auth.service.js
 * refreshAccessToken).
 *
 * TTL INDEX: expired refresh tokens are automatically pruned by MongoDB
 * once `expiresAt` passes. This is safe for reuse detection because a
 * token is always explicitly revoked (with `replacedByTokenId` set) at the
 * moment it's rotated — it does not rely on still existing past its
 * natural `expiresAt` to be detected as reused.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    tokenHash: { type: String, required: true, unique: true },

    deviceId: { type: String, default: null },
    ipAddress: { type: String, default: null },

    isRevoked: { type: Boolean, default: false },
    revokedAt: { type: Date, default: null },
    replacedByTokenId: { type: mongoose.Schema.Types.ObjectId, ref: 'RefreshToken', default: null },

    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// NOTE: tokenHash's unique index is already declared via `unique: true` above.
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL cleanup

module.exports = mongoose.models.RefreshToken || mongoose.model('RefreshToken', refreshTokenSchema);
