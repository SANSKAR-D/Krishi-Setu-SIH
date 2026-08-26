const express = require('express');
const { getDashboardData } = require('../controllers/dashboardController');

const router = express.Router();

// GET /api/dashboard
router.get('/dashboard', getDashboardData);

module.exports = router;
