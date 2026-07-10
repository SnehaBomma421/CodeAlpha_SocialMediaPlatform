const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies the JWT token from the Authorization header
 * Attaches the authenticated user to req.user
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header: "Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.',
      });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request (exclude password)
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.',
        });
      }

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please log in again.',
        });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please log in again.',
        });
      }
      throw jwtError;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Optional auth middleware
 * Attaches user if token exists, but doesn't block if missing
 * Useful for public endpoints where we want user-aware data
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

module.exports = { protect, optionalAuth };
