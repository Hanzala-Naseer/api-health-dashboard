// const ApiError = require('../../utils/ApiError.js');
// const endpointRepository = require('./endpoint.repository.js');

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
//  */
// function toEndpointResponse(endpoint) {
//   return {
    
//     id: endpoint._id || endpoint.id, // Use _id from MongoDB
//     name: endpoint.name,
//     url: endpoint.url,
//     method: endpoint.method,
//     expectedStatus: endpoint.expectedStatus,
//     description: endpoint.description,
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

//   return endpoint;
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

//     if (duplicate && duplicate.id !== endpoint.id) {
//       throw ApiError.conflict(
//         'You are already monitoring this URL.',
//         'ENDPOINT_ALREADY_EXISTS'
//       );
//     }
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


const ApiError = require('../../utils/ApiError.js');
const endpointRepository = require('./endpoint.repository.js');

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
 */
function toEndpointResponse(endpoint) {
  return {
    id: endpoint._id || endpoint.id, // Use _id from MongoDB (lean() returns _id)
    name: endpoint.name,
    url: endpoint.url,
    method: endpoint.method,
    expectedStatus: endpoint.expectedStatus,
    description: endpoint.description,
    monitoringEnabled: endpoint.monitoringEnabled,
    currentStatus: endpoint.currentStatus,
    uptimePercentage: endpoint.uptimePercentage,
    totalChecks: endpoint.totalChecks,
    successfulChecks: endpoint.successfulChecks,
    failedChecks: endpoint.failedChecks,
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

  return toEndpointResponse(endpoint); // Also map the single endpoint
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