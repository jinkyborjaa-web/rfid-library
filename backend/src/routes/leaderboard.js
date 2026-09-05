const express = require('express');
const { query } = require('express-validator');
const router = express.Router();
const checkInController = require('../controllers/checkInController');

// Validation middleware
const validateLeaderboardQuery = [
    query('period').optional().isDate().withMessage('Period must be a valid date')
];

// Routes
router.get('/', validateLeaderboardQuery, checkInController.getLeaderboard);

module.exports = router; 