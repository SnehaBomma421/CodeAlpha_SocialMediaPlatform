const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation, validate } = require('../middleware/validate');
const upload = require('../middleware/upload');

// POST /api/auth/register — Create a new account (optional avatar upload)
router.post('/register', upload.single('avatar'), registerValidation, validate, register);

// POST /api/auth/login — Sign in
router.post('/login', loginValidation, validate, login);

// GET /api/auth/me — Get current user (protected)
router.get('/me', protect, getMe);

module.exports = router;
