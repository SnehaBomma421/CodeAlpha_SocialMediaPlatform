const cloudinary = require('cloudinary').v2;

/**
 * Cloudinary Configuration
 *
 * Reads credentials from environment variables.
 * Used by multer-storage-cloudinary to upload images directly to Cloudinary
 * instead of saving them to the local filesystem.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
