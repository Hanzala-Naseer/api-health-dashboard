

// // src/modules/endpoint/endpoint.service.js

// const ApiError = require('../../utils/ApiError.js');
// const endpointRepository = require('./endpoint.repository.js');
// const { getMethodCategory } = require('../../utils/httpMethod.util.js');

// /**
//  * ---------------------------------------------------------------------
//  * CREATE ENDPOINT
//  * ---------------------------------------------------------------------
//  * Flow:
//  * 1. Normalize the URL.
//  * 2. Ensure the user isn't already monitoring it.
//  * 3. Create the endpoint.
//  * 4. Return a clean response object.
//  *
//  * NOTE:
//  * Monitoring statistics are NOT initialized here.
//  * The schema defaults handle those values.
//  */
// async function createEndpoint(userId, payload) {
//   const normalizedUrl = normalizeUrl(payload.url);

//   const existingEndpoint = await endpointRepository.findByUserAndUrl(
//     userId,
//     normalizedUrl
//   );

//   if (existingEndpoint) {
//     throw ApiError.conflict(
//       'This API endpoint is already being monitored.',
//       'ENDPOINT_ALREADY_EXISTS'
//     );
//   }

//   const endpoint = await endpointRepository.createEndpoint({
//     userId,
//     ...payload,
//     url: normalizedUrl,
//   });

//   return toEndpointResponse(endpoint);
// }

// /**
//  * ---------------------------------------------------------------------
//  * URL NORMALIZATION
//  * ---------------------------------------------------------------------
//  * WHY:
//  * Different URL representations should not create duplicate endpoints.
//  *
//  * Example:
//  *
//  * https://api.github.com/
//  * https://api.github.com
//  *
//  * become
//  *
//  * https://api.github.com
//  */
// function normalizeUrl(url) {
//   return url.trim().replace(/\/+$/, '');
// }

// /**
//  * ---------------------------------------------------------------------
//  * RESPONSE MAPPING
//  * ---------------------------------------------------------------------
//  * Never expose the raw Mongoose document.
//  * 
//  * V1.5: Includes hasAuthentication (virtual) and authType but NEVER
//  * exposes authentication secrets (staticToken, apiKeyValue, 
//  * basicPassword, loginConfig.body, etc.).
//  */


// // function toEndpointResponse(endpoint) {
// //   // Safely get authentication type without exposing secrets
// //   const authType = endpoint.auth?.type || 'NONE';

// //   return {
// //     id: endpoint._id || endpoint.id,
// //     name: endpoint.name,
// //     url: endpoint.url,
// //     method: endpoint.method,
// //     expectedStatus: endpoint.expectedStatus,
// //     description: endpoint.description,
// //     headers: endpoint.headers instanceof Map ? Object.fromEntries(endpoint.headers) : endpoint.headers || {},
// //     bodyType: endpoint.bodyType,
// //     body: endpoint.body,
// //     monitoringType: endpoint.monitoringType || 'READ_ONLY',
// //     methodCategory: getMethodCategory(endpoint.method),
// //     isStateChanging: getMethodCategory(endpoint.method) === 'STATE_CHANGING',
// //     monitoringEnabled: endpoint.monitoringEnabled,
// //     currentStatus: endpoint.currentStatus,
// //     uptimePercentage: endpoint.uptimePercentage,
// //     totalChecks: endpoint.totalChecks,
// //     successfulChecks: endpoint.successfulChecks,
// //     failedChecks: endpoint.failedChecks,
// //     createdAt: endpoint.createdAt,
// //     updatedAt: endpoint.updatedAt,

// //     // ============================================================
// //     // V1.5 — Authentication Response (safe, no secrets)
// //     // ============================================================
// //     /**
// //      * hasAuthentication: Whether the endpoint has authentication configured.
// //      * This is computed by the virtual field on the model.
// //      */
// //     hasAuthentication: endpoint.hasAuthentication || false,

// //     /**
// //      * authType: The type of authentication configured.
// //      * One of: NONE, STATIC_BEARER, API_KEY, BASIC, LOGIN_FLOW
// //      */
// //     authType,

// //     /**
// //      * loginConfig: Only returned for LOGIN_FLOW, but WITHOUT secrets.
// //      * 
// //      * We return:
// //      * - loginUrl (the endpoint URL)
// //      * - method (the HTTP method)
// //      * - tokenPath (the dot-notation path)
// //      * - asBearer (boolean)
// //      * - cacheTtlSeconds (number)
// //      * 
// //      * We DO NOT return:
// //      * - headers (may contain secrets)
// //      * - body (contains email/password or other secrets)
// //      */
// //     ...(authType === 'LOGIN_FLOW' && endpoint.auth?.loginConfig
// //       ? {
// //           loginConfig: {
// //             loginUrl: endpoint.auth.loginConfig.loginUrl || null,
// //             method: endpoint.auth.loginConfig.method || 'POST',
// //             tokenPath: endpoint.auth.loginConfig.tokenPath || 'data.accessToken',
// //             asBearer: endpoint.auth.loginConfig.asBearer !== false,
// //             cacheTtlSeconds: endpoint.auth.loginConfig.cacheTtlSeconds || 0,
// //           },
// //         }
// //       : {}),
// //   };
// // }

// function toEndpointResponse(endpoint) {
//   // Safely get authentication type without exposing secrets
//   const authType = endpoint.auth?.type || 'NONE';
  
//   // 🔥 FIX: Check if auth exists and type is not NONE
//   const hasAuthentication = !!(endpoint.auth && 
//                            endpoint.auth.type && 
//                            endpoint.auth.type !== 'NONE');

//   // Helper to safely handle Map or Object
//   const normalizeHeaders = (headers) => {
//     if (!headers) return {};
//     if (headers instanceof Map) {
//       return Object.fromEntries(headers);
//     }
//     if (typeof headers === 'object') {
//       return headers;
//     }
//     return {};
//   };

//   return {
//     // ============================================================
//     // Basic Information
//     // ============================================================
//     id: endpoint._id || endpoint.id,
//     name: endpoint.name,
//     url: endpoint.url,
//     method: endpoint.method,
//     expectedStatus: endpoint.expectedStatus,
//     description: endpoint.description || '',
    
//     // ============================================================
//     // Request Configuration
//     // ============================================================
//     headers: normalizeHeaders(endpoint.headers),
//     queryParams: normalizeHeaders(endpoint.queryParams),
//     validationRules: endpoint.validationRules || [],
//     bodyType: endpoint.bodyType || 'NONE',
//     body: endpoint.body || null,
    
//     // ============================================================
//     // Monitoring Configuration
//     // ============================================================
//     monitoringType: endpoint.monitoringType || 'READ_ONLY',
//     methodCategory: getMethodCategory(endpoint.method),
//     isStateChanging: getMethodCategory(endpoint.method) === 'STATE_CHANGING',
//     monitoringEnabled: endpoint.monitoringEnabled ?? true,
    
//     // ============================================================
//     // Health Status
//     // ============================================================
//     currentStatus: endpoint.currentStatus || 'UNKNOWN',
//     uptimePercentage: endpoint.uptimePercentage ?? 0,
//     totalChecks: endpoint.totalChecks ?? 0,
//     successfulChecks: endpoint.successfulChecks ?? 0,
//     failedChecks: endpoint.failedChecks ?? 0,
    
//     // ============================================================
//     // Response Metrics (FIXED: Now included!)
//     // ============================================================
//     lastResponseTime: endpoint.lastResponseTime ?? null,
//     lastCheckedAt: endpoint.lastCheckedAt ?? null,
//     frequency: endpoint.frequency ?? 60000,
//     timeout: endpoint.timeout ?? 10000,
    
//     // ============================================================
//     // Authentication (FIXED: Properly set hasAuthentication)
//     // ============================================================
//     hasAuthentication: hasAuthentication,
//     authType: authType,

//     // ============================================================
//     // Login Flow Config (without secrets)
//     // ============================================================
//     ...(authType === 'LOGIN_FLOW' && endpoint.auth?.loginConfig
//       ? {
//           loginConfig: {
//             loginUrl: endpoint.auth.loginConfig.loginUrl || null,
//             method: endpoint.auth.loginConfig.method || 'POST',
//             tokenPath: endpoint.auth.loginConfig.tokenPath || 'data.accessToken',
//             asBearer: endpoint.auth.loginConfig.asBearer !== false,
//             cacheTtlSeconds: endpoint.auth.loginConfig.cacheTtlSeconds || 0,
//             // Multi-step: step bodies may contain credentials (e.g. a
//             // password), so only url/method/extract rules are exposed —
//             // never the body itself.
//             ...(Array.isArray(endpoint.auth.loginConfig.steps) && endpoint.auth.loginConfig.steps.length > 0
//               ? {
//                   steps: endpoint.auth.loginConfig.steps.map((step) => ({
//                     name: step.name || null,
//                     url: step.url,
//                     method: step.method || 'GET',
//                     extract: step.extract || [],
//                     hasBody: step.body != null,
//                   })),
//                   tokenVariable: endpoint.auth.loginConfig.tokenVariable || 'token',
//                   forwardCookies: Boolean(endpoint.auth.loginConfig.forwardCookies),
//                 }
//               : {}),
//           },
//         }
//       : {}),

//     // ============================================================
//     // API_KEY_QUERY Config (without secrets — apiKeyValue omitted)
//     // ============================================================
//     ...(authType === 'API_KEY_QUERY' && endpoint.auth
//       ? {
//           apiKeyQueryParam: endpoint.auth.apiKeyQueryParam || null,
//         }
//       : {}),

//     // ============================================================
//     // HMAC Config (without secrets — hmacSecret omitted)
//     // ============================================================
//     ...(authType === 'HMAC' && endpoint.auth
//       ? {
//           hmacConfig: {
//             signatureHeader: endpoint.auth.hmacSignatureHeader || 'X-Signature',
//             timestampHeader: endpoint.auth.hmacTimestampHeader || 'X-Timestamp',
//             nonceHeader: endpoint.auth.hmacNonceHeader || null,
//             format: endpoint.auth.hmacFormat || 'hex',
//             signedFields: endpoint.auth.hmacSignedFields || ['timestamp', 'method', 'path', 'body'],
//           },
//         }
//       : {}),

//     // ============================================================
//     // OAuth2 Config (without secrets — clientSecret/refreshToken omitted)
//     // ============================================================
//     ...((authType === 'OAUTH2_CLIENT_CREDENTIALS' || authType === 'OAUTH2_REFRESH_TOKEN') && endpoint.auth?.oauth2Config
//       ? {
//           oauth2Config: {
//             tokenUrl: endpoint.auth.oauth2Config.tokenUrl || null,
//             clientId: endpoint.auth.oauth2Config.clientId || null,
//             scope: endpoint.auth.oauth2Config.scope || null,
//             audience: endpoint.auth.oauth2Config.audience || null,
//             hasRefreshToken: authType === 'OAUTH2_REFRESH_TOKEN'
//               ? Boolean(endpoint.auth.oauth2Config.refreshToken)
//               : undefined,
//           },
//         }
//       : {}),

//     // ============================================================
//     // Timestamps
//     // ============================================================
//     createdAt: endpoint.createdAt,
//     updatedAt: endpoint.updatedAt,
//   };
// }
// async function getEndpoints(userId, query) {
//   const {
//     page,
//     limit,
//     search,
//     status,
//     monitoringEnabled,
//     method,
//     sortBy,
//     sortOrder,
//     authType, // V1.5
//   } = query;

//   const filter = {
//     userId,
//   };

//   if (status) {
//     filter.currentStatus = status;
//   }

//   if (method) {
//     filter.method = method;
//   }

//   if (monitoringEnabled !== undefined) {
//     filter.monitoringEnabled = monitoringEnabled;
//   }

//   // V1.5 — Filter by authentication type
//   if (authType) {
//     filter['auth.type'] = authType;
//   }

//   if (search) {
//     filter.$or = [
//       {
//         name: {
//           $regex: search,
//           $options: 'i',
//         },
//       },
//       {
//         url: {
//           $regex: search,
//           $options: 'i',
//         },
//       },
//     ];
//   }

//   const sort = {
//     [sortBy]: sortOrder === 'asc' ? 1 : -1,
//   };

//   const skip = (page - 1) * limit;

//   const [endpoints, total] = await Promise.all([
//     endpointRepository.findEndpoints(filter, {
//       skip,
//       limit,
//       sort,
//     }),
//     endpointRepository.countEndpoints(filter),
//   ]);

//   return {
//     endpoints: endpoints.map(toEndpointResponse),
//     pagination: {
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit),
//     },
//   };
// }

// async function getEndpoint(userId, endpointId) {
//   const endpoint = await endpointRepository.findByIdAndUser(endpointId, userId);

//   if (!endpoint) {
//     throw ApiError.notFound(
//       'Endpoint not found.',
//       'ENDPOINT_NOT_FOUND'
//     );
//   }

//   return toEndpointResponse(endpoint);
// }

// async function updateEndpoint(userId, endpointId, payload) {
//   const endpoint = await endpointRepository.findByIdAndUser(
//     endpointId,
//     userId
//   );

//   if (!endpoint) {
//     throw ApiError.notFound(
//       'Endpoint not found.',
//       'ENDPOINT_NOT_FOUND'
//     );
//   }

//   // Normalize URL if it is being updated
//   if (payload.url) {
//     payload.url = normalizeUrl(payload.url);

//     const duplicate = await endpointRepository.findByUserAndUrl(
//       userId,
//       payload.url
//     );

//     if (duplicate && duplicate._id.toString() !== endpointId) {
//       throw ApiError.conflict(
//         'You are already monitoring this URL.',
//         'ENDPOINT_ALREADY_EXISTS'
//       );
//     }
//   }

//   // V1.5 — If auth.type is being updated to 'NONE', clean up auth fields
//   // The pre-save middleware will handle this, but we also handle it here
//   // for cases where the update is partial.
//   if (payload.auth && payload.auth.type === 'NONE') {
//     // Set all auth fields to undefined via the update object
//     payload.auth.staticToken = undefined;
//     payload.auth.apiKeyHeader = undefined;
//     payload.auth.apiKeyValue = undefined;
//     payload.auth.basicUsername = undefined;
//     payload.auth.basicPassword = undefined;
//     payload.auth.loginConfig = undefined;
//     payload.auth.apiKeyQueryParam = undefined;
//     payload.auth.hmacSecret = undefined;
//     payload.auth.hmacSignatureHeader = undefined;
//     payload.auth.hmacTimestampHeader = undefined;
//     payload.auth.hmacNonceHeader = undefined;
//     payload.auth.hmacFormat = undefined;
//     payload.auth.hmacSignedFields = undefined;
//     payload.auth.oauth2Config = undefined;
//   }

//   const updatedEndpoint = await endpointRepository.updateEndpoint(
//     endpointId,
//     payload
//   );

//   return toEndpointResponse(updatedEndpoint);
// }

// async function deleteEndpoint(userId, endpointId) {
//   const endpoint = await endpointRepository.findByIdAndUser(
//     endpointId,
//     userId
//   );

//   if (!endpoint) {
//     throw ApiError.notFound(
//       'Endpoint not found.',
//       'ENDPOINT_NOT_FOUND'
//     );
//   }

//   await endpointRepository.deleteEndpoint(endpointId);
// }

// module.exports = {
//   createEndpoint,
//   getEndpoints,
//   getEndpoint,
//   updateEndpoint,
//   deleteEndpoint
// };


// src/modules/endpoint/endpoint.service.js

const ApiError = require('../../utils/ApiError.js');
const endpointRepository = require('./endpoint.repository.js');
const { getMethodCategory } = require('../../utils/httpMethod.util.js');

// Import authentication service for cache clearing
const authenticationService = require('../authentication');

/**
 * ---------------------------------------------------------------------
 * CREATE ENDPOINT
 * ---------------------------------------------------------------------
 * Flow:
 * 1. Normalize the URL.
 * 2. Ensure the user isn't already monitoring it.
 * 3. Create the endpoint.
 * 4. Return a clean response object.
 *
 * NOTE:
 * Monitoring statistics are NOT initialized here.
 * The schema defaults handle those values.
 */
async function createEndpoint(userId, payload) {
  const normalizedUrl = normalizeUrl(payload.url);

  const existingEndpoint = await endpointRepository.findByUserAndUrl(
    userId,
    normalizedUrl
  );

  if (existingEndpoint) {
    throw ApiError.conflict(
      'This API endpoint is already being monitored.',
      'ENDPOINT_ALREADY_EXISTS'
    );
  }

  const endpoint = await endpointRepository.createEndpoint({
    userId,
    ...payload,
    url: normalizedUrl,
  });

  return toEndpointResponse(endpoint);
}

/**
 * ---------------------------------------------------------------------
 * URL NORMALIZATION
 * ---------------------------------------------------------------------
 * WHY:
 * Different URL representations should not create duplicate endpoints.
 *
 * Example:
 *
 * https://api.github.com/
 * https://api.github.com
 *
 * become
 *
 * https://api.github.com
 */
function normalizeUrl(url) {
  return url.trim().replace(/\/+$/, '');
}

/**
 * ---------------------------------------------------------------------
 * RESPONSE MAPPING
 * ---------------------------------------------------------------------
 * Never expose the raw Mongoose document.
 * 
 * V1.5: Includes hasAuthentication (virtual) and authType but NEVER
 * exposes authentication secrets (staticToken, apiKeyValue, 
 * basicPassword, loginConfig.body, etc.).
 */
function toEndpointResponse(endpoint) {
  // Safely get authentication type without exposing secrets
  const authType = endpoint.auth?.type || 'NONE';
  
  // FIX: Check if auth exists and type is not NONE
  const hasAuthentication = !!(endpoint.auth && 
                           endpoint.auth.type && 
                           endpoint.auth.type !== 'NONE');

  // Helper to safely handle Map or Object
  const normalizeHeaders = (headers) => {
    if (!headers) return {};
    if (headers instanceof Map) {
      return Object.fromEntries(headers);
    }
    if (typeof headers === 'object') {
      return headers;
    }
    return {};
  };

  return {
    // ============================================================
    // Basic Information
    // ============================================================
    id: endpoint._id || endpoint.id,
    name: endpoint.name,
    url: endpoint.url,
    method: endpoint.method,
    expectedStatus: endpoint.expectedStatus,
    description: endpoint.description || '',
    
    // ============================================================
    // Request Configuration
    // ============================================================
    headers: normalizeHeaders(endpoint.headers),
    queryParams: normalizeHeaders(endpoint.queryParams),
    validationRules: endpoint.validationRules || [],
    bodyType: endpoint.bodyType || 'NONE',
    body: endpoint.body || null,
    
    // ============================================================
    // Monitoring Configuration
    // ============================================================
    monitoringType: endpoint.monitoringType || 'READ_ONLY',
    methodCategory: getMethodCategory(endpoint.method),
    isStateChanging: getMethodCategory(endpoint.method) === 'STATE_CHANGING',
    monitoringEnabled: endpoint.monitoringEnabled ?? true,
    
    // ============================================================
    // Health Status
    // ============================================================
    currentStatus: endpoint.currentStatus || 'UNKNOWN',
    uptimePercentage: endpoint.uptimePercentage ?? 0,
    totalChecks: endpoint.totalChecks ?? 0,
    successfulChecks: endpoint.successfulChecks ?? 0,
    failedChecks: endpoint.failedChecks ?? 0,
    
    // ============================================================
    // Response Metrics
    // ============================================================
    lastResponseTime: endpoint.lastResponseTime ?? null,
    lastCheckedAt: endpoint.lastCheckedAt ?? null,
    frequency: endpoint.frequency ?? 60000,
    timeout: endpoint.timeout ?? 10000,
    
    // ============================================================
    // Authentication
    // ============================================================
    hasAuthentication: hasAuthentication,
    authType: authType,

    // ============================================================
    // Login Flow Config (without secrets)
    // ============================================================
    ...(authType === 'LOGIN_FLOW' && endpoint.auth?.loginConfig
      ? {
          loginConfig: {
            loginUrl: endpoint.auth.loginConfig.loginUrl || null,
            method: endpoint.auth.loginConfig.method || 'POST',
            tokenPath: endpoint.auth.loginConfig.tokenPath || 'data.accessToken',
            asBearer: endpoint.auth.loginConfig.asBearer !== false,
            cacheTtlSeconds: endpoint.auth.loginConfig.cacheTtlSeconds || 0,
            // Multi-step: step bodies may contain credentials (e.g. a
            // password), so only url/method/extract rules are exposed —
            // never the body itself.
            ...(Array.isArray(endpoint.auth.loginConfig.steps) && endpoint.auth.loginConfig.steps.length > 0
              ? {
                  steps: endpoint.auth.loginConfig.steps.map((step) => ({
                    name: step.name || null,
                    url: step.url,
                    method: step.method || 'GET',
                    extract: step.extract || [],
                    hasBody: step.body != null,
                  })),
                  tokenVariable: endpoint.auth.loginConfig.tokenVariable || 'token',
                  forwardCookies: Boolean(endpoint.auth.loginConfig.forwardCookies),
                }
              : {}),
          },
        }
      : {}),

    // ============================================================
    // API_KEY_QUERY Config (without secrets — apiKeyValue omitted)
    // ============================================================
    ...(authType === 'API_KEY_QUERY' && endpoint.auth
      ? {
          apiKeyQueryParam: endpoint.auth.apiKeyQueryParam || null,
        }
      : {}),

    // ============================================================
    // HMAC Config (without secrets — hmacSecret omitted)
    // ============================================================
    ...(authType === 'HMAC' && endpoint.auth
      ? {
          hmacConfig: {
            signatureHeader: endpoint.auth.hmacSignatureHeader || 'X-Signature',
            timestampHeader: endpoint.auth.hmacTimestampHeader || 'X-Timestamp',
            nonceHeader: endpoint.auth.hmacNonceHeader || null,
            format: endpoint.auth.hmacFormat || 'hex',
            signedFields: endpoint.auth.hmacSignedFields || ['timestamp', 'method', 'path', 'body'],
          },
        }
      : {}),

    // ============================================================
    // OAuth2 Config (without secrets — clientSecret/refreshToken omitted)
    // ============================================================
    ...((authType === 'OAUTH2_CLIENT_CREDENTIALS' || authType === 'OAUTH2_REFRESH_TOKEN') && endpoint.auth?.oauth2Config
      ? {
          oauth2Config: {
            tokenUrl: endpoint.auth.oauth2Config.tokenUrl || null,
            clientId: endpoint.auth.oauth2Config.clientId || null,
            scope: endpoint.auth.oauth2Config.scope || null,
            audience: endpoint.auth.oauth2Config.audience || null,
            hasRefreshToken: authType === 'OAUTH2_REFRESH_TOKEN'
              ? Boolean(endpoint.auth.oauth2Config.refreshToken)
              : undefined,
          },
        }
      : {}),

    // ============================================================
    // Timestamps
    // ============================================================
    createdAt: endpoint.createdAt,
    updatedAt: endpoint.updatedAt,
  };
}

async function getEndpoints(userId, query) {
  const {
    page,
    limit,
    search,
    status,
    monitoringEnabled,
    method,
    sortBy,
    sortOrder,
    authType, // V1.5
  } = query;

  const filter = {
    userId,
  };

  if (status) {
    filter.currentStatus = status;
  }

  if (method) {
    filter.method = method;
  }

  if (monitoringEnabled !== undefined) {
    filter.monitoringEnabled = monitoringEnabled;
  }

  // V1.5 — Filter by authentication type
  if (authType) {
    filter['auth.type'] = authType;
  }

  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: 'i',
        },
      },
      {
        url: {
          $regex: search,
          $options: 'i',
        },
      },
    ];
  }

  const sort = {
    [sortBy]: sortOrder === 'asc' ? 1 : -1,
  };

  const skip = (page - 1) * limit;

  const [endpoints, total] = await Promise.all([
    endpointRepository.findEndpoints(filter, {
      skip,
      limit,
      sort,
    }),
    endpointRepository.countEndpoints(filter),
  ]);

  return {
    endpoints: endpoints.map(toEndpointResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getEndpoint(userId, endpointId) {
  const endpoint = await endpointRepository.findByIdAndUser(endpointId, userId);

  if (!endpoint) {
    throw ApiError.notFound(
      'Endpoint not found.',
      'ENDPOINT_NOT_FOUND'
    );
  }

  return toEndpointResponse(endpoint);
}

async function updateEndpoint(userId, endpointId, payload) {
  const endpoint = await endpointRepository.findByIdAndUser(
    endpointId,
    userId
  );

  if (!endpoint) {
    throw ApiError.notFound(
      'Endpoint not found.',
      'ENDPOINT_NOT_FOUND'
    );
  }

  // ✅ Check if authentication configuration is being updated
  // We need to check if auth is changing, not just if it exists
  const authChanged = payload.auth && 
    JSON.stringify(payload.auth) !== JSON.stringify(endpoint.auth);

  // Normalize URL if it is being updated
  if (payload.url) {
    payload.url = normalizeUrl(payload.url);

    const duplicate = await endpointRepository.findByUserAndUrl(
      userId,
      payload.url
    );

    if (duplicate && duplicate._id.toString() !== endpointId) {
      throw ApiError.conflict(
        'You are already monitoring this URL.',
        'ENDPOINT_ALREADY_EXISTS'
      );
    }
  }

  // V1.5 — If auth.type is being updated to 'NONE', clean up auth fields
  // The pre-save middleware will handle this, but we also handle it here
  // for cases where the update is partial.
  if (payload.auth && payload.auth.type === 'NONE') {
    // Set all auth fields to undefined via the update object
    payload.auth.staticToken = undefined;
    payload.auth.apiKeyHeader = undefined;
    payload.auth.apiKeyValue = undefined;
    payload.auth.basicUsername = undefined;
    payload.auth.basicPassword = undefined;
    payload.auth.loginConfig = undefined;
    payload.auth.apiKeyQueryParam = undefined;
    payload.auth.hmacSecret = undefined;
    payload.auth.hmacSignatureHeader = undefined;
    payload.auth.hmacTimestampHeader = undefined;
    payload.auth.hmacNonceHeader = undefined;
    payload.auth.hmacFormat = undefined;
    payload.auth.hmacSignedFields = undefined;
    payload.auth.oauth2Config = undefined;
  }

  const updatedEndpoint = await endpointRepository.updateEndpoint(
    endpointId,
    payload
  );

  // ✅ If auth changed, clear the token cache
  if (authChanged) {
    // Clear cache for this endpoint
    if (authenticationService.clearCacheByEndpointId) {
      authenticationService.clearCacheByEndpointId(endpointId);
    }
    
    // Also clear cache for the login URL if it's LOGIN_FLOW
    if (payload.auth?.type === 'LOGIN_FLOW' && payload.auth?.loginConfig?.loginUrl) {
      if (authenticationService.clearCacheByLoginUrl) {
        authenticationService.clearCacheByLoginUrl(payload.auth.loginConfig.loginUrl);
      }
    }
    
    console.log(`🔄 Auth cache cleared for endpoint ${endpointId}`);
  }

  return toEndpointResponse(updatedEndpoint);
}

async function deleteEndpoint(userId, endpointId) {
  const endpoint = await endpointRepository.findByIdAndUser(
    endpointId,
    userId
  );

  if (!endpoint) {
    throw ApiError.notFound(
      'Endpoint not found.',
      'ENDPOINT_NOT_FOUND'
    );
  }

  // ✅ Clear cache when endpoint is deleted
  if (authenticationService.clearCacheByEndpointId) {
    authenticationService.clearCacheByEndpointId(endpointId);
  }

  await endpointRepository.deleteEndpoint(endpointId);
}

module.exports = {
  createEndpoint,
  getEndpoints,
  getEndpoint,
  updateEndpoint,
  deleteEndpoint
};