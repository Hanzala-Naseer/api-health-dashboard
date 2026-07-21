const ApiError = require('../utils/ApiError');

/**
 * Generic validation middleware factory.
 * WHY: Every endpoint needs input validation, but hand-rolling checks per
 * route is error-prone and inconsistent. This wraps a zod schema and
 * validates whichever request part(s) it's given, returning a single
 * standardized 400 with field-level details on failure. Parsed (and
 * coerced/defaulted) values are written back onto req so controllers get
 * clean, typed data.
 *
 * Usage: router.post('/register', validate({ body: registerSchema }), controller)
 */
function validate(schemas) {
  return (req, res, next) => {
    const targets = ['body', 'query', 'params', 'cookies'];
    const details = [];

    for (const target of targets) {
      const schema = schemas[target];
      if (!schema) continue;

      const result = schema.safeParse(req[target]);
      if (!result.success) {
        for (const issue of result.error.issues) {
          details.push({
            field: `${target}.${issue.path.join('.')}`,
            message: issue.message,
          });
        }
      } else {
        req[target] = result.data;
      }
    }

    if (details.length > 0) {
      return next(ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', details));
    }

    next();
  };
}

module.exports = validate;
