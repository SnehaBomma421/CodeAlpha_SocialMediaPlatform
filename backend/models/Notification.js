const mongoose = require('mongoose');

/**
 * Notification Schema
 * Stores user notifications for likes, follows, and comments
 *
 * Types:
 * - like:     Someone liked your post
 * - follow:   Someone followed you
 * - comment:  Someone commented on your post
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have a recipient'],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have a sender'],
    },
    type: {
      type: String,
      enum: ['like', 'follow', 'comment'],
      required: [true, 'Notification type is required'],
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index for fetching unread notifications for a user
 */
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
