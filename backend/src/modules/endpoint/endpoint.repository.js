



const ApiEndpoint = require('../../models/ApiEndpoint.model.js');
const mongoose=require("mongoose");

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
};

module.exports = endpointRepository;