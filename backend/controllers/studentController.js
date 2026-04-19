// ============================================================
// controllers/studentController.js — Student CRUD
// ============================================================
const bcrypt = require('bcryptjs');
const db     = require('../config/db');

// ── GET all students ─────────────────────────────────────────
const getAllStudents = async (req, res) => {
    try {
        const { search, dept, status } = req.query;
        let query  = `SELECT s.*, d.name AS department_name, d.code AS dept_code
                      FROM students s
                      JOIN departments d ON s.department_id = d.id
                      WHERE 1=1`;
        const params = [];

        if (search) {
            query += ' AND (s.student_id LIKE ? OR s.full_name LIKE ? OR s.email LIKE ?)';
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        if (dept)   { query += ' AND s.department_id = ?'; params.push(dept); }
        if (status) { query += ' AND s.status = ?';        params.push(status); }

        query += ' ORDER BY s.created_at DESC';

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getAllStudents error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── GET single student by DB id ──────────────────────────────
const getStudentById = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT s.*, d.name AS department_name, d.code AS dept_code
             FROM students s
             JOIN departments d ON s.department_id = d.id
             WHERE s.id = ?`, [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('getStudentById error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── GET student profile (for logged-in student) ──────────────
const getMyProfile = async (req, res) => {
    try {
        const studentDbId = req.session.student.id;
        const [rows] = await db.query(
            `SELECT s.*, d.name AS department_name, d.code AS dept_code
             FROM students s
             JOIN departments d ON s.department_id = d.id
             WHERE s.id = ?`, [studentDbId]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Profile not found.' });
        // Never expose password
        const { password, ...profile } = rows[0];
        res.json({ success: true, data: profile });
    } catch (err) {
        console.error('getMyProfile error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── ADD student ──────────────────────────────────────────────
const addStudent = async (req, res) => {
    try {
        const { student_id, full_name, email, password, department_id,
                batch, semester, phone, address } = req.body;

        if (!student_id || !full_name || !email || !password || !department_id || !batch) {
            return res.status(400).json({ success: false, message: 'Required fields missing.' });
        }

        const hashed = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO students (student_id, full_name, email, password,
              department_id, batch, semester, phone, address)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [student_id, full_name, email, hashed,
             department_id, batch, semester || 1, phone || null, address || null]
        );

        res.status(201).json({ success: true, message: 'Student added successfully.', id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Student ID or email already exists.' });
        }
        console.error('addStudent error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── EDIT student ─────────────────────────────────────────────
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, department_id, batch, semester,
                phone, address, cgpa, status, password } = req.body;

        let query  = `UPDATE students SET full_name=?, email=?, department_id=?,
                       batch=?, semester=?, phone=?, address=?, cgpa=?, status=?`;
        const params = [full_name, email, department_id, batch, semester,
                        phone || null, address || null, cgpa || 0, status || 'Active'];

        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            query  += ', password=?';
            params.push(hashed);
        }

        query += ' WHERE id=?';
        params.push(id);

        const [result] = await db.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }
        res.json({ success: true, message: 'Student updated successfully.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Email already in use.' });
        }
        console.error('updateStudent error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── DELETE student ───────────────────────────────────────────
const deleteStudent = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM students WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }
        res.json({ success: true, message: 'Student deleted successfully.' });
    } catch (err) {
        console.error('deleteStudent error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── GET departments (helper for forms) ──────────────────────
const getDepartments = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM departments ORDER BY name');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getAllStudents, getStudentById, getMyProfile, addStudent, updateStudent, deleteStudent, getDepartments };
