const endpointRepository = require('../endpoint/endpoint.repository');
const alertRepository = require('../alert/alert.repository');
const monitoringRepository=require('../monitoring/monitoring.repository');
const notificationRepository = require('../notification/notification.repository');

const ApiError = require('../../utils/ApiError');


const dashboardService = {
  async getDashboardSummary(userId) {
    const [
      totalEndpoints,
      healthyEndpoints,
      downEndpoints,
      activeAlerts,
      uptimeResult,
    ] = await Promise.all([
      endpointRepository.countAllEndpoints(userId),
      endpointRepository.countEndpointsByStatus(userId, 'UP'),
      endpointRepository.countEndpointsByStatus(userId, 'DOWN'),
      alertRepository.countActiveAlerts(userId),
      endpointRepository.getAverageUptime(userId),
    ]);

    const averageUptime = uptimeResult.length
      ? Number(uptimeResult[0].averageUptime.toFixed(2))
      : 100;

    return {
      totalEndpoints,
      healthyEndpoints,
      downEndpoints,
      activeAlerts,
      averageUptime,
    };
  },

  async getRecentHealthChecks(userId, options) {

  const {
    page,
    limit,
  } = options;


  const [
    healthChecks,
    total,
  ] = await Promise.all([

    monitoringRepository.findRecentHealthChecks(
      userId,
      {
        page,
        limit,
      }
    ),

    monitoringRepository.countHealthChecks(
      userId
    ),

  ]);


  return {
    healthChecks,
    meta:{
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

},

async getEndpointHistory(
  endpointId,
  userId,
  options
) {


  const endpoint =
    await endpointRepository.findByIdAndUser(
      endpointId,
      userId
    );


  if (!endpoint) {

    throw ApiError.notFound(
      'Endpoint not found.'
    );

  }


  const {
    page,
    limit,
  } = options;


  const skip =
    (page - 1) * limit;



  const [
    history,
    total
  ] = await Promise.all([


    monitoringRepository.findEndpointHistory(
      endpointId,
      userId,
      {
        skip,
        limit,
      }
    ),


    monitoringRepository.countEndpointHistory(
      endpointId,
      userId
    )

  ]);



  return {

    endpoint:{
      id:endpoint._id,
      name:endpoint.name,
      url:endpoint.url,
      method:endpoint.method,
    },


    history,


    meta:{
      page,
      limit,
      total,
      totalPages:
        Math.ceil(total / limit)
    }

  };


},


    async getActiveAlerts(
  userId,
  options
) {


  const {
    page,
    limit,
  } = options;


  const skip =
    (page - 1) * limit;


  const alerts =
    await alertRepository.findActiveAlertsByUser(
      userId,
      {
        skip,
        limit,
      }
    );


  const total =
    await alertRepository.countActiveAlertsByUser(
      userId
    );


  return {

    alerts,

    meta:{
      page,
      limit,
      total,
      totalPages:
        Math.ceil(total / limit)
    }

  };


},

async getAlertHistory(userId, { page, limit }) {

  const skip = (page - 1) * limit;


  const [
    alerts,
    total
  ] = await Promise.all([

    alertRepository.findAlertHistoryByUser(
      userId,
      {
        skip,
        limit
      }
    ),


    alertRepository.countAlertHistoryByUser(
      userId
    )

  ]);


  return {
    alerts,
    meta:{
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

},

async getNotificationHistory(userId, { page, limit }) {

  const skip = (page - 1) * limit;


  const [
    notifications,
    total
  ] = await Promise.all([

    notificationRepository.findNotificationHistoryByUser(
      userId,
      {
        skip,
        limit
      }
    ),


    notificationRepository.countNotificationHistoryByUser(
      userId
    )

  ]);


  return {
    notifications,
    meta:{
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

},
};

module.exports = dashboardService;