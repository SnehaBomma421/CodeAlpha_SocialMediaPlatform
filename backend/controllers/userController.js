const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/users/profile
 * Get the currently authenticated user's full profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('followers', 'name username avatar bio')
      .populate('following', 'name username avatar bio');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Count user's total posts
    const totalPosts = await Post.countDocuments({ user: req.user._id });

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        totalPosts,
        followersCount: user.followers.length,
        followingCount: user.following.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/profile
 * Update the currently authenticated user's profile
 *
 * Body: { name, bio, username } (all optional)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, username } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;

    // If username is being changed, check it's unique
    if (username) {
      const existingUser = await User.findOne({
        username: username.toLowerCase(),
        _id: { $ne: req.user._id },
      });

      if (existingUser) {
        throw new AppError('Username is already taken', 409);
      }

      updateFields.username = username.toLowerCase();
    }

    // If avatar uploaded, convert buffer to Base64 data URI
    if (req.file) {
      updateFields.avatar = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 * Get a user's public profile by their ID
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email')
      .populate('followers', 'name username avatar')
      .populate('following', 'name username avatar');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const totalPosts = await Post.countDocuments({ user: req.params.id });

    // Check if the requesting user follows this user
    const isFollowing = req.user
      ? user.followers.some((f) => f._id.toString() === req.user._id.toString())
      : false;

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        totalPosts,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/follow/:id
 * Follow a user
 */
const followUser = async (req, res, next) => {
  try {
    // Cannot follow yourself
    if (req.params.id === req.user._id.toString()) {
      throw new AppError('You cannot follow yourself', 400);
    }

    const userToFollow = await User.findById(req.params.id);
    if (!userToFollow) {
      throw new AppError('User not found', 404);
    }

    // Check if already following
    if (userToFollow.followers.includes(req.user._id)) {
      throw new AppError('You are already following this user', 400);
    }

    // Add follower to the target user
    await User.findByIdAndUpdate(req.params.id, {
      $push: { followers: req.user._id },
    });

    // Add to current user's following list
    await User.findByIdAndUpdate(req.user._id, {
      $push: { following: req.params.id },
    });

    // Create notification
    try {
      await Notification.create({
        recipient: req.params.id,
        sender: req.user._id,
        type: 'follow',
      });
    } catch (notifError) {
      // Log but don't fail the follow if notification creation fails
      console.error('Failed to create follow notification:', notifError.message);
    }

    res.status(200).json({
      success: true,
      message: `You are now following ${userToFollow.name}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/unfollow/:id
 * Unfollow a user
 */
const unfollowUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      throw new AppError('You cannot unfollow yourself', 400);
    }

    const userToUnfollow = await User.findById(req.params.id);
    if (!userToUnfollow) {
      throw new AppError('User not found', 404);
    }

    // Check if actually following
    if (!userToUnfollow.followers.includes(req.user._id)) {
      throw new AppError('You are not following this user', 400);
    }

    // Remove follower
    await User.findByIdAndUpdate(req.params.id, {
      $pull: { followers: req.user._id },
    });

    // Remove from current user's following list
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { following: req.params.id },
    });

    res.status(200).json({
      success: true,
      message: `You have unfollowed ${userToUnfollow.name}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/search?q=query
 * Search users by name or username
 */
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(200).json({ success: true, users: [] });
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    const users = await User.find({
      $or: [
        { name: searchRegex },
        { username: searchRegex },
      ],
      _id: { $ne: req.user ? req.user._id : null }, // Exclude current user
    })
      .select('name username avatar bio')
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/suggestions
 * Get suggested users to follow (not already followed, limit 5)
 */
const getSuggestions = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id).select('following');

    const followingIds = currentUser.following.map((f) => f.toString());
    followingIds.push(req.user._id.toString()); // Exclude self

    const suggestions = await User.find({
      _id: { $nin: followingIds },
    })
      .select('name username avatar bio')
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      users: suggestions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserById,
  followUser,
  unfollowUser,
  searchUsers,
  getSuggestions,
};
