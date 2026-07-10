/**
 * Custom error class with HTTP status code
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 * Catches all errors and returns consistent JSON responses
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // ─── Mongoose validation error ──────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join('. ');
    errors = messages;
  }

  // ─── Mongoose duplicate key error ────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `An account with this ${field} already exists.`;
  }

  // ─── Mongoose cast error (invalid ObjectId) ──────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ─── Multer file size error ──────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large. Maximum size is 5MB.';
  }

  // ─── Multer unexpected file ──────────────────────────
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field.';
  }

  // ─── JSON parse error ────────────────────────────────
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body.';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { AppError, errorHandler };
