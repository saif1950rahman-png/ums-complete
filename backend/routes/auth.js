// ============================================================
// routes/auth.js
// ============================================================
const express = require('express');
const router  = express.Router();
const { adminLogin, adminLogout, studentLogin, studentLogout, checkSession } = require('../controllers/authController');

router.post('/admin/login',    adminLogin);
router.post('/admin/logout',   adminLogout);
router.post('/student/login',  studentLogin);
router.post('/student/logout', studentLogout);
router.get('/session',         checkSession);

module.exports = router;
