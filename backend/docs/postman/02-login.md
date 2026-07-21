# Postman Testing — Feature 2: Login + Session Issuance

Base URL: `http://localhost:5000/api/v1/auth`

New optional header for all requests in this feature: `X-Device-Id: <any-stable-string>`
(simulates a frontend-generated device fingerprint; required for new-device detection to work).

---

## 1. `POST /login`

### Request
```
POST /api/v1/auth/login
Content-Type: application/json
X-Device-Id: my-postman-device-1

{
  "email": "jane.doe@example.com",
  "password": "Str0ng!Passw0rd",
  "rememberMe": true
}
```

### Expected success — `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful.",
  "data": {
    "user": { "id": "...", "email": "...", "role": "MEMBER", "status": "ACTIVE", "firstName": "Jane", "lastName": "Doe" },
    "accessToken": "eyJhbGciOi...",
    "accessExpiresAt": "2026-07-20T10:35:59.022Z"
  }
}
```
Also sets two **httpOnly** cookies (visible in Postman's "Cookies" link under Send, not in the body):
- `gk_access_token` — expires per `JWT_ACCESS_EXPIRES_IN`
- `gk_refresh_token` — expires per `JWT_REFRESH_EXPIRES_IN` (7d) or `JWT_REFRESH_EXPIRES_IN_REMEMBER_ME` (30d) if `rememberMe: true`; scoped to path `/api/v1/auth`

### Postman steps
1. Make sure Postman's cookie jar is enabled for `localhost` (it is by default).
2. Register + verify a user first (Feature 1 flow) if you haven't.
3. Send `login` with the body above. Confirm `200`, and check Postman's cookie manager (bottom of response panel → "Cookies") to see both cookies were set.
4. Confirm in Prisma Studio: `auth_sessions` has a new row (`tokenType: access`), `refresh_tokens` has a new row, `users.lastLoginAt` is updated.

---

## 2. `GET /me` (protected route — proves the token/session actually works)

### Request
```
GET /api/v1/auth/me
```
No body needed — Postman automatically sends the cookies from step 1 if you're using the same session/tab.

### Expected success — `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Current user retrieved.",
  "data": { "user": { "id": "...", "email": "...", "role": "MEMBER", "status": "ACTIVE" } }
}
```

### Alternative: Bearer header (for mobile/API-style testing without cookies)
```
GET /api/v1/auth/me
Authorization: Bearer <paste accessToken from the login response body>
```

### Error cases to test

| Case | Setup | Expected |
|---|---|---|
| No token at all | Clear cookies, no Authorization header | `401 NO_TOKEN` |
| Garbage token | `Authorization: Bearer not-a-real-token` | `401 INVALID_TOKEN` |
| Expired token | Lower `JWT_ACCESS_EXPIRES_IN=5s` in `.env`, login, wait 6s, call `/me` | `401 TOKEN_EXPIRED` |

---

## 3. Failed login / account lockout

### Request (wrong password)
```
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "jane.doe@example.com", "password": "TotallyWrongPassword1!" }
```

### Postman steps
1. Send the wrong-password request once → `401 INVALID_CREDENTIALS`, message shows attempts remaining (e.g. "4 attempt(s) remaining").
2. Repeat until you hit `MAX_FAILED_LOGIN_ATTEMPTS` (default 5; lower it in `.env` to `2` for a fast test) → final response is `403 ACCOUNT_LOCKED`.
3. Check your terminal/inbox for the "account was temporarily locked" email.
4. Immediately try logging in with the **correct** password → still `403 ACCOUNT_LOCKED` with a "try again in N minute(s)" message (proves locking blocks even valid credentials).
5. Check `users.lockedUntil` in Prisma Studio — should be set ~`ACCOUNT_LOCK_DURATION_MINUTES` in the future, `failedLoginAttempts` reset to 0.

### Other status-based rejections to test

| Case | Setup | Expected |
|---|---|---|
| Unverified email | Register a new user, don't verify, try to log in | `403 EMAIL_NOT_VERIFIED` |
| Unknown email | `"email": "ghost@example.com"` | `401 INVALID_CREDENTIALS` (generic — no enumeration) |
| Suspended account | Manually set `isSuspended: true` on a user via Prisma Studio, try login | `403 ACCOUNT_SUSPENDED` |
| Deactivated account | Manually set `status: DEACTIVATED` via Prisma Studio | `403 ACCOUNT_DEACTIVATED` |
| Deleted account | Manually set `status: DELETED` via Prisma Studio | `401 INVALID_CREDENTIALS` (generic — deleted accounts aren't distinguishable from nonexistent ones) |

---

## 4. New-device login alert

### Postman steps
1. Log in with `X-Device-Id: device-1` → check terminal/inbox for a **"New sign-in to your account"** email.
2. Log in again with the **same** `X-Device-Id: device-1` → no new-device email this time (device is now recognized).
3. Log in with a **different** `X-Device-Id: device-2` → new-device email fires again (different device, same account).
4. Log in with **no** `X-Device-Id` header at all → no new-device email either way (can't reliably fingerprint without it — documented limitation, see README).

---

## Postman Test Scripts

For the successful login request ("Tests" tab):
```javascript
pm.test("Login succeeded", () => {
  const body = pm.response.json();
  pm.expect(body.success).to.eql(true);
  pm.expect(body.data.accessToken).to.be.a('string');
});

pm.test("Access token cookie was set", () => {
  pm.expect(pm.cookies.has('gk_access_token')).to.be.true;
});
```

For `/me`:
```javascript
pm.test("Returns the logged-in user", () => {
  const body = pm.response.json();
  pm.expect(body.data.user.email).to.eql(pm.environment.get('testEmail'));
});
```
