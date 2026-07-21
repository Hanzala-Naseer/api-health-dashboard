# Postman Testing — Feature 1: Registration + Email OTP Verification

Base URL: `http://localhost:5000/api/v1/auth`
All requests: `Content-Type: application/json`

---

## 1. `POST /register`

### Request
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "jane.doe@example.com",
  "password": "Str0ng!Passw0rd",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+923001234567",
  "marketingConsent": true
}
```

### Expected success — `201 Created`
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful. Please check your email for a verification code.",
  "data": {
    "user": {
      "id": "clx...",
      "email": "jane.doe@example.com",
      "status": "PENDING_EMAIL_VERIFICATION",
      "firstName": "Jane",
      "lastName": "Doe"
    }
  }
}
```
> With no SMTP configured (`.env` defaults), the OTP is printed to the server console
> as `[DEV EMAIL] To: jane.doe@example.com | Subject: ...`. Copy the 6-digit code from
> there for step 2.

### Postman steps
1. Create a request `POST {{baseUrl}}/register` with the body above.
2. Send. Confirm `201` and `status: PENDING_EMAIL_VERIFICATION`.
3. Check your terminal (or inbox, if SMTP is configured) for the OTP.
4. Query the DB / Prisma Studio: `otp_verifications` should have one row for this
   user with `purpose = REGISTRATION`, `status = PENDING`. `users` should have one
   row with `emailVerifiedAt = null`.

### Error cases to test

| Case | Body change | Expected |
|---|---|---|
| Duplicate verified email | Register same email twice, verifying in between | `409 EMAIL_ALREADY_REGISTERED` on 2nd call |
| Re-register unverified email | Register same email twice, no verification in between | `201` again (OTP re-issued, same user row reused) |
| Weak password | `"password": "weak"` | `400 VALIDATION_ERROR` with per-rule messages |
| Invalid email | `"email": "not-an-email"` | `400 VALIDATION_ERROR` |
| Missing required fields | omit `firstName` | `400 VALIDATION_ERROR`, `field: body.firstName` |
| Duplicate phone number | reuse a phone already on another account | `409 PHONE_ALREADY_REGISTERED` |
| Rate limit | Send 11 requests within 15 min from same IP | `429 RATE_LIMITED` on the 11th |

---

## 2. `POST /verify-otp`

### Request
```
POST /api/v1/auth/verify-otp
Content-Type: application/json

{
  "email": "jane.doe@example.com",
  "otp": "482913",
  "purpose": "REGISTRATION"
}
```

### Expected success — `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Email verified successfully.",
  "data": {
    "user": {
      "id": "clx...",
      "email": "jane.doe@example.com",
      "status": "ACTIVE",
      "emailVerifiedAt": "2026-07-19T09:00:00.000Z"
    }
  }
}
```
> A welcome email is sent immediately after (check console/inbox). `users.status`
> flips to `ACTIVE`, `otp_verifications` row for this OTP flips to `VERIFIED`.

### Postman steps
1. Use the OTP captured from step 1's console/email output.
2. Send `POST {{baseUrl}}/verify-otp`. Confirm `200` and `status: ACTIVE`.
3. Re-send the exact same request again → should now fail (OTP already used).

### Error cases to test

| Case | Setup | Expected |
|---|---|---|
| Wrong OTP | Use `"otp": "000000"` | `400 INVALID_OTP`, message shows attempts remaining |
| Exhaust attempts | Submit wrong OTP 5 times in a row | 5th response: `400 OTP_MAX_ATTEMPTS_REACHED` |
| Replay used OTP | Verify successfully, then submit the same OTP again | `400 OTP_NOT_FOUND` (no longer PENDING) |
| Expired OTP | Wait past `OTP_EXPIRY_MINUTES` (or lower it to 1 in `.env` for a fast test), then submit | `400 OTP_EXPIRED` |
| Unknown email | `"email": "ghost@example.com"` | `400 INVALID_OTP` (generic — no enumeration) |
| Malformed OTP | `"otp": "12"` | `400 VALIDATION_ERROR` |

---

## 3. `POST /resend-otp`

### Request
```
POST /api/v1/auth/resend-otp
Content-Type: application/json

{
  "email": "jane.doe@example.com",
  "purpose": "REGISTRATION"
}
```

### Expected success — `200 OK` (always this generic shape, whether or not the account exists)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "If an account with this email exists and is not yet verified, a new code has been sent."
}
```

### Postman steps
1. Immediately after registering (before verifying), call `resend-otp`.
2. Confirm `200` with the generic message.
3. Check console/email for a NEW code — the old code should now be `REVOKED` in
   `otp_verifications` (confirm via Prisma Studio) and no longer accepted by
   `verify-otp`.
4. Immediately call `resend-otp` again → expect `429 OTP_RESEND_COOLDOWN` (60s cooldown).
5. Call `resend-otp` for an email that's already verified → still `200` generic
   message, but confirm via server logs that no new OTP was actually created.
6. Call `resend-otp` for an email that never registered → still `200` generic
   message (no enumeration).
7. Call `resend-otp` 6 times over an hour (or lower `OTP_MAX_RESEND_PER_HOUR` to 2
   for a fast test) → expect `429 OTP_HOURLY_LIMIT_REACHED` once the cap is hit.

---

## Postman Collection Variables

Set these as a Postman Environment so requests are reusable:

| Variable | Value |
|---|---|
| `baseUrl` | `http://localhost:5000/api/v1/auth` |

## Suggested Postman Test Scripts (per request, "Tests" tab)

```javascript
pm.test("Status code is 200 or 201", () => {
  pm.expect([200, 201]).to.include(pm.response.code);
});

pm.test("Response has success:true", () => {
  pm.expect(pm.response.json().success).to.eql(true);
});
```

For error-case requests, swap to:
```javascript
pm.test("Error response is well-formed", () => {
  const body = pm.response.json();
  pm.expect(body.success).to.eql(false);
  pm.expect(body).to.have.property('errorCode');
});
```
