

import apiClient from './client';

/**
 * Endpoint API — CREATE, LIST, GET-ONE, UPDATE and DELETE are all real
 * backend routes now (see src/modules/endpoint/endpoint.routes.js).
 *
 * NOTE on `frequency`: `createEndpointSchema` is still `.strict()` and does
 * NOT list `frequency` — sending it on create still causes a 400. It IS
 * accepted by `updateEndpointSchema` though, so Monitoring Frequency is
 * editable after creation but not at creation time. See EndpointForm.jsx
 * (`allowFrequency` prop).
 *
 * NOTE on the list endpoint: `toEndpointResponse` (the mapper used by
 * GET /endpoints) still does not return `lastResponseTime` / `lastCheckedAt`
 * / `frequency` — only the single-endpoint GET does (it returns the raw
 * document). The endpoints table shows "—" for those columns accordingly.
 *
 * V1.5: All endpoints now support `auth` configuration for authentication
 * types: NONE, STATIC_BEARER, API_KEY, BASIC, LOGIN_FLOW.
 */

export async function createEndpoint({ name, url, method, expectedStatus, description, auth }) {
  const payload = { name, url, method, expectedStatus };
  if (description) payload.description = description;
  if (auth) payload.auth = auth; // V1.5
  const { data } = await apiClient.post('/endpoints', payload);
  return data.data.endpoint;
}

export async function getEndpoints({
  page = 1,
  limit = 10,
  search,
  status,
  monitoringEnabled,
  method,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  authType, // V1.5 — filter by authentication type
} = {}) {
  const params = { page, limit, sortBy, sortOrder };
  if (search) params.search = search;
  if (status) params.status = status;
  if (monitoringEnabled !== undefined) params.monitoringEnabled = monitoringEnabled;
  if (method) params.method = method;
  if (authType) params.authType = authType; // V1.5

  const { data } = await apiClient.get('/endpoints', { params });
  return data.data; // { endpoints, pagination }
}

export async function getEndpointById(id) {
  const { data } = await apiClient.get(`/endpoints/${id}`);
  return data.data.endpoint; // raw document — includes frequency/timeout/lastResponseTime/lastCheckedAt
}

/**
 * PATCH /api/endpoints/:id — real. Accepts any subset of:
 * name, url, method, expectedStatus, description, frequency, timeout,
 * monitoringEnabled, auth (V1.5).
 * `updateEndpointSchema.refine` requires at least one field to be present.
 */
export async function updateEndpoint(id, payload) {
  const { data } = await apiClient.patch(`/endpoints/${id}`, payload);
  return data.data.endpoint;
}

/** Convenience wrapper over updateEndpoint — there's no separate toggle route. */
export async function toggleMonitoring(id, monitoringEnabled) {
  return updateEndpoint(id, { monitoringEnabled });
}

export async function deleteEndpoint(id) {
  await apiClient.delete(`/endpoints/${id}`);
  return { id };
}