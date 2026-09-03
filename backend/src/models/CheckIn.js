const { pool } = require('../db');

class CheckIn {
    static async create(checkInData) {
        const { rows } = await pool.query(
            `INSERT INTO check_ins (student_id, check_in_time, check_in_date, device_id)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [checkInData.student_id, checkInData.check_in_time, checkInData.check_in_date, checkInData.device_id]
        );
        return rows[0];
    }

    static async getVisitLog(filters = {}) {
        const conditions = [];
        const values = [];
        if (filters.startDate) { values.push(filters.startDate); conditions.push(`c.check_in_date >= $${values.length}`); }
        if (filters.endDate) { values.push(filters.endDate); conditions.push(`c.check_in_date <= $${values.length}`); }
        if (filters.studentId) { values.push(filters.studentId); conditions.push(`s.student_id = $${values.length}`); }
        if (filters.course) { values.push(filters.course); conditions.push(`s.course = $${values.length}`); }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const count = await pool.query(`SELECT COUNT(*)::int AS total FROM check_ins c JOIN students s ON c.student_id = s.student_id ${where}`, values);
        const limit = Math.min(Number(filters.limit) || 50, 100);
        const offset = Math.max(Number(filters.offset) || 0, 0);
        values.push(limit, offset);
        const { rows } = await pool.query(
            `SELECT c.check_in_id, c.check_in_time, c.check_in_date, c.device_id,
                    s.student_id, s.first_name, s.last_name, s.course, s.year_level, s.section
             FROM check_ins c JOIN students s ON c.student_id = s.student_id ${where}
             ORDER BY c.check_in_date DESC, c.check_in_time DESC
             LIMIT $${values.length - 1} OFFSET $${values.length}`,
            values
        );
        return { data: rows, total: count.rows[0].total };
    }

    static async getLeaderboard(period = null) {
        const values = [];
        const periodClause = period ? `AND c.check_in_date >= $1` : '';
        if (period) values.push(period);
        const { rows } = await pool.query(
            `SELECT s.student_id, CONCAT(s.first_name, ' ', s.last_name) AS full_name,
                    s.course, s.year_level, s.section, COUNT(c.check_in_id)::int AS visit_count
             FROM students s LEFT JOIN check_ins c ON s.student_id = c.student_id ${periodClause}
             WHERE s.status = 'active' GROUP BY s.student_id
             ORDER BY visit_count DESC LIMIT 10`,
            values
        );
        return rows;
    }

    static async hasRecentCheckIn(studentId, minutesThreshold = 5) {
        const { rows } = await pool.query(
            `SELECT EXISTS (
                SELECT 1 FROM check_ins
                WHERE student_id = $1
                  AND check_in_date = CURRENT_DATE
                  AND check_in_time >= CURRENT_TIME - ($2 * INTERVAL '1 minute')
            ) AS exists`,
            [studentId, minutesThreshold]
        );
        return rows[0].exists;
    }
}

module.exports = CheckIn;
