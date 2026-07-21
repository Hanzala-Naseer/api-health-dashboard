const mongoose = require('mongoose');

/**
 * Stores previous password hashes so a user can't reuse a recent password.
 * Only the most recent PASSWORD_HISTORY_LIMIT entries are kept per user —
 * older rows are pruned by the application whenever a new one is added
 * (see auth.repository.js trimPasswordHistory).
 */
const passwordHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    passwordHash: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

passwordHistorySchema.index({ userId: 1 });
passwordHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.PasswordHistory || mongoose.model('PasswordHistory', passwordHistorySchema);
