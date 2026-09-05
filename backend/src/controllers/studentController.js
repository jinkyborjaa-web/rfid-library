const Student = require('../models/Student');
const { validationResult } = require('express-validator');

exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.findAll({
            search: req.query.search,
            course: req.query.course,
            year: req.query.year,
            section: req.query.section
        });
        res.json({
            status: 'success',
            data: students
        });
    } catch (err) {
        console.error('Error getting students:', err);
        res.status(500).json({
            status: 'error',
            message: 'Error retrieving students'
        });
    }
};

exports.getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({
                status: 'error',
                message: 'Student not found'
            });
        }
        res.json({
            status: 'success',
            data: student
        });
    } catch (err) {
        console.error('Error getting student:', err);
        res.status(500).json({
            status: 'error',
            message: 'Error retrieving student'
        });
    }
};

exports.createStudent = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            errors: errors.array()
        });
    }

    try {
        const existingStudent = await Student.findByRfid(req.body.rfid_number);
        if (existingStudent) {
            return res.status(400).json({
                status: 'error',
                message: 'RFID number already exists'
            });
        }

        const student = await Student.create(req.body);
        res.status(201).json({
            status: 'success',
            data: student
        });
    } catch (err) {
        console.error('Error creating student:', err);
        res.status(500).json({
            status: 'error',
            message: 'Error creating student'
        });
    }
};

exports.updateStudent = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            errors: errors.array()
        });
    }

    try {
        const success = await Student.update(req.params.id, req.body);
        if (!success) {
            return res.status(404).json({
                status: 'error',
                message: 'Student not found'
            });
        }
        res.json({
            status: 'success',
            message: 'Student updated successfully'
        });
    } catch (err) {
        console.error('Error updating student:', err);
        res.status(500).json({
            status: 'error',
            message: 'Error updating student'
        });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const success = await Student.delete(req.params.id);
        if (!success) {
            return res.status(404).json({
                status: 'error',
                message: 'Student not found'
            });
        }
        res.json({
            status: 'success',
            message: 'Student deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting student:', err);
        res.status(500).json({
            status: 'error',
            message: 'Error deleting student'
        });
    }
}; 