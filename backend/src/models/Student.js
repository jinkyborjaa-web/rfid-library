const { pool } = require('../db');

class Student {
    static async findAll(filters = {}) {
        const conditions = [];
            const values = [];
            if (filters.search) {
                conditions.push(`(first_name ILIKE $${values.length + 1} OR last_name ILIKE $${values.length + 1} OR rfid_number ILIKE $${values.length + 1})`);
                const search = `%${filters.search}%`;
                values.push(search);
            }
            if (filters.course) { values.push(filters.course); conditions.push(`course = $${values.length}`); }
            if (filters.year) { values.push(filters.year); conditions.push(`year_level = $${values.length}`); }
            if (filters.section) { values.push(filters.section); conditions.push(`section = $${values.length}`); }
            const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
            const { rows } = await pool.query(`SELECT * FROM students ${where} ORDER BY created_at DESC`, values);
            return rows;
    }

    static async findById(id) {
        const { rows } = await pool.query('SELECT * FROM students WHERE student_id = $1', [id]);
            return rows[0];
    }

    static async findByRfid(rfidNumber) {
        const { rows } = await pool.query('SELECT * FROM students WHERE rfid_number = $1', [rfidNumber]);
            return rows[0];
    }

    static async create(studentData) {
        const { rows } = await pool.query(
            'INSERT INTO students (rfid_number, first_name, last_name, course, year_level, section) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [studentData.rfid_number, studentData.first_name, studentData.last_name, studentData.course || null, studentData.year_level || null, studentData.section || null]
        );
        return rows[0];
    }

    static async update(id, studentData) {
        const result = await pool.query(
            'UPDATE students SET rfid_number = $1, first_name = $2, last_name = $3, course = $4, year_level = $5, section = $6, status = COALESCE($7, status) WHERE student_id = $8',
            [studentData.rfid_number, studentData.first_name, studentData.last_name, studentData.course || null, studentData.year_level || null, studentData.section || null, studentData.status || null, id]
        );
        return result.rowCount > 0;
    }

    static async delete(id) {
        const result = await pool.query('DELETE FROM students WHERE student_id = $1', [id]);
        return result.rowCount > 0;
    }
}

module.exports = Student; 