const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const studentController = require('../controllers/studentController');
const checkInController = require('../controllers/checkInController');

// Validation middleware
const validateStudent = [
    body('rfid_number').notEmpty().withMessage('RFID number is required'),
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('course').optional(),
    body('year_level').optional(),
    body('section').optional(),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be either active or inactive')
];

// Routes
router.get('/', studentController.getAllStudents);
router.get('/top-visitors', checkInController.getLeaderboard);
router.get('/:id', studentController.getStudentById);
router.post('/', validateStudent, studentController.createStudent);
router.put('/:id', validateStudent, studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

module.exports = router; 