const multer = require('multer');
const { AppError } = require('./errorHandler');

/**
 * Multer storage configuration using memory storage
 *
 * Files are stored in memory as Buffer instead of being saved to disk.
 * The controller converts the buffer to a Base64 data URI and saves it
 * directly in MongoDB.
 */

/**
 * File filter — only allow image files
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, GIF, and WebP images are allowed', 400), false);
  }
};

/**
 * Configured multer instance
 * Limits: 5MB file size, single image field named "image"
 * Uses memoryStorage so req.file.buffer is available for Base64 conversion
 */
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  },
});

module.exports = upload;
