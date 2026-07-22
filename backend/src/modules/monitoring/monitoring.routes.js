// const express = require('express');

// const monitoringController = require('./monitoring.controller');
// const validate = require('../../middlewares/validate.middleware');
// const {
//   checkEndpointSchema,
// } = require('./monitoring.validation');

// const router = express.Router();

// /**
//  * Phase 1
//  * Manual endpoint health check.
//  */
// router.post(
//   '/check',
//   validate(checkEndpointSchema),
//   monitoringController.checkEndpoint
// );

// module.exports = router;

const express = require('express');

const { authenticate } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');

const monitoringController = require('./monitoring.controller');
const {
  checkEndpointSchema,
} = require('./monitoring.validation');

const router = express.Router();

/**
 * Manual health check for an existing endpoint.
 */
router.post(
  '/check/:endpointId',
  authenticate,
  validate(checkEndpointSchema),
  monitoringController.checkEndpoint
);

module.exports = router;