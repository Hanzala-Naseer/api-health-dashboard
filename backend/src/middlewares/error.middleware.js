const env = require('../config/env');
const logger = require('../lib/logger');
const ApiError = require('../utils/ApiError');

/**
 * 404 handler — must be registered AFTER all routes, BEFORE the error handler.
 */
function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
}

/**
 * Centralized error handler — the ONLY place that writes error responses.
 *
 * WHY: Never let raw errors (stack traces, MongoDB internals, file paths)
 * leak to the client. Known errors (ApiError, `isOperational: true`) get
 * their intended message. Anything else — a bug, an unhandled Mongoose
 * error, a third-party library throwing — is logged in full internally and
 * reduced to a generic message externally.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let { statusCode, message, errorCode, details } = normalizeError(err);

  const logPayload = {
    statusCode,
    errorCode,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  };

  if (statusCode >= 500) {
    logger.error(err.stack || err.message, logPayload);
  } else {
    logger.warn(message, logPayload);
  }

  const responseBody = {
    success: false,
    statusCode,
    message,
    errorCode,
    details: details && details.length ? details : undefined,
  };

  // Only leak stack traces in non-production, and only for our own bugs.
  if (env.NODE_ENV !== 'production' && statusCode >= 500) {
    responseBody.stack = err.stack;
  }

  res.status(statusCode).json(responseBody);
}

function normalizeError(err) {
  if (err instanceof ApiError) {
    return { statusCode: err.statusCode, message: err.message, errorCode: err.errorCode, details: err.details };
  }

  // MongoDB duplicate key error (unique index violation — e.g. email, tokenHash)
  if (err.code === 11000) {
    return mapMongoDuplicateKeyError(err);
  }

  // Mongoose schema validation errors (required field missing, enum mismatch, etc.)
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return { statusCode: 400, message: 'Validation failed.', errorCode: 'VALIDATION_ERROR', details };
  }

  // Malformed ObjectId passed where a valid one was expected
  if (err.name === 'CastError') {
    return {
      statusCode: 400,
      message: `Invalid value for field "${err.path}".`,
      errorCode: 'INVALID_IDENTIFIER',
      details: [],
    };
  }

  if (err.name === 'JsonWebTokenError') {
    return { statusCode: 401, message: 'Invalid token', errorCode: 'INVALID_TOKEN', details: [] };
  }
  if (err.name === 'TokenExpiredError') {
    return { statusCode: 401, message: 'Token expired', errorCode: 'TOKEN_EXPIRED', details: [] };
  }

  // Unknown / programmer error — never expose details
  return {
    statusCode: 500,
    message: 'Something went wrong. Please try again later.',
    errorCode: 'INTERNAL_ERROR',
    details: [],
  };
}

function mapMongoDuplicateKeyError(err) {
  const field = err.keyValue ? Object.keys(err.keyValue).join(', ') : 'value';
  return {
    statusCode: 409,
    message: `A record with this ${field} already exists.`,
    errorCode: 'DUPLICATE_ENTRY',
    details: [],
  };
}

module.exports = { notFoundHandler, errorHandler };
