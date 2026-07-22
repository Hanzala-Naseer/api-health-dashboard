


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

  findRecentHealthChecks(userId, { page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    return HealthCheck.find({
      userId,
    })
      .sort({
        checkedAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .select(
        'status statusCode responseTime checkedAt endpointId errorType errorMessage'
      )
      .populate({
        path: 'endpointId',
        select: 'name url method',
      })
      .lean();
  },


    countHealthChecks(userId) {

    return HealthCheck.countDocuments({
      userId,
    });

  },


  findEndpointHistory(endpointId, userId, { skip, limit }) {

  return HealthCheck.find({
    endpointId,
    userId,
  })
    .sort({
      checkedAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .select(
      'status statusCode responseTime checkedAt errorType errorMessage'
    )
    .lean();

},


countEndpointHistory(endpointId, userId) {

  return HealthCheck.countDocuments({
    endpointId,
    userId,
  });

},
};

module.exports = monitoringRepository;