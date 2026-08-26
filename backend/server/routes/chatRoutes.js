const express = require('express');
const multer = require('multer');
const { handleChatRequest } = require('../controllers/chatController');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST /api/chat
router.post('/chat', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), handleChatRequest);

module.exports = router;
