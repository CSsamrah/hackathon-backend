const Assignment=require("../models/Assignment")
const Student=require('../models/Student')
const Submission=require('../models/Submission')

const getCurrentAssignments = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Validate studentId
        if (!studentId) {
            return res.status(400).json({ message: "Student ID is required" });
        }

        // Fetch student
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        const studentClass = student.class;

        // Fetch assignments
        const futureAssignments = await Assignment.find({
            class: studentClass,
            dueDate: { $gte: new Date() }
        });

        if (!futureAssignments.length) {
            return res.status(200).json({ message: "No current assignments available" });
        }

        // Fetch submissions
        const studentSubmissions = await Submission.find({
            studentId,
            assignmentId: { $in: futureAssignments.map(a => a._id) }
        });

        // Filter unsubmitted assignments
        const submittedAssignmentIds = new Set(
            studentSubmissions.map(sub => sub.assignmentId.toString())
        );

        const unsubmittedAssignments = futureAssignments.filter(
            assignment => !submittedAssignmentIds.has(assignment._id.toString())
        );

        if (!unsubmittedAssignments.length) {
            return res.status(200).json({ message: "All assignments have been submitted" });
        }

        res.status(200).json(unsubmittedAssignments);
    } catch (error) {
        console.error("Error fetching current assignments:", error);
        res.status(500).json({ message: "Failed to fetch current assignments", error });
    }
};

const getSubmittedAssignments = async (req, res) => {
    const { studentId } = req.params;

    try {
        const submissions = await Submission.find({ studentId }).populate('assignmentId');
        res.status(200).json(submissions);
        
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch submitted assignments", error });
    }
};
const getFailedAssignments = async (req, res) => {
    const { studentId } = req.params;

    try {
       
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        const assignments = await Assignment.find({ class: student.class });

        const submissions = await Submission.find({ studentId });

        const submittedAssignmentIds = submissions.map(submission => submission.assignmentId.toString());

        // Filter assignments where the student has not submitted and the due date has passed
        const failedAssignments = assignments.filter(assignment => 
            !submittedAssignmentIds.includes(assignment._id.toString()) &&
            new Date(assignment.dueDate) < new Date()
        );
        res.status(200).json(failedAssignments);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch failed assignments", error });
    }
};

const getLeaderboard = async (req, res) => {
    try {
        // Fetch all submissions
        const submissions = await Submission.find();

        // Create a map to store the highest marks for each student
        const studentMarksMap = new Map();

        submissions.forEach(submission => {
            const studentId = submission.studentId.toString();
            const marks = submission.marks;

            if (!studentMarksMap.has(studentId) || studentMarksMap.get(studentId) < marks) {
                studentMarksMap.set(studentId, marks);
            }
        });

        // Convert the map to an array of objects
        const leaderboard = [];
        for (const [studentId, marks] of studentMarksMap) {
            const student = await Student.findById(studentId);
            if (student) {
                leaderboard.push({
                    studentId,
                    studentName: student.name,
                    marks
                });
            }
        }

        // Sort the leaderboard by marks in descending order
        leaderboard.sort((a, b) => b.marks - a.marks);

        // Return the leaderboard
        res.status(200).json(leaderboard);
    } catch (error) {
        // Handle errors and send appropriate response
        res.status(500).json({ message: "Failed to fetch leaderboard", error });
    }
};

const getParticularAssignment = async (req, res) => {
    const { assignmentId } = req.params;
    console.log(`Received request for assignment ID: ${assignmentId}`);

    try {
        const assignment = await Assignment.findById(assignmentId);
        console.log(`Assignment found: ${assignment}`);

        if (!assignment) {
            console.log(`Assignment not found with ID: ${assignmentId}`);
            return res.status(404).json({ message: 'Assignment not found' });
        }

        res.status(200).json({
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            points:assignment.points
        });
    } catch (error) {
        console.error(`Error retrieving assignment: ${error.message}`);
        res.status(500).json({ message: 'Error retrieving assignment', error: error.message });
    }
};

module.exports={
    getCurrentAssignments,getSubmittedAssignments,getFailedAssignments,getLeaderboard,getParticularAssignment
}