const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

/**
 * Helper: Generate JWT token for a user
 * @param {string} userId - The user's ObjectId
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

/**
 * Helper: Format user data for response (exclude sensitive fields)
 */
const formatUserResponse = (user) => {
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatar: user.avatar,
    followers: user.followers,
    following: user.following,
    followersCount: user.followers ? user.followers.length : 0,
    followingCount: user.following ? user.following.length : 0,
    createdAt: user.createdAt,
  };
};

/**
 * POST /api/auth/register
 * Register a new user account
 *
 * Body: { name, username, email, password, confirmPassword }
 * Optional: avatar uploaded via multer
 */
const register = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    // Check if user already exists by email or username
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
      throw new AppError(`A user with this ${field} already exists`, 409);
    }

    // Create new user
    const user = new User({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
    });

    // If avatar was uploaded, set it
    if (req.file) {
      user.avatar = `/uploads/${req.file.filename}`;
    }

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticate a user and return JWT token
 *
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email, explicitly select password since it's excluded by default
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get the currently authenticated user's data
 * Useful for checking token validity and loading initial state
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'name username avatar')
      .populate('following', 'name username avatar');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
