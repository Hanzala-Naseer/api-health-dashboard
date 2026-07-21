const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },

    isUsed: { type: Boolean, default: false },
    usedAt: { type: Date, default: null },
    usedIp: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

passwordResetTokenSchema.index({ userId: 1 });
passwordResetTokenSchema.index({ expiresAt: 1 });
passwordResetTokenSchema.index({ tokenHash: 1 });

module.exports =
  mongoose.models.PasswordResetToken || mongoose.model('PasswordResetToken', passwordResetTokenSchema);
