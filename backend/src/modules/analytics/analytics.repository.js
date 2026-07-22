const mongoose = require('mongoose');


const HealthCheck = require('../../models/HealthCheck.model');
const ApiEndpoint = require('../../models/ApiEndpoint.model');
const Alert = require('../../models/Alert.model');


const analyticsRepository = {


  /**
   * Get endpoint basic information
   */
  findEndpoint(endpointId){

    return ApiEndpoint.findById(endpointId)
      .select(
        'name url method currentStatus lastCheckedAt'
      );

  },



  /**
   * Uptime + performance analytics
   *
   * Calculates:
   * - total checks
   * - successful checks
   * - failed checks
   * - average response time
   * - minimum response time
   * - maximum response time
   */
 getEndpointStatistics(endpointId, startDate, endDate){


  const match = {

    endpointId:
      new mongoose.Types.ObjectId(endpointId)

  };



  if(startDate && endDate){

    match.checkedAt = {

      $gte:startDate,

      $lte:endDate

    };

  }



  return HealthCheck.aggregate([


    {
      $match:match
    },


    {
      $group:{


        _id:null,


        totalChecks:{
          $sum:1
        },


        successfulChecks:{
          $sum:{
            $cond:[
              {
                $eq:[
                  "$status",
                  "UP"
                ]
              },
              1,
              0
            ]
          }
        },


        failedChecks:{
          $sum:{
            $cond:[
              {
                $ne:[
                  "$status",
                  "UP"
                ]
              },
              1,
              0
            ]
          }
        },



        /*
         * Status distribution
         *
         * Example:
         *
         * {
         *   UP: 100,
         *   DOWN: 20,
         *   ERROR: 5
         * }
         */
        statusBreakdown:{

          $push:"$status"

        },



        averageResponseTime:{
          $avg:"$responseTime"
        },


        minResponseTime:{
          $min:"$responseTime"
        },


        maxResponseTime:{
          $max:"$responseTime"
        }


      }

    }


  ]);

},
async getOverview(userId){


    const objectUserId =
        new mongoose.Types.ObjectId(userId);



    /*
     * First find all endpoints owned by this user
     *
     * User
     *   |
     *   └── ApiEndpoints
     *            |
     *            └── HealthChecks
     *
     */
    const endpointIds =
        await ApiEndpoint.find({
            userId: objectUserId
        })
        .distinct('_id');



    const [
        endpoints,
        health,
        alerts
    ] = await Promise.all([



        /*
         * Endpoint Statistics
         */
        ApiEndpoint.aggregate([


            {
                $match:{
                    userId: objectUserId
                }
            },


            {
                $group:{


                    _id:null,


                    total:{
                        $sum:1
                    },


                    active:{
                        $sum:{
                            $cond:[

                                {
                                    $eq:[
                                        "$monitoringEnabled",
                                        true
                                    ]
                                },

                                1,

                                0

                            ]
                        }
                    }


                }
            }


        ]),





        /*
         * Health Check Statistics
         *
         * HealthCheck does not contain userId.
         * It belongs to endpointId.
         */
        HealthCheck.aggregate([


            {
                $match:{

                    endpointId:{
                        $in:endpointIds
                    }

                }
            },



            {
                $group:{


                    _id:null,


                    totalChecks:{
                        $sum:1
                    },


                    successfulChecks:{

                        $sum:{

                            $cond:[

                                {
                                    $eq:[
                                        "$status",
                                        "UP"
                                    ]
                                },

                                1,

                                0

                            ]

                        }

                    }


                }

            }


        ]),





        /*
         * Alert Statistics
         */
        Alert.aggregate([


            {
                $match:{
                    userId: objectUserId
                }
            },



            {
                $group:{


                    _id:null,


                    total:{
                        $sum:1
                    },


                    active:{

                        $sum:{

                            $cond:[

                                {
                                    $eq:[
                                        "$status",
                                        "ACTIVE"
                                    ]
                                },

                                1,

                                0

                            ]

                        }

                    },



                    resolved:{

                        $sum:{

                            $cond:[

                                {
                                    $eq:[
                                        "$status",
                                        "RESOLVED"
                                    ]
                                },

                                1,

                                0

                            ]

                        }

                    }


                }


            }


        ])



    ]);





    const totalChecks =
        health[0]?.totalChecks || 0;



    const successfulChecks =
        health[0]?.successfulChecks || 0;



    const failedChecks =
        totalChecks - successfulChecks;



    const uptime =
        totalChecks === 0
        ? 100
        :
        Number(
            (
                (successfulChecks / totalChecks) * 100
            )
            .toFixed(2)
        );




    return {



        endpoints:{


            total:
                endpoints[0]?.total || 0,


            active:
                endpoints[0]?.active || 0,


            inactive:
                (endpoints[0]?.total || 0)
                -
                (endpoints[0]?.active || 0)


        },





        health:{


            totalChecks,


            successfulChecks,


            failedChecks,


            overallUptime: uptime


        },





        alerts:{


            total:
                alerts[0]?.total || 0,


            active:
                alerts[0]?.active || 0,


            resolved:
                alerts[0]?.resolved || 0


        }



    };


},


/**
 * Get uptime trend
 *
 * Groups health checks day wise
 *
 * User
 *  |
 *  └── Endpoints
 *          |
 *          └── HealthChecks
 *
 */
async getUptimeTrend(userId, startDate, endDate){


    const result =
        await HealthCheck.aggregate([


            /*
             * Get user's health checks
             */
            {
                $match:{

                    userId:
                        new mongoose.Types.ObjectId(userId),


                    checkedAt:{
                        $gte:startDate,
                        $lte:endDate
                    }

                }

            },



            /*
             * Group checks by day
             */
            {
                $group:{


                    _id:{


                        $dateToString:{


                            format:"%Y-%m-%d",

                            date:"$checkedAt"

                        }


                    },


                    totalChecks:{
                        $sum:1
                    },


                    successfulChecks:{


                        $sum:{


                            $cond:[


                                {
                                    $eq:[
                                        "$status",
                                        "UP"
                                    ]
                                },


                                1,


                                0


                            ]


                        }


                    },


                    failedChecks:{


                        $sum:{


                            $cond:[


                                {
                                    $ne:[
                                        "$status",
                                        "UP"
                                    ]
                                },


                                1,


                                0


                            ]


                        }


                    }



                }


            },



            /*
             * Sort dates
             */
            {

                $sort:{

                    _id:1

                }

            }



        ]);




    /*
     * Convert aggregation result
     * into frontend friendly format
     */
    const formatted =
        result.map(item=>{

            console.log("UPTIME AGG RESULT:", result);


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


                date:item._id,


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




    return formatted;


},


/**
 * Response time performance trend
 *
 * Returns:
 * - Average response time
 * - Minimum response time
 * - Maximum response time
 *
 * Grouped by day
 */
async getResponseTimeTrend(
    userId,
    startDate,
    endDate
){


    return HealthCheck.aggregate([


        {
            $match:{


                userId:
                    new mongoose.Types.ObjectId(userId),


                checkedAt:{
                    $gte:startDate,
                    $lte:endDate
                },


                /*
                 * Ignore failed checks
                 * because responseTime can be null
                 */
                responseTime:{
                    $ne:null
                }


            }

        },



        {
            $group:{


                _id:{


                    $dateToString:{


                        format:"%Y-%m-%d",


                        date:"$checkedAt"


                    }


                },



                averageResponseTime:{


                    $avg:"$responseTime"


                },



                minResponseTime:{


                    $min:"$responseTime"


                },



                maxResponseTime:{


                    $max:"$responseTime"


                },



                totalChecks:{


                    $sum:1


                }


            }


        },



        {

            $sort:{


                _id:1


            }

        }



    ]);



},

/**
 * Error breakdown analytics
 *
 * Returns:
 * - Error type distribution
 * - Count of failures
 *
 * User
 *  |
 *  └── ApiEndpoints
 *          |
 *          └── HealthChecks
 */
async getErrorBreakdown(
    userId,
    startDate,
    endDate
){


    const objectUserId =
        new mongoose.Types.ObjectId(userId);



    /*
     * Find user's endpoints
     */
    const endpointIds =
        await ApiEndpoint.find({
            userId: objectUserId
        })
        .distinct('_id');




    const match = {


        endpointId:{
            $in:endpointIds
        },


        status:{
            $ne:"UP"
        }


    };




    if(startDate && endDate){


        match.checkedAt = {


            $gte:startDate,


            $lte:endDate


        };


    }





    const result =
        await HealthCheck.aggregate([



            {
                $match:match
            },



           {
    $group:{


        _id:{
            
            $ifNull:[
                "$errorType",
                "UNKNOWN"
            ]

        },


        count:{
            $sum:1
        }


    }

},


            {
                $sort:{


                    count:-1


                }
            }



        ]);



        
        
    return result.map(error=>({


        errorType:
            error._id || "UNKNOWN",


        count:
            error.count



    }));



},

};


module.exports = analyticsRepository;