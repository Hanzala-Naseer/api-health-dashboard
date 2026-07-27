const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const AuthSession = require('../models/AuthSession.model');
const User = require('../models/User.model');
const { verifyAccessToken } = require('../utils/tokens');
const { COOKIE_NAMES, USER_STATUS } = require('../config/constants');

/**
 * authenticate — the ONLY way a request should be treated as "logged in".
 *
 * WHY a DB check on top of JWT verification (not "just verify the JWT and
 * trust it"): a bare-JWT approach can't implement "Access Token Revocation"
 * — once issued, a stateless JWT is valid until it expires no matter what.
 * We close that gap by mirroring every access token's `jti` into an
 * AuthSession row at login time. Here, after the JWT signature/expiry check
 * passes, we look up that session and reject if it's been revoked (logout,
 * "log out all devices", admin-forced revocation, etc.) — so logout takes
 * effect immediately instead of waiting out the token's natural expiry.
 *
 * Accepts the token from the httpOnly cookie (browser clients) OR an
 * `Authorization: Bearer <token>` header (mobile/API clients), cookie takes
 * precedence when both are present.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const bearerHeader = req.headers.authorization;
  const bearerToken = bearerHeader?.startsWith('Bearer ') ? bearerHeader.slice(7) : null;
  const token = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN] || bearerToken;

  


  if (!token) {
    throw ApiError.unauthorized('Authentication required.', 'NO_TOKEN');
  }

  const payload = verifyAccessToken(token); // throws INVALID_TOKEN / TOKEN_EXPIRED

  const session = await AuthSession.findOne({ token: payload.jti });

  if (!session || session.isRevoked || session.expiresAt.getTime() < Date.now()) {
    throw ApiError.unauthorized('Session has been revoked. Please log in again.', 'SESSION_REVOKED');
  }

  const user = await User.findById(payload.sub);

  if (!user) {
    throw ApiError.unauthorized('User no longer exists.', 'USER_NOT_FOUND');
  }

  const blockedStatuses = [
    USER_STATUS.SUSPENDED,
    USER_STATUS.DEACTIVATED,
    USER_STATUS.LOCKED,
    USER_STATUS.DELETED,
  ];
  if (blockedStatuses.includes(user.status) || user.isSuspended) {
    throw ApiError.forbidden('Account is not active.', 'ACCOUNT_NOT_ACTIVE');
  }

  // Fire-and-forget — don't block the request on a timestamp touch.
  AuthSession.updateOne({ _id: session.id }, { lastUsedAt: new Date() }).catch(() => {});

  req.user = { id: user.id, email: user.email, role: user.role, status: user.status };
  req.sessionId = session.id;
  next();
});

module.exports = { authenticate };
