// ============================================================
// controllers/feeController.js — Tuition Fees Management
// ============================================================
const db = require('../config/db');

/**
 * Determine fee status based on paid vs total
 */
const computeStatus = (paid, total) => {
    const p = parseFloat(paid);
    const t = parseFloat(total);
    if (p >= t)  return 'Paid';
    if (p > 0)   return 'Partial';
    return 'Unpaid';
};

// ── GET fees for one student ─────────────────────────────────
const getFeesByStudent = async (req, res) => {
    try {
        const { student_id } = req.params;  // can be DB id OR student_id string

        // Resolve to DB id (handle both formats)
        const isNumeric = /^\d+$/.test(student_id);
        const whereClause = isNumeric ? 's.id = ?' : 's.student_id = ?';

        const [rows] = await db.query(
            `SELECT f.*, s.full_name, s.student_id AS student_no,
                    d.name AS department_name
             FROM fees f
             JOIN students s ON f.student_id = s.id
             JOIN departments d ON s.department_id = d.id
             WHERE ${whereClause}
             ORDER BY f.year DESC, f.semester DESC`,
            [student_id]
        );

        // Summary totals
        const summary = rows.reduce((acc, r) => {
            acc.total_fee   += parseFloat(r.total_fee);
            acc.paid_amount += parseFloat(r.paid_amount);
            acc.due_amount  += parseFloat(r.due_amount);
            return acc;
        }, { total_fee: 0, paid_amount: 0, due_amount: 0 });

        res.json({ success: true, data: rows, summary });
    } catch (err) {
        console.error('getFeesByStudent error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── GET all fees (admin overview) ────────────────────────────
const getAllFees = async (req, res) => {
    try {
        const { status, search, semester, year } = req.query;
        let query = `SELECT f.*, s.full_name, s.student_id AS student_no,
                            d.name AS dept_name, d.code AS dept_code
                     FROM fees f
                     JOIN students s ON f.student_id = s.id
                     JOIN departments d ON s.department_id = d.id
                     WHERE 1=1`;
        const params = [];

        if (status)   { query += ' AND f.status = ?';          params.push(status); }
        if (semester) { query += ' AND f.semester = ?';        params.push(semester); }
        if (year)     { query += ' AND f.year = ?';            params.push(year); }
        if (search) {
            query += ' AND (s.student_id LIKE ? OR s.full_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY f.year DESC, f.semester DESC, s.student_id ASC';

        const [rows] = await db.query(query, params);

        // Summary cards
        const summary = rows.reduce((acc, r) => {
            acc.total_fee   += parseFloat(r.total_fee);
            acc.paid_amount += parseFloat(r.paid_amount);
            acc.due_amount  += parseFloat(r.due_amount);
            if (r.status === 'Paid')    acc.paid_count++;
            if (r.status === 'Partial') acc.partial_count++;
            if (r.status === 'Unpaid')  acc.unpaid_count++;
            return acc;
        }, { total_fee: 0, paid_amount: 0, due_amount: 0, paid_count: 0, partial_count: 0, unpaid_count: 0 });

        res.json({ success: true, data: rows, summary });
    } catch (err) {
        console.error('getAllFees error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── ADD fee record ───────────────────────────────────────────
const addFee = async (req, res) => {
    try {
        const { student_id, semester, year, total_fee, due_date, notes } = req.body;

        if (!student_id || !semester || !year || !total_fee) {
            return res.status(400).json({ success: false, message: 'student_id, semester, year, total_fee are required.' });
        }

        const [result] = await db.query(
            `INSERT INTO fees (student_id, semester, year, total_fee, paid_amount, status, due_date, notes)
             VALUES (?, ?, ?, ?, 0, 'Unpaid', ?, ?)`,
            [student_id, semester, year, parseFloat(total_fee), due_date || null, notes || null]
        );

        res.status(201).json({ success: true, message: 'Fee record created.', id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Fee record already exists for this student/semester/year.' });
        }
        console.error('addFee error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── UPDATE fee (edit total, due_date, notes) ─────────────────
const updateFee = async (req, res) => {
    try {
        const { id } = req.params;
        const { total_fee, due_date, notes } = req.body;

        // Fetch current paid_amount to recalculate status
        const [rows] = await db.query('SELECT paid_amount FROM fees WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Fee record not found.' });

        const newStatus = computeStatus(rows[0].paid_amount, total_fee);

        const [result] = await db.query(
            `UPDATE fees SET total_fee=?, status=?, due_date=?, notes=? WHERE id=?`,
            [parseFloat(total_fee), newStatus, due_date || null, notes || null, id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Fee record not found.' });
        res.json({ success: true, message: 'Fee updated.', status: newStatus });
    } catch (err) {
        console.error('updateFee error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── ADD PAYMENT (partial or full) ────────────────────────────
const payFee = async (req, res) => {
    try {
        const { fee_id, amount, payment_method, transaction_id, payment_date, received_by, notes } = req.body;

        if (!fee_id || !amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'fee_id and positive amount are required.' });
        }

        // Fetch current fee record
        const [rows] = await db.query('SELECT * FROM fees WHERE id = ?', [fee_id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Fee record not found.' });

        const fee         = rows[0];
        const payAmount   = parseFloat(amount);
        const newPaid     = parseFloat(fee.paid_amount) + payAmount;
        const totalFee    = parseFloat(fee.total_fee);

        // Prevent overpayment
        if (newPaid > totalFee) {
            return res.status(400).json({
                success: false,
                message: `Payment exceeds due amount. Max payable: ৳${(totalFee - parseFloat(fee.paid_amount)).toFixed(2)}`
            });
        }

        const newStatus      = computeStatus(newPaid, totalFee);
        const payDateFinal   = payment_date || new Date().toISOString().split('T')[0];

        // Update fee record
        await db.query(
            `UPDATE fees SET paid_amount=?, status=?, last_payment_date=? WHERE id=?`,
            [newPaid, newStatus, payDateFinal, fee_id]
        );

        // Log payment history
        await db.query(
            `INSERT INTO payment_history
              (fee_id, student_id, amount_paid, payment_date, payment_method, transaction_id, received_by, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [fee_id, fee.student_id, payAmount, payDateFinal,
             payment_method || 'Cash', transaction_id || null,
             received_by || 'Admin', notes || null]
        );

        res.json({
            success: true,
            message: `Payment of ৳${payAmount.toFixed(2)} recorded successfully.`,
            new_status: newStatus,
            new_paid: newPaid,
            new_due: (totalFee - newPaid).toFixed(2)
        });
    } catch (err) {
        console.error('payFee error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── DELETE fee record ────────────────────────────────────────
const deleteFee = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM fees WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Fee record not found.' });
        res.json({ success: true, message: 'Fee record deleted.' });
    } catch (err) {
        console.error('deleteFee error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── GET payment history for a fee record ────────────────────
const getPaymentHistory = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT ph.*, s.full_name, s.student_id AS student_no
             FROM payment_history ph
             JOIN students s ON ph.student_id = s.id
             WHERE ph.fee_id = ?
             ORDER BY ph.payment_date DESC`,
            [req.params.fee_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getPaymentHistory error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── Dashboard stats ──────────────────────────────────────────
const getDashboardStats = async (req, res) => {
    try {
        const [[students]]  = await db.query('SELECT COUNT(*) AS cnt FROM students WHERE status="Active"');
        const [[courses]]   = await db.query('SELECT COUNT(*) AS cnt FROM courses');
        const [[fees]]      = await db.query(
            `SELECT SUM(total_fee) AS total, SUM(paid_amount) AS collected,
                    SUM(due_amount) AS due FROM fees`
        );
        const [[paid]]      = await db.query('SELECT COUNT(*) AS cnt FROM fees WHERE status="Paid"');
        const [[partial]]   = await db.query('SELECT COUNT(*) AS cnt FROM fees WHERE status="Partial"');
        const [[unpaid]]    = await db.query('SELECT COUNT(*) AS cnt FROM fees WHERE status="Unpaid"');

        res.json({
            success: true,
            stats: {
                active_students: students.cnt,
                total_courses:   courses.cnt,
                total_fees:      fees.total      || 0,
                collected:       fees.collected  || 0,
                due:             fees.due        || 0,
                paid_count:      paid.cnt,
                partial_count:   partial.cnt,
                unpaid_count:    unpaid.cnt
            }
        });
    } catch (err) {
        console.error('getDashboardStats error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = {
    getFeesByStudent, getAllFees, addFee, updateFee,
    payFee, deleteFee, getPaymentHistory, getDashboardStats
};
