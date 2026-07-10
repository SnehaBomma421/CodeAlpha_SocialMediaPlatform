const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All notification routes require authentication
router.use(protect);

// GET /api/notifications — Get all notifications
router.get('/', getNotifications);

// PUT /api/notifications/read-all — Mark all as read
router.put('/read-all', markAllAsRead);

// PUT /api/notifications/read/:id — Mark one as read
router.put('/read/:id', markAsRead);

// DELETE /api/notifications/:id — Delete a notification
router.delete('/:id', deleteNotification);

module.exports = router;
