const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 * Reads the MONGODB_URI from environment variables
 * Handles connection events and graceful shutdown
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Log connection events for debugging
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

/**
 * Graceful shutdown — close mongoose connection
 * when the Node process ends
 */
const gracefulShutdown = () => {
  mongoose.connection.close(false).then(() => {
    console.log('🔌 MongoDB connection closed gracefully');
    process.exit(0);
  });
};

// Handle application termination
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = connectDB;
