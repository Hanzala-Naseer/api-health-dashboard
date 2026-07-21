const mongoose = require('mongoose');

/**
 * One settings document per user (enforced via the unique index below).
 */
const notificationSettingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    emailAlerts: { type: Boolean, default: true },
    alertOnRecovery: { type: Boolean, default: true },
    timezone: { type: String, default: 'UTC' },
  },
  { timestamps: true }
);

notificationSettingSchema.index({ userId: 1 }, { unique: true });

module.exports =
  mongoose.models.NotificationSetting || mongoose.model('NotificationSetting', notificationSettingSchema);
