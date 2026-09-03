const CheckIn = require('../models/CheckIn');
const Student = require('../models/Student');
const { validationResult } = require('express-validator');

exports.createCheckIn = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            errors: errors.array()
        });
    }

    try {
        const { rfid_number, device_id } = req.body;

        // Find student by RFID
        const student = await Student.findByRfid(rfid_number);
        if (!student) {
            return res.status(404).json({
                status: 'error',
                message: 'Student not found'
            });
        }

        // Convert student_id to Number
        student.student_id = Number(student.student_id);

        // Check for recent check-in
        const hasRecentCheckIn = await CheckIn.hasRecentCheckIn(student.student_id);
        if (hasRecentCheckIn) {
            return res.status(400).json({
                status: 'error',
                message: 'Student has already checked in recently'
            });
        }

        // Create check-in record
        const now = new Date();
        const checkInData = {
            student_id: student.student_id,
            check_in_time: now.toTimeString().split(' ')[0],
            check_in_date: now.toISOString().split('T')[0],
            device_id: device_id || 'MAIN_SCANNER'
        };

        const checkIn = await CheckIn.create(checkInData);
        
        // Ensure all numeric values are converted from BigInt to Number
        const responseData = {
            status: 'success',
            data: {
                check_in: {
                    ...checkIn,
                    check_in_id: Number(checkIn.check_in_id),
                    student_id: Number(checkIn.student_id)
                },
                student: {
                    student_id: student.student_id,
                    first_name: student.first_name,
                    last_name: student.last_name,
                    course: student.course,
                    year_level: student.year_level,
                    section: student.section
                }
            }
        };

        res.status(201).json(responseData);
    } catch (err) {
        console.error('Error creating check-in:', err);
        res.status(500).json({
            status: 'error',
            message: err.message || 'Error creating check-in'
        });
    }
};

exports.getVisitLog = async (req, res) => {
    try {
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            studentId: req.query.studentId,
            course: req.query.course,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
        };

        const { data: visits, total } = await CheckIn.getVisitLog(filters);
        res.json({
            status: 'success',
            data: visits,
            total: Number(total) // Convert BigInt to Number
        });
    } catch (err) {
        console.error('Error getting visit log:', err);
        res.status(500).json({
            status: 'error',
            message: 'Error retrieving visit log'
        });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const period = req.query.period; // Can be null for all-time
        const leaderboard = await CheckIn.getLeaderboard(period);
        res.json({
            status: 'success',
            data: leaderboard
        });
    } catch (err) {
        console.error('Error getting leaderboard:', err);
        res.status(500).json({
            status: 'error',
            message: 'Error retrieving leaderboard'
        });
    }
}; 