const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const analyticsService = require('./analytics.service');



const getDateRange = (
  period,
  startDate,
  endDate
)=>{


  let start;
  let end = new Date();



  if(period){


    const now = new Date();



    switch(period){


      case "24h":

        start =
          new Date(
            now.getTime()
            -
            24 *
            60 *
            60 *
            1000
          );

        break;



      case "7d":

        start =
          new Date(
            now.getTime()
            -
            7 *
            24 *
            60 *
            60 *
            1000
          );

        break;



      case "30d":

        start =
          new Date(
            now.getTime()
            -
            30 *
            24 *
            60 *
            60 *
            1000
          );

        break;



      default:

        start =
          new Date(
            now.getTime()
            -
            7 *
            24 *
            60 *
            60 *
            1000
          );

    }


  }
  else if(startDate && endDate){


    start =
      new Date(startDate);


    end =
      new Date(endDate);


  }
  else{


    start =
      new Date(
        Date.now()
        -
        7 *
        24 *
        60 *
        60 *
        1000
      );


  }


  return {
    start,
    end
  };


};





const analyticsController = {



  /**
   * GET endpoint statistics
   */
  getEndpointStatistics:
  asyncHandler(
    async(req,res)=>{


      const {
        endpointId
      } = req.params;



      const {
        period,
        startDate,
        endDate
      } = req.query;



      const statistics =
        await analyticsService.getEndpointStatistics(

          endpointId,

          {
            period,
            startDate,
            endDate
          }

        );



      return new ApiResponse(

        200,

        "Endpoint statistics fetched successfully.",

        statistics

      ).send(res);


    }
  ),





  /**
   * GET analytics overview
   */
  getOverview:
  asyncHandler(
    async(req,res)=>{


      const overview =
        await analyticsService.getOverview(

          req.user.id

        );



      return new ApiResponse(

        200,

        "Analytics overview fetched successfully.",

        overview

      ).send(res);


    }
  ),





  /**
   * GET uptime trend
   */
  getUptimeTrend:
  asyncHandler(
    async(req,res)=>{


      const {
        period,
        startDate,
        endDate
      } = req.query;



      const {
        start,
        end
      } =
      getDateRange(
        period,
        startDate,
        endDate
      );



      const trend =
        await analyticsService.getUptimeTrend(

          req.user.id,

          start,

          end

        );



      return new ApiResponse(

        200,

        "Uptime trend fetched successfully.",

        trend

      ).send(res);


    }
  ),





  /**
   * GET response time trend
   */
  getResponseTimeTrend:
  asyncHandler(
    async(req,res)=>{


      const {
        period,
        startDate,
        endDate
      } = req.query;



      const {
        start,
        end
      } =
      getDateRange(

        period,

        startDate,

        endDate

      );



      const trend =
        await analyticsService.getResponseTimeTrend(

          req.user.id,

          start,

          end

        );



      return new ApiResponse(

        200,

        "Response time trend fetched successfully.",

        trend

      ).send(res);


    }
  ),
  getErrorBreakdown:
  asyncHandler(
    async(req,res)=>{

      const {
        period,
        startDate,
        endDate
      } = req.query;


      const {
        start,
        end
      } =
      getDateRange(
        period,
        startDate,
        endDate
      );


      const breakdown =
        await analyticsService.getErrorBreakdown(

          req.user.id,

          start,

          end

        );


      return new ApiResponse(

        200,

        "Error breakdown fetched successfully.",

        breakdown

      ).send(res);


    }
  ),




};



module.exports = analyticsController;