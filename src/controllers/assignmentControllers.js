const Assignment = require('../models/Assignment')
const Submission = require('../models/Submission')
const Register = require('../models/Registration')
const { createSubmission } = require('../services/studentServices')
const Teacher = require('../models/Teacher');
const Student = require('../models/Student')
const { createAssign } = require('../services/teacherService')
const mongoose = require('mongoose');


var admin = require("firebase-admin");

var serviceAccount = require("./ServiceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://assignmentproject-a5ea3.appspot.com"
});

var bucket = admin.storage().bucket();

// submit assignment 
const submitAssignment = async (req, res) => {
    const { studentId, title } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found.' });

        const assignment = await Assignment.findOne({ title });
        if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });
        const assignmentId = assignment._id;

        const blob = bucket.file(`submissions/${Date.now()}_${file.originalname}`);
        const blobStream = blob.createWriteStream({
            metadata: { contentType: file.mimetype }
        });

        blobStream.on('error', (err) => res.status(500).json({ message: 'Error uploading file', error: err }));

        blobStream.on('finish', async () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            try {
                await createSubmission(studentId, assignmentId, publicUrl);
                res.status(200).json({ message: 'Assignment submitted successfully', fileUrl: publicUrl });
            } catch (error) {
                res.status(500).json({ message: 'Error submitting assignment', error: error.message });
            }
        });

        blobStream.end(file.buffer);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const createAssignment = async (req, res) => {
    try {
        const { classTeaches, points, topic, title, description, dueDate, courseName } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).send('No file uploaded.');
        }

        const pointsNumber = Number(points);
        if (isNaN(pointsNumber)) {
            return res.status(400).send('Points must be a number.');
        }

        const blob = bucket.file(`assignments/${Date.now()}_${file.originalname}`);
        const blobStream = blob.createWriteStream({
            metadata: { contentType: file.mimetype }
        });

        blobStream.on('error', (err) => res.status(500).send(err));

        blobStream.on('finish', async () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            try {
                const assignment = await createAssign(
                    classTeaches,
                    pointsNumber,
                    topic,
                    title,
                    description,
                    dueDate,
                    publicUrl,
                    courseName
                );
                res.status(200).send({ message: 'Assignment uploaded successfully', fileUrl: publicUrl });
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        blobStream.end(file.buffer);
    } catch (error) {
        res.status(500).send({ message: 'Error creating assignment', error: error.message });
    }
};


const getAssignmentUrl = async (req, res) => {
    const { submissionId } = req.params;

    if (!submissionId || !mongoose.Types.ObjectId.isValid(submissionId)) {
        return res.status(400).json({ message: 'Invalid submission ID' });
    }

    try {
        const submission = await Submission.findById(submissionId);

        if (!submission) {
            console.error(`Submission with ID ${submissionId} not found.`);
            return res.status(404).json({ message: 'Submission not found' });
        }

        const filePath = submission.file;

        res.status(200).json({ url: filePath });
    } catch (error) {
        console.error('Error fetching assignment URL:', error);
        res.status(500).json({ message: 'Failed to fetch assignment URL', error: error.message });
    }
};

const getLeaderboard = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        // Validate that assignmentId is provided
        if (!assignmentId) {
            return res.status(400).json({ message: 'Assignment ID is required.' });
        }

        // Fetch all submissions for the given assignment
        const submissions = await Submission.find({ assignmentId })
            .populate('studentId', 'name') // Populate studentId field with student name
            .sort({ marks: -1 }); // Sort by marks in descending order

        if (!Array.isArray(submissions)) {
            console.error('Submissions is not an array:', submissions);
            return res.status(500).json({ message: 'Unexpected data structure for submissions.' });
        }

        // Handle the case where no submissions are found
        if (!submissions || submissions.length === 0) {
            return res.status(404).json({ message: 'No submissions found for the given assignment.' });
        }

        // Construct the leaderboard data
        const leaderboard = submissions.map(submission => {
            if (!submission.studentId || !submission.studentId.name) {
                console.warn(`Incomplete data for submission ID ${submission._id}`);
                return {
                    studentName: 'Unknown Student',
                    marks: submission.marks,
                    submissionDate: submission.submissionDate
                };
            }
            return {
                studentName: submission.studentId.name,
                marks: submission.marks,
                submissionDate: submission.submissionDate
            };
        });

        // Respond with the leaderboard
        res.status(200).json(leaderboard);

    } catch (error) {
        // Log the detailed error for debugging
        console.error('Error fetching leaderboard:', error);

        // Respond with a detailed error message for specific errors
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid assignment ID format.' });
        }

        // Catch any other errors and send a generic message
        res.status(500).json({ message: 'An error occurred while fetching the leaderboard.', error: error.message });
    }
};

const getAssignmentsByTeacherClass = async (req, res) => {
    try {
        const { teacherId } = req.params;

        // Find the teacher by teacherId and extract the class
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        const { class: teacherClass } = teacher;

        // Fetch assignments for the extracted class
        const assignments = await Assignment.find({ class: teacherClass }).select('title _id'); // Selecting only title and _id fields

        res.status(200).json(assignments);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ message: 'An error occurred while fetching assignments.' });
    }
};

const getAssignmentsByStudentClass = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Find the teacher by teacherId and extract the class
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'student not found' });
        }

        const studentClass = student.class;

        // Fetch assignments for the extracted class
        const assignments = await Assignment.find({ class: studentClass }).select('title _id'); // Selecting only title and _id fields

        res.status(200).json(assignments);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ message: 'An error occurred while fetching assignments.' });
    }
};

module.exports = {
    submitAssignment, createAssignment, getAssignmentUrl, getLeaderboard, getAssignmentsByTeacherClass, getAssignmentsByStudentClass
}