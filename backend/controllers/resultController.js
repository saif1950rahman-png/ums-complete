// ============================================================
// controllers/resultController.js — Results CRUD
// ============================================================
const db = require('../config/db');

/**
 * Calculate grade & grade point from marks
 * Based on Southeast University grading system
 */
const calculateGrade = (marks) => {
    if (marks >= 80) return { grade: 'A+', grade_point: 4.00 };
    if (marks >= 75) return { grade: 'A',  grade_point: 3.75 };
    if (marks >= 70) return { grade: 'A-', grade_point: 3.50 };
    if (marks >= 65) return { grade: 'B+', grade_point: 3.25 };
    if (marks >= 60) return { grade: 'B',  grade_point: 3.00 };
    if (marks >= 55) return { grade: 'B-', grade_point: 2.75 };
    if (marks >= 50) return { grade: 'C+', grade_point: 2.50 };
    if (marks >= 45) return { grade: 'C',  grade_point: 2.25 };
    if (marks >= 40) return { grade: 'D',  grade_point: 2.00 };
    return { grade: 'F', grade_point: 0.00 };
};

// ── GET results for a student ────────────────────────────────
const getStudentResults = async (req, res) => {
    try {
        const { id } = req.params; // student DB id

        const [rows] = await db.query(
            `SELECT r.*, c.course_code, c.course_name, c.credit_hours,
                    s.full_name AS student_name, s.student_id AS student_no
             FROM results r
             JOIN courses c  ON r.course_id  = c.id
             JOIN students s ON r.student_id = s.id
             WHERE r.student_id = ?
             ORDER BY r.semester ASC, c.course_code ASC`, [id]
        );

        // Group by semester
        const grouped = {};
        rows.forEach(row => {
            const key = `Semester ${row.semester} (${row.year})`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(row);
        });

        res.json({ success: true, data: rows, grouped });
    } catch (err) {
        console.error('getStudentResults error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── GET all results (admin) ──────────────────────────────────
const getAllResults = async (req, res) => {
    try {
        const { student_id, semester, year } = req.query;
        let query  = `SELECT r.*, c.course_code, c.course_name,
                             s.full_name, s.student_id AS student_no
                      FROM results r
                      JOIN courses c  ON r.course_id  = c.id
                      JOIN students s ON r.student_id = s.id
                      WHERE 1=1`;
        const params = [];

        if (student_id) { query += ' AND s.student_id LIKE ?'; params.push(`%${student_id}%`); }
        if (semester)   { query += ' AND r.semester = ?';       params.push(semester); }
        if (year)       { query += ' AND r.year = ?';           params.push(year); }

        query += ' ORDER BY s.student_id, r.semester';

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getAllResults error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── ADD result ───────────────────────────────────────────────
const addResult = async (req, res) => {
    try {
        const { student_id, course_id, semester, marks_obtained, total_marks, year, remarks } = req.body;

        if (!student_id || !course_id || !semester || marks_obtained === undefined || !year) {
            return res.status(400).json({ success: false, message: 'Required fields missing.' });
        }

        const percentage = (marks_obtained / (total_marks || 100)) * 100;
        const { grade, grade_point } = calculateGrade(percentage);

        const [result] = await db.query(
            `INSERT INTO results (student_id, course_id, semester, marks_obtained,
              total_marks, grade, grade_point, year, remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [student_id, course_id, semester, marks_obtained,
             total_marks || 100, grade, grade_point, year, remarks || null]
        );

        res.status(201).json({
            success: true,
            message: `Result added. Grade: ${grade} (${grade_point})`,
            id: result.insertId, grade, grade_point
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Result already exists for this student/course/semester.' });
        }
        console.error('addResult error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── UPDATE result ────────────────────────────────────────────
const updateResult = async (req, res) => {
    try {
        const { marks_obtained, total_marks, remarks } = req.body;
        const percentage = (marks_obtained / (total_marks || 100)) * 100;
        const { grade, grade_point } = calculateGrade(percentage);

        const [result] = await db.query(
            `UPDATE results SET marks_obtained=?, total_marks=?, grade=?, grade_point=?, remarks=?
             WHERE id=?`,
            [marks_obtained, total_marks || 100, grade, grade_point, remarks || null, req.params.id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Result not found.' });
        res.json({ success: true, message: `Result updated. Grade: ${grade}`, grade, grade_point });
    } catch (err) {
        console.error('updateResult error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── DELETE result ────────────────────────────────────────────
const deleteResult = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM results WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Result not found.' });
        res.json({ success: true, message: 'Result deleted.' });
    } catch (err) {
        console.error('deleteResult error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getStudentResults, getAllResults, addResult, updateResult, deleteResult };
