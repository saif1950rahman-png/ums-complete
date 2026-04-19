// ============================================================
// routes/students.js
// ============================================================
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/studentController');
const { requireAdmin, requireStudent } = require('../middleware/auth');

// Public helper (for forms)
router.get('/departments',     ctrl.getDepartments);

// Student self-view — MUST be before /:id to prevent Express matching 'me' as an id param
router.get('/me/profile',      requireStudent, ctrl.getMyProfile);

// Admin-only CRUD
router.get('/',                requireAdmin,   ctrl.getAllStudents);
router.get('/:id',             requireAdmin,   ctrl.getStudentById);
router.post('/',               requireAdmin,   ctrl.addStudent);
router.put('/:id',             requireAdmin,   ctrl.updateStudent);
router.delete('/:id',          requireAdmin,   ctrl.deleteStudent);

module.exports = router;
