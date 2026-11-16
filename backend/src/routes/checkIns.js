const express = require('express');
const { body } = require('express-validator');
const Student = require('../models/Student');
const checkInController = require('../controllers/checkInController');

const router = express.Router();

router.post('/', body('rfid_number').trim().notEmpty().withMessage('RFID number is required'), checkInController.createCheckIn);

router.get('/verify/:rfid', async (req, res, next) => {
    try {
        const student = await Student.findByRfid(req.params.rfid);
        if (!student) {
            return res.status(404).json({ status: 'error', message: 'Student not found' });
        }
        res.json({ status: 'success', data: student });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
