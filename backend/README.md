# API Health Dashboard — Auth Module

> **Migration note:** this module was migrated from PostgreSQL/Prisma to
> **MongoDB/Mongoose**. Architecture, routes, controllers, services, JWT
> flow, refresh-token rotation, and password/OTP handling are unchanged —
> only the persistence layer (`src/models/*`, `auth.repository.js`,
> `src/lib/db.js`) was replaced. New domain models for the API Health
> Dashboard itself (`ApiEndpoint`, `HealthCheck`, `Alert`,
> `NotificationSetting`) live alongside the auth models in `src/models/`,
> ready for the endpoint-monitoring feature modules to be built on top of
> this auth foundation. Refresh-token rotation uses a MongoDB transaction,
> which requires a replica-set deployment (local `mongod --replSet rs0` or
> MongoDB Atlas) — see `.env.example`.

---

# GymKey Auth Module (legacy name — see migration note above)

A production-grade, reusable Authentication & Authorization module built on your
`gymkey_production_schema.prisma`. This is being built **incrementally, one fully
implemented and tested feature at a time**, per your instructions — this delivery
covers **Feature 1**.

## ✅ Feature 1: Registration + Email OTP Verification

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/resend-otp`

See `docs/postman/01-registration-email-verification.md`.

## ✅ Feature 2 (this delivery): Login + Session Issuance

- `POST /api/v1/auth/login` — failed-attempt protection, account locking, remember-me,
  device tracking, new-device security alerts, issues access token (JWT + cookie) and
  refresh token (opaque, hashed, cookie-only).
- `GET /api/v1/auth/me` — first protected route, proves `authenticate` middleware +
  session revocation checking works end-to-end.

See `docs/postman/02-login.md`.

## ✅ Feature 3 (this delivery): Refresh Token Rotation + Reuse Detection

- `POST /api/v1/auth/refresh-token` — rotates the refresh token on every use
  (old one revoked, new one issued, linked via `replacedByTokenId`), issues a
  fresh access token. Presenting an already-rotated (revoked) token triggers
  reuse detection: every refresh token AND session for that user is revoked,
  a security alert email is sent, and the caller is forced to log in again.

See `docs/postman/03-refresh-token-rotation.md`.

## ✅ Feature 4 (this delivery): Logout / Logout All Devices

- `POST /api/v1/auth/logout` — revokes the current device's access session
  immediately (and its refresh token, when `X-Device-Id` is available) and
  clears cookies.
- `POST /api/v1/auth/logout-all` — revokes every session and refresh token
  for the user across all devices ("sign out everywhere").

**Bug caught and fixed during testing:** the refresh endpoint originally
treated *any* revoked refresh token as a reuse attack — including tokens
revoked by a normal logout — which would have falsely nuked every other
device and sent a scary security email just because a client retried
`/refresh-token` post-logout. Fixed by only triggering reuse detection when
the revoked token was superseded by a rotation (`replacedByTokenId` set);
tokens revoked by logout/admin/an earlier nuke now fail cleanly with
`REFRESH_TOKEN_REVOKED` instead. See `docs/postman/04-logout.md`.

## ✅ Feature 5 (this delivery): Forgot / Reset / Change Password

- `POST /api/v1/auth/forgot-password` — generic response (no enumeration), DB-backed
  cooldown, invalidates prior unused reset tokens on each new request.
- `POST /api/v1/auth/reset-password` — consumes the emailed token, enforces password
  history reuse prevention, revokes every session/refresh token (unauthenticated flow
  — no "current device" to preserve).
- `POST /api/v1/auth/change-password` — authenticated; verifies current password,
  enforces reuse prevention, revokes every OTHER session/device while preserving the
  one the user is actively using.

**⚠️ Schema change required for this feature** — a `PasswordHistory` model didn't
exist in the original schema (needed for password reuse prevention). It's been added,
along with the matching relation on `User`. **Run migrations again:**
```bash
npx prisma generate
npx prisma migrate dev --name add_password_history
```

See `docs/postman/05-password-management.md`.

## 🗺️ Roadmap (not yet built — next messages, one at a time)

6. Session Management (list/revoke sessions, login history)
7. Google OAuth (pluggable provider architecture)
8. RBAC: Role, Permission, Ownership middleware (on top of the `authenticate`
   middleware already built in Feature 2)
9. Admin authentication events, account suspension/locking flows (admin-triggered)

Tell me when you're ready and I'll continue with **Feature 2: Login**, following the
same process (explain → implement → test → verify edge cases).

## Architecture

Layered / Clean Architecture, one module per domain concern:

```
src/
  config/         env.js (validated env vars), constants.js (enums mirrored from schema)
  lib/            prisma.js (singleton client), logger.js (winston)
  utils/          ApiError, ApiResponse, asyncHandler, crypto (OTP/token hashing),
                  password (bcrypt), requestContext (IP/device/UA extraction)
  validations/    zod schemas per module — the ONLY place input shape is defined
  middlewares/    validate, rateLimiter, error (centralized, never leaks internals)
  modules/auth/   routes -> controller (thin, HTTP only) -> service (business rules)
                          -> repository (all Prisma queries live here)
  emails/         mailer.js (nodemailer wrapper) + templates/
```

**Why this shape:** routes never contain logic; controllers never touch Prisma;
services never touch `req`/`res`; repositories never contain business rules. Each
layer can be tested or replaced independently, and this same skeleton is meant to be
copy-pasted into your next SaaS project.

## Setup

```bash
npm install
cp .env.example .env   # fill in real DATABASE_URL, JWT secrets, SMTP creds
npx prisma generate    # generates the client into src/generated/prisma
npx prisma migrate dev # applies your schema to Postgres
npm run dev
```

> Note: in the sandbox this was built in, `npx prisma generate` could not reach
> `binaries.prisma.sh` (network policy), so the Prisma engine binaries couldn't be
> downloaded there. Every file was syntax-checked, and the full app (routes,
> validation, error handling, boot/shutdown) was smoke-tested against a stub client
> to confirm wiring is correct. Run `npx prisma generate` in your own environment
> before starting the server — the app **will not run without it**
> (`src/generated/prisma` does not exist in this delivery on purpose; it's a build
> artifact, not source code, and is already in `.gitignore`).

## Security notes specific to this feature

- Passwords: bcrypt, cost factor 12 (configurable), never logged, never returned.
- OTPs: SHA-256 hashed at rest (not bcrypt — see `utils/crypto.js` for why),
  6 digits, 10-minute expiry, 5 max attempts, timing-safe comparison.
- Old pending OTPs are revoked the instant a new one is issued — only the latest
  code ever works.
- Resend is both cooldown-limited (60s) and hourly-capped (5/hr) per account, on
  top of IP-based rate limiting — so the limit holds even if the attacker rotates
  IPs or the legitimate user rotates devices.
- `resend-otp` always returns the same generic message whether or not the email
  exists, to prevent account enumeration.
- Re-registering an abandoned (unverified) signup reuses the existing row instead
  of erroring — good UX without weakening security, since no session is ever
  granted pre-verification either way.
- Every state-changing action writes a `UserActivityLog` row (IP, user agent,
  device info) for audit purposes.
