const asyncHandler = require('../../utils/asyncHandler.js');
const ApiResponse = require('../../utils/ApiResponse');

const endpointService = require('./endpoint.service');

/**
 * WHY controllers stay this thin:
 * A controller's responsibility is limited to:
 *  - receiving the already-validated request
 *  - calling the appropriate service
 *  - returning a standardized HTTP response
 *
 * Business rules, duplicate detection, normalization, and database
 * operations all belong in the service/repository layers.
 */

const createEndpoint = asyncHandler(async (req, res) => {
  const endpoint = await endpointService.createEndpoint(req.user.id, req.body);

  return new ApiResponse(
    201,
    'API endpoint created successfully.',
    { endpoint }
  ).send(res);
});

const getEndpoints = asyncHandler(async (req, res) => {
  const result = await endpointService.getEndpoints(
    req.user.id,
    req.query
  );

  return new ApiResponse(
    200,
    'Endpoints retrieved successfully.',
    result
  ).send(res);
});

module.exports = {
  createEndpoint,
  getEndpoints
};