import apiClient from './client';

/**
 * Dashboard + Analytics API — real now.
 * GET /api/dashboard             → dashboard.routes.js
 * GET /api/dashboard/recent-health-checks → dashboard.routes.js
 * GET /api/analytics/*           → analytics.routes.js
 *
 * NOTE: the analytics trend endpoints group by calendar day
 * ($dateToString format "%Y-%m-%d") regardless of the requested period, so
 * even a `period=24h` request returns date-labeled buckets, not hourly
 * ones. We default to `period=7d` so charts actually show a trend instead
 * of one or two points.
 */

/** GET /api/dashboard — totals across all of the user's endpoints. */
export async function getDashboardSummary() {
  const { data } = await apiClient.get('/dashboard');
  return data.data; // { totalEndpoints, healthyEndpoints, downEndpoints, activeAlerts, averageUptime }
}

/** GET /api/dashboard/recent-health-checks?page&limit — cross-endpoint feed. */
export async function getRecentHealthChecks({ page = 1, limit = 5 } = {}) {
  const { data } = await apiClient.get('/dashboard/recent-health-checks', {
    params: { page, limit },
  });
  return { checks: data.data, meta: data.meta };
}

/** GET /api/analytics/response-time-trend?period= */
export async function getResponseTimeTrend({ period = '7d' } = {}) {
  const { data } = await apiClient.get('/analytics/response-time-trend', { params: { period } });
  return data.data; // [{ date, averageResponseTime, minResponseTime, maxResponseTime, totalChecks }]
}

/** GET /api/analytics/uptime-trend?period= */
export async function getUptimeTrend({ period = '7d' } = {}) {
  const { data } = await apiClient.get('/analytics/uptime-trend', { params: { period } });
  return data.data; // [{ date, totalChecks, successfulChecks, failedChecks, uptime }]
}

/** GET /api/analytics/error-breakdown?period= */
export async function getErrorBreakdown({ period = '7d' } = {}) {
  const { data } = await apiClient.get('/analytics/error-breakdown', { params: { period } });
  return data.data; // [{ type, count, percentage }]
}

/** GET /api/analytics/endpoints/:endpointId/statistics?period= */
export async function getEndpointStatistics(endpointId, { period = '7d' } = {}) {
  const { data } = await apiClient.get(`/analytics/endpoints/${endpointId}/statistics`, {
    params: { period },
  });
  return data.data; // { endpoint, uptime, performance, availability }
}
