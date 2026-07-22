const mongoose = require('mongoose');


const ALERT_TYPE = [
  'DOWNTIME',
  'SLOW_RESPONSE',
  'SSL_EXPIRY',
  'STATUS_MISMATCH',
  'RECOVERY',
  'OTHER'
];


const ALERT_SEVERITY = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
];


const ALERT_STATUS = [
  'ACTIVE',
  'RESOLVED'
];



const alertSchema = new mongoose.Schema(

  {


    /*
     * Ownership
     */

    endpointId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiEndpoint',
      required:true
    },


    userId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'User',
      required:true
    },



    /*
     * Related health check
     *
     * Allows:
     * Alert → HealthCheck → Error details
     */

    healthCheckId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'HealthCheck',
      required:false
    },



    /*
     * Alert classification
     */

    type:{
      type:String,
      enum:ALERT_TYPE,
      required:true
    },


    severity:{
      type:String,
      enum:ALERT_SEVERITY,
      default:'MEDIUM'
    },



    /*
     * Technical error reason
     *
     * Examples:
     *
     * DNS_ERROR
     * TIMEOUT
     * CONNECTION_ERROR
     * SSL_ERROR
     */

    errorType:{
      type:String,
      default:null
    },



    title:{
      type:String,
      required:true,
      trim:true,
      maxlength:200
    },



    message:{
      type:String,
      required:true,
      trim:true,
      maxlength:2000
    },



    /*
     * Lifecycle
     */

    status:{
      type:String,
      enum:ALERT_STATUS,
      default:'ACTIVE'
    },


    resolvedAt:{
      type:Date,
      default:null
    },



    /*
     * Notification tracking
     *
     * Phase 4.2:
     * Email
     * Push
     * In-app notification
     */

    notificationSent:{
      type:Boolean,
      default:false
    },


    lastNotifiedAt:{
      type:Date,
      default:null
    },



    /*
     * Future expansion
     *
     * Store extra data:
     *
     * {
     *   responseTime:12000,
     *   threshold:5000
     * }
     */

    metadata:{
      type:mongoose.Schema.Types.Mixed,
      default:null
    }


  },


  {
    timestamps:true
  }

);





/*
 * Query patterns
 */


// Endpoint alert history
alertSchema.index({
  endpointId:1,
  createdAt:-1
});


// User dashboard alerts
alertSchema.index({
  userId:1,
  createdAt:-1
});


// Active alerts lookup
alertSchema.index({
  status:1,
  createdAt:-1
});


// Notification worker
alertSchema.index({
  notificationSent:1,
  status:1
});



module.exports =
mongoose.models.Alert ||
mongoose.model(
  'Alert',
  alertSchema
);