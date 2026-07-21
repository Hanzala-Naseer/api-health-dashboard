/**
 * Wraps an async Express handler so any rejected promise / thrown error is
 * forwarded to next(err) automatically, instead of every controller needing
 * try/catch. This keeps controllers thin and prevents unhandled rejections
 * from crashing the process.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
