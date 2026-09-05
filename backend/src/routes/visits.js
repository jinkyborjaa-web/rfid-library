const express = require('express');
const { query } = require('express-validator');
const router = express.Router();
const checkInController = require('../controllers/checkInController');

// Validation middleware
const validateVisitLogQuery = [
    query('startDate').optional().isDate().withMessage('Start date must be a valid date'),
    query('endDate').optional().isDate().withMessage('End date must be a valid date'),
    query('studentId').optional().isInt().withMessage('Student ID must be an integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer')
];

// Routes
router.get('/', validateVisitLogQuery, checkInController.getVisitLog);

module.exports = router; 