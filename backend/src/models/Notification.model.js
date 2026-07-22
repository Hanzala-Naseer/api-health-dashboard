const mongoose = require('mongoose');


const NOTIFICATION_TYPE = [
  'DOWNTIME',
  'RECOVERY',
  'SLOW_RESPONSE',
  'SSL_EXPIRY',
  'STATUS_MISMATCH',
  'OTHER',
];


const NOTIFICATION_CHANNEL = [
  'EMAIL',
  'IN_APP',
  'PUSH',
];


const NOTIFICATION_STATUS = [
  'PENDING',
  'SENT',
  'FAILED',
];


const notificationSchema = new mongoose.Schema(

  {

    /**
     * User who receives notification
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },


    /**
     * Related alert incident
     *
     * Example:
     * GitHub API DOWN alert
     */
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert',
      required: true,
    },


    /**
     * Notification category
     */
    type: {
      type: String,
      enum: NOTIFICATION_TYPE,
      required: true,
    },


    /**
     * Delivery channel
     */
    channel: {
      type: String,
      enum: NOTIFICATION_CHANNEL,
      required: true,
    },


    /**
     * Delivery state
     */
    status: {
      type: String,
      enum: NOTIFICATION_STATUS,
      default: 'PENDING',
    },


    /**
     * Email subject / notification title
     */
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },


    /**
     * Actual notification message
     */
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },


    /**
     * When notification was successfully sent
     */
    sentAt: {
      type: Date,
      default: null,
    },


    /**
     * If delivery fails
     */
    errorMessage: {
      type: String,
      default: null,
    },

  },


  {
    timestamps:true,
  }

);



/**
 * Query patterns:
 *
 * 1. User notification history
 * 2. Alert related notifications
 * 3. Failed notification retries
 */

notificationSchema.index({
  userId:1,
  createdAt:-1,
});


notificationSchema.index({
  alertId:1,
});


notificationSchema.index({
  status:1,
});



module.exports =
  mongoose.models.Notification ||
  mongoose.model(
    'Notification',
    notificationSchema
  );