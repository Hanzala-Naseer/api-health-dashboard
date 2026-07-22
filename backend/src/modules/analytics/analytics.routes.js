const express = require('express');

const router = express.Router();

const analyticsController = require('./analytics.controller');

const { authenticate } = require('../../middlewares/auth.middleware');



/**
 * Endpoint Analytics Routes
 *
 * Base:
 * /api/analytics
 */



/*
 * Get endpoint statistics
 *
 * Example:
 *
 * GET
 * /api/analytics/endpoints/6a607736605e4e03afc9a041/statistics
 *
 *
 * Optional filters:
 *
 * ?startDate=2026-07-01
 * &endDate=2026-07-22
 */
router.get(

  '/endpoints/:endpointId/statistics',

  authenticate,

  analyticsController.getEndpointStatistics

);


router.get(

    '/overview',

    authenticate,

    analyticsController.getOverview

);


router.get(
    '/uptime-trend',
    authenticate,
    analyticsController.getUptimeTrend
);


router.get(
    '/response-time-trend',authenticate,
    analyticsController.getResponseTimeTrend
);

router.get(
    '/error-breakdown',authenticate,
    analyticsController.getErrorBreakdown
);



module.exports = router;