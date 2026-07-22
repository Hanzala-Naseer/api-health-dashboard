

// const axios = require('axios');
// const { performance } = require('node:perf_hooks');


// async function checkEndpoint(endpoint) {


//   const start = performance.now();



//   try {


//     const response = await axios({

//       method:endpoint.method,

//       url:endpoint.url,

//       timeout:endpoint.timeout,


//       validateStatus:()=>true,

//     });



//     const responseTime =
//       Math.round(
//         performance.now()-start
//       );



//     const responseBody =
//       typeof response.data === 'string'
//       ? response.data
//       : JSON.stringify(response.data);



//     const responseSize =
//       Number(
//         response.headers['content-length']
//       )
//       ||
//       Buffer.byteLength(
//         responseBody,
//         'utf8'
//       );




//     const isHealthy =
//       response.status === endpoint.expectedStatus;



//     return {


//       status:
//         isHealthy
//         ? 'UP'
//         : 'DOWN',



//       statusCode:
//         response.status,



//       responseTime,


//       responseSize,


//       responseHeaders:
//         response.headers,


//       errorType:
//         isHealthy
//         ? null
//         : 'HTTP_ERROR',



//       errorMessage:
//         isHealthy
//         ? null
//         : `Unexpected status code ${response.status}`

//     };



//   }


//   catch(error){



//     /*
//      * Timeout
//      */
//     if(error.code === 'ECONNABORTED'){


//       return {

//         status:'TIMEOUT',

//         statusCode:null,

//         responseTime:null,

//         responseSize:null,

//         responseHeaders:null,


//         errorType:'TIMEOUT',


//         errorMessage:
//           'Request exceeded timeout limit'

//       };

//     }




//     /*
//      * DNS failure
//      */
//     if(error.code === 'ENOTFOUND'){


//       return {


//         status:'ERROR',

//         statusCode:null,

//         responseTime:null,

//         responseSize:null,

//         responseHeaders:null,


//         errorType:'DNS_ERROR',


//         errorMessage:
//           'Domain could not be resolved'

//       };


//     }





//     /*
//      * Connection refused
//      */
//     if(
//       error.code === 'ECONNREFUSED'
//     ){


//       return {


//         status:'ERROR',

//         statusCode:null,

//         responseTime:null,

//         responseSize:null,

//         responseHeaders:null,


//         errorType:'CONNECTION_ERROR',


//         errorMessage:
//           'Connection refused'

//       };


//     }




//     /*
//      * SSL certificate issue
//      */
//     if(
//       error.code === 'CERT_HAS_EXPIRED' ||
//       error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
//     ){


//       return {


//         status:'ERROR',

//         statusCode:null,

//         responseTime:null,

//         responseSize:null,

//         responseHeaders:null,


//         errorType:'SSL_ERROR',


//         errorMessage:
//           'SSL certificate validation failed'

//       };


//     }




//     return {


//       status:'ERROR',

//       statusCode:null,

//       responseTime:null,

//       responseSize:null,

//       responseHeaders:null,


//       errorType:'UNKNOWN_ERROR',


//       errorMessage:
//         error.message


//     };


//   }

// }



// module.exports={
//   checkEndpoint
// };


const axios = require('axios');
const { performance } = require('node:perf_hooks');


/**
 * Creates standardized failed health check response.
 *
 * Keeps response format consistent for:
 * - TIMEOUT
 * - DNS_ERROR
 * - CONNECTION_ERROR
 * - SSL_ERROR
 * - UNKNOWN_ERROR
 */
function createErrorResponse(errorType, errorMessage, status = 'ERROR') {

  return {

    status,

    statusCode: null,

    responseTime: null,

    responseSize: null,

    responseHeaders: null,

    errorType,

    errorMessage,

  };

}



/**
 * Converts Node/Axios errors into application level categories.
 *
 * Axios gives technical errors:
 *
 * ENOTFOUND
 * ECONNREFUSED
 * ETIMEDOUT
 * CERT_HAS_EXPIRED
 *
 * We convert them into business friendly errors
 * which Alert System can understand.
 */
function classifyError(error) {


  /*
   * Request timeout
   */
  if (
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT'
  ) {

    return createErrorResponse(

      'TIMEOUT',

      'Request exceeded timeout limit',

      'TIMEOUT'

    );

  }



  /*
   * DNS resolution failed
   */
  if (
    error.code === 'ENOTFOUND'
  ) {

    return createErrorResponse(

      'DNS_ERROR',

      'Domain could not be resolved'

    );

  }



  /*
   * Server refused connection
   */
  if (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ECONNRESET'
  ) {

    return createErrorResponse(

      'CONNECTION_ERROR',

      'Connection could not be established'

    );

  }



  /*
   * SSL certificate problems
   */
  if (
    error.code === 'CERT_HAS_EXPIRED' ||
    error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
  ) {

    return createErrorResponse(

      'SSL_ERROR',

      'SSL certificate validation failed'

    );

  }



  /*
   * Unknown network/application error
   */
  return createErrorResponse(

    'UNKNOWN_ERROR',

    error.message

  );

}



/**
 * Performs HTTP health check.
 *
 * Responsibilities:
 *
 * 1. Execute HTTP request.
 * 2. Measure response metrics.
 * 3. Determine endpoint health.
 * 4. Normalize technical errors.
 *
 * No:
 * - Database access
 * - Repository calls
 * - Alert logic
 * - Scheduler logic
 */
async function checkEndpoint(endpoint) {


  const start = performance.now();



  try {


    const response = await axios({

      method: endpoint.method,

      url: endpoint.url,

      timeout: endpoint.timeout,


      /*
       * Axios normally throws for:
       *
       * 404
       * 500
       *
       * We disable that because monitoring
       * decides health itself.
       */
      validateStatus: () => true,

    });



    const responseTime =
      Math.round(
        performance.now() - start
      );



    const responseBody =
      typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data);



    const responseSize =
      Number(
        response.headers['content-length']
      )
      ||
      Buffer.byteLength(
        responseBody,
        'utf8'
      );



    const isHealthy =
      response.status === endpoint.expectedStatus;



    return {


      status:
        isHealthy
          ? 'UP'
          : 'DOWN',



      statusCode:
        response.status,



      responseTime,


      responseSize,



      responseHeaders:
        response.headers,



      errorType:
        isHealthy
          ? null
          : 'HTTP_ERROR',



      errorMessage:
        isHealthy
          ? null
          : `Unexpected status code ${response.status}`


    };



  }


  catch(error) {


    return classifyError(error);


  }


}



module.exports = {

  checkEndpoint,

};