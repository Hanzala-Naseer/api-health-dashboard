


// const HealthCheck = require('../../models/HealthCheck.model');
// const ApiEndpoint = require('../../models/ApiEndpoint.model');

// /**
//  * WHY a repository layer:
//  * All database access for the monitoring module lives here.
//  * The service layer decides WHAT should happen.
//  * The repository decides HOW MongoDB is queried.
//  */

// const monitoringRepository = {
//   /**
//    * Creates a HealthCheck document.
//    */
//   createHealthCheck(data) {
//     return HealthCheck.create(data);
//   },

//   /**
//    * Finds an endpoint by id.
//    * Used internally while updating monitoring statistics.
//    */
//   findEndpointById(endpointId) {
//     return ApiEndpoint.findById(endpointId);
//   },

//   /**
//    * Persists updated monitoring statistics.
//    */
//   saveEndpoint(endpoint) {
//     return endpoint.save();
//   },
// };

// module.exports = monitoringRepository;


const HealthCheck = require('../../models/HealthCheck.model');
const ApiEndpoint = require('../../models/ApiEndpoint.model');

/**
 * WHY a repository layer:
 * Contains only MongoDB queries.
 * No business rules should live here.
 */

const monitoringRepository = {
  /**
   * Creates a HealthCheck document.
   */
  createHealthCheck(data) {
    return HealthCheck.create(data);
  },

  /**
   * Atomically updates endpoint statistics.
   */
  updateEndpointStatistics(endpointId, update) {
    return ApiEndpoint.findByIdAndUpdate(
      endpointId,
      update,
      {
        new: true,
        runValidators: true,
      }
    );
  },
};

module.exports = monitoringRepository;