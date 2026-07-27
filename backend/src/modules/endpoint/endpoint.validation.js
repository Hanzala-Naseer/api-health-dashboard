

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
  'XML',
  'MULTIPART',
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
  'API_KEY_QUERY',
  'OAUTH2_CLIENT_CREDENTIALS',
  'OAUTH2_REFRESH_TOKEN',
  'HMAC',
];

const HMAC_FORMATS = ['hex', 'base64'];

const LOGIN_HTTP_METHODS = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];

/**
 * One extraction rule within a login flow step — pulls a named variable
 * out of the step's response, to be used by later steps or as the final
 * auth token.
 */
const loginStepExtractSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    from: z.enum(['body', 'header', 'cookie']),
    path: z.string().trim().min(1).max(300),
  })
  .strict();

/**
 * One step in a multi-step login flow (see helpers/multiStepLogin.js).
 * url/headers/body may reference {{var.NAME}} placeholders populated by
 * earlier steps' extract rules.
 */
const loginStepSchema = z
  .object({
    name: z.string().trim().max(100).optional(),
    url: z.string().url({ message: 'Step url must be a valid URL' }),
    method: z.enum(LOGIN_HTTP_METHODS).default('GET'),
    headers: z
      .record(z.string().trim().min(1).max(200), z.string().max(4000))
      .optional(),
    body: z
      .union([z.string().max(20000), z.record(z.string(), z.any())])
      .optional(),
    extract: z.array(loginStepExtractSchema).optional().default([]),
  })
  .strict();

// Custom headers: plain string -> string map (e.g. { "Authorization": "Bearer xyz" }).
// Keys/values are trimmed of surrounding whitespace at the HTTP level anyway, so we just
// cap length to keep documents small and reject anything that isn't a flat string map.
const headersSchema = z
  .record(
    z.string().trim().min(1).max(200),
    z.string().max(4000)
  )
  .optional();

// Same shape as headers — a flat string->string map. Values may contain
// {{placeholder}} templates, resolved at request time.
const queryParamsSchema = z
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
// V2 — Response Validation Rules
// ============================================================

/**
 * A single response validation rule. Discriminated by `type` so each
 * variant only requires the fields it actually uses.
 */
const validationRuleSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('HEADER_EXISTS'), header: z.string().trim().min(1).max(200) }).strict(),
  z.object({ type: z.literal('HEADER_EQUALS'), header: z.string().trim().min(1).max(200), value: z.string().max(4000) }).strict(),
  z.object({ type: z.literal('BODY_CONTAINS'), value: z.string().min(1).max(2000) }).strict(),
  z.object({ type: z.literal('BODY_NOT_CONTAINS'), value: z.string().min(1).max(2000) }).strict(),
  z.object({ type: z.literal('REGEX'), pattern: z.string().min(1).max(200) }).strict(),
  z.object({ type: z.literal('JSONPATH_EQUALS'), path: z.string().min(1).max(300), value: z.any() }).strict(),
  z.object({ type: z.literal('JSONPATH_EXISTS'), path: z.string().min(1).max(300) }).strict(),
  z.object({ type: z.literal('MIN_SIZE'), bytes: z.number().int().min(0) }).strict(),
  z.object({ type: z.literal('MAX_SIZE'), bytes: z.number().int().min(1) }).strict(),
  z.object({ type: z.literal('MAX_RESPONSE_TIME'), ms: z.number().int().min(1) }).strict(),
]);

const validationRulesSchema = z.array(validationRuleSchema).max(20).optional();

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
      .optional(),
    method: z
      .enum(LOGIN_HTTP_METHODS)
      .default('POST'),
    headers: z
      .record(z.string().trim().min(1).max(200), z.string().max(4000))
      .default({ 'Content-Type': 'application/json' })
      .optional(),
    body: z
      .union([z.string().max(20000), z.record(z.string(), z.any())])
      .optional(),
    tokenPath: z
      .string()
      .trim()
      .min(1, 'Token path is required for LOGIN_FLOW authentication')
      .default('data.accessToken')
      .optional(),
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

    // --- Advanced multi-step login (V2) ---
    // When provided (non-empty), loginUrl/body above aren't required —
    // see the refine() rules below.
    steps: z.array(loginStepSchema).min(1).optional(),
    tokenVariable: z.string().trim().min(1).max(100).default('token').optional(),
    forwardCookies: z.boolean().default(false).optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.steps && data.steps.length > 0) {
        return true; // multi-step mode doesn't need a single loginUrl
      }
      return Boolean(data.loginUrl && data.loginUrl.trim().length > 0);
    },
    {
      message: 'loginUrl is required for LOGIN_FLOW authentication unless steps is provided',
      path: ['loginUrl'],
    }
  )
  .refine(
    (data) => {
      if (data.steps && data.steps.length > 0) {
        return true; // multi-step mode builds its own request bodies per-step
      }
      return data.body !== undefined && data.body !== null && Object.keys(data.body).length > 0;
    },
    {
      message: 'Login body is required for LOGIN_FLOW authentication unless steps is provided',
      path: ['body'],
    }
  );

/**
 * OAuth2 configuration schema, shared by OAUTH2_CLIENT_CREDENTIALS and
 * OAUTH2_REFRESH_TOKEN. All fields are optional here — which ones are
 * actually required depends on the grant type, enforced by the refine()
 * rules below rather than by this shape itself.
 */
const oauth2ConfigSchema = z
  .object({
    tokenUrl: z
      .string()
      .url({ message: 'Token URL must be a valid URL' })
      .optional(),
    clientId: z.string().trim().min(1).max(500).optional(),
    clientSecret: z.string().trim().min(1).max(4000).optional(),
    refreshToken: z.string().trim().min(1).max(4000).optional(),
    scope: z.string().trim().max(500).optional(),
    audience: z.string().trim().max(500).optional(),
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

    // API_KEY_QUERY (reuses apiKeyValue above for the value)
    apiKeyQueryParam: z
      .string()
      .trim()
      .min(1, 'apiKeyQueryParam is required for API_KEY_QUERY authentication')
      .max(100)
      .optional(),

    // HMAC
    hmacSecret: z
      .string()
      .trim()
      .min(1, 'hmacSecret is required for HMAC authentication')
      .max(4000)
      .optional(),
    hmacSignatureHeader: z.string().trim().min(1).max(100).optional(),
    hmacTimestampHeader: z.string().trim().max(100).optional(),
    hmacNonceHeader: z.string().trim().max(100).optional(),
    hmacFormat: z.enum(HMAC_FORMATS).optional(),
    hmacSignedFields: z
      .array(z.enum(['timestamp', 'nonce', 'method', 'path', 'body']))
      .min(1)
      .optional(),

    // OAUTH2_CLIENT_CREDENTIALS / OAUTH2_REFRESH_TOKEN
    oauth2Config: oauth2ConfigSchema.optional(),
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
        if (data.loginConfig?.steps && data.loginConfig.steps.length > 0) {
          return true;
        }
        return data.loginConfig && data.loginConfig.loginUrl && data.loginConfig.loginUrl.length > 0;
      }
      return true;
    },
    {
      message: 'loginConfig.loginUrl is required for LOGIN_FLOW authentication (unless loginConfig.steps is provided)',
      path: ['loginConfig', 'loginUrl'],
    }
  )
  .refine(
    (data) => {
      if (data.type === 'LOGIN_FLOW') {
        if (data.loginConfig?.steps && data.loginConfig.steps.length > 0) {
          return true;
        }
        return data.loginConfig && data.loginConfig.body && Object.keys(data.loginConfig.body).length > 0;
      }
      return true;
    },
    {
      message: 'loginConfig.body is required for LOGIN_FLOW authentication (unless loginConfig.steps is provided)',
      path: ['loginConfig', 'body'],
    }
  )
  .refine(
    (data) => {
      if (data.type === 'API_KEY_QUERY') {
        return Boolean(data.apiKeyQueryParam && data.apiKeyValue);
      }
      return true;
    },
    {
      message: 'apiKeyQueryParam and apiKeyValue are required for API_KEY_QUERY authentication',
      path: ['apiKeyQueryParam'],
    }
  )
  .refine(
    (data) => {
      if (data.type === 'HMAC') {
        return Boolean(data.hmacSecret);
      }
      return true;
    },
    {
      message: 'hmacSecret is required for HMAC authentication',
      path: ['hmacSecret'],
    }
  )
  .refine(
    (data) => {
      if (data.type === 'OAUTH2_CLIENT_CREDENTIALS') {
        return Boolean(data.oauth2Config?.tokenUrl && data.oauth2Config?.clientId && data.oauth2Config?.clientSecret);
      }
      return true;
    },
    {
      message: 'oauth2Config.tokenUrl, clientId, and clientSecret are required for OAUTH2_CLIENT_CREDENTIALS authentication',
      path: ['oauth2Config', 'tokenUrl'],
    }
  )
  .refine(
    (data) => {
      if (data.type === 'OAUTH2_REFRESH_TOKEN') {
        return Boolean(data.oauth2Config?.tokenUrl && data.oauth2Config?.refreshToken);
      }
      return true;
    },
    {
      message: 'oauth2Config.tokenUrl and refreshToken are required for OAUTH2_REFRESH_TOKEN authentication',
      path: ['oauth2Config', 'refreshToken'],
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
    validationRules: validationRulesSchema,
    description: z
      .string()
      .trim()
      .max(1000)
      .optional(),
    headers: headersSchema,
    queryParams: queryParamsSchema,
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

    validationRules: validationRulesSchema,

    description: z.string().trim().max(1000).nullable().optional(),

    frequency: z.number().int().min(10).optional(),

    timeout: z.number().int().min(100).optional(),

    monitoringEnabled: z.boolean().optional(),

    headers: headersSchema,

    queryParams: queryParamsSchema,

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
  oauth2ConfigSchema,
  AUTH_TYPES,
};