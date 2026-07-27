// const mongoose = require('mongoose');

// const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
// const ENDPOINT_STATUS = ['UP', 'DOWN', 'DEGRADED', 'UNKNOWN'];
// const BODY_TYPES = ['NONE', 'JSON', 'TEXT', 'FORM_URLENCODED'];

// // Production V1 monitoring metadata (Feature 1). This never blocks or
// // changes request execution — every method (including POST/PUT/PATCH/DELETE)
// // still runs exactly as configured. It only tags the endpoint so the
// // frontend can warn/filter, e.g. "this scheduled check writes real data".
// const MONITORING_TYPES = ['READ_ONLY', 'TRANSACTION'];

// /**
//  * A single monitored API endpoint belonging to a user. Aggregated uptime
//  * counters (`totalChecks`, `successfulChecks`, ...) are maintained by the
//  * monitoring worker on every HealthCheck write, so dashboard reads never
//  * need to aggregate the (potentially huge) HealthCheck collection.
//  */
// const apiEndpointSchema = new mongoose.Schema(
//   {
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

//     name: { type: String, required: true, trim: true, maxlength: 150 },
//     url: { type: String, required: true, trim: true },
//     method: { type: String, enum: HTTP_METHODS, default: 'GET' },
//     expectedStatus: { type: Number, default: 200, min: 100, max: 599 },
//     description: { type: String, trim: true, maxlength: 1000, default: null },

//     // Custom request headers sent with every check, e.g. { "Authorization": "Bearer xyz",
//     // "X-Api-Key": "..." }. Stored as a plain object (not a Mongoose Map) so lean() and
//     // full-document reads return the same shape without extra conversion.
//     headers: { type: mongoose.Schema.Types.Mixed, default: {} },

//     // Request body sent for methods like POST/PUT/PATCH (and DELETE, for APIs that
//     // require one). `bodyType` determines how `body` is serialized/interpreted:
//     //   NONE             -> no body sent regardless of `body`
//     //   JSON             -> sent as application/json (object or JSON string)
//     //   TEXT             -> sent as raw text, Content-Type left as provided in `headers`
//     //   FORM_URLENCODED  -> object/JSON string sent as application/x-www-form-urlencoded
//     bodyType: { type: String, enum: BODY_TYPES, default: 'NONE' },
//     body: { type: mongoose.Schema.Types.Mixed, default: null },

//     // Production V1 (Feature 1): does this monitored endpoint only read data,
//     // or can it change/create/delete real records? Purely informational —
//     // PulseOps still executes POST/PUT/PATCH/DELETE exactly as configured
//     // either way (see monitoring/healthChecker.service.js). Frontend uses
//     // this to warn users before they schedule something that writes data.
//     monitoringType: { type: String, enum: MONITORING_TYPES, default: 'READ_ONLY' },

//     // Monitoring config
//     frequency: { type: Number, default: 300, min: 10 }, // seconds between checks
//     timeout: { type: Number, default: 10000, min: 100 }, // ms
//     monitoringEnabled: { type: Boolean, default: true },

//     // Latest known state (denormalized for fast dashboard reads)
//     currentStatus: { type: String, enum: ENDPOINT_STATUS, default: 'UNKNOWN' },
//     lastResponseTime: { type: Number, default: null }, // ms
//     lastStatusCode: { type: Number, default: null },
//     lastCheckedAt: { type: Date, default: null },

//     // Aggregated stats
//     uptimePercentage: { type: Number, default: 100, min: 0, max: 100 },
//     totalChecks: { type: Number, default: 0 },
//     successfulChecks: { type: Number, default: 0 },
//     failedChecks: { type: Number, default: 0 },
//   },
//   { timestamps: true }
// );

// // One endpoint per (user, url) — mirrors the composite unique index requested
// // apiEndpointSchema.index({ userId: 1, url: 1 }, { unique: true });
// // One endpoint per (user + URL + HTTP method).
// // Allows monitoring the same URL with different HTTP methods
// // (GET, POST, PUT, PATCH, DELETE, etc.) while preventing exact duplicates.
// apiEndpointSchema.index(
//   {
//     userId: 1,
//     url: 1,
//     method: 1,
//   },
//   {
//     unique: true,
//   }
// );

// apiEndpointSchema.index({ userId: 1 });
// apiEndpointSchema.index({ currentStatus: 1 });
// apiEndpointSchema.index({ monitoringEnabled: 1 });

// const ApiEndpoint = mongoose.models.ApiEndpoint || mongoose.model('ApiEndpoint', apiEndpointSchema);

// module.exports = ApiEndpoint;
// module.exports.MONITORING_TYPES = MONITORING_TYPES;


// src/models/ApiEndpoint.model.js

const mongoose = require('mongoose');

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const ENDPOINT_STATUS = ['UP', 'DOWN', 'DEGRADED', 'UNKNOWN'];
const BODY_TYPES = ['NONE', 'JSON', 'TEXT', 'FORM_URLENCODED', 'XML', 'MULTIPART'];

// Production V1 monitoring metadata (Feature 1). This never blocks or
// changes request execution — every method (including POST/PUT/PATCH/DELETE)
// still runs exactly as configured. It only tags the endpoint so the
// frontend can warn/filter, e.g. "this scheduled check writes real data".
const MONITORING_TYPES = ['READ_ONLY', 'TRANSACTION'];

// ============================================================
// V1.5 / V2 — Authentication Types (mirrors src/config/constants.js)
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

// HMAC signature output encoding
const HMAC_FORMATS = ['hex', 'base64'];

// HTTP methods supported for login flow authentication
const LOGIN_HTTP_METHODS = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];

/**
 * A single monitored API endpoint belonging to a user. Aggregated uptime
 * counters (`totalChecks`, `successfulChecks`, ...) are maintained by the
 * monitoring worker on every HealthCheck write, so dashboard reads never
 * need to aggregate the (potentially huge) HealthCheck collection.
 */
const apiEndpointSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    name: { type: String, required: true, trim: true, maxlength: 150 },
    url: { type: String, required: true, trim: true },
    method: { type: String, enum: HTTP_METHODS, default: 'GET' },
    expectedStatus: { type: Number, default: 200, min: 100, max: 599 },

    // Optional additional assertions beyond the status code match above —
    // header/body/JSONPath/size/timing checks. Only evaluated once the
    // status code already matches expectedStatus. See
    // modules/monitoring/responseValidator.service.js for the rule shapes.
    validationRules: { type: mongoose.Schema.Types.Mixed, default: [] },

    description: { type: String, trim: true, maxlength: 1000, default: null },

    // Custom request headers sent with every check, e.g. { "Authorization": "Bearer xyz",
    // "X-Api-Key": "..." }. Stored as a plain object (not a Mongoose Map) so lean() and
    // full-document reads return the same shape without extra conversion.
    headers: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Custom query string params sent with every check, e.g. { "version": "2" }.
    // Values may contain {{placeholder}} templates (timestamp, uuid, etc. — see
    // modules/authentication/helpers/templateResolver.js), resolved fresh per request.
    queryParams: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Request body sent for methods like POST/PUT/PATCH (and DELETE, for APIs that
    // require one). `bodyType` determines how `body` is serialized/interpreted:
    //   NONE             -> no body sent regardless of `body`
    //   JSON             -> sent as application/json (object or JSON string)
    //   TEXT             -> sent as raw text, Content-Type left as provided in `headers`
    //   FORM_URLENCODED  -> object/JSON string sent as application/x-www-form-urlencoded
    //   XML              -> raw XML string sent as-is, Content-Type defaults to application/xml
    //   MULTIPART        -> object/JSON string of text fields sent as multipart/form-data
    //                       (file uploads are not supported)
    bodyType: { type: String, enum: BODY_TYPES, default: 'NONE' },
    body: { type: mongoose.Schema.Types.Mixed, default: null },

    // Production V1 (Feature 1): does this monitored endpoint only read data,
    // or can it change/create/delete real records? Purely informational —
    // PulseOps still executes POST/PUT/PATCH/DELETE exactly as configured
    // either way (see monitoring/healthChecker.service.js). Frontend uses
    // this to warn users before they schedule something that writes data.
    monitoringType: { type: String, enum: MONITORING_TYPES, default: 'READ_ONLY' },

    // Monitoring config
    frequency: { type: Number, default: 300, min: 10 }, // seconds between checks
    timeout: { type: Number, default: 10000, min: 100 }, // ms
    monitoringEnabled: { type: Boolean, default: true },

    // Latest known state (denormalized for fast dashboard reads)
    currentStatus: { type: String, enum: ENDPOINT_STATUS, default: 'UNKNOWN' },
    lastResponseTime: { type: Number, default: null }, // ms
    lastStatusCode: { type: Number, default: null },
    lastCheckedAt: { type: Date, default: null },

    // Aggregated stats
    uptimePercentage: { type: Number, default: 100, min: 0, max: 100 },
    totalChecks: { type: Number, default: 0 },
    successfulChecks: { type: Number, default: 0 },
    failedChecks: { type: Number, default: 0 },

    // ============================================================
    // Scheduler lease (multi-server safety)
    // ============================================================
    // Identifies which server instance currently "owns" this endpoint for
    // the in-progress check. leaseExpiresAt is set a few minutes out so a
    // crashed server never permanently blocks the endpoint from being
    // picked up again — the lease just expires and another server claims it.
    leaseOwner: { type: String, default: null },
    leaseExpiresAt: { type: Date, default: null },

    // ============================================================
    // V1.5 — Authentication Configuration
    // ============================================================
    /**
     * Authentication configuration for this monitored endpoint.
     *
     * When authType is:
     *
     * NONE (default)        — No authentication headers added
     * STATIC_BEARER         — Uses auth.staticToken as Bearer token
     * API_KEY               — Uses auth.apiKeyHeader + auth.apiKeyValue
     * BASIC                 — Uses auth.basicUsername + auth.basicPassword
     * LOGIN_FLOW            — Automatically logs in before each check
     */
    auth: {
      type: {
        type: String,
        enum: AUTH_TYPES,
        default: 'NONE',
      },

      // --- STATIC_BEARER ---
      staticToken: {
        type: String,
        default: null,
        trim: true,
      },

      // --- API_KEY ---
      apiKeyHeader: {
        type: String,
        default: null,
        trim: true,
        maxlength: 100,
      },
      apiKeyValue: {
        type: String,
        default: null,
        trim: true,
        maxlength: 4000,
      },

      // --- BASIC ---
      basicUsername: {
        type: String,
        default: null,
        trim: true,
        maxlength: 255,
      },
      basicPassword: {
        type: String,
        default: null,
        trim: true,
        maxlength: 4000,
      },

      // --- LOGIN_FLOW ---
      loginConfig: {
        // The login endpoint URL (e.g., "https://api.example.com/auth/login")
        loginUrl: {
          type: String,
          default: null,
          trim: true,
        },

        // HTTP method for the login request (default: POST)
        method: {
          type: String,
          enum: LOGIN_HTTP_METHODS,
          default: 'POST',
        },

        // Headers sent to the login endpoint (e.g., { "Content-Type": "application/json" })
        headers: {
          type: mongoose.Schema.Types.Mixed,
          default: { 'Content-Type': 'application/json' },
        },

        // Body sent to the login endpoint (e.g., { "email": "user@example.com", "password": "..." })
        body: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },

        // Dot-notation path to extract the token from the login response
        // Examples: "data.accessToken", "token", "payload.jwt"
        tokenPath: {
          type: String,
          default: 'data.accessToken',
          trim: true,
        },

        // Whether the token should be sent as a Bearer token
        // (if false, the token is sent as-is in the Authorization header without "Bearer " prefix)
        asBearer: {
          type: Boolean,
          default: true,
        },

        // Optional: time in seconds to cache the token (default: 0 = no cache)
        // Future enhancement for V1.6+ (token refresh)
        cacheTtlSeconds: {
          type: Number,
          default: 0,
          min: 0,
        },

        // --- Advanced multi-step login (V2) ---
        // When present (non-empty), the multi-step engine runs instead of
        // the single loginUrl/body flow above. See
        // modules/authentication/helpers/multiStepLogin.js for the step shape.
        steps: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },
        // Which extracted variable (from any step's `extract` rules)
        // becomes the Authorization token. Only used in multi-step mode.
        tokenVariable: {
          type: String,
          default: 'token',
          trim: true,
        },
        // If true, the accumulated session cookie jar is also sent as a
        // Cookie header on the actual monitored request (not just between
        // login steps) — needed for session-cookie-based APIs.
        forwardCookies: {
          type: Boolean,
          default: false,
        },
      },

      // --- API_KEY_QUERY ---
      // Same idea as API_KEY, but sent as a query string param instead of a header
      // (e.g. ?api_key=..., ?apikey=..., ?token=...). Reuses apiKeyValue above.
      apiKeyQueryParam: {
        type: String,
        default: null,
        trim: true,
        maxlength: 100,
      },

      // --- HMAC ---
      hmacSecret: {
        type: String,
        default: null,
        trim: true,
        maxlength: 4000,
      },
      hmacSignatureHeader: {
        type: String,
        default: 'X-Signature',
        trim: true,
        maxlength: 100,
      },
      hmacTimestampHeader: {
        type: String,
        default: 'X-Timestamp',
        trim: true,
        maxlength: 100,
      },
      hmacNonceHeader: {
        type: String,
        default: null,
        trim: true,
        maxlength: 100,
      },
      hmacFormat: {
        type: String,
        enum: HMAC_FORMATS,
        default: 'hex',
      },
      // Order controls the order the fields are concatenated into the
      // string-to-sign, e.g. ['timestamp', 'method', 'path', 'body'].
      hmacSignedFields: {
        type: [String],
        default: ['timestamp', 'method', 'path', 'body'],
      },

      // --- OAUTH2_CLIENT_CREDENTIALS / OAUTH2_REFRESH_TOKEN ---
      // Shared by both OAuth2 grant types — clientId/clientSecret are used
      // for CLIENT_CREDENTIALS (and optionally alongside refreshToken for
      // providers that require client auth on refresh too).
      oauth2Config: {
        tokenUrl: {
          type: String,
          default: null,
          trim: true,
        },
        clientId: {
          type: String,
          default: null,
          trim: true,
          maxlength: 500,
        },
        clientSecret: {
          type: String,
          default: null,
          trim: true,
          maxlength: 4000,
        },
        refreshToken: {
          type: String,
          default: null,
          trim: true,
          maxlength: 4000,
        },
        scope: {
          type: String,
          default: null,
          trim: true,
          maxlength: 500,
        },
        audience: {
          type: String,
          default: null,
          trim: true,
          maxlength: 500,
        },
      },

      // Authentication status (computed, not stored directly — see virtual below)
    },

    // Virtual: indicates whether the endpoint has any authentication configured
    // (used in GET responses to avoid exposing secrets)
  },
  {
    timestamps: true,
    // Enable virtuals for JSON output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================
// V1.5 — Virtual Field: hasAuthentication
// ============================================================

/**
 * Determines whether the endpoint has any authentication configured.
 *
 * Returns true if:
 * - auth.type is not 'NONE'
 * - AND the required fields for that type are present
 *
 * This is computed on read and never stored in the database.
 */
apiEndpointSchema.virtual('hasAuthentication').get(function () {
  const auth = this.auth || {};

  switch (auth.type) {
    case 'STATIC_BEARER':
      return Boolean(auth.staticToken);

    case 'API_KEY':
      return Boolean(auth.apiKeyHeader && auth.apiKeyValue);

    case 'BASIC':
      return Boolean(auth.basicUsername && auth.basicPassword);

    case 'LOGIN_FLOW': {
      const loginConfig = auth.loginConfig;
      if (!loginConfig) return false;
      if (Array.isArray(loginConfig.steps) && loginConfig.steps.length > 0) {
        return loginConfig.steps.every((step) => Boolean(step.url));
      }
      return Boolean(loginConfig.loginUrl && loginConfig.body);
    }

    case 'API_KEY_QUERY':
      return Boolean(auth.apiKeyQueryParam && auth.apiKeyValue);

    case 'HMAC':
      return Boolean(auth.hmacSecret);

    case 'OAUTH2_CLIENT_CREDENTIALS':
      return Boolean(auth.oauth2Config && auth.oauth2Config.tokenUrl && auth.oauth2Config.clientId && auth.oauth2Config.clientSecret);

    case 'OAUTH2_REFRESH_TOKEN':
      return Boolean(auth.oauth2Config && auth.oauth2Config.tokenUrl && auth.oauth2Config.refreshToken);

    case 'NONE':
    default:
      return false;
  }
});

// ============================================================
// V1.5 — Indexes
// ============================================================

// One endpoint per (user, url) — mirrors the composite unique index requested
apiEndpointSchema.index({ userId: 1, url: 1 }, { unique: true });
apiEndpointSchema.index({ userId: 1 });
apiEndpointSchema.index({ currentStatus: 1 });
apiEndpointSchema.index({ monitoringEnabled: 1 });

// Index for filtering by authentication type (e.g., "show me all endpoints with LOGIN_FLOW auth")
apiEndpointSchema.index({ 'auth.type': 1 });

// Supports the scheduler's claim query (findOneAndUpdate on monitoringEnabled
// endpoints with an expired/absent lease).
apiEndpointSchema.index({ monitoringEnabled: 1, leaseExpiresAt: 1 });

// ============================================================
// V1.5 — Middleware: Clean authentication fields before validation
// ============================================================

// Every field any auth type stores. Used by the pre-save hook below to
// clear out whatever the current auth.type doesn't use, so switching auth
// types never leaves a stale secret (old password, old client secret,
// etc.) sitting in the document.
const ALL_AUTH_FIELDS = [
  'staticToken',
  'apiKeyHeader',
  'apiKeyValue',
  'basicUsername',
  'basicPassword',
  'loginConfig',
  'apiKeyQueryParam',
  'hmacSecret',
  'hmacSignatureHeader',
  'hmacTimestampHeader',
  'hmacNonceHeader',
  'hmacFormat',
  'hmacSignedFields',
  'oauth2Config',
];

// Which of the fields above each auth type actually uses — everything
// else gets cleared. API_KEY and API_KEY_QUERY both use apiKeyValue since
// they're the same underlying idea (a key), just delivered differently.
const AUTH_FIELDS_TO_KEEP = {
  NONE: [],
  STATIC_BEARER: ['staticToken'],
  API_KEY: ['apiKeyHeader', 'apiKeyValue'],
  BASIC: ['basicUsername', 'basicPassword'],
  LOGIN_FLOW: ['loginConfig'],
  API_KEY_QUERY: ['apiKeyQueryParam', 'apiKeyValue'],
  HMAC: ['hmacSecret', 'hmacSignatureHeader', 'hmacTimestampHeader', 'hmacNonceHeader', 'hmacFormat', 'hmacSignedFields'],
  OAUTH2_CLIENT_CREDENTIALS: ['oauth2Config'],
  OAUTH2_REFRESH_TOKEN: ['oauth2Config'],
};

/**
 * Pre-save middleware that ensures authentication fields are consistent.
 *
 * - Clears every auth field the current auth.type doesn't use
 * - If auth.type is 'LOGIN_FLOW', ensure loginConfig has defaults
 */
apiEndpointSchema.pre('save', function (next) {
  // If no auth object exists, create one with default type
  if (!this.auth) {
    this.auth = { type: 'NONE' };
    return next();
  }

  const type = this.auth.type || 'NONE';
  const fieldsToKeep = new Set(AUTH_FIELDS_TO_KEEP[type] || []);

  for (const field of ALL_AUTH_FIELDS) {
    if (!fieldsToKeep.has(field)) {
      this.auth[field] = undefined;
    }
  }

  // Ensure loginConfig has defaults
  if (type === 'LOGIN_FLOW' && this.auth.loginConfig) {
    if (!this.auth.loginConfig.method) {
      this.auth.loginConfig.method = 'POST';
    }
    if (!this.auth.loginConfig.headers) {
      this.auth.loginConfig.headers = { 'Content-Type': 'application/json' };
    }
    if (!this.auth.loginConfig.tokenPath) {
      this.auth.loginConfig.tokenPath = 'data.accessToken';
    }
    if (this.auth.loginConfig.asBearer === undefined) {
      this.auth.loginConfig.asBearer = true;
    }
  }

  next();
});

const ApiEndpoint = mongoose.models.ApiEndpoint || mongoose.model('ApiEndpoint', apiEndpointSchema);

module.exports = ApiEndpoint;
module.exports.MONITORING_TYPES = MONITORING_TYPES;
module.exports.AUTH_TYPES = AUTH_TYPES;
module.exports.LOGIN_HTTP_METHODS = LOGIN_HTTP_METHODS;