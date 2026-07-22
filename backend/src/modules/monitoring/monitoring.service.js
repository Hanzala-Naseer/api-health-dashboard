

const ApiError = require('../../utils/ApiError');

const endpointRepository = require('../endpoint/endpoint.repository');
const monitoringRepository = require('./monitoring.repository');
const healthCheckerService = require('./healthChecker.service');
const alertService =require('../alert/alert.service');


/**
 * Performs a health check for an existing endpoint.
 *
 * Flow:
 *
 * 1. Verify endpoint ownership.
 * 2. Execute HTTP health check.
 * 3. Store health check history.
 * 4. Update endpoint statistics.
 *
 */
async function checkEndpoint({ endpointId, userId }) {


  // Step 1:
  // Fetch endpoint belonging to authenticated user
  const endpoint =
    await endpointRepository.findByIdAndUser(
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

  const result =
    await healthCheckerService.checkEndpoint(endpoint);



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
   *
   */

  const healthCheck =
    await monitoringRepository.createHealthCheck({

      endpointId: endpoint._id,

      userId: endpoint.userId,


      status: result.status,


      statusCode:
        result.statusCode,


      responseTime:
        result.responseTime,


      responseSize:
        result.responseSize,


      responseHeaders:
        result.responseHeaders,


      // Added error classification
      errorType:
        result.errorType,


      errorMessage:
        result.errorMessage,


      checkedAt,

    });

    await alertService.processHealthCheck({

  endpoint,

  healthCheck

});



  /**
   * Convert technical failures
   * into dashboard status.
   *
   * ERROR/TIMEOUT
   * become DOWN for users.
   *
   */

  const endpointStatus =

    result.status === 'ERROR' ||
    result.status === 'TIMEOUT'

      ? 'DOWN'

      : result.status;



  /**
   * Calculate statistics
   */

  const totalChecks =
    endpoint.totalChecks + 1;


  const successfulChecks =
    endpoint.successfulChecks +
    (
      result.status === 'UP'
        ? 1
        : 0
    );


  const failedChecks =
    endpoint.failedChecks +
    (
      result.status === 'UP'
        ? 0
        : 1
    );



  const uptimePercentage =
    Number(
      (
        (successfulChecks / totalChecks) *
        100
      ).toFixed(2)
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

        currentStatus:
          endpointStatus,


        lastStatusCode:
          result.statusCode,


        lastResponseTime:
          result.responseTime,


        lastCheckedAt:
          checkedAt,


        uptimePercentage,

      },


      $inc: {

        totalChecks: 1,


        successfulChecks:
          result.status === 'UP'
            ? 1
            : 0,


        failedChecks:
          result.status === 'UP'
            ? 0
            : 1,

      },

    }

  );



  return healthCheck;

}



module.exports = {

  checkEndpoint,

};