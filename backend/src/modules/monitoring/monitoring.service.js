// src/modules/monitoring/monitoring.service.js

const ApiError = require('../../utils/ApiError');

const endpointRepository = require('../endpoint/endpoint.repository');
const monitoringRepository = require('./monitoring.repository');
const healthCheckerService = require('./healthChecker.service');
const alertService = require('../alert/alert.service');

/**
 * Performs a health check for an existing endpoint.
 *
 * Flow:
 *
 * 1. Verify endpoint ownership.
 * 2. Execute HTTP health check (with automatic authentication).
 * 3. Store health check history.
 * 4. Update endpoint statistics.
 *
 * V1.5: Authentication is now handled automatically by healthCheckerService.
 * No changes needed in this file.
 */
async function checkEndpoint({ endpointId, userId }) {
  // Step 1:
  // Fetch endpoint belonging to authenticated user
  const endpoint = await endpointRepository.findByIdAndUser(
    endpointId,
    userId
  );

  if (!endpoint) {
    throw ApiError.notFound(
      'Endpoint not found.',
      'ENDPOINT_NOT_FOUND'
    );
  }

  // Step 2:
  // Execute health check request
  // V1.5: Authentication is now automatic
  const result = await healthCheckerService.checkEndpoint(endpoint);

  const checkedAt = new Date();

  /**
   * Step 3:
   *
   * Store monitoring history.
   *
   * Possible states:
   *
   * UP
   * DOWN
   * DEGRADED
   * TIMEOUT
   * ERROR
   * AUTHENTICATION_FAILED (V1.5)
   * TOKEN_EXTRACTION_FAILED (V1.5)
   */
  const healthCheck = await monitoringRepository.createHealthCheck({
    endpointId: endpoint._id,
    userId: endpoint.userId,
    status: result.status,
    statusCode: result.statusCode,
    responseTime: result.responseTime,
    responseSize: result.responseSize,
    responseHeaders: result.responseHeaders,
    errorType: result.errorType,
    errorMessage: result.errorMessage,
    checkedAt,
  });

  await alertService.processHealthCheck({
    endpoint,
    healthCheck,
  });

  // Not persisted or part of the public response — Mongoose's toJSON only
  // serializes schema paths, so this is just a way to hand the scheduler
  // a retry count for its metrics without changing the HealthCheck schema.
  healthCheck.retryCount = result.retryCount || 0;

  /**
   * Convert technical failures
   * into dashboard status.
   *
   * ERROR/TIMEOUT/AUTHENTICATION_FAILED
   * become DOWN for users.
   */
  const endpointStatus =
    result.status === 'ERROR' ||
    result.status === 'TIMEOUT' ||
    result.status === 'AUTHENTICATION_FAILED' ||
    result.status === 'TOKEN_EXTRACTION_FAILED'
      ? 'DOWN'
      : result.status;

  /**
   * Calculate statistics
   */
  const totalChecks = endpoint.totalChecks + 1;
  const successfulChecks = endpoint.successfulChecks + (result.status === 'UP' ? 1 : 0);
  const failedChecks = endpoint.failedChecks + (result.status === 'UP' ? 0 : 1);

  const uptimePercentage = Number(
    ((successfulChecks / totalChecks) * 100).toFixed(2)
  );

  /**
   * Update endpoint statistics.
   *
   * Atomic update prevents race conditions
   * when multiple checks run together.
   */
  await monitoringRepository.updateEndpointStatistics(
    endpoint._id,
    {
      $set: {
        currentStatus: endpointStatus,
        lastStatusCode: result.statusCode,
        lastResponseTime: result.responseTime,
        lastCheckedAt: checkedAt,
        uptimePercentage,
      },
      $inc: {
        totalChecks: 1,
        successfulChecks: result.status === 'UP' ? 1 : 0,
        failedChecks: result.status === 'UP' ? 0 : 1,
      },
    }
  );

  return healthCheck;
}

module.exports = {
  checkEndpoint,
};