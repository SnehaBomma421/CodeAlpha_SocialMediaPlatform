const mongoose = require('mongoose');

/**
 * Post Schema
 * Represents a user-created post with optional image, likes, and comments
 */
const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post must belong to a user'],
      index: true,
    },
    caption: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    },
    image: {
      type: String,
      default: '', // URL or path to uploaded image
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    hashtags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Virtual: Count of likes
 */
postSchema.virtual('likesCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

/**
 * Virtual: Count of comments
 */
postSchema.virtual('commentsCount').get(function () {
  return this.comments ? this.comments.length : 0;
});

/**
 * Indexes for efficient queries
 */
postSchema.index({ createdAt: -1 }); // Sort by newest first
postSchema.index({ hashtags: 1 }); // Search by hashtags
postSchema.index({ user: 1, createdAt: -1 }); // User's posts sorted by date

/**
 * Extract hashtags from caption before saving
 */
postSchema.pre('save', function (next) {
  if (this.isModified('caption')) {
    // Find all hashtags in the caption (e.g., #technology, #design)
    const tagRegex = /#[\w]+/g;
    const matches = this.caption.match(tagRegex);
    if (matches) {
      this.hashtags = [...new Set(matches.map((tag) => tag.toLowerCase()))];
    } else {
      this.hashtags = [];
    }
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);
