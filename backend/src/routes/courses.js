const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const values = [];
        let where = '';
        if (req.query.college_id) { values.push(req.query.college_id); where = 'WHERE co.college_id = $1'; }
        const { rows } = await pool.query(
            `SELECT co.course_id, co.college_id, co.name, c.name AS college_name
             FROM courses co JOIN colleges c ON c.college_id = co.college_id ${where} ORDER BY co.name`, values
        );
        res.json({ status: 'success', data: rows });
    } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
    const collegeId = Number(req.body.college_id);
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!Number.isInteger(collegeId) || !name) return res.status(400).json({ status: 'error', message: 'College and course name are required' });
    try {
        const { rows } = await pool.query('INSERT INTO courses (college_id, name) VALUES ($1, $2) RETURNING *', [collegeId, name]);
        res.status(201).json({ status: 'success', data: rows[0] });
    } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const assigned = await pool.query(
            `SELECT COUNT(*)::int AS count FROM students s JOIN courses co ON co.name = s.course
             WHERE co.course_id = $1`, [req.params.id]
        );
        if (assigned.rows[0].count > 0) return res.status(409).json({ status: 'error', message: `Cannot delete - ${assigned.rows[0].count} students are assigned to this course` });
        const result = await pool.query('DELETE FROM courses WHERE course_id = $1', [req.params.id]);
        if (!result.rowCount) return res.status(404).json({ status: 'error', message: 'Course not found' });
        res.json({ status: 'success' });
    } catch (error) { next(error); }
});

module.exports = router;