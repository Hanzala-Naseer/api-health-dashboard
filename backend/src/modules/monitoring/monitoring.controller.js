// const asyncHandler = require('../../utils/asyncHandler');
// const ApiResponse = require('../../utils/ApiResponse');

// const monitoringService = require('./monitoring.service');

// /**
//  * Phase 1
//  *
//  * Performs a manual health check against a single endpoint.
//  *
//  * Later this controller will also expose:
//  * - Health check history
//  * - Latest checks
//  * - Endpoint statistics
//  */
// const checkEndpoint = asyncHandler(async (req, res) => {
//   const result = await monitoringService.checkEndpoint(req.body);

//   return new ApiResponse(
//     200,
//     'Health check completed successfully.',
//     result
//   ).send(res);
// });

// module.exports = {
//   checkEndpoint,
// };


const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const monitoringService = require('./monitoring.service');

/**
 * Performs a manual health check for an existing endpoint.
 */
const checkEndpoint = asyncHandler(async (req, res) => {
  const result = await monitoringService.checkEndpoint({
    endpointId: req.params.endpointId,
    userId: req.user.id,
  });

  return new ApiResponse(
    200,
    'Health check completed successfully.',
    result
  ).send(res);
});

module.exports = {
  checkEndpoint,
};