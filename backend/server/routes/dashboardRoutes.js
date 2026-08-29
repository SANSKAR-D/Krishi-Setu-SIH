const express = require('express');
const { getDashboardData } = require('../controllers/dashboardController');

const router = express.Router();

const { aiLimiter } = require('../middleware/rateLimiter');

// GET /api/dashboard - Rate limited to protect Gemini API calls
router.get('/dashboard', aiLimiter, getDashboardData);

module.exports = router;
