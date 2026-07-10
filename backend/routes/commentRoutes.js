const express = require('express');
const router = express.Router();
const {
  addComment,
  updateComment,
  deleteComment,
  getComments,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const {
  createCommentValidation,
  updateCommentValidation,
  validate,
} = require('../middleware/validate');

// All comment routes require authentication
router.use(protect);

// GET /api/posts/:id/comments — Get comments for a post (mounted at /api)
router.get('/posts/:id/comments', getComments);

// POST /api/posts/:id/comment — Add a comment to a post (mounted at /api)
router.post('/posts/:id/comment', createCommentValidation, validate, addComment);

// PUT /api/comments/:id — Edit a comment (mounted at /api)
router.put('/comments/:id', updateCommentValidation, validate, updateComment);

// DELETE /api/comments/:id — Delete a comment (mounted at /api)
router.delete('/comments/:id', deleteComment);

module.exports = router;
