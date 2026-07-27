const asyncHandler = require('../../utils/asyncHandler.js');
const ApiResponse = require('../../utils/ApiResponse');

const healthService = require('./health.service');

const getHealth = asyncHandler(async (req, res) => {
  const result = await healthService.getOverallHealth();

  return new ApiResponse(
    200,
    'Health check completed successfully.',
    result
  ).send(res);
});

const checkDatabaseHealth = asyncHandler(async (req, res) => {
  const result = await healthService.checkDatabase();

  return new ApiResponse(
    200,
    'Database health check completed successfully.',
    result
  ).send(res);
});

const checkAuthHealth = asyncHandler(async (req, res) => {
  const result = healthService.checkAuth(req.user);

  return new ApiResponse(
    200,
    'Auth health check completed successfully.',
    result
  ).send(res);
});

const checkSystemHealth = asyncHandler(async (req, res) => {
  const result = healthService.checkSystem();

  return new ApiResponse(
    200,
    'System health check completed successfully.',
    result
  ).send(res);
});

const checkSchedulerHealth = asyncHandler(async (req, res) => {
  const result = healthService.checkScheduler();

  return new ApiResponse(
    200,
    'Scheduler health check completed successfully.',
    result
  ).send(res);
});

module.exports = {
  getHealth,
  checkDatabaseHealth,
  checkAuthHealth,
  checkSystemHealth,
  checkSchedulerHealth,
};
