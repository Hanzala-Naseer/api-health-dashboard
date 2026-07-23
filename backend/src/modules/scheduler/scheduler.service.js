

const logger = require('../../lib/logger');

const endpointRepository = require('../endpoint/endpoint.repository');
const monitoringService = require('../monitoring/monitoring.service');

let scheduler = null;

let isRunning = false;


/**
 * Determines whether endpoint should be checked.
 *
 * frequency stored in seconds.
 */
function shouldRunEndpoint(endpoint) {

  if (!endpoint.lastCheckedAt) {
    return true;
  }


  const now = Date.now();


  const lastChecked =
    new Date(endpoint.lastCheckedAt).getTime();


  const frequencyMs =
    endpoint.frequency * 1000;


  return (
    now - lastChecked >= frequencyMs
  );

}



/**
 * Starts background monitoring scheduler.
 */
function startScheduler() {


  if (scheduler) {

    logger.warn(
      'Monitoring scheduler is already running.'
    );

    return;

  }


  logger.info(
    'Starting monitoring scheduler...'
  );



  scheduler = setInterval(async () => {


    /*
     * Prevent overlapping executions
     */
    if (isRunning) {

      logger.warn(
        'Previous scheduler cycle still running. Skipping this tick.'
      );

      return;

    }



    isRunning = true;



    try {


      logger.info(
        `[Scheduler] Tick - ${new Date().toISOString()}`
      );



      /*
       * Step 1:
       * Get monitored endpoints
       */
      const endpoints =
        await endpointRepository.findMonitoringEnabledEndpoints();

        console.log("\n===== Scheduler Endpoints =====");

endpoints.forEach((e) => {
  console.log(e.name, e.url);
});

console.log("===============================\n");



      logger.info(
        `Found ${endpoints.length} monitored endpoint(s).`
      );




      /*
       * Step 2:
       * Filter due endpoints
       */
      const dueEndpoints = endpoints.filter((endpoint) => {

  const due = shouldRunEndpoint(endpoint);

  const secondsSinceLastCheck = endpoint.lastCheckedAt
    ? Math.floor(
        (Date.now() - new Date(endpoint.lastCheckedAt).getTime()) / 1000
      )
    : "Never";

  console.log("\n------------------------");
  console.log("Endpoint:", endpoint.name);
  console.log("Frequency:", endpoint.frequency, "seconds");
  console.log("Last Checked:", endpoint.lastCheckedAt);
  console.log("Seconds Since Last Check:", secondsSinceLastCheck);
  console.log("Due:", due);

  return due;
});



      logger.info(
        `${dueEndpoints.length} endpoint(s) ready for health check.`
      );




      if (dueEndpoints.length === 0) {


        logger.info(
          'No endpoints require checking this cycle.'
        );


        return;

      }




      logger.info(
        'Starting parallel health checks...'
      );




      /*
       * Step 3:
       * Execute checks concurrently
       */
      const results =
        await Promise.allSettled(

          dueEndpoints.map(async (endpoint)=>{


            logger.info(
              `Checking started → ${endpoint.name}`
            );



            const healthCheck =
              await monitoringService.checkEndpoint({

                endpointId: endpoint._id,

                userId: endpoint.userId,

              });



            logger.info(
              `Checking completed → ${endpoint.name}`
            );



            return {

              name: endpoint.name,

              status: healthCheck.status,

            };


          })

        );





      /*
       * Step 4:
       * Handle results
       */
      results.forEach((result)=>{


        if(result.status === 'fulfilled'){


          const {
            name,
            status
          } = result.value;



          if(status === 'UP'){


            logger.info(
              `Health check successful → ${name}`
            );


          }
          else{


            logger.warn(
              `Health check failed → ${name} (${status})`
            );


          }


        }
        else{


          logger.error(
            `Health check execution error → ${result.reason.message}`
          );


        }


      });




      logger.info(
        'Parallel health checks finished.'
      );



    }
    catch(error){


      logger.error(
        'Scheduler execution failed'
      );


      logger.error(error);



    }
    finally{


      /*
       * Always release lock
       */
      isRunning = false;


    }



  },10000);



}



/**
 * Stop scheduler.
 */
function stopScheduler(){


  if(!scheduler){

    return;

  }



  clearInterval(scheduler);


  scheduler = null;


  logger.info(
    'Monitoring scheduler stopped.'
  );

}



module.exports = {

  startScheduler,

  stopScheduler,

};