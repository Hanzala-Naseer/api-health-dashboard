const ApiEndpoint = require('../../models/ApiEndpoint.model.js');

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
findEndpoints(filter, { sort, skip, limit }) {
  return ApiEndpoint.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
},

countEndpoints(filter) {
  return ApiEndpoint.countDocuments(filter);
},

findByIdAndUser(endpointId, userId) {
  return ApiEndpoint.findOne({
    _id: endpointId,
    userId,
  }).lean();
}
};




module.exports = endpointRepository;