// ============================================================
// middleware/auth.js — Session-based authentication guards
// ============================================================

/**
 * Require admin session to proceed
 */
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.admin) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'Admin authentication required.' });
};

/**
 * Require student session to proceed
 */
const requireStudent = (req, res, next) => {
    if (req.session && req.session.student) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'Student authentication required.' });
};

module.exports = { requireAdmin, requireStudent };
