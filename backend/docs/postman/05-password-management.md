# Postman Testing — Feature 5: Forgot Password / Reset Password / Change Password

Base URL: `http://localhost:5000/api/v1/auth`

---

## 1. `POST /forgot-password`

### Request
```json
{ "email": "jane.doe@example.com" }
```

### Expected — `200 OK`, always this generic message (no enumeration)
```json
{ "success": true, "statusCode": 200, "message": "If an account with this email exists, a password reset link has been sent." }
```

### Postman steps
1. Send with a real, registered email. Check your terminal/inbox for the "Reset your
   password" email containing a link like
   `http://localhost:3000/reset-password?token=<raw-token>`. Copy that token.
2. Send again immediately → `429 PASSWORD_RESET_COOLDOWN` (default 60s).
3. Send with an email that doesn't exist → still `200` with the same generic message.
4. Confirm in Prisma Studio: `password_reset_tokens` has a new row for the user,
   `expiresAt` ~30 minutes out (`PASSWORD_RESET_TOKEN_EXPIRY_MINUTES`).

---

## 2. `POST /reset-password`

### Request
```json
{ "token": "<raw token from the email>", "newPassword": "Br4nd!NewPassword" }
```

### Expected — `200 OK`
```json
{ "success": true, "statusCode": 200, "message": "Password reset successfully. Please log in with your new password." }
```
A "Your password was changed" confirmation email is sent. Every session and refresh
token for the account is revoked — if you were logged in anywhere, you're logged out
everywhere (there's no "current device" to preserve in this unauthenticated flow).

### Postman steps
1. Use the token from step 1.
2. Send `reset-password`. Confirm `200`.
3. Try logging in with the OLD password → `401 INVALID_CREDENTIALS`.
4. Log in with the NEW password → `200`, works fine.
5. Send the exact same request again (same token) → `400 RESET_TOKEN_ALREADY_USED`.

### Error cases

| Case | Setup | Expected |
|---|---|---|
| Garbage token | `"token": "not-a-real-token"` | `400 INVALID_RESET_TOKEN` |
| Expired token | Lower `PASSWORD_RESET_TOKEN_EXPIRY_MINUTES=1`, wait past it | `400 RESET_TOKEN_EXPIRED` |
| Weak new password | `"newPassword": "weak"` | `400 VALIDATION_ERROR` |
| Reused password | Reset to a password identical to the current one or a recent historical one | `400 PASSWORD_REUSE_NOT_ALLOWED` |

---

## 3. `POST /change-password` (authenticated)

Requires being logged in — send the access token cookie or `Authorization: Bearer`.

### Request
```json
{ "currentPassword": "Br4nd!NewPassword", "newPassword": "AnotherStr0ng!One" }
```

### Expected — `200 OK`
```json
{ "success": true, "statusCode": 200, "message": "Password changed successfully. You have been signed out of all other devices." }
```

### Postman steps — prove session preservation
1. Login from **two** devices: `X-Device-Id: dev-A` and `X-Device-Id: dev-B`.
2. Confirm `GET /me` works on both.
3. From device A, call `change-password` with the correct current password.
4. `GET /me` on device A → **still `200`** (current session preserved on purpose).
5. `GET /me` on device B → `401 SESSION_REVOKED` (every other device signed out).
6. Check inbox/terminal for the password-changed confirmation email.

### Error cases

| Case | Setup | Expected |
|---|---|---|
| Wrong current password | `"currentPassword": "WrongOne!"` | `401 INVALID_CURRENT_PASSWORD` |
| New password same as current | `newPassword` equals `currentPassword` | `400 VALIDATION_ERROR` (caught before even hitting the DB) |
| New password matches password history | Change password, then try changing back to a password used within the last `PASSWORD_HISTORY_LIMIT` changes | `400 PASSWORD_REUSE_NOT_ALLOWED` |
| Not authenticated | No cookie/header | `401 NO_TOKEN` |

---

## Postman Test Scripts

```javascript
// forgot-password / reset-password
pm.test("Generic success message", () => {
  pm.expect(pm.response.json().success).to.eql(true);
});

// change-password
pm.test("Password changed, current session intact", () => {
  const body = pm.response.json();
  pm.expect(body.success).to.eql(true);
  pm.expect(pm.cookies.has('gk_access_token')).to.be.true; // NOT cleared — session preserved
});
```
