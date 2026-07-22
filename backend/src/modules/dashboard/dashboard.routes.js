const express = require('express');

const dashboardController = require('./dashboard.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get(
  '/',
  authenticate,
  dashboardController.getDashboardSummary
);

router.get(
  '/recent-health-checks',
  authenticate,
  dashboardController.getRecentHealthChecks
);

router.get(
  '/endpoints/:id/history',
  authenticate,
  dashboardController.getEndpointHistory
);

router.get(
  '/alerts/active',
  authenticate,
  dashboardController.getActiveAlerts
);

router.get(
  '/alerts/history',
  authenticate,
  dashboardController.getAlertHistory
);

router.get(
  '/notifications/history',
  authenticate,
  dashboardController.getNotificationHistory
);

module.exports = router;