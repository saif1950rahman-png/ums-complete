// ============================================================
// controllers/courseController.js — Course CRUD
// ============================================================
const db = require('../config/db');

// ── GET all courses ──────────────────────────────────────────
const getAllCourses = async (req, res) => {
    try {
        const { search, dept, semester } = req.query;
        let query  = `SELECT c.*, d.name AS department_name, d.code AS dept_code
                      FROM courses c
                      JOIN departments d ON c.department_id = d.id
                      WHERE 1=1`;
        const params = [];

        if (search) {
            query += ' AND (c.course_code LIKE ? OR c.course_name LIKE ?)';
            const like = `%${search}%`;
            params.push(like, like);
        }
        if (dept)     { query += ' AND c.department_id = ?'; params.push(dept); }
        if (semester) { query += ' AND c.semester = ?';      params.push(semester); }

        query += ' ORDER BY c.course_code ASC';

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getAllCourses error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── GET single course ────────────────────────────────────────
const getCourseById = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT c.*, d.name AS department_name
             FROM courses c JOIN departments d ON c.department_id = d.id
             WHERE c.id = ?`, [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Course not found.' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── ADD course ───────────────────────────────────────────────
const addCourse = async (req, res) => {
    try {
        const { course_code, course_name, credit_hours, department_id, semester, description } = req.body;

        if (!course_code || !course_name || !credit_hours || !department_id || !semester) {
            return res.status(400).json({ success: false, message: 'Required fields missing.' });
        }

        const [result] = await db.query(
            `INSERT INTO courses (course_code, course_name, credit_hours, department_id, semester, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [course_code.toUpperCase(), course_name, credit_hours, department_id, semester, description || null]
        );

        res.status(201).json({ success: true, message: 'Course added successfully.', id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Course code already exists.' });
        }
        console.error('addCourse error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── UPDATE course ────────────────────────────────────────────
const updateCourse = async (req, res) => {
    try {
        const { course_name, credit_hours, department_id, semester, description } = req.body;

        const [result] = await db.query(
            `UPDATE courses SET course_name=?, credit_hours=?, department_id=?, semester=?, description=?
             WHERE id=?`,
            [course_name, credit_hours, department_id, semester, description || null, req.params.id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Course not found.' });
        res.json({ success: true, message: 'Course updated successfully.' });
    } catch (err) {
        console.error('updateCourse error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── DELETE course ────────────────────────────────────────────
const deleteCourse = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Course not found.' });
        res.json({ success: true, message: 'Course deleted successfully.' });
    } catch (err) {
        console.error('deleteCourse error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getAllCourses, getCourseById, addCourse, updateCourse, deleteCourse };
