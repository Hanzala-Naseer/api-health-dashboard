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


};


module.exports = notificationRepository;