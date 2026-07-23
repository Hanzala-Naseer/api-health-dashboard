# API Health Dashboard — Frontend

React 19 + Vite + Tailwind CSS frontend for the API Health Dashboard backend. Built exactly against the real backend source (routes/controllers/services/repositories/models/validation) — nothing here assumes an endpoint that doesn't exist.

**This version is updated against a significantly more complete backend** (auth + endpoints CRUD + dashboard summary + analytics trends + monitoring history + read-only alerts). Only three things remain genuinely unimplemented on the backend and stay as placeholders: profile-field updates, notification preferences, and alert create/enable/disable/delete.

## Stack

React 19 · Vite · JavaScript (JSX) · Tailwind CSS · React Router DOM · Axios · React Hook Form · React Hot Toast · Recharts · Lucide React

## Getting started

```bash
npm install
npm run dev
```

The app expects the backend running at `http://localhost:5001` (see `.env` → `VITE_API_BASE_URL`). The backend's own `.env` has `PORT=5001`, and its routes are mounted at `/api/auth`, `/api/endpoints`, `/api/monitoring`, `/api/dashboard`, `/api/analytics` (no `/v1` prefix). If your backend runs elsewhere, just update `.env`.

`npm run build` produces a production bundle; `npm run lint` runs ESLint.

## Backend analysis → what's real vs. placeholder

| Feature | Backend Status | Frontend Status |
|---|---|---|
| Register | Ready (requires OTP email verification before login) | Connected to real API |
| Verify / Resend OTP | Ready | Connected to real API |
| Login | Ready | Connected to real API |
| Get current user (`/auth/me`) | Ready (only returns `id, email, role, status` — no name) | Connected to real API; name is merged in from login/register data kept in local storage |
| Refresh token | Ready | Connected to real API (used transparently by the axios interceptor on 401) |
| Logout / Logout all | Ready | Connected to real API |
| Forgot / Reset / Change password | Ready | Connected to real API |
| Create endpoint | Ready (still doesn't accept `frequency`, even though `updateEndpointSchema` does) | Connected to real API; Frequency control disabled at creation time |
| List endpoints | Ready (response still omits `lastResponseTime` / `lastCheckedAt` — only the single-endpoint GET returns those) | Connected to real API; those two table columns render "—" |
| Get endpoint by ID | Ready (raw document, includes `lastResponseTime`/`lastCheckedAt`/`frequency`/`timeout`) | Connected to real API |
| **Update endpoint** | **Now real** — `PATCH /api/endpoints/:id`, accepts `frequency`/`timeout`/`monitoringEnabled` too | Connected to real API |
| **Delete endpoint** | **Now real** — `DELETE /api/endpoints/:id` | Connected to real API |
| **Toggle monitoring** | No dedicated route, but achievable via `PATCH /:id` with `{ monitoringEnabled }` | Connected — `toggleMonitoring()` is a thin wrapper over `updateEndpoint()` |
| **Manual "Run Check"** | **New** — `POST /api/monitoring/check/:endpointId` runs a live probe, stores a HealthCheck, updates endpoint stats | Connected — "Run Check" button on Endpoint Details |
| **Dashboard summary** | **New** — `GET /api/dashboard` → `{ totalEndpoints, healthyEndpoints, downEndpoints, activeAlerts, averageUptime }` | Connected — powers the Dashboard Overview KPI cards |
| **Recent health checks (cross-endpoint)** | **New** — `GET /api/dashboard/recent-health-checks` | Connected — Dashboard "Recent Health Checks" widget and the Monitoring History page |
| **Per-endpoint history** | **New** — `GET /api/dashboard/endpoints/:id/history` | Connected — Endpoint Details latency chart + Recent Checks table |
| **Response time / uptime trend** | **New** — `GET /api/analytics/response-time-trend`, `/uptime-trend` (grouped by calendar day, always, regardless of `period`) | Connected — Dashboard Overview chart uses `response-time-trend` |
| **Error breakdown** | **New** — `GET /api/analytics/error-breakdown` | Connected — small card on Monitoring History |
| **Per-endpoint statistics** | **New** — `GET /api/analytics/endpoints/:id/statistics` (avg/min/max latency, uptime %, status breakdown, all windowed by `period`) | Connected — Endpoint Details stat cards |
| **Active / historical alerts** | **New, but read-only** — `GET /api/dashboard/alerts/active`, `/alerts/history` return real `Alert` documents | Connected — Alerts page, Active/History tabs. **No create/enable/disable/delete route exists** — alerts are meant to be generated automatically by the monitoring pipeline, not authored by hand, so those controls were removed from the UI entirely (see note below) |
| Notification history | Route exists (`/api/dashboard/notifications/history`) but not wired into any page yet — the `Notification`-sending pipeline itself is dead code on the backend, so this will be empty even once wired up | Not used |
| Profile update / avatar | **Still no route** | Placeholder (`api/profileApi.js`) |
| Notification preferences | **Still no route** (`NotificationSetting` model exists, unused) | Placeholder (`api/profileApi.js`) |

Every remaining placeholder function is marked `// TODO Replace with backend endpoint` in its file.

### A note on Alerts being empty

`GET /api/dashboard/alerts/active` and `/alerts/history` are real, working routes — but the code path that's supposed to *create* an `Alert` document when a health check fails (`alert.service.js` → `processHealthCheck`) is entirely commented out in this backend build. So even once an endpoint goes down, no `Alert` row gets written, and these lists will stay empty. That's a backend-side gap to flag back to that team — nothing to fix here.

## Routes

Public: `/`, `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`
Protected (under the dashboard layout): `/dashboard`, `/dashboard/endpoints`, `/dashboard/endpoints/new`, `/dashboard/endpoints/:id`, `/dashboard/endpoints/:id/edit`, `/dashboard/alerts`, `/dashboard/history`, `/dashboard/settings`
Fallback: `*` → 404

**Note on `/verify-email`:** required because the backend's `register()` deliberately does *not* log the user in; it creates the account as `PENDING_EMAIL_VERIFICATION` and emails an OTP. Login is rejected with `EMAIL_NOT_VERIFIED` until this step completes.

## Auth token storage

The access token is stored in `localStorage` and attached as a `Bearer` header on every request. The backend also sets httpOnly cookies for both access and refresh tokens — axios is configured with `withCredentials: true` so those work too, with the header as a fallback. On a 401, the interceptor calls `/auth/refresh-token` once and retries the original request; if that fails, it clears the session and redirects to `/login`.

## Project structure

```
src/
  api/          axios client + one service file per domain (real + placeholder)
    endpointApi.js     create/list/get/update/delete/toggle — all real
    monitoringApi.js   manual run-check + per-endpoint & cross-endpoint history — all real
    dashboardApi.js    summary + analytics trends/breakdown/statistics — all real
    alertApi.js        active/history alert feeds — real, read-only
    profileApi.js       change-password real; profile fields + notification prefs still placeholder
  components/
    layout/     Sidebar, Navbar, PageHeader, DashboardLayout
    common/     Button, Card, Modal, Loader, EmptyState, StatusBadge, SearchBar,
                ConfirmDialog, Pagination, FormField primitives
    charts/     ResponseTimeChart, UptimeChart, StatusPieChart (Recharts)
    forms/      LoginForm, RegisterForm, EndpointForm
  contexts/     AuthContext (+ authContextInstance.js for fast-refresh compliance)
  hooks/        useAuth
  pages/        Landing, Auth, Dashboard, Endpoints, EndpointDetails, Alerts,
                History, Settings, NotFound
  routes/       ProtectedRoute
  utils/        constants.js (mirrors backend enums), formatters.js
```

## Known backend gaps still worth flagging

- `createEndpointSchema` doesn't accept `frequency`, so it can only be set after creation via edit.
- `GET /api/endpoints` (list) still doesn't return `lastResponseTime`/`lastCheckedAt` — only the single-item GET does.
- `GET /api/dashboard/recent-health-checks` only accepts `page`/`limit` — no `search`/`status` filters — so the Monitoring History page's search/status filters only narrow the currently-loaded page, not the full dataset.
- Analytics trend endpoints (`response-time-trend`, `uptime-trend`) always group by calendar day regardless of the requested `period`, so `period=24h` can return just one or two data points.
- `/auth/me` doesn't return `firstName`/`lastName`, only `id, email, role, status`.
- The alert-creation hook (`alert.service.js`) and the notification-sending pipeline (`notification.service.js`) are both commented out, so `Alert` and `Notification` documents are never actually written — the read routes for them work, they'll just stay empty.
- No route exists yet for updating profile fields or notification preferences.
