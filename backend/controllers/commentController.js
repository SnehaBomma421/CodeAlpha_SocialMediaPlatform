const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');

/**
 * POST /api/posts/:id/comment
 * Add a comment to a post
 *
 * Body: { text }
 */
const addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    const { text } = req.body;

    // Create the comment
    const comment = await Comment.create({
      post: req.params.id,
      user: req.user._id,
      text,
    });

    // Add comment reference to the post
    post.comments.push(comment._id);
    await post.save();

    // Populate user data for response
    await comment.populate('user', 'name username avatar');

    // Create notification (only if commenting on someone else's post)
    if (post.user.toString() !== req.user._id.toString()) {
      try {
        await Notification.create({
          recipient: post.user,
          sender: req.user._id,
          type: 'comment',
          post: post._id,
          comment: comment._id,
        });
      } catch (notifError) {
        console.error('Failed to create comment notification:', notifError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Comment added!',
      comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/comments/:id
 * Edit a comment (only the owner can edit)
 *
 * Body: { text }
 */
const updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Verify ownership
    if (comment.user.toString() !== req.user._id.toString()) {
      throw new AppError('You can only edit your own comments', 403);
    }

    const { text } = req.body;
    comment.text = text;
    await comment.save();

    await comment.populate('user', 'name username avatar');

    res.status(200).json({
      success: true,
      message: 'Comment updated!',
      comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/comments/:id
 * Delete a comment (only the owner or post owner can delete)
 */
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Find the post this comment belongs to
    const post = await Post.findById(comment.post);

    // Verify ownership (comment owner or post owner can delete)
    const isCommentOwner = comment.user.toString() === req.user._id.toString();
    const isPostOwner = post && post.user.toString() === req.user._id.toString();

    if (!isCommentOwner && !isPostOwner) {
      throw new AppError('You can only delete your own comments', 403);
    }

    // Remove comment reference from the post
    if (post) {
      post.comments.pull(comment._id);
      await post.save();
    }

    // Delete the comment
    await Comment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Comment deleted!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/:id/comments
 * Get all comments for a post (newest first)
 */
const getComments = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    const comments = await Comment.find({ post: req.params.id })
      .populate('user', 'name username avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      comments,
      total: comments.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addComment,
  updateComment,
  deleteComment,
  getComments,
};
