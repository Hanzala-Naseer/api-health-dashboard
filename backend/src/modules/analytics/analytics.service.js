const analyticsRepository = require('./analytics.repository');
const ApiError = require('../../utils/ApiError');



const analyticsService = {



  /**
   * Get endpoint analytics
   */
  async getEndpointStatistics(
    endpointId,
    filters = {}
  ){


    const {

      period,

      startDate,

      endDate

    } = filters;



    /*
     * Fetch endpoint information
     */
    const endpoint =
      await analyticsRepository.findEndpoint(endpointId);



    if(!endpoint){


      throw ApiError.notFound(
        'Endpoint not found.'
      );


    }



    /*
     * Calculate date range
     */
    let calculatedStartDate = null;

    let calculatedEndDate = new Date();



    /*
     * Quick period filters
     *
     * 24h
     * 7d
     * 30d
     */
    if(period){


      const periodMap = {


        "24h":24,


        "7d":24 * 7,


        "30d":24 * 30


      };



      const hours =
        periodMap[period];



      if(hours){


        calculatedStartDate =
          new Date(

            Date.now()
            -
            hours * 60 * 60 * 1000

          );


      }



    }


    /*
     * Custom date range
     */
    else if(startDate && endDate){


      calculatedStartDate =
        new Date(startDate);



      calculatedEndDate =
        new Date(endDate);


    }




    /*
     * Fetch aggregated health data
     */
    const result =
      await analyticsRepository.getEndpointStatistics(

        endpointId,

        calculatedStartDate,

        calculatedEndDate

      );



    /*
     * No health checks available
     */
    if(!result.length){


      return {


        endpoint:{


          id:endpoint._id,


          name:endpoint.name,


          url:endpoint.url,


          method:endpoint.method


        },



        uptime:{


          percentage:100,


          totalChecks:0,


          successfulChecks:0,


          failedChecks:0,


          statusBreakdown:{}


        },



        performance:{


          averageResponseTime:0,


          minResponseTime:0,


          maxResponseTime:0


        },



        availability:{


          currentStatus:
            endpoint.currentStatus,


          lastChecked:
            endpoint.lastCheckedAt


        }


      };


    }




    const stats = result[0];



    /*
     * Convert status array into object
     *
     * Example:
     *
     * [
     *  "UP",
     *  "DOWN",
     *  "UP"
     * ]
     *
     * becomes:
     *
     * {
     *  UP:2,
     *  DOWN:1
     * }
     */
    const statusBreakdown =
      (stats.statusBreakdown || [])
      .reduce(

        (acc,status)=>{


          acc[status] =
            (acc[status] || 0) + 1;



          return acc;


        },

        {}

      );




    /*
     * Calculate uptime percentage
     */
    const uptimePercentage =

      (
        stats.successfulChecks /
        stats.totalChecks
      ) * 100;




    return {


      endpoint:{


        id:endpoint._id,


        name:endpoint.name,


        url:endpoint.url,


        method:endpoint.method


      },



      uptime:{



        percentage:

          Number(
            uptimePercentage.toFixed(2)
          ),



        totalChecks:

          stats.totalChecks,



        successfulChecks:

          stats.successfulChecks,



        failedChecks:

          stats.failedChecks,



        statusBreakdown



      },



      performance:{



        averageResponseTime:

          Math.round(
            stats.averageResponseTime || 0
          ),



        minResponseTime:

          stats.minResponseTime || 0,



        maxResponseTime:

          stats.maxResponseTime || 0



      },



      availability:{



        currentStatus:

          endpoint.currentStatus,



        lastChecked:

          endpoint.lastCheckedAt



      }



    };



  },


  /**
 * Get global analytics overview
 */
async getOverview(userId) {



    const overview =
        await analyticsRepository.getOverview(
            userId
        );


    const endpoints =
        overview.endpoints || {};

    const health =
        overview.health || {};

    const alerts =
        overview.alerts || {};



    const totalChecks =
        health.totalChecks || 0;


    const successfulChecks =
        health.successfulChecks || 0;



    const uptime =
        totalChecks === 0
            ? 100
            :
            Number(
                (
                    successfulChecks /
                    totalChecks
                * 100
                ).toFixed(2)
            );



    return {


        endpoints:{

            total:
                endpoints.total || 0,


            active:
                endpoints.active || 0,


            inactive:
                (
                    (endpoints.total || 0)
                    -
                    (endpoints.active || 0)
                )

        },


        health:{

            totalChecks,


            successfulChecks,


            failedChecks:
                totalChecks -
                successfulChecks,


            overallUptime:
                uptime

        },


        alerts:{


            total:
                alerts.total || 0,


            active:
                alerts.active || 0,


            resolved:
                (
                    (alerts.total || 0)
                    -
                    (alerts.active || 0)
                )

        }


    };


},

/**
 * Get uptime trend analytics
 *
 * Calculates daily uptime percentage
 */
async getUptimeTrend(userId, startDate, endDate){


    const trend =
        await analyticsRepository.getUptimeTrend(
            userId,
            startDate,
            endDate
        );



    return trend.map(item => {


        const uptime =
            item.totalChecks === 0

            ?

            100

            :

            (
                item.successfulChecks /
                item.totalChecks
            )
            *
            100;



        return {


            date:
                item._id || item.date,


            totalChecks:
                item.totalChecks,


            successfulChecks:
                item.successfulChecks,


            failedChecks:
                item.failedChecks,


            uptime:
                Number(
                    uptime.toFixed(2)
                )


        };


    });


},

/**
 * Get response time performance trend
 *
 * Returns:
 * - Average response time
 * - Minimum response time
 * - Maximum response time
 *
 * Grouped by date
 */
async getResponseTimeTrend(
    userId,
    startDate,
    endDate
){


    const trend =
        await analyticsRepository.getResponseTimeTrend(

            userId,

            startDate,

            endDate

        );




    return trend.map(item => {


        return {


            date:
                item._id,


            averageResponseTime:
                Math.round(
                    item.averageResponseTime || 0
                ),



            minResponseTime:
                item.minResponseTime || 0,



            maxResponseTime:
                item.maxResponseTime || 0,



            totalChecks:
                item.totalChecks


        };


    });



},

/**
 * Error Breakdown Analytics
 */
async getErrorBreakdown(
    userId,
    startDate,
    endDate
){


    const result =
        await analyticsRepository.getErrorBreakdown(

            userId,

            startDate,

            endDate

        );



    const totalErrors =
        result.reduce(

            (sum, item) =>
                sum + item.count,

            0

        );



    return result.map(item => ({


        type:
            item.errorType || "UNKNOWN",


        count:
            item.count,



        percentage:
            totalErrors === 0

            ?

            0

            :

            Number(

                (
                    (item.count / totalErrors)
                    *
                    100

                )
                .toFixed(2)

            )


    }));



},



};



module.exports = analyticsService;