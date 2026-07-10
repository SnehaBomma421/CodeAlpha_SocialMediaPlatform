const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/posts
 * Get all posts with pagination (infinite scroll)
 * Query params: page, limit, userId (optional filter)
 */
const getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.query.userId;

    let query = {};

    // Filter by user if specified (for profile pages)
    if (userId) {
      query.user = userId;
    }

    // Get posts sorted by newest first
    const posts = await Post.find(query)
      .populate('user', 'name username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination metadata
    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);

    // Attach like/comment counts and check if current user has liked
    const postsWithMeta = posts.map((post) => ({
      ...post,
      likesCount: post.likes ? post.likes.length : 0,
      commentsCount: post.comments ? post.comments.length : 0,
      isLiked: req.user
        ? post.likes.some((like) => like.toString() === req.user._id.toString())
        : false,
    }));

    res.status(200).json({
      success: true,
      posts: postsWithMeta,
      pagination: {
        page,
        limit,
        totalPosts,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/:id
 * Get a single post by ID
 */
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'name username avatar bio')
      .populate({
        path: 'comments',
        options: { sort: { createdAt: -1 }, limit: 50 },
        populate: { path: 'user', select: 'name username avatar' },
      })
      .lean();

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    const isLiked = req.user
      ? post.likes.some((like) => like.toString() === req.user._id.toString())
      : false;

    res.status(200).json({
      success: true,
      post: {
        ...post,
        likesCount: post.likes ? post.likes.length : 0,
        commentsCount: post.comments ? post.comments.length : 0,
        isLiked,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/posts
 * Create a new post
 *
 * Body: { caption }
 * Optional: image uploaded via multer
 */
const createPost = async (req, res, next) => {
  try {
    const { caption } = req.body;

    const postData = {
      user: req.user._id,
      caption: caption || '',
    };

    if (req.file) {
      postData.image = `/uploads/${req.file.filename}`;
    }

    const post = await Post.create(postData);

    // Populate user data for response
    await post.populate('user', 'name username avatar');

    res.status(201).json({
      success: true,
      message: 'Post created successfully!',
      post: {
        ...post.toObject(),
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/posts/:id
 * Update a post (only the owner can update)
 *
 * Body: { caption }
 */
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // Verify ownership
    if (post.user.toString() !== req.user._id.toString()) {
      throw new AppError('You can only edit your own posts', 403);
    }

    const { caption } = req.body;
    if (caption !== undefined) {
      post.caption = caption;
    }

    // If a new image was uploaded
    if (req.file) {
      post.image = `/uploads/${req.file.filename}`;
    }

    await post.save();
    await post.populate('user', 'name username avatar');

    res.status(200).json({
      success: true,
      message: 'Post updated successfully!',
      post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/posts/:id
 * Delete a post (only the owner can delete)
 * Also removes associated comments and notifications
 */
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // Verify ownership
    if (post.user.toString() !== req.user._id.toString()) {
      throw new AppError('You can only delete your own posts', 403);
    }

    // Delete all comments associated with this post
    await Comment.deleteMany({ post: post._id });

    // Delete related notifications
    await Notification.deleteMany({ post: post._id });

    // Delete the post
    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/posts/:id/like
 * Like a post
 */
const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // Check if already liked
    if (post.likes.includes(req.user._id)) {
      throw new AppError('You have already liked this post', 400);
    }

    post.likes.push(req.user._id);
    await post.save();

    // Create notification (only if liking someone else's post)
    if (post.user.toString() !== req.user._id.toString()) {
      try {
        await Notification.create({
          recipient: post.user,
          sender: req.user._id,
          type: 'like',
          post: post._id,
        });
      } catch (notifError) {
        console.error('Failed to create like notification:', notifError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Post liked!',
      likesCount: post.likes.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/posts/:id/unlike
 * Unlike a post
 */
const unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // Check if actually liked
    if (!post.likes.includes(req.user._id)) {
      throw new AppError('You have not liked this post', 400);
    }

    post.likes.pull(req.user._id);
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post unliked!',
      likesCount: post.likes.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/search?q=query
 * Search posts by caption or hashtags
 */
const searchPosts = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(200).json({ success: true, posts: [] });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const isHashtagSearch = q.trim().startsWith('#');
    const hashtagQuery = q.trim().replace(/^#/, '').toLowerCase();

    let query;

    if (isHashtagSearch) {
      // Search by hashtag
      query = { hashtags: hashtagQuery };
    } else {
      // Search by caption text
      query = { caption: searchRegex };
    }

    const posts = await Post.find(query)
      .populate('user', 'name username avatar')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const postsWithMeta = posts.map((post) => ({
      ...post,
      likesCount: post.likes ? post.likes.length : 0,
      commentsCount: post.comments ? post.comments.length : 0,
      isLiked: req.user
        ? post.likes.some((like) => like.toString() === req.user._id.toString())
        : false,
    }));

    res.status(200).json({
      success: true,
      posts: postsWithMeta,
      total: posts.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/trending/hashtags
 * Get trending hashtags based on usage count
 */
const getTrendingHashtags = async (req, res, next) => {
  try {
    const hashtags = await Post.aggregate([
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      hashtags: hashtags.map((h) => ({ tag: h._id, count: h.count })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  searchPosts,
  getTrendingHashtags,
};
