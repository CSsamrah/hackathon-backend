const express = require('express');
const router = express.Router();

const {loginUser,signupUser, logout}=require('../controllers/registerControllers');
const { submitAssignment,createAssignment,getAssignmentUrl, getLeaderboard, getAssignmentsByTeacherClass, getAssignmentsByStudentClass } = require('../controllers/assignmentControllers');

const multer = require('multer');
const { getCurrentAssignments, getSubmittedAssignments, getFailedAssignments, getParticularAssignment } = require('../controllers/studentController');
const {getSubmittedAssignmentsForClass, getFailedAssignmentsForClass, updateMarks,updateRemarks}=require('../controllers/teacherController')

const authenticateToken=require("../middleware/auth")

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // limit file size to 10MB
  });


router.post('/login', loginUser);
router.post('/signup', signupUser);
router.post('/logout',authenticateToken,logout)
router.post('/submit',upload.single('file'),submitAssignment);
router.post('/create',upload.single('file'),createAssignment);
router.get('/current/:studentId',getCurrentAssignments)
router.get('/particular/:assignmentId',getParticularAssignment)
router.get('/submitted/:studentId',getSubmittedAssignments)
router.get('/failed/:studentId',getFailedAssignments)
router.get('/studentsSubmitted/:teacherId',getSubmittedAssignmentsForClass)
router.get('/studentsfailed/:teacherId',getFailedAssignmentsForClass)
router.put('/marks/:submissionId',updateMarks)
router.put('/remarks/:submissionId',updateRemarks)
router.get('/getAssignment/:submissionId', getAssignmentUrl);
router.get('/leaderboard/:assignmentId',getLeaderboard);
router.get('/classAssignments/:teacherId',getAssignmentsByTeacherClass)
router.get('/studentAssignments/:studentId',getAssignmentsByStudentClass)




module.exports = router;