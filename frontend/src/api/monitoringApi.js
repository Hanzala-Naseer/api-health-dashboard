import apiClient from './client';

/**
 * Monitoring API — everything here is now real.
 *
 * - Manual "Run Check": POST /api/monitoring/check/:endpointId (mounted by
 *   monitoring.routes.js). Executes a live HTTP probe against the endpoint,
 *   persists a HealthCheck row, and updates the endpoint's aggregated stats.
 * - Per-endpoint history + cross-endpoint history both actually live under
 *   the dashboard router (dashboard.routes.js) rather than /api/monitoring —
 *   that's a backend module-naming quirk, not a frontend one. We group them
 *   here anyway since from the UI's perspective they're both "monitoring
 *   data" concerns (endpoint chart + Monitoring History page).
 */

/** Triggers a live health check for one endpoint right now. */
export async function runManualCheck(endpointId) {
  const { data } = await apiClient.post(`/monitoring/check/${endpointId}`);
  return data.data; // the new HealthCheck document
}

/**
 * GET /api/dashboard/endpoints/:id/history?page&limit
 * Real per-endpoint check history, used for the endpoint's latency chart
 * and its "Recent Checks" table.
 */
export async function getEndpointHistory(endpointId, { page = 1, limit = 50 } = {}) {
  const { data } = await apiClient.get(`/dashboard/endpoints/${endpointId}/history`, {
    params: { page, limit },
  });
  return data.data; // { endpoint: {id,name,url,method}, history: [...] } + data.meta
}

/**
 * GET /api/dashboard/recent-health-checks?page&limit
 * Real cross-endpoint check history (every endpoint the user owns), used
 * for the Monitoring History page. NOTE: the backend only accepts
 * page/limit here — no search or status query params — so any
 * search/status filtering in the UI is applied client-side to the page
 * of results already fetched, not the full dataset.
 */
export async function getMonitoringHistory({ page = 1, limit = 20 } = {}) {
  const { data } = await apiClient.get('/dashboard/recent-health-checks', {
    params: { page, limit },
  });
  return {
    checks: data.data,
    pagination: {
      page: data.meta?.page ?? page,
      limit: data.meta?.limit ?? limit,
      total: data.meta?.total ?? data.data.length,
      totalPages: data.meta?.totalPages ?? 1,
    },
  };
}
