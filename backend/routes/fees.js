// ============================================================
// routes/fees.js — Tuition Fees API Routes
// ============================================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/feeController');
const { requireAdmin, requireStudent } = require('../middleware/auth');

// ── Admin routes ─────────────────────────────────────────────
router.get('/dashboard-stats',       requireAdmin,   ctrl.getDashboardStats);
router.get('/',                      requireAdmin,   ctrl.getAllFees);
router.post('/add-fee',              requireAdmin,   ctrl.addFee);
router.put('/update-fee/:id',        requireAdmin,   ctrl.updateFee);
router.post('/pay-fee',              requireAdmin,   ctrl.payFee);
router.delete('/delete-fee/:id',     requireAdmin,   ctrl.deleteFee);
router.get('/history/:fee_id',       requireAdmin,   ctrl.getPaymentHistory);

// Admin: get fees by student ID
router.get('/student/:student_id',   requireAdmin,   ctrl.getFeesByStudent);

// ── Student self-view (read-only) ────────────────────────────
router.get('/my-fees', requireStudent, async (req, res) => {
    req.params.student_id = req.session.student.id;
    return ctrl.getFeesByStudent(req, res);
});

module.exports = router;
