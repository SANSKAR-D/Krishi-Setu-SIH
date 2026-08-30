const express = require('express');
const multer = require('multer');
const { handleChatRequest, getChatHistory } = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const { aiLimiter } = require('../middleware/rateLimiter');

// GET /api/chat/history - Get chat history for logged in user
router.get('/chat/history', authMiddleware, getChatHistory);

// POST /api/chat - Protected route with stricter rate limiting
router.post('/chat', aiLimiter, authMiddleware, upload.fields([{ name: 'image' }, { name: 'audio' }]), handleChatRequest);

module.exports = router;
