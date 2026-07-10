const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/notifications
 * Get all notifications for the authenticated user
 * Newest first, with unread notifications at the top
 */
const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name username avatar')
      .populate('post', 'caption image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalUnread = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    const totalNotifications = await Notification.countDocuments({
      recipient: req.user._id,
    });

    const totalPages = Math.ceil(totalNotifications / limit);

    res.status(200).json({
      success: true,
      notifications,
      unreadCount: totalUnread,
      pagination: {
        page,
        limit,
        total: totalNotifications,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/read/:id
 * Mark a single notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the authenticated user
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
