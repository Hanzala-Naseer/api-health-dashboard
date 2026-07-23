import apiClient from './client';

/**
 * Alerts API — real, but READ-ONLY from the frontend's perspective.
 *
 * GET /api/dashboard/alerts/active  and  GET /api/dashboard/alerts/history
 * (dashboard.routes.js) both return real Alert documents. There is still no
 * create/enable/disable/delete route for alerts — alerts are meant to be
 * generated automatically by the monitoring pipeline when a health check
 * fails, not authored by hand. (If these lists come back empty even for
 * endpoints that are DOWN, that's expected in the current backend build —
 * the alert-on-downtime hook exists but isn't active yet — nothing to fix
 * on the frontend.)
 */

export async function getActiveAlerts({ page = 1, limit = 10 } = {}) {
  const { data } = await apiClient.get('/dashboard/alerts/active', { params: { page, limit } });
  return { alerts: data.data.alerts, meta: data.meta };
}

export async function getAlertHistory({ page = 1, limit = 10 } = {}) {
  const { data } = await apiClient.get('/dashboard/alerts/history', { params: { page, limit } });
  return { alerts: data.data.alerts, meta: data.meta };
}
