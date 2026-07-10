const multer = require('multer');
const path = require('path');
const { AppError } = require('./errorHandler');

/**
 * Multer storage configuration
 * Saves uploaded files to the uploads directory with unique filenames
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

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
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  },
});

module.exports = upload;
