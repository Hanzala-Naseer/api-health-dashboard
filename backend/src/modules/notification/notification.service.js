// const notificationRepository =
//   require('./notification.repository');

// const NotificationSetting =
//   require('../../models/NotificationSetting.model');

// const User =
//   require('../../models/User.model');

// const mailer =
//   require('../../emails/mailer');

// const alertDownEmail =
//   require('../../emails/templates/alertDownEmail');



// function isAlertEnabled(settings, alertType) {


//   if (!settings) {

//     return true;

//   }


//   const preferences = {

//     DOWNTIME:
//       settings.downtimeAlerts,

//     RECOVERY:
//       settings.recoveryAlerts,

//     SLOW_RESPONSE:
//       settings.slowResponseAlerts,

//     SSL_EXPIRY:
//       settings.sslExpiryAlerts,

//   };


//   return preferences[alertType] !== false;

// }




// async function sendAlertNotification(alert) {


//   const settings =
//     await NotificationSetting.findOne({
//       userId: alert.userId,
//     });



//   if (
//     settings &&
//     settings.emailAlerts === false
//   ) {

//     return null;

//   }



//   if (
//     !isAlertEnabled(
//       settings,
//       alert.type
//     )
//   ) {

//     return null;

//   }



//   const user =
//     await User.findById(
//       alert.userId
//     )
//     .select(
//       'email name'
//     );



//   if (!user) {

//     throw new Error(
//       'User not found for notification'
//     );

//   }




//   const notification =
//     await notificationRepository.createNotification({

//       userId:
//         alert.userId,

//       alertId:
//         alert._id,

//       type:
//         alert.type,

//       channel:
//         'EMAIL',

//       status:
//         'PENDING',

//       title:
//         alert.title,

//       message:
//         alert.message,

//     });




//   try {


//     let email;



//     if (
//       alert.type === 'DOWNTIME'
//     ) {


//       email =
//         alertDownEmail({

//           endpointName:
//             alert.title.replace(' is DOWN', ''),

//           errorType:
//             alert.errorType,

//           errorMessage:
//             alert.message,

//           detectedAt:
//         alert.createdAt.toLocaleString(),

//         });


//     }
//     else {


//       email = {

//         subject:
//           alert.title,

//         html:
//           alert.message,

//         text:
//           alert.message,

//       };

//     }





//     await mailer.sendEmail({

//       to:
//         user.email,

//       subject:
//         email.subject,

//       html:
//         email.html,

//       text:
//         email.text,

//       type:
//         `${alert.type}_ALERT`,

//     });





//     await notificationRepository.updateStatus(

//       notification._id,

//       {

//         status:
//           'SENT',

//         sentAt:
//           new Date(),

//       }

//     );



//     return notification;



//   }

//   catch(error) {


//     await notificationRepository.updateStatus(

//       notification._id,

//       {

//         status:
//           'FAILED',

//         errorMessage:
//           error.message,

//       }

//     );


//     throw error;

//   }


// }



// module.exports = {

//   sendAlertNotification,

// };



const notificationRepository =
  require('./notification.repository');

const NotificationSetting =
  require('../../models/NotificationSetting.model');

const User =
  require('../../models/User.model');

const mailer =
  require('../../emails/mailer');

const alertDownEmail =
  require('../../emails/templates/alertDownEmail');

const alertRecoveryEmail =
  require('../../emails/templates/alertRecoveryEmail');



function isAlertEnabled(settings, alertType) {

  if (!settings) {
    return true;
  }

  const preferences = {

    DOWNTIME:
      settings.downtimeAlerts,

    RECOVERY:
      settings.recoveryAlerts,

    SLOW_RESPONSE:
      settings.slowResponseAlerts,

    SSL_EXPIRY:
      settings.sslExpiryAlerts,

  };

  return preferences[alertType] !== false;

}



async function sendAlertNotification(alert) {

  const settings =
    await NotificationSetting.findOne({
      userId: alert.userId,
    });

  if (
    settings &&
    settings.emailAlerts === false
  ) {
    return null;
  }

  if (
    !isAlertEnabled(
      settings,
      alert.type
    )
  ) {
    return null;
  }

  const user =
    await User.findById(alert.userId)
      .select('email name');

  if (!user) {
    throw new Error(
      'User not found for notification'
    );
  }

  const notification =
    await notificationRepository.createNotification({

      userId:
        alert.userId,

      alertId:
        alert._id,

      type:
        alert.type,

      channel:
        'EMAIL',

      status:
        'PENDING',

      title:
        alert.title,

      message:
        alert.message,

    });

  try {

    let email;

    switch (alert.type) {

      case 'DOWNTIME':

        email = alertDownEmail({

          endpointName:
            alert.title.replace(' is DOWN', ''),

          errorType:
            alert.errorType,

          errorMessage:
            alert.message,

          detectedAt:
            alert.createdAt.toLocaleString(),

        });

        break;


      case 'RECOVERY':

        email = alertRecoveryEmail({

          endpointName:
            alert.title.replace(' recovered', ''),

          recoveredAt:
            alert.createdAt.toLocaleString(),

        });

        break;


      default:

        email = {

          subject:
            alert.title,

          html:
            alert.message,

          text:
            alert.message,

        };

    }


    await mailer.sendEmail({

      to:
        user.email,

      subject:
        email.subject,

      html:
        email.html,

      text:
        email.text,

      type:
        `${alert.type}_ALERT`,

    });


    await notificationRepository.updateStatus(

      notification._id,

      {

        status:
          'SENT',

        sentAt:
          new Date(),

      }

    );


    return notification;

  }

  catch (error) {

    await notificationRepository.updateStatus(

      notification._id,

      {

        status:
          'FAILED',

        errorMessage:
          error.message,

      }

    );

    throw error;

  }

}



module.exports = {

  sendAlertNotification,

};