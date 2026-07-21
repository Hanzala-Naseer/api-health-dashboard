/**
 * ApiResponse — standardized success envelope.
 * WHY: Frontend/mobile clients should never have to guess response shape
 * per-endpoint. Every success response looks like:
 * { success: true, statusCode, message, data, meta? }
 * Every error response (see error.middleware.js) looks like:
 * { success: false, statusCode, message, errorCode, details, meta }
 */
class ApiResponse {
  constructor(statusCode, message, data = null, meta = undefined) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (meta) this.meta = meta;
  }

  send(res) {
    return res.status(this.statusCode).json(this);
  }
}

module.exports = ApiResponse;
