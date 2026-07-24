// src/modules/health-demo/health-demo.controller.js

const asyncHandler = require('../../utils/asyncHandler.js');
const ApiResponse = require('../../utils/ApiResponse.js');
const ApiError = require('../../utils/ApiError.js');

const healthDemoService = require('./health-demo.service.js');

/**
 * WHY controllers stay this thin:
 * Same rationale as endpoint.controller.js — receive the already-validated
 * request, call the service, return a standardized HTTP response. Business
 * rules and database access live in the service/repository layers.
 */

// ============================================================
// AUTHENTICATION (Demo)
// ============================================================

/**
 * Demo login endpoint.
 *
 * POST /health-demo/login
 *
 * Body:
 *   { "email": "demo@pulseops.app", "password": "DemoPassword123!" }
 *
 * Response:
 *   {
 *     "success": true,
 *     "statusCode": 200,
 *     "message": "Login successful.",
 *     "data": {
 *       "accessToken": "..."
 *     }
 *   }
 *
 * This matches the default LOGIN_FLOW tokenPath: "data.accessToken"
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await healthDemoService.login({ email, password });

  return new ApiResponse(
    200,
    'Login successful.',
    result
  ).send(res);
});

/**
 * Demo authentication middleware.
 *
 * Validates the Authorization header and attaches the user info to req.user.
 *
 * This is a simplified version of the main authenticate middleware,
 * specifically for the demo endpoints.
 *
 * FIX: Uses a valid MongoDB ObjectId format for the demo user ID.
 * '000000000000000000000001' is a 24-character hex string that MongoDB
 * accepts as a valid ObjectId.
 */
const authenticateDemo = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw ApiError.unauthorized(
      'Authentication required. Please login first.',
      'NO_TOKEN'
    );
  }

  const tokenData = healthDemoService.authenticateDemoRequest(authHeader);

  if (!tokenData) {
    throw ApiError.unauthorized(
      'Invalid or expired token. Please login again.',
      'INVALID_TOKEN'
    );
  }

  // Attach user info to the request
  // Use a valid MongoDB ObjectId format (24-character hex string)
  // This ensures all database operations work correctly
  req.user = {
    id: '000000000000000000000001', // Valid ObjectId format
    email: tokenData.email,
  };

  next();
});

// ============================================================
// CRUD
// ============================================================

const createItem = asyncHandler(async (req, res) => {
  const item = await healthDemoService.createItem(req.user.id, req.body);

  return new ApiResponse(
    201,
    'Health demo item created successfully.',
    { item }
  ).send(res);
});

const getItems = asyncHandler(async (req, res) => {
  const result = await healthDemoService.getItems(
    req.user.id,
    req.query
  );

  return new ApiResponse(
    200,
    'Health demo items retrieved successfully.',
    result
  ).send(res);
});

const getItem = asyncHandler(async (req, res) => {
  const item = await healthDemoService.getItem(
    req.user.id,
    req.params.id
  );

  return new ApiResponse(
    200,
    'Health demo item retrieved successfully.',
    { item }
  ).send(res);
});

const replaceItem = asyncHandler(async (req, res) => {
  const item = await healthDemoService.replaceItem(
    req.user.id,
    req.params.id,
    req.body
  );

  return new ApiResponse(
    200,
    'Health demo item updated successfully.',
    { item }
  ).send(res);
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await healthDemoService.updateItem(
    req.user.id,
    req.params.id,
    req.body
  );

  return new ApiResponse(
    200,
    'Health demo item updated successfully.',
    { item }
  ).send(res);
});

const deleteItem = asyncHandler(async (req, res) => {
  await healthDemoService.deleteItem(
    req.user.id,
    req.params.id
  );

  return new ApiResponse(
    200,
    'Health demo item deleted successfully.'
  ).send(res);
});

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Authentication
  login,
  authenticateDemo,
  // CRUD
  createItem,
  getItems,
  getItem,
  replaceItem,
  updateItem,
  deleteItem,
};