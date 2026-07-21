# Postman Testing — Feature 3: Refresh Token Rotation + Reuse Detection

Base URL: `http://localhost:5000/api/v1/auth`

You need Postman's cookie jar enabled (default) since the refresh token lives in an
httpOnly cookie set by `/login`.

---

## 1. `POST /refresh-token` — normal rotation

### Request
```
POST /api/v1/auth/refresh-token
```
No body required if you're relying on the cookie from a prior `/login` in the same
Postman session. For mobile/API-style testing without cookies:
```json
{ "refreshToken": "<raw refresh token — you won't normally have this, see note below>" }
```
> Note: the raw refresh token is **never** returned in the `/login` response body —
> only set as an httpOnly cookie — so in Postman you'll almost always test this via
> the cookie jar, not by pasting a token into the body.

### Expected success — `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Access token refreshed.",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "accessExpiresAt": "2026-07-20T12:05:34.858Z"
  }
}
```
Both `gk_access_token` and `gk_refresh_token` cookies are replaced with new values.
Old refresh token row flips to `isRevoked: true` in `refresh_tokens` (check Prisma
Studio), new row is created with `replacedByTokenId` pointing forward isn't stored —
rather the **old** row's `replacedByTokenId` points at the **new** row's id.

### Postman steps
1. Login first (Feature 2 flow) — this seeds the cookie jar.
2. Send `POST /refresh-token` with an empty body.
3. Confirm `200` and a new `accessToken` different from the login response.
4. In Prisma Studio: confirm the original `refresh_tokens` row is now
   `isRevoked: true` with `replacedByTokenId` set, and a new row exists.
5. Confirm a new `auth_sessions` row was created (`tokenType: access`).

---

## 2. Reuse detection (the important one)

### Postman steps
1. Login → note Postman now holds refresh-token-**v1** in its cookie jar.
2. **Duplicate the request** in Postman before sending: save a copy of the current
   cookie jar (Postman → Cookies → export), or simpler — call `/refresh-token` once
   and manually copy the `gk_refresh_token` cookie **value** from the response headers
   before Postman's jar overwrites it with v2.
3. Call `/refresh-token` again normally (rotates v1 → v2). Confirm `200`.
4. Now manually set the `gk_refresh_token` cookie back to the **v1** value you saved
   in step 2 (Postman → Cookies → edit for `localhost`), simulating an attacker who
   stole the token before it was rotated.
5. Send `POST /refresh-token` again with v1 active.

### Expected — `401 REFRESH_TOKEN_REUSE_DETECTED`
```json
{
  "success": false,
  "statusCode": 401,
  "message": "This session is no longer valid. You have been signed out of all devices for security. Please log in again.",
  "errorCode": "REFRESH_TOKEN_REUSE_DETECTED"
}
```
6. Check your terminal/inbox for the **"Security alert: you've been signed out of all
   devices"** email.
7. Now try refreshing with the **v2** token (the legitimate, most recent one) —
   it will **also** fail with the same error. This is intentional: reuse detection
   revokes every refresh token and session for the account, including the
   currently-valid one, because we can't be sure which token the attacker has.
   The only way forward is a fresh `/login`.
8. Confirm in Prisma Studio: every row in `refresh_tokens` and `auth_sessions` for
   this user is now `isRevoked: true`, with `revokedReason: "REFRESH_TOKEN_REUSE_DETECTED"`
   on the sessions.

---

## 3. Other error cases

| Case | Setup | Expected |
|---|---|---|
| No refresh token | Clear cookies, empty body | `401 NO_REFRESH_TOKEN` |
| Garbage token | `{"refreshToken": "not-a-real-token"}`, no cookie | `401 INVALID_REFRESH_TOKEN` |
| Expired token | Lower `JWT_REFRESH_EXPIRES_IN=5s` in `.env`, login, wait 6s, refresh | `401 REFRESH_TOKEN_EXPIRED` |
| Suspended account mid-session | Login, then set `isSuspended: true` on the user via Prisma Studio, then refresh | `403 ACCOUNT_NOT_ACTIVE` |

---

## Postman Test Script

```javascript
pm.test("Refresh returns a new access token", () => {
  const body = pm.response.json();
  pm.expect(body.success).to.eql(true);
  pm.expect(body.data.accessToken).to.be.a('string');
});

pm.test("Refresh token cookie was rotated", () => {
  pm.expect(pm.cookies.has('gk_refresh_token')).to.be.true;
});
```
