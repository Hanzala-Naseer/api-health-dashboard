const { Router } = require('express');

const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');

const { createEndpointSchema,getEndpointsSchema } = require('./endpoint.validation');

const endpointController = require('./endpoint.controller.js');

const router = Router();

/**
 * FEATURE 1: API Endpoint Management
 * Users can create and manage the APIs they want PulseOps to monitor.
 * Every endpoint is owned by the authenticated user.
 */

/**
 * Create a new monitored API endpoint
 */
router.post(
  '/',
  authenticate,
  validate({ body: createEndpointSchema }),
  endpointController.createEndpoint
);

/**
 * FEATURE 2: Endpoint Listing
 * Supports pagination, searching, filtering and sorting.
 */
// router.get('/', authenticate, endpointController.getEndpoints);

router.get(
    '/',
    authenticate,
    validate({
        query: getEndpointsSchema,
    }),
    endpointController.getEndpoints
);

/**
 * FEATURE 3: Endpoint Details
 * Returns a single endpoint owned by the authenticated user.
 */
// router.get('/:endpointId', authenticate, endpointController.getEndpointById);

/**
 * FEATURE 4: Update Endpoint
 * Allows updating monitoring configuration without affecting
 * monitoring history or aggregated statistics.
 */
// router.patch(
//   '/:endpointId',
//   authenticate,
//   validate({ body: updateEndpointSchema }),
//   endpointController.updateEndpoint
// );

/**
 * FEATURE 5: Enable / Disable Monitoring
 * Temporarily pauses or resumes monitoring without deleting
 * the endpoint or its historical data.
 */
// router.patch(
//   '/:endpointId/toggle',
//   authenticate,
//   endpointController.toggleMonitoring
// );

/**
 * FEATURE 6: Delete Endpoint
 * Permanently removes the endpoint. Associated monitoring
 * history and alerts will be handled by the service layer.
 */
// router.delete('/:endpointId', authenticate, endpointController.deleteEndpoint);

module.exports = router;