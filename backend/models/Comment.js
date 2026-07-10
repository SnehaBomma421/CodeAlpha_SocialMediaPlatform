const mongoose = require('mongoose');

/**
 * Comment Schema
 * Stores comments on posts with reference to both the post and the commenting user
 */
const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Comment must belong to a post'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment must belong to a user'],
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes
 */
commentSchema.index({ post: 1, createdAt: -1 }); // Comments for a post, newest first

module.exports = mongoose.model('Comment', commentSchema);
