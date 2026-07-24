// const { z } = require('zod');

// const HTTP_METHODS = [
//   'GET',
//   'POST',
//   'PUT',
//   'PATCH',
//   'DELETE',
//   'HEAD',
//   'OPTIONS',
// ];
// const ENDPOINT_STATUS = [
//   'UP',
//   'DOWN',
//   'DEGRADED',
//   'UNKNOWN',
// ];
// const BODY_TYPES = [
//   'NONE',
//   'JSON',
//   'TEXT',
//   'FORM_URLENCODED',
// ];

// // Production V1 (Feature 1): informational only — never restricts which
// // HTTP methods can be configured. See models/ApiEndpoint.model.js.
// const MONITORING_TYPES = [
//   'READ_ONLY',
//   'TRANSACTION',
// ];

// // Custom headers: plain string -> string map (e.g. { "Authorization": "Bearer xyz" }).
// // Keys/values are trimmed of surrounding whitespace at the HTTP level anyway, so we just
// // cap length to keep documents small and reject anything that isn't a flat string map.
// const headersSchema = z
//   .record(
//     z.string().trim().min(1).max(200),
//     z.string().max(4000)
//   )
//   .optional();

// // Body accepts either a JSON object (from a JSON-editor UI) or a raw string (for
// // TEXT/FORM_URLENCODED bodies, or a hand-typed JSON string) — normalized later in the
// // service layer based on bodyType.
// const bodySchema = z
//   .union([z.string().max(20000), z.record(z.string(), z.any())])
//   .optional();

// const createEndpointSchema = z
//   .object({
//     name: z
//       .string()
//       .trim()
//       .min(3)
//       .max(150),
//     url: z
//       .string()
//       .url({ message: 'URL must start with http:// or https://' }), 
//     method: z
//       .enum(HTTP_METHODS)
//       .default('GET'),
//     expectedStatus: z
//       .number()
//       .int()
//       .min(100)
//       .max(599)
//       .default(200),
//     description: z
//       .string()
//       .trim()
//       .max(1000)
//       .optional(),
//     headers: headersSchema,
//     bodyType: z
//       .enum(BODY_TYPES)
//       .default('NONE'),
//     body: bodySchema,
//     monitoringType: z
//       .enum(MONITORING_TYPES)
//       .default('READ_ONLY'),
//   })
//   .strict()
//   .refine(
//     (data) => data.bodyType === 'NONE' || data.body !== undefined,
//     {
//       message: 'body is required when bodyType is not NONE.',
//       path: ['body'],
//     }
//   );


//   const getEndpointsSchema = z
//   .object({
//     page: z.coerce.number().int().min(1).default(1),

//     limit: z.coerce.number().int().min(1).max(100).default(10),

//     search: z.string().trim().optional(),

//     status: z.enum(ENDPOINT_STATUS).optional(),

//     monitoringEnabled: z.coerce.boolean().optional(),

//     method: z.enum(HTTP_METHODS).optional(),

//     sortBy: z
//       .enum([
//         'createdAt',
//         'updatedAt',
//         'name',
//         'lastCheckedAt',
//         'uptimePercentage',
//         'lastResponseTime',
//       ])
//       .default('createdAt'),

//     sortOrder: z.enum(['asc', 'desc']).default('desc'),
//   })
//   .strict();


//   const getEndpointSchema = z.object({
//   id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid endpoint id'),
// });

// const updateEndpointSchema = z
//   .object({
//     name: z.string().trim().min(1).max(150).optional(),

//     url: z.string().trim().url().optional(),

//     method: z
//       .enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
//       .optional(),

//     expectedStatus: z.number().int().min(100).max(599).optional(),

//     description: z.string().trim().max(1000).nullable().optional(),

//     frequency: z.number().int().min(10).optional(),

//     timeout: z.number().int().min(100).optional(),

//     monitoringEnabled: z.boolean().optional(),

//     headers: headersSchema,

//     bodyType: z.enum(BODY_TYPES).optional(),

//     body: bodySchema,

//     monitoringType: z.enum(MONITORING_TYPES).optional(),
//   })
//   .refine((data) => Object.keys(data).length > 0, {
//     message: 'At least one field is required.',
//   });


// module.exports = {
//   createEndpointSchema,
//   getEndpointsSchema,
//   getEndpointSchema,
//   updateEndpointSchema
// };


// src/modules/endpoint/endpoint.validation.js

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
const BODY_TYPES = [
  'NONE',
  'JSON',
  'TEXT',
  'FORM_URLENCODED',
];

// Production V1 (Feature 1): informational only — never restricts which
// HTTP methods can be configured. See models/ApiEndpoint.model.js.
const MONITORING_TYPES = [
  'READ_ONLY',
  'TRANSACTION',
];

// ============================================================
// V1.5 — Authentication Types
// ============================================================

const AUTH_TYPES = [
  'NONE',
  'STATIC_BEARER',
  'API_KEY',
  'BASIC',
  'LOGIN_FLOW',
];

const LOGIN_HTTP_METHODS = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];

// Custom headers: plain string -> string map (e.g. { "Authorization": "Bearer xyz" }).
// Keys/values are trimmed of surrounding whitespace at the HTTP level anyway, so we just
// cap length to keep documents small and reject anything that isn't a flat string map.
const headersSchema = z
  .record(
    z.string().trim().min(1).max(200),
    z.string().max(4000)
  )
  .optional();

// Body accepts either a JSON object (from a JSON-editor UI) or a raw string (for
// TEXT/FORM_URLENCODED bodies, or a hand-typed JSON string) — normalized later in the
// service layer based on bodyType.
const bodySchema = z
  .union([z.string().max(20000), z.record(z.string(), z.any())])
  .optional();

// ============================================================
// V1.5 — Authentication Schemas
// ============================================================

/**
 * Login flow configuration schema.
 *
 * Validates that:
 * - loginUrl is a valid URL
 * - method is a valid HTTP method for login
 * - headers is a valid header map
 * - body is present (required for login)
 * - tokenPath is a non-empty string
 */
const loginFlowConfigSchema = z
  .object({
    loginUrl: z
      .string()
      .url({ message: 'Login URL must be a valid URL' })
      .min(1, 'Login URL is required for LOGIN_FLOW authentication'),
    method: z
      .enum(LOGIN_HTTP_METHODS)
      .default('POST'),
    headers: z
      .record(z.string().trim().min(1).max(200), z.string().max(4000))
      .default({ 'Content-Type': 'application/json' })
      .optional(),
    body: z
      .union([z.string().max(20000), z.record(z.string(), z.any())])
      .refine((val) => val !== undefined && val !== null && Object.keys(val).length > 0, {
        message: 'Login body is required for LOGIN_FLOW authentication',
      }),
    tokenPath: z
      .string()
      .trim()
      .min(1, 'Token path is required for LOGIN_FLOW authentication')
      .default('data.accessToken'),
    asBearer: z
      .boolean()
      .default(true)
      .optional(),
    cacheTtlSeconds: z
      .number()
      .int()
      .min(0)
      .default(0)
      .optional(),
  })
  .strict();

/**
 * Authentication configuration schema.
 *
 * Validates that the required fields for each auth type are present.
 */
const authConfigSchema = z
  .object({
    type: z
      .enum(AUTH_TYPES)
      .default('NONE'),

    // STATIC_BEARER
    staticToken: z
      .string()
      .trim()
      .min(1, 'Static token is required for STATIC_BEARER authentication')
      .max(4000)
      .optional(),

    // API_KEY
    apiKeyHeader: z
      .string()
      .trim()
      .min(1, 'API key header is required for API_KEY authentication')
      .max(100)
      .optional(),
    apiKeyValue: z
      .string()
      .trim()
      .min(1, 'API key value is required for API_KEY authentication')
      .max(4000)
      .optional(),

    // BASIC
    basicUsername: z
      .string()
      .trim()
      .min(1, 'Username is required for BASIC authentication')
      .max(255)
      .optional(),
    basicPassword: z
      .string()
      .trim()
      .min(1, 'Password is required for BASIC authentication')
      .max(4000)
      .optional(),

    // LOGIN_FLOW
    loginConfig: loginFlowConfigSchema.optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.type === 'STATIC_BEARER') {
        return data.staticToken && data.staticToken.length > 0;
      }
      return true;
    },
    {
      message: 'staticToken is required for STATIC_BEARER authentication',
      path: ['staticToken'],
    }
  )
  .refine(
    (data) => {
      if (data.type === 'API_KEY') {
        return data.apiKeyHeader && data.apiKeyValue && data.apiKeyHeader.length > 0 && data.apiKeyValue.length > 0;
      }
      return true;
    },
    {
      message: 'apiKeyHeader and apiKeyValue are required for API_KEY authentication',
      path: ['apiKeyHeader'],
    }
  )
  .refine(
    (data) => {
      if (data.type === 'BASIC') {
        return data.basicUsername && data.basicPassword && data.basicUsername.length > 0 && data.basicPassword.length > 0;
      }
      return true;
    },
    {
      message: 'basicUsername and basicPassword are required for BASIC authentication',
      path: ['basicUsername'],
    }
  )
  .refine(
    (data) => {
      if (data.type === 'LOGIN_FLOW') {
        return data.loginConfig && data.loginConfig.loginUrl && data.loginConfig.loginUrl.length > 0;
      }
      return true;
    },
    {
      message: 'loginConfig.loginUrl is required for LOGIN_FLOW authentication',
      path: ['loginConfig', 'loginUrl'],
    }
  )
  .refine(
    (data) => {
      if (data.type === 'LOGIN_FLOW') {
        return data.loginConfig && data.loginConfig.body && Object.keys(data.loginConfig.body).length > 0;
      }
      return true;
    },
    {
      message: 'loginConfig.body is required for LOGIN_FLOW authentication',
      path: ['loginConfig', 'body'],
    }
  );

// ============================================================
// Main Endpoint Schemas
// ============================================================

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
    headers: headersSchema,
    bodyType: z
      .enum(BODY_TYPES)
      .default('NONE'),
    body: bodySchema,
    monitoringType: z
      .enum(MONITORING_TYPES)
      .default('READ_ONLY'),
    // V1.5 — Authentication configuration
    auth: authConfigSchema.optional(),
  })
  .strict()
  .refine(
    (data) => data.bodyType === 'NONE' || data.body !== undefined,
    {
      message: 'body is required when bodyType is not NONE.',
      path: ['body'],
    }
  );

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

    // V1.5 — Filter by authentication type
    authType: z.enum(AUTH_TYPES).optional(),
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

    headers: headersSchema,

    bodyType: z.enum(BODY_TYPES).optional(),

    body: bodySchema,

    monitoringType: z.enum(MONITORING_TYPES).optional(),

    // V1.5 — Authentication configuration (partial update)
    auth: authConfigSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required.',
  });

module.exports = {
  createEndpointSchema,
  getEndpointsSchema,
  getEndpointSchema,
  updateEndpointSchema,
  // V1.5 — Export auth schemas for reuse
  authConfigSchema,
  loginFlowConfigSchema,
  AUTH_TYPES,
};