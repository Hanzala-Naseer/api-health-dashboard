const alertRepository =
require('./alert.repository');



async function processHealthCheck({
  endpoint,
  healthCheck
}) {


  const failedStatuses = [
    'DOWN',
    'ERROR',
    'TIMEOUT'
  ];



  /*
   * FAILURE CASE
   */

  if(
    failedStatuses.includes(
      healthCheck.status
    )
  ){


    const existingAlert =
      await alertRepository.findActiveAlert(
        endpoint._id
      );



    // Already alerted
    if(existingAlert){

      return null;

    }



    return alertRepository.create({

      endpointId:endpoint._id,

      userId:endpoint.userId,


      healthCheckId:
        healthCheck._id,


      type:'DOWNTIME',


      severity:'HIGH',


      errorType:
        healthCheck.errorType,


      title:
        `${endpoint.name} is DOWN`,


      message:
        healthCheck.errorMessage
        ||
        'Endpoint is unreachable'


    });


  }



  /*
   * RECOVERY CASE
   */

  if(
    healthCheck.status === 'UP'
  ){

    await alertRepository.resolve(
      endpoint._id
    );

  }


}



module.exports = {

 processHealthCheck

};