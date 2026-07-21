/**
 * ApiError — the ONLY way application code should signal a known,
 * operational failure (bad input, unauthorized, not found, conflict, etc).
 *
 * WHY: Distinguishing "operational errors" (expected, safe to show a
 * message for) from "programmer errors" (bugs — bare Error/TypeError) is
 * what lets the centralized error handler decide: leak-safe message to the
 * client vs. generic "Internal Server Error" + full log for us.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - safe-to-expose message
   * @param {string} [errorCode] - machine-readable code, e.g. 'INVALID_CREDENTIALS'
   * @param {Array}  [details] - optional array of field-level validation errors
   */
  constructor(statusCode, message, errorCode = 'ERROR', details = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // flags this as a known, expected error
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errorCode = 'BAD_REQUEST', details = []) {
    return new ApiError(400, message, errorCode, details);
  }

  static unauthorized(message = 'Unauthorized', errorCode = 'UNAUTHORIZED') {
    return new ApiError(401, message, errorCode);
  }

  static forbidden(message = 'Forbidden', errorCode = 'FORBIDDEN') {
    return new ApiError(403, message, errorCode);
  }

  static notFound(message = 'Resource not found', errorCode = 'NOT_FOUND') {
    return new ApiError(404, message, errorCode);
  }

  static conflict(message = 'Conflict', errorCode = 'CONFLICT') {
    return new ApiError(409, message, errorCode);
  }

  static tooManyRequests(message = 'Too many requests', errorCode = 'RATE_LIMITED') {
    return new ApiError(429, message, errorCode);
  }

  static internal(message = 'Internal server error', errorCode = 'INTERNAL_ERROR') {
    return new ApiError(500, message, errorCode);
  }
}

module.exports = ApiError;
