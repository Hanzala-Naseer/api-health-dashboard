const dashboardService = require('./dashboard.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const getDashboardSummary = asyncHandler(async (req, res) => {
  
  const dashboardSummary = await dashboardService.getDashboardSummary(
    req.user.id
  );

return res.status(200).json(
  new ApiResponse(
    200,
    'Dashboard summary fetched successfully.',
    dashboardSummary
  )
);
});

async function getRecentHealthChecks(req, res) {

    const page = Number(req.query.page) || 1;

    const limit = Number(req.query.limit) || 10;


  const result =
 await dashboardService.getRecentHealthChecks(
    req.user.id,
    {
      page,
      limit,
    }
 );


return new ApiResponse(
  200,
  'Recent health checks fetched successfully.',
  result.healthChecks,
  result.meta
).send(res);

  };



 async function getEndpointHistory(req, res) {

  const {
    id: endpointId,
  } = req.params;


  const page =
    Number(req.query.page) || 1;


  const limit =
    Number(req.query.limit) || 50;


  const result =
    await dashboardService.getEndpointHistory(
      endpointId,
      req.user.id,
      {
        page,
        limit,
      }
    );


 return new ApiResponse(
  200,
  'Endpoint history fetched successfully.',
  {
    endpoint: result.endpoint,
    history: result.history,
  },
  result.meta
).send(res);

};


async function getActiveAlerts(req, res) {


  const page =
    Number(req.query.page) || 1;


  const limit =
    Number(req.query.limit) || 10;



  const result =
    await dashboardService.getActiveAlerts(
      req.user.id,
      {
        page,
        limit,
      }
    );



  return new ApiResponse(
    200,
    'Active alerts fetched successfully.',
    {
      alerts: result.alerts,
    },
    result.meta
  ).send(res);


};

async function getAlertHistory(req, res){

  const userId = req.user.id;


  const page = Number(req.query.page) || 1;

  const limit = Number(req.query.limit) || 10;


  const result = await dashboardService.getAlertHistory(
    userId,
    {
      page,
      limit
    }
  );


  return new ApiResponse(
    200,
    'Alert history fetched successfully.',
    {
      alerts: result.alerts
    },
    result.meta
  ).send(res);

};

async function getNotificationHistory(req, res){

  const userId = req.user.id;


  const page = Number(req.query.page) || 1;

  const limit = Number(req.query.limit) || 10;


  const result = await dashboardService.getNotificationHistory(
    userId,
    {
      page,
      limit
    }
  );


  return new ApiResponse(
    200,
    'Notification history fetched successfully.',
    {
      notifications: result.notifications
    },
    result.meta
  ).send(res);

};
module.exports = {
  getDashboardSummary,
  getRecentHealthChecks,
  getEndpointHistory,
  getActiveAlerts,
  getAlertHistory,
  getNotificationHistory
  
};