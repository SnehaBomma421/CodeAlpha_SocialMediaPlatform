const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

// ─── Load environment variables ────────────────────────────
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// ─── Route imports ─────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// ─── Initialize app ────────────────────────────────────────
const app = express();

// ─── Security middleware ────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());

// ─── Body parsing middleware ────────────────────────────────
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ─── Logging (disable in test) ──────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Static files ───────────────────────────────────────────
// Serve frontend client files
app.use(express.static(path.join(__dirname, '..', 'client')));

// ─── API Routes ────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', commentRoutes); // comment routes have mixed prefixes
app.use('/api/notifications', notificationRoutes);

// ─── Health check endpoint ──────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SocialSphere API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Serve index.html for all non-API routes (SPA-style) ───
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// ─── Global error handler (must be last middleware) ────────
app.use(errorHandler);

// ─── Start server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════╗
║         🌐 SocialSphere Server              ║
║──────────────────────────────────────────────║
║  Status:  ✅ Running                        ║
║  Port:    ${String(PORT).padEnd(37)}║
║  Mode:    ${(process.env.NODE_ENV || 'development').padEnd(37)}║
║  URL:     http://localhost:${String(PORT).padEnd(14)}║
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app; // Export for testing
