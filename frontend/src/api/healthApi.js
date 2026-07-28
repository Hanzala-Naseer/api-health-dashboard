import apiClient from './client';

/**
 * Health API — wraps the backend's operational health checks
 * (src/modules/health/health.routes.js). All routes here are POST
 * (they accept an optional { note } body per the backend's health
 * validation schema, matching how the same endpoint could realistically
 * be configured/monitored like any other PulseOps-monitored endpoint).
 */

/** GET /api/health — overall health summary (db + auth + system + scheduler). */
export async function getOverallHealth() {
  const { data } = await apiClient.get('/health');
  return data.data;
}

/** POST /api/health/scheduler — scheduler running status, last run metrics, config. */
export async function getSchedulerHealth() {
  const { data } = await apiClient.post('/health/scheduler');
  return data.data; // { running, tickInProgress, workerId, activeWorkers, lastRun, config }
}

/** POST /api/health/database — DB connectivity check. */
export async function getDatabaseHealth() {
  const { data } = await apiClient.post('/health/database');
  return data.data;
}

/** POST /api/health/auth — auth subsystem check. */
export async function getAuthHealth() {
  const { data } = await apiClient.post('/health/auth');
  return data.data;
}

/** POST /api/health/system — process/system resource check. */
export async function getSystemHealth() {
  const { data } = await apiClient.post('/health/system');
  return data.data;
}
