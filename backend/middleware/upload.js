const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { AppError } = require('./errorHandler');

/**
 * Multer storage configuration using Cloudinary
 *
 * Instead of saving files to a local uploads folder (which breaks on
 * Render/Heroku because those files don't persist), images are uploaded
 * directly to Cloudinary. The response stores the Cloudinary secure_url.
 */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'socialsphere',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
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
