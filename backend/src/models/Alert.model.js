const mongoose = require('mongoose');

const ALERT_TYPE = ['DOWNTIME', 'SLOW_RESPONSE', 'SSL_EXPIRY', 'STATUS_MISMATCH', 'RECOVERY', 'OTHER'];
const ALERT_SEVERITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const alertSchema = new mongoose.Schema(
  {
    endpointId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiEndpoint', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    type: { type: String, enum: ALERT_TYPE, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    severity: { type: String, enum: ALERT_SEVERITY, default: 'MEDIUM' },

    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

alertSchema.index({ endpointId: 1 });
alertSchema.index({ userId: 1 });
alertSchema.index({ resolved: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ userId: 1, resolved: 1, createdAt: -1 });

module.exports = mongoose.models.Alert || mongoose.model('Alert', alertSchema);
