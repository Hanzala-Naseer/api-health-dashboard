const mongoose = require('mongoose');


/**
 * Notification preferences for each user.
 *
 * One document per user.
 */
const notificationSettingSchema =
  new mongoose.Schema(

    {

      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },


      /*
       * Master switch.
       *
       * If false:
       * no notifications are sent.
       */
      emailAlerts: {
        type: Boolean,
        default: true,
      },


      /*
       * Alert type preferences
       */
      downtimeAlerts: {
        type: Boolean,
        default: true,
      },


      recoveryAlerts: {
        type: Boolean,
        default: true,
      },


      slowResponseAlerts: {
        type: Boolean,
        default: true,
      },


      sslExpiryAlerts: {
        type: Boolean,
        default: true,
      },


      /*
       * User timezone.
       *
       * Used later when sending:
       * "Detected at 10:30 PM"
       */
      timezone: {
        type: String,
        default: 'UTC',
      },


    },

    {
      timestamps:true,
    }

  );



/*
 * One settings document per user.
 */
notificationSettingSchema.index(
  {
    userId:1,
  },
  {
    unique:true,
  }
);



module.exports =
 mongoose.models.NotificationSetting ||
 mongoose.model(
   'NotificationSetting',
   notificationSettingSchema
 );