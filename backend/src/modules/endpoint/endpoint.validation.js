const { z } = require('zod');

const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
];
const ENDPOINT_STATUS = [
  'UP',
  'DOWN',
  'DEGRADED',
  'UNKNOWN',
];


const createEndpointSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3)
      .max(150),
    url: z
      .string()
      .url({ message: 'URL must start with http:// or https://' }), 
    method: z
      .enum(HTTP_METHODS)
      .default('GET'),
    expectedStatus: z
      .number()
      .int()
      .min(100)
      .max(599)
      .default(200),
    description: z
      .string()
      .trim()
      .max(1000)
      .optional(),
  })
  .strict();


  const getEndpointsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(10),

    search: z.string().trim().optional(),

    status: z.enum(ENDPOINT_STATUS).optional(),

    monitoringEnabled: z.coerce.boolean().optional(),

    method: z.enum(HTTP_METHODS).optional(),

    sortBy: z
      .enum([
        'createdAt',
        'updatedAt',
        'name',
        'lastCheckedAt',
        'uptimePercentage',
        'lastResponseTime',
      ])
      .default('createdAt'),

    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();


  const getEndpointSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid endpoint id'),
});

const updateEndpointSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),

    url: z.string().trim().url().optional(),

    method: z
      .enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
      .optional(),

    expectedStatus: z.number().int().min(100).max(599).optional(),

    description: z.string().trim().max(1000).nullable().optional(),

    frequency: z.number().int().min(10).optional(),

    timeout: z.number().int().min(100).optional(),

    monitoringEnabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required.',
  });


module.exports = {
  createEndpointSchema,
  getEndpointsSchema,
  getEndpointSchema,
  updateEndpointSchema
};