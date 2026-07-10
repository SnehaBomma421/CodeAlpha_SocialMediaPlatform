/**
 * Application configuration
 * Centralizes all environment variables with defaults
 */
const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongoUri: process.env.MONGODB_URI,

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_change_me',
  jwtExpire: process.env.JWT_EXPIRE || '30d',

  // File upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB

  // CORS
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5000',

  // Bcrypt salt rounds
  bcryptSaltRounds: 12,
};

// Validate required config in production
if (config.nodeEnv === 'production') {
  if (!config.mongoUri || config.mongoUri.includes('<username>')) {
    console.error('❌ Fatal: MONGODB_URI is not configured in production');
    process.exit(1);
  }
  if (!config.jwtSecret || config.jwtSecret === 'default_jwt_secret_change_me') {
    console.error('❌ Fatal: JWT_SECRET is not configured in production');
    process.exit(1);
  }
}

module.exports = config;
