const express = require('express');
const { getDashboardSoilData, getDashboardAdvisories } = require('../controllers/dashboardController');

const router = express.Router();

const { aiLimiter } = require('../middleware/rateLimiter');

// GET /api/dashboard/soil - Fast endpoint for soil data
router.get('/dashboard/soil', getDashboardSoilData);

// GET /api/dashboard/advisories - Rate limited AI endpoint
router.get('/dashboard/advisories', aiLimiter, getDashboardAdvisories);

module.exports = router;
