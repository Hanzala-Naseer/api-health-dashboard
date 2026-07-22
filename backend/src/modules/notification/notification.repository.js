const Notification = require('../../models/Notification.model');


const notificationRepository = {


  /**
   * Create notification record.
   *
   * Initially stored as PENDING.
   * Later updated to SENT or FAILED.
   */
  async createNotification(data) {

    return Notification.create(data);

  },



  /**
   * Find notifications for a user.
   *
   * Used later for:
   * - notification history page
   * - dashboard
   */
  async findByUserId(
    userId,
    limit = 50
  ) {

    return Notification.find({
      userId,
    })
      .sort({
        createdAt:-1,
      })
      .limit(limit);

  },



  /**
   * Find notifications related to alert.
   *
   * Prevent duplicate sending.
   *
   * Example:
   * Do not send same downtime email twice.
   */
  async findByAlertId(alertId) {

    return Notification.find({
      alertId,
    });

  },



  /**
   * Update notification status.
   *
   * Example:
   *
   * PENDING
   *    |
   *    v
   * SENT
   *
   * or
   *
   * PENDING
   *    |
   *    v
   * FAILED
   */
  async updateStatus(
    notificationId,
    updateData
  ) {

    return Notification.findByIdAndUpdate(
      notificationId,
      updateData,
      {
        new:true,
      }
    );

  },

  async findNotificationHistoryByUser(
  userId,
  { skip, limit }
){

  return Notification.find({
    userId
  })
  .sort({
    createdAt:-1
  })
  .skip(skip)
  .limit(limit)
  .populate(
    'alertId',
    'title type severity status'
  )
  .lean();

},


async countNotificationHistoryByUser(userId){

  return Notification.countDocuments({
    userId
  });

},  


};


module.exports = notificationRepository;