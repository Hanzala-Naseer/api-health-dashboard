

// const ApiError = require('../../utils/ApiError.js');
// const endpointRepository = require('./endpoint.repository.js');
// const { getMethodCategory } = require('../../utils/httpMethod.util.js');


// async function createEndpoint(userId, payload) {
//   const normalizedUrl = normalizeUrl(payload.url);

//  const existingEndpoint = await endpointRepository.findByUserUrlAndMethod(
//   userId,
//   normalizedUrl,
//   payload.method
// );

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
//  */
// function toEndpointResponse(endpoint) {
//   return {
//     id: endpoint._id || endpoint.id, // Use _id from MongoDB (lean() returns _id)
//     name: endpoint.name,
//     url: endpoint.url,
//     method: endpoint.method,
//     expectedStatus: endpoint.expectedStatus,
//     description: endpoint.description,
//     headers: endpoint.headers instanceof Map ? Object.fromEntries(endpoint.headers) : endpoint.headers || {},
//     bodyType: endpoint.bodyType,
//     body: endpoint.body,
//     // Feature 1: monitoring metadata (informational, never restricts execution).
//     monitoringType: endpoint.monitoringType || 'READ_ONLY',
//     // Feature 5: scheduler-prep metadata so the frontend can warn/filter
//     // without PulseOps changing how the scheduler actually executes checks.
//     methodCategory: getMethodCategory(endpoint.method),
//     isStateChanging: getMethodCategory(endpoint.method) === 'STATE_CHANGING',
//     monitoringEnabled: endpoint.monitoringEnabled,
//     currentStatus: endpoint.currentStatus,
//     uptimePercentage: endpoint.uptimePercentage,
//     totalChecks: endpoint.totalChecks,
//     successfulChecks: endpoint.successfulChecks,
//     failedChecks: endpoint.failedChecks,
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

//   return toEndpointResponse(endpoint); // Also map the single endpoint
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
// // Normalize URL if it is being updated
// if (payload.url) {
//   payload.url = normalizeUrl(payload.url);
// }

// // Check duplicates using the final URL + final Method
// const finalUrl = payload.url || endpoint.url;
// const finalMethod = payload.method || endpoint.method;

// const duplicate = await endpointRepository.findByUserUrlAndMethod(
//   userId,
//   finalUrl,
//   finalMethod
// );

// if (
//   duplicate &&
//   duplicate._id.toString() !== endpointId
// ) {
//   throw ApiError.conflict(
//     'You are already monitoring this endpoint with the same HTTP method.',
//     'ENDPOINT_ALREADY_EXISTS'
//   );
// }

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


// function toEndpointResponse(endpoint) {
//   // Safely get authentication type without exposing secrets
//   const authType = endpoint.auth?.type || 'NONE';

//   return {
//     id: endpoint._id || endpoint.id,
//     name: endpoint.name,
//     url: endpoint.url,
//     method: endpoint.method,
//     expectedStatus: endpoint.expectedStatus,
//     description: endpoint.description,
//     headers: endpoint.headers instanceof Map ? Object.fromEntries(endpoint.headers) : endpoint.headers || {},
//     bodyType: endpoint.bodyType,
//     body: endpoint.body,
//     monitoringType: endpoint.monitoringType || 'READ_ONLY',
//     methodCategory: getMethodCategory(endpoint.method),
//     isStateChanging: getMethodCategory(endpoint.method) === 'STATE_CHANGING',
//     monitoringEnabled: endpoint.monitoringEnabled,
//     currentStatus: endpoint.currentStatus,
//     uptimePercentage: endpoint.uptimePercentage,
//     totalChecks: endpoint.totalChecks,
//     successfulChecks: endpoint.successfulChecks,
//     failedChecks: endpoint.failedChecks,
//     createdAt: endpoint.createdAt,
//     updatedAt: endpoint.updatedAt,

//     // ============================================================
//     // V1.5 — Authentication Response (safe, no secrets)
//     // ============================================================
//     /**
//      * hasAuthentication: Whether the endpoint has authentication configured.
//      * This is computed by the virtual field on the model.
//      */
//     hasAuthentication: endpoint.hasAuthentication || false,

//     /**
//      * authType: The type of authentication configured.
//      * One of: NONE, STATIC_BEARER, API_KEY, BASIC, LOGIN_FLOW
//      */
//     authType,

//     /**
//      * loginConfig: Only returned for LOGIN_FLOW, but WITHOUT secrets.
//      * 
//      * We return:
//      * - loginUrl (the endpoint URL)
//      * - method (the HTTP method)
//      * - tokenPath (the dot-notation path)
//      * - asBearer (boolean)
//      * - cacheTtlSeconds (number)
//      * 
//      * We DO NOT return:
//      * - headers (may contain secrets)
//      * - body (contains email/password or other secrets)
//      */
//     ...(authType === 'LOGIN_FLOW' && endpoint.auth?.loginConfig
//       ? {
//           loginConfig: {
//             loginUrl: endpoint.auth.loginConfig.loginUrl || null,
//             method: endpoint.auth.loginConfig.method || 'POST',
//             tokenPath: endpoint.auth.loginConfig.tokenPath || 'data.accessToken',
//             asBearer: endpoint.auth.loginConfig.asBearer !== false,
//             cacheTtlSeconds: endpoint.auth.loginConfig.cacheTtlSeconds || 0,
//           },
//         }
//       : {}),
//   };
// }

function toEndpointResponse(endpoint) {
  // Safely get authentication type without exposing secrets
  const authType = endpoint.auth?.type || 'NONE';
  
  // 🔥 FIX: Check if auth exists and type is not NONE
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
    // Response Metrics (FIXED: Now included!)
    // ============================================================
    lastResponseTime: endpoint.lastResponseTime ?? null,
    lastCheckedAt: endpoint.lastCheckedAt ?? null,
    frequency: endpoint.frequency ?? 60000,
    timeout: endpoint.timeout ?? 10000,
    
    // ============================================================
    // Authentication (FIXED: Properly set hasAuthentication)
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
  }

  const updatedEndpoint = await endpointRepository.updateEndpoint(
    endpointId,
    payload
  );

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

  await endpointRepository.deleteEndpoint(endpointId);
}

module.exports = {
  createEndpoint,
  getEndpoints,
  getEndpoint,
  updateEndpoint,
  deleteEndpoint
};