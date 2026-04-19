// ============================================================
// routes/courses.js
// ============================================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/courseController');
const { requireAdmin } = require('../middleware/auth');

router.get('/',        ctrl.getAllCourses);    // public (students can view)
router.get('/:id',     ctrl.getCourseById);
router.post('/',       requireAdmin, ctrl.addCourse);
router.put('/:id',     requireAdmin, ctrl.updateCourse);
router.delete('/:id',  requireAdmin, ctrl.deleteCourse);

// ============================================================
// routes/results.js  (defined inline below, exported together)
// ============================================================
const exRouter  = express.Router();
const rCtrl     = require('../controllers/resultController');
const { requireAdmin: rAdmin, requireStudent } = require('../middleware/auth');

exRouter.get('/all',           rAdmin,         rCtrl.getAllResults);
exRouter.get('/student/:id',   rAdmin,         rCtrl.getStudentResults);
exRouter.get('/me',            requireStudent, async (req, res) => {
    req.params.id = req.session.student.id;
    return rCtrl.getStudentResults(req, res);
});
exRouter.post('/',             rAdmin,         rCtrl.addResult);
exRouter.put('/:id',           rAdmin,         rCtrl.updateResult);
exRouter.delete('/:id',        rAdmin,         rCtrl.deleteResult);

module.exports.courseRouter  = router;
module.exports.resultRouter  = exRouter;
