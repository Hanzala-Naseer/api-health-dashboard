const mongoose = require('mongoose');

const HEALTH_CHECK_STATUS = ['UP', 'DOWN', 'DEGRADED', 'TIMEOUT', 'ERROR'];

/**
 * One row per monitoring probe. This collection is expected to grow into
 * the millions of documents (one row every `frequency` seconds per
 * endpoint), so indexes are deliberately narrow and query-driven rather
 * than exhaustive — every extra index has a real write-amplification cost
 * at this volume.
 *
 * `responseHeaders` is stored as Mixed rather than a fixed sub-schema since
 * header sets vary per endpoint/provider and aren't queried directly.
 */
const healthCheckSchema = new mongoose.Schema(
  {
    endpointId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiEndpoint', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    status: { type: String, enum: HEALTH_CHECK_STATUS, required: true },
    statusCode: { type: Number, default: null },
    responseTime: { type: Number, default: null }, // ms
    responseSize: { type: Number, default: null }, // bytes

    checkedAt: { type: Date, required: true, default: Date.now },

    errorMessage: { type: String, default: null },
    responseHeaders: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Most common access pattern: "latest checks for this endpoint" and
// "this user's checks across all their endpoints", both time-ordered.
healthCheckSchema.index({ endpointId: 1, checkedAt: -1 });
healthCheckSchema.index({ userId: 1, checkedAt: -1 });
healthCheckSchema.index({ status: 1 });

module.exports = mongoose.models.HealthCheck || mongoose.model('HealthCheck', healthCheckSchema);
