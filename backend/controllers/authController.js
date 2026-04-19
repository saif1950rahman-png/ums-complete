// ============================================================
// controllers/authController.js — Login / Logout logic
// ============================================================
const bcrypt = require('bcryptjs');
const db     = require('../config/db');

// ── Admin Login ──────────────────────────────────────────────
const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }

        const [rows] = await db.query(
            'SELECT * FROM admins WHERE username = ?', [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const admin = rows[0];

        // Try bcrypt compare first
        let match = false;
        try {
            match = await bcrypt.compare(password, admin.password);
        } catch(e) {
            match = false;
        }

        // Fallback: if hash is invalid/old, do direct compare then re-hash
        if (!match && admin.password === password) {
            match = true;
        }

        // Fallback: master password from env for recovery
        if (!match && process.env.MASTER_PASSWORD && password === process.env.MASTER_PASSWORD) {
            match = true;
        }

        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // If password matched but not via bcrypt, update to proper hash
        const isBcrypt = admin.password.startsWith('$2');
        if (!isBcrypt) {
            const newHash = await bcrypt.hash(password, 10);
            await db.query('UPDATE admins SET password = ? WHERE id = ?', [newHash, admin.id]);
        }

        req.session.admin = { id: admin.id, username: admin.username, full_name: admin.full_name };
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ success: false, message: 'Session error.' });
            }
            return res.json({ success: true, message: 'Login successful.', admin: req.session.admin });
        });

    } catch (err) {
        console.error('adminLogin error:', err);
        return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
};

// ── Admin Logout ─────────────────────────────────────────────
const adminLogout = (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true, message: 'Logged out.' });
    });
};

// ── Student Login ────────────────────────────────────────────
const studentLogin = async (req, res) => {
    try {
        const { student_id, password } = req.body;

        if (!student_id || !password) {
            return res.status(400).json({ success: false, message: 'Student ID and password are required.' });
        }

        const [rows] = await db.query(
            `SELECT s.*, d.name AS department_name, d.code AS dept_code
             FROM students s
             JOIN departments d ON s.department_id = d.id
             WHERE s.student_id = ?`, [student_id]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid Student ID or password.' });
        }

        const student = rows[0];

        let match = false;
        try {
            match = await bcrypt.compare(password, student.password);
        } catch(e) {
            match = false;
        }

        if (!match && student.password === password) {
            match = true;
        }

        if (!match && process.env.MASTER_PASSWORD && password === process.env.MASTER_PASSWORD) {
            match = true;
        }

        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid Student ID or password.' });
        }

        if (student.status === 'Inactive') {
            return res.status(403).json({ success: false, message: 'Your account is inactive. Contact admin.' });
        }

        // Re-hash if not bcrypt
        const isBcrypt = student.password.startsWith('$2');
        if (!isBcrypt) {
            const newHash = await bcrypt.hash(password, 10);
            await db.query('UPDATE students SET password = ? WHERE id = ?', [newHash, student.id]);
        }

        req.session.student = {
            id:              student.id,
            student_id:      student.student_id,
            full_name:       student.full_name,
            email:           student.email,
            department_name: student.department_name,
            dept_code:       student.dept_code,
            semester:        student.semester,
            batch:           student.batch,
            cgpa:            student.cgpa
        };

        req.session.save((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Session error.' });
            }
            return res.json({ success: true, message: 'Login successful.', student: req.session.student });
        });

    } catch (err) {
        console.error('studentLogin error:', err);
        return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
};

// ── Student Logout ───────────────────────────────────────────
const studentLogout = (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true, message: 'Logged out.' });
    });
};

// ── Check session status ─────────────────────────────────────
const checkSession = (req, res) => {
    if (req.session && req.session.admin) {
        return res.json({ success: true, role: 'admin', user: req.session.admin });
    }
    if (req.session && req.session.student) {
        return res.json({ success: true, role: 'student', user: req.session.student });
    }
    return res.json({ success: false, message: 'No active session.' });
};

module.exports = { adminLogin, adminLogout, studentLogin, studentLogout, checkSession };
