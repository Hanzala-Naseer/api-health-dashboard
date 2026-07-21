# Postman Testing — Feature 4: Logout / Logout All Devices

Base URL: `http://localhost:5000/api/v1/auth`

Both endpoints require authentication (send the access token cookie from `/login`,
or `Authorization: Bearer <accessToken>`). Use `X-Device-Id` on your login requests
to properly exercise the per-device behavior below.

---

## 1. `POST /logout` (current device only)

### Request
```
POST /api/v1/auth/logout
```
(cookies from a prior login carry the auth)

### Expected success — `200 OK`
```json
{ "success": true, "statusCode": 200, "message": "Logged out successfully.", "data": null }
```
Both `gk_access_token` and `gk_refresh_token` cookies are cleared in the response.

### Postman steps — prove it's single-device, not global
1. Login **twice** with two different `X-Device-Id` headers (simulate two browser
   tabs/devices) — save each response's cookies into two separate Postman cookie
   jars, or just note the `Set-Cookie` values manually.
2. Call `GET /me` with device A's cookies → `200`.
3. Call `POST /logout` with device A's cookies → `200`.
4. Call `GET /me` with device A's cookies again → `401 SESSION_REVOKED`.
5. Call `GET /me` with device B's cookies → **still `200`** — logout only affected
   device A.
6. Call `POST /refresh-token` with device A's (now-logged-out) cookies → expect a
   clean `401 REFRESH_TOKEN_REVOKED` ("This session has ended. Please log in
   again.") — **not** a reuse-detection alarm. Confirm no security alert email was
   sent for this — logging out is expected behavior, not an attack.

> **Known limitation, by design:** single-device logout can only precisely target
> the refresh token belonging to that device if the client sends `X-Device-Id`. If
> a client never sends that header, `/logout` still immediately kills the access
> token (so protected routes stop working right away), but the matching refresh
> token isn't individually revoked — it will still work until it's naturally
> rotated or expires. See the code comment on `revokeRefreshTokensForDevice` in
> `auth.repository.js`. For guaranteed full sign-out regardless of device-id
> support, use `/logout-all`.

---

## 2. `POST /logout-all` (every device)

### Request
```
POST /api/v1/auth/logout-all
```

### Expected success — `200 OK`
```json
{ "success": true, "statusCode": 200, "message": "Logged out of all devices successfully.", "data": null }
```

### Postman steps
1. Login from device A and device B again (fresh sessions).
2. Confirm `GET /me` works on both.
3. Call `POST /logout-all` using **either** device's cookies.
4. Confirm `GET /me` now fails with `401 SESSION_REVOKED` on **both** devices.
5. Confirm in Prisma Studio: every row in `auth_sessions` and `refresh_tokens` for
   this user is now `isRevoked: true`; sessions show
   `revokedReason: "USER_LOGOUT_ALL_DEVICES"`.
6. Check `user_activity_logs` for a `LOGOUT_ALL_DEVICES` event.

---

## 3. Error cases

| Case | Setup | Expected |
|---|---|---|
| Logout with no auth | Clear cookies, no header | `401 NO_TOKEN` |
| Logout with expired access token | Wait past `JWT_ACCESS_EXPIRES_IN`, then call `/logout` | `401 TOKEN_EXPIRED` — note: if your access token is already expired, you can't use `/logout` to kill the session; use `/refresh-token` first, or just let it expire naturally. This is expected — logout requires proving who you are. |
| Double logout | Call `/logout` twice in a row with the same (now-stale) cookies | Second call: `401 SESSION_REVOKED` (session already gone) — not an error in the "something broke" sense, just already logged out |

---

## Postman Test Script

```javascript
pm.test("Logout succeeded and cleared cookies", () => {
  const body = pm.response.json();
  pm.expect(body.success).to.eql(true);
});

pm.test("Access token cookie cleared", () => {
  pm.expect(pm.cookies.has('gk_access_token')).to.be.false;
});
```
