const mongoose = require('mongoose');

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const ENDPOINT_STATUS = ['UP', 'DOWN', 'DEGRADED', 'UNKNOWN'];

/**
 * A single monitored API endpoint belonging to a user. Aggregated uptime
 * counters (`totalChecks`, `successfulChecks`, ...) are maintained by the
 * monitoring worker on every HealthCheck write, so dashboard reads never
 * need to aggregate the (potentially huge) HealthCheck collection.
 */
const apiEndpointSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    name: { type: String, required: true, trim: true, maxlength: 150 },
    url: { type: String, required: true, trim: true },
    method: { type: String, enum: HTTP_METHODS, default: 'GET' },
    expectedStatus: { type: Number, default: 200, min: 100, max: 599 },
    description: { type: String, trim: true, maxlength: 1000, default: null },

    // Monitoring config
    frequency: { type: Number, default: 300, min: 10 }, // seconds between checks
    timeout: { type: Number, default: 10000, min: 100 }, // ms
    monitoringEnabled: { type: Boolean, default: true },

    // Latest known state (denormalized for fast dashboard reads)
    currentStatus: { type: String, enum: ENDPOINT_STATUS, default: 'UNKNOWN' },
    lastResponseTime: { type: Number, default: null }, // ms
    lastStatusCode: { type: Number, default: null },
    lastCheckedAt: { type: Date, default: null },

    // Aggregated stats
    uptimePercentage: { type: Number, default: 100, min: 0, max: 100 },
    totalChecks: { type: Number, default: 0 },
    successfulChecks: { type: Number, default: 0 },
    failedChecks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One endpoint per (user, url) — mirrors the composite unique index requested
apiEndpointSchema.index({ userId: 1, url: 1 }, { unique: true });
apiEndpointSchema.index({ userId: 1 });
apiEndpointSchema.index({ currentStatus: 1 });
apiEndpointSchema.index({ monitoringEnabled: 1 });

module.exports = mongoose.models.ApiEndpoint || mongoose.model('ApiEndpoint', apiEndpointSchema);
