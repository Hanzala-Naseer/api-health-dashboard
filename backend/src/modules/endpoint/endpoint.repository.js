

// const ApiEndpoint = require('../../models/ApiEndpoint.model.js');
// const mongoose = require('mongoose');


// const endpointRepository = {

//   findByUserUrlAndMethod(userId, url, method) {
//     return ApiEndpoint.findOne({
//       userId,
//       url,
//       method,
//     });
//   },

//   /**
//    * Creates a monitored endpoint.
//    */
//   createEndpoint(data) {
//     return ApiEndpoint.create(data);
//   },

//   /**
//    * Returns paginated endpoints.
//    */
//   findEndpoints(filter, { sort, skip, limit }) {
//     return ApiEndpoint.find(filter)
//       .sort(sort)
//       .skip(skip)
//       .limit(limit)
//       .lean();
//   },

//   /**
//    * Counts endpoints.
//    */
//   countEndpoints(filter) {
//     return ApiEndpoint.countDocuments(filter);
//   },

//   /**
//    * Finds a single endpoint owned by the user.
//    */
//   findByIdAndUser(endpointId, userId) {
//     return ApiEndpoint.findOne({
//       _id: endpointId,
//       userId,
//     });
//   },

//   /**
//    * Updates an endpoint.
//    */
//   updateEndpoint(endpointId, data) {
//     return ApiEndpoint.findByIdAndUpdate(
//       endpointId,
//       data,
//       {
//         new: true,
//         runValidators: true,
//       }
//     );
//   },

//   /**
//    * Deletes an endpoint.
//    */
//   deleteEndpoint(endpointId) {
//     return ApiEndpoint.findByIdAndDelete(endpointId);
//   },

//   /**
//    * Returns all monitoring-enabled endpoints.
//    */
//   findMonitoringEnabledEndpoints() {
//     return ApiEndpoint.find({
//       monitoringEnabled: true,
//     }).lean();
//   },

//   /**
//    * Counts all endpoints belonging to a user.
//    */
//   countAllEndpoints(userId) {
//     return ApiEndpoint.countDocuments({
//       userId,
//     });
//   },

//   /**
//    * Counts endpoints by status.
//    */
//   countEndpointsByStatus(userId, status) {
//     return ApiEndpoint.countDocuments({
//       userId,
//       currentStatus: status,
//     });
//   },

//   /**
//    * Returns average uptime.
//    */
//   getAverageUptime(userId) {
//     return ApiEndpoint.aggregate([
//       {
//         $match: {
//           userId: new mongoose.Types.ObjectId(userId),
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           averageUptime: {
//             $avg: '$uptimePercentage',
//           },
//         },
//       },
//     ]);
//   },
// };

// module.exports = endpointRepository;



// src/modules/endpoint/endpoint.repository.js

const ApiEndpoint = require('../../models/ApiEndpoint.model.js');
const mongoose = require("mongoose");

/**
 * WHY a repository layer:
 * The service layer should contain business rules ("a user can't monitor
 * the same endpoint twice"), not Mongoose queries. Keeping all database
 * access here makes the service easier to test and keeps ODM-specific code
 * isolated in one place.
 */

const endpointRepository = {
  /**
   * Finds an endpoint by user and URL.
   * Used to prevent duplicate monitoring entries.
   */
  findByUserAndUrl(userId, url) {
    return ApiEndpoint.findOne({
      userId,
      url,
    });
  },

  /**
   * Creates a new monitored endpoint.
   * Monitoring statistics are initialized by schema defaults.
   */
  createEndpoint(data) {
    return ApiEndpoint.create(data);
  },

  /**
   * Returns paginated endpoints.
   * 
   * V1.5: Supports filtering by auth.type via the filter object.
   * Example: filter = { userId, 'auth.type': 'LOGIN_FLOW' }
   */
  findEndpoints(filter, { sort, skip, limit }) {
    return ApiEndpoint.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  },

  /**
   * Counts endpoints.
   */
  countEndpoints(filter) {
    return ApiEndpoint.countDocuments(filter);
  },

  /**
   * Finds a single endpoint owned by the user.
   */
  findByIdAndUser(endpointId, userId) {
    return ApiEndpoint.findOne({
      _id: endpointId,
      userId,
    });
  },

  /**
   * Updates an endpoint.
   */
  updateEndpoint(endpointId, data) {
    return ApiEndpoint.findByIdAndUpdate(
      endpointId,
      data,
      {
        new: true,
        runValidators: true,
      }
    );
  },

  /**
   * Deletes an endpoint.
   */
  deleteEndpoint(endpointId) {
    return ApiEndpoint.findByIdAndDelete(endpointId);
  },

  findMonitoringEnabledEndpoints() {
    return ApiEndpoint.find({
      monitoringEnabled: true,
    }).lean();
  },

  /**
   * Same query as findMonitoringEnabledEndpoints, but as a cursor instead
   * of an array. Used by the scheduler so it can stream endpoints in
   * batches instead of loading the entire collection into memory.
   */
  getMonitoringEnabledEndpointsCursor() {
    return ApiEndpoint.find({
      monitoringEnabled: true,
    }).lean().cursor();
  },

  /**
   * Atomically claims an endpoint for this server instance.
   *
   * Only succeeds if the endpoint has no active lease (or the previous
   * lease has expired), so exactly one server processes a given endpoint
   * per cycle. Returns the updated document if the claim succeeded, or
   * null if another server already owns it.
   */
  claimEndpoint(endpointId, workerId, leaseDurationMs) {
    const now = new Date();

    return ApiEndpoint.findOneAndUpdate(
      {
        _id: endpointId,
        monitoringEnabled: true,
        $or: [
          { leaseExpiresAt: null },
          { leaseExpiresAt: { $lte: now } },
        ],
      },
      {
        $set: {
          leaseOwner: workerId,
          leaseExpiresAt: new Date(now.getTime() + leaseDurationMs),
        },
      },
      {
        new: true,
      }
    );
  },

  /**
   * Releases a lease once processing is done, so the endpoint doesn't sit
   * locked until the lease naturally expires. Only clears it if this
   * worker is still the owner, so it can't accidentally release a lease
   * a different server has since acquired.
   */
  releaseEndpointLease(endpointId, workerId) {
    return ApiEndpoint.updateOne(
      {
        _id: endpointId,
        leaseOwner: workerId,
      },
      {
        $set: {
          leaseOwner: null,
          leaseExpiresAt: null,
        },
      }
    );
  },

  /**
   * Counts all endpoints belonging to a user.
   */
  countAllEndpoints(userId) {
    return ApiEndpoint.countDocuments({
      userId,
    });
  },

  /**
   * Counts endpoints by status for a user.
   */
  countEndpointsByStatus(userId, status) {
    return ApiEndpoint.countDocuments({
      userId,
      currentStatus: status,
    });
  },

  getAverageUptime(userId) {
    return ApiEndpoint.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,
          averageUptime: {
            $avg: '$uptimePercentage',
          },
        },
      },
    ]);
  },

  // ============================================================
  // V1.5 — Additional Queries
  // ============================================================

  /**
   * Finds all endpoints with LOGIN_FLOW authentication that are enabled.
   * Used by the scheduler to know which endpoints need automatic login.
   */
  findLoginFlowEndpoints() {
    return ApiEndpoint.find({
      monitoringEnabled: true,
      'auth.type': 'LOGIN_FLOW',
      'auth.loginConfig.loginUrl': { $ne: null },
    }).lean();
  },

  /**
   * Finds endpoints by authentication type.
   */
  findByAuthType(userId, authType) {
    return ApiEndpoint.find({
      userId,
      'auth.type': authType,
    }).lean();
  },
};

module.exports = endpointRepository;