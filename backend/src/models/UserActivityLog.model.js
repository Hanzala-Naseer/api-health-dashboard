const mongoose = require('mongoose');

const userActivityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Event, e.g. LOGIN_SUCCESS | LOGIN_FAILED | LOGOUT | PASSWORD_CHANGED (see config/constants.js ACTIVITY_EVENTS)
    event: { type: String, required: true },

    // Context
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    deviceInfo: { type: String, default: null },
    location: { type: String, default: null },

    // For failed attempts
    failureReason: { type: String, default: null },

    // Session
    sessionId: { type: String, default: null },

    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

userActivityLogSchema.index({ userId: 1 });
userActivityLogSchema.index({ event: 1 });
userActivityLogSchema.index({ createdAt: 1 });
userActivityLogSchema.index({ userId: 1, event: 1 });
userActivityLogSchema.index({ ipAddress: 1 });

module.exports = mongoose.models.UserActivityLog || mongoose.model('UserActivityLog', userActivityLogSchema);
