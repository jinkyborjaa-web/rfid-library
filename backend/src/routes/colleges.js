const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT c.college_id, c.name,
                    COALESCE(json_agg(json_build_object('course_id', co.course_id, 'name', co.name)
                    ORDER BY co.name) FILTER (WHERE co.course_id IS NOT NULL), '[]') AS courses
             FROM colleges c LEFT JOIN courses co ON co.college_id = c.college_id
             GROUP BY c.college_id ORDER BY c.name`
        );
        res.json({ status: 'success', data: rows });
    } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name) return res.status(400).json({ status: 'error', message: 'College name is required' });
    try {
        const { rows } = await pool.query('INSERT INTO colleges (name) VALUES ($1) RETURNING *', [name]);
        res.status(201).json({ status: 'success', data: rows[0] });
    } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const assigned = await pool.query(
            `SELECT COUNT(*)::int AS count FROM students s JOIN courses co ON co.name = s.course
             WHERE co.college_id = $1`, [req.params.id]
        );
        if (assigned.rows[0].count > 0) return res.status(409).json({ status: 'error', message: `Cannot delete - ${assigned.rows[0].count} students are assigned to courses in this college` });
        const result = await pool.query('DELETE FROM colleges WHERE college_id = $1', [req.params.id]);
        if (!result.rowCount) return res.status(404).json({ status: 'error', message: 'College not found' });
        res.json({ status: 'success' });
    } catch (error) { next(error); }
});

module.exports = router;