const { Router } = require('express');

const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');

const { healthCheckBodySchema } = require('./health.validation');
const healthController = require('./health.controller.js');

const router = Router();

/**
 * FEATURE 4: Health Endpoints
 *
 * Dedicated, production-style health endpoints customers can safely
 * monitor. All require authentication, accept custom headers naturally
 * (no restriction on headers), and validate any request body. None of
 * these ever touch business data — they only report current state.
 */

router.get(
  '/',
  authenticate,
  healthController.getHealth
);

router.post(
  '/database',
  authenticate,
  validate({ body: healthCheckBodySchema }),
  healthController.checkDatabaseHealth
);

router.post(
  '/auth',
  authenticate,
  validate({ body: healthCheckBodySchema }),
  healthController.checkAuthHealth
);

router.post(
  '/system',
  authenticate,
  validate({ body: healthCheckBodySchema }),
  healthController.checkSystemHealth
);

module.exports = router;
