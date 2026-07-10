const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  searchPosts,
  getTrendingHashtags,
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const {
  createPostValidation,
  updatePostValidation,
  validate,
} = require('../middleware/validate');
const upload = require('../middleware/upload');

// ─── Public-ish routes (optional auth for like-state) ───────
// GET /api/posts/search — Search posts
router.get('/search', protect, searchPosts);

// GET /api/posts/trending — Trending hashtags
router.get('/trending', protect, getTrendingHashtags);

// GET /api/posts — Get all posts (paginated)
router.get('/', protect, getPosts);

// GET /api/posts/:id — Get single post
router.get('/:id', protect, getPostById);

// ─── Protected routes ───────────────────────────────────────
// POST /api/posts — Create a post (optional image upload)
router.post('/', protect, upload.single('image'), createPostValidation, validate, createPost);

// PUT /api/posts/:id — Update a post (optional image upload)
router.put('/:id', protect, upload.single('image'), updatePostValidation, validate, updatePost);

// DELETE /api/posts/:id — Delete a post
router.delete('/:id', protect, deletePost);

// POST /api/posts/:id/like — Like a post
router.post('/:id/like', protect, likePost);

// DELETE /api/posts/:id/unlike — Unlike a post
router.delete('/:id/unlike', protect, unlikePost);

module.exports = router;
