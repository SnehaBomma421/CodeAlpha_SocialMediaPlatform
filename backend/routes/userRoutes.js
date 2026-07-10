const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getUserById,
  followUser,
  unfollowUser,
  searchUsers,
  getSuggestions,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { updateProfileValidation, validate } = require('../middleware/validate');
const upload = require('../middleware/upload');

// All user routes require authentication
router.use(protect);

// GET /api/users/profile — Get own profile
router.get('/profile', getProfile);

// PUT /api/users/profile — Update own profile (optional avatar upload)
router.put('/profile', upload.single('avatar'), updateProfileValidation, validate, updateProfile);

// GET /api/users/search — Search users
router.get('/search', searchUsers);

// GET /api/users/suggestions — Get suggested users
router.get('/suggestions', getSuggestions);

// GET /api/users/:id — Get user by ID
router.get('/:id', getUserById);

// POST /api/users/follow/:id — Follow a user
router.post('/follow/:id', followUser);

// DELETE /api/users/unfollow/:id — Unfollow a user
router.delete('/unfollow/:id', unfollowUser);

module.exports = router;
