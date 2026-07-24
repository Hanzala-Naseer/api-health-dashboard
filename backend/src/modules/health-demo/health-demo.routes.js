// src/modules/health-demo/health-demo.routes.js

const { Router } = require('express');

const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { AUTH_TYPES } = require('../../config/constants');

const {
  loginSchema,
  createItemSchema,
  getItemsSchema,
  itemIdParamSchema,
  updateItemSchema,
} = require('./health-demo.validation');

const healthDemoController = require('./health-demo.controller.js');

const router = Router();

// ============================================================
// AUTHENTICATION (Demo)
// ============================================================

/**
 * Demo login endpoint.
 *
 * This endpoint is PUBLIC (no authentication required).
 *
 * It returns a token that can be used to authenticate subsequent requests
 * to the protected demo endpoints.
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
 */
router.post(
  '/login',
  // No authentication required
  validate({ body: loginSchema }),
  healthDemoController.login
);

// ============================================================
// PROTECTED CRUD ROUTES
// ============================================================

/**
 * All CRUD routes are protected with the demo authentication middleware.
 *
 * To test the LOGIN_FLOW authentication flow:
 *
 * 1. POST /health-demo/login → get a token
 * 2. Create an endpoint with:
 *    auth.type = 'LOGIN_FLOW'
 *    auth.loginConfig.loginUrl = 'http://localhost:5001/health-demo/login'
 *    auth.loginConfig.body = { "email": "demo@pulseops.app", "password": "DemoPassword123!" }
 *    auth.loginConfig.tokenPath = "data.accessToken"
 * 3. The scheduler will automatically login before each check
 */

/**
 * Create a new demo item.
 */
router.post(
  '/',
  healthDemoController.authenticateDemo, // Protected
  validate({ body: createItemSchema }),
  healthDemoController.createItem
);

/**
 * List demo items.
 */
router.get(
  '/',
  healthDemoController.authenticateDemo, // Protected
  validate({ query: getItemsSchema }),
  healthDemoController.getItems
);

/**
 * Get a single demo item.
 */
router.get(
  '/:id',
  healthDemoController.authenticateDemo, // Protected
  validate({ params: itemIdParamSchema }),
  healthDemoController.getItem
);

/**
 * Full replace of a demo item.
 */
router.put(
  '/:id',
  healthDemoController.authenticateDemo, // Protected
  validate({
    params: itemIdParamSchema,
    body: createItemSchema,
  }),
  healthDemoController.replaceItem
);

/**
 * Partial update of a demo item.
 */
router.patch(
  '/:id',
  healthDemoController.authenticateDemo, // Protected
  validate({
    params: itemIdParamSchema,
    body: updateItemSchema,
  }),
  healthDemoController.updateItem
);

/**
 * Delete a demo item.
 */
router.delete(
  '/:id',
  healthDemoController.authenticateDemo, // Protected
  validate({
    params: itemIdParamSchema,
  }),
  healthDemoController.deleteItem
);

module.exports = router;