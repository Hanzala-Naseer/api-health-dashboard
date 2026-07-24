const { z } = require('zod');

/**
 * FEATURE 4: Health Endpoints
 *
 * These POST checks accept an optional request body/headers so customers
 * can realistically configure and monitor them (custom headers, a small
 * JSON body) exactly like any other endpoint PulseOps monitors — while the
 * handler itself never touches business data.
 */
const healthCheckBodySchema = z
  .object({
    note: z
      .string()
      .trim()
      .max(500)
      .optional(),
  })
  .strict()
  .optional()
  .default({});

module.exports = {
  healthCheckBodySchema,
};
