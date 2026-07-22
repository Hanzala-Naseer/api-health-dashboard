// const nodemailer = require('nodemailer');
// const env = require('../config/env');
// const logger = require('../lib/logger');

// /**
//  * WHY a single mailer wrapper:
//  * - One place to swap providers (SMTP -> SES/SendGrid/Postmark) later.
//  * - One place to guarantee emails NEVER throw and break the request that
//  *   triggered them (e.g. registration should still succeed even if the
//  *   welcome email fails — the failure is logged, not swallowed silently).
//  * - One place to enforce "from" address/name consistently.
//  */
// const transporter = nodemailer.createTransport({
//   host: env.SMTP_HOST,
//   port: env.SMTP_PORT,
//   secure: env.SMTP_SECURE,
//   auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
// });

// /**
//  * Sends an email. Never throws — auth flows must not fail because an email
//  * provider hiccupped. Callers that need to guarantee delivery (e.g. queue +
//  * retry) should build that on top of this in a background job, not inline
//  * in the request/response cycle.
//  */
// async function sendEmail({ to, subject, html, text }) {
//   try {
//     if (!env.SMTP_HOST) {
//       // Dev fallback: no SMTP configured — log instead of sending, so local
//       // development / this sandbox doesn't require real credentials.
//       logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}\n${text || html}`);
//       return { delivered: false, dev: true };
//     }

//     const info = await transporter.sendMail({
//       from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM_ADDRESS}>`,
//       to,
//       subject,
//       html,
//       text,
//     });
//     logger.info(`Email sent to ${to} — messageId: ${info.messageId}`);
//     return { delivered: true, messageId: info.messageId };
//   } catch (err) {
//     logger.error(`Failed to send email to ${to}: ${err.message}`);
//     return { delivered: false, error: err.message };
//   }
// }

// module.exports = { sendEmail };


const nodemailer = require('nodemailer');

const env = require('../config/env');
const logger = require('../lib/logger');


/**
 * Central email provider wrapper.
 *
 * Responsibilities:
 *
 * - SMTP provider handling
 * - Future provider replacement
 * - Consistent sender identity
 * - Email logging
 * - Prevent email failures breaking app flow
 */


const transporter = nodemailer.createTransport({

  host: env.SMTP_HOST,

  port: env.SMTP_PORT,

  secure: env.SMTP_SECURE,

  auth:
    env.SMTP_USER
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        }
      : undefined,

});



/**
 * Sends email.
 *
 * Never throws.
 *
 * Email failure should not break:
 * - registration
 * - password reset
 * - monitoring scheduler
 * - alert creation
 */


async function sendEmail({

  to,

  subject,

  html,

  text,

  type = 'GENERAL',

}) {


  try {


    /*
     * Development fallback.
     *
     * No SMTP configured:
     * log email instead of sending.
     */

    if (!env.SMTP_HOST) {


      logger.info(

        `[DEV EMAIL:${type}] To: ${to} | Subject: ${subject}\n${text || html}`

      );


      return {

        delivered:false,

        dev:true,

      };

    }



    const info = await transporter.sendMail({


      from:
        `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM_ADDRESS}>`,


      to,


      subject,


      html,


      text,


    });



    logger.info(

      `[EMAIL:${type}] Sent to ${to} — messageId: ${info.messageId}`

    );



    return {


      delivered:true,


      messageId:info.messageId,


    };



  }


  catch(error){


    logger.error(

      `[EMAIL:${type}] Failed to send to ${to}: ${error.message}`

    );



    return {


      delivered:false,


      error:error.message,


    };


  }


}



module.exports = {

  sendEmail,

};