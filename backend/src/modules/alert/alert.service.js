

// const alertRepository =
//   require('./alert.repository');

// const notificationService =
//   require('../notification/notification.service');


// async function processHealthCheck({
//   endpoint,
//   healthCheck,
// }) {

//   const failedStatuses = [
//     'DOWN',
//     'ERROR',
//     'TIMEOUT',
//   ];


//   /*
//    * Create alert on failure
//    */
//   if (
//     failedStatuses.includes(
//       healthCheck.status
//     )
//   ) {

//     const existingAlert =
//       await alertRepository.findActiveAlert(
//         endpoint._id
//       );


//     if (existingAlert) {

//       return null;

//     }


//     const alert =
//       await alertRepository.create({

//         endpointId:
//           endpoint._id,

//         userId:
//           endpoint.userId,

//         healthCheckId:
//           healthCheck._id,

//         type:
//           'DOWNTIME',

//         severity:
//           'HIGH',

//         errorType:
//           healthCheck.errorType,

//         title:
//           `${endpoint.name} is DOWN`,

//         message:
//           healthCheck.errorMessage ||
//           'Endpoint is unreachable',

//       });


//     // Templates require endpoint name
//     alert.endpointId = {
//       _id: endpoint._id,
//       name: endpoint.name,
//     };


//     try {

//       await notificationService
//         .sendAlertNotification(
//           alert
//         );

//     } catch (error) {

//       console.error(
//         'Downtime notification failed:',
//         error.message
//       );

//     }


//     return alert;

//   }



//   /*
//    * Resolve alert on recovery
//    */
//   if (
//     healthCheck.status === 'UP'
//   ) {

//     const resolvedAlert =
//       await alertRepository.resolve(
//         endpoint._id
//       );


//     // No active alert existed
//     if (!resolvedAlert) {

//       return null;

//     }


//     // Recovery email template also needs endpoint name
//     resolvedAlert.endpointId = {
//       _id: endpoint._id,
//       name: endpoint.name,
//     };


//     // Send as recovery notification
//     resolvedAlert.type = 'RECOVERY';

//     resolvedAlert.title =
//       `${endpoint.name} recovered`;

//     resolvedAlert.message =
//       'Endpoint is responding normally again.';


//     try {

//       await notificationService
//         .sendAlertNotification(
//           resolvedAlert
//         );

//     } catch (error) {

//       console.error(
//         'Recovery notification failed:',
//         error.message
//       );

//     }


//     return resolvedAlert;

//   }


//   return null;

// }


// module.exports = {
//   processHealthCheck,
// };


const alertRepository =
  require('./alert.repository');

const notificationService =
  require('../notification/notification.service');

async function processHealthCheck({
  endpoint,
  healthCheck,
}) {



  const failedStatuses = [
    'DOWN',
    'ERROR',
    'TIMEOUT',
  ];

  /*
   * FAILURE
   */
  if (
    failedStatuses.includes(
      healthCheck.status
    )
  ) {

    console.log(
      '[Failure] Looking for ACTIVE alert...'
    );

    const existingAlert =
      await alertRepository.findActiveAlert(
        endpoint._id
      );

    console.log(
      '[Failure] Existing Alert:',
      existingAlert
        ? existingAlert._id.toString()
        : 'NONE'
    );

    if (existingAlert) {

      console.log(
        '[Failure] Alert already active. Skipping creation.'
      );

      return null;

    }

    console.log(
      '[Failure] Creating new alert...'
    );

    const alert =
      await alertRepository.create({

        endpointId:
          endpoint._id,

        userId:
          endpoint.userId,

        healthCheckId:
          healthCheck._id,

        type:
          'DOWNTIME',

        severity:
          'HIGH',

        errorType:
          healthCheck.errorType,

        title:
          `${endpoint.name} is DOWN`,

        message:
          healthCheck.errorMessage ||
          'Endpoint is unreachable',

      });

    console.log(
      '[Failure] Alert Created:',
      alert._id.toString()
    );

    // Needed by email template
    alert.endpointId = {
      _id: endpoint._id,
      name: endpoint.name,
    };

    try {

      console.log(
        '[Failure] Sending downtime email...'
      );

      await notificationService.sendAlertNotification(
        alert
      );

      console.log(
        '[Failure] Downtime email sent.'
      );

    }
    catch (error) {

      console.error(
        '[Failure] Downtime email failed:',
        error.message
      );

    }

    return alert;

  }

  /*
   * RECOVERY
   */
  if (
    healthCheck.status === 'UP'
  ) {

    console.log(
      '[Recovery] Looking for ACTIVE alert...'
    );

    const resolvedAlert =
      await alertRepository.resolve(
        endpoint._id
      );

    console.log(
      '[Recovery] Resolved Alert:',
      resolvedAlert
        ? resolvedAlert._id.toString()
        : 'NONE'
    );

    if (!resolvedAlert) {

      console.log(
        '[Recovery] No ACTIVE alert found.'
      );

      return null;

    }

    resolvedAlert.endpointId = {
      _id: endpoint._id,
      name: endpoint.name,
    };

    resolvedAlert.type = 'RECOVERY';

    resolvedAlert.title =
      `${endpoint.name} recovered`;

    resolvedAlert.message =
      'Endpoint is responding normally again.';

    try {

      console.log(
        '[Recovery] Sending recovery email...'
      );

      await notificationService.sendAlertNotification(
        resolvedAlert
      );

      console.log(
        '[Recovery] Recovery email sent.'
      );

    }
    catch (error) {

      console.error(
        '[Recovery] Recovery email failed:',
        error.message
      );

    }

    return resolvedAlert;

  }

  console.log(
    '[Alert Service] No alert action required.'
  );

  return null;

}

module.exports = {
  processHealthCheck,
};