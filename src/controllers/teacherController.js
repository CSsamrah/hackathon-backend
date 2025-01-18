const Teacher=require('../models/Teacher')
const Assignment=require('../models/Assignment')
const Submission=require('../models/Submission')
const Student=require('../models/Student')


const getSubmittedAssignmentsForClass = async (req, res) => {
    const { teacherId } = req.params; // Assuming you get teacherId from the URL

    try {
        // Step 1: Get the class the teacher is teaching
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        const teacherClass = teacher.class;

        // Step 2: Find assignments for the class
        const assignments = await Assignment.find({ class: teacherClass });
        if (!assignments || assignments.length === 0) {
            return res.status(200).json({ message: 'No assignments found for this class' });
        }


        // Step 3: Get submissions for those assignments
        const assignmentIds = assignments.map(assignment => assignment._id);
        const submissions = await Submission.find({ assignmentId: { $in: assignmentIds }, status: 'submitted' })
            .populate('studentId')
            .populate('assignmentId');
        
            console.log('Assignments:', assignments);
            console.log('Submissions:', submissions);

        if (!submissions || submissions.length === 0) {
            return res.status(200).json({ message: 'No submissions found for these assignments' });
        }

        // Step 4: Extract relevant student and assignment information
        const result = submissions.map(submission => ({
            submissionId: submission._id, 
            studentId: submission.studentId ? submission.studentId._id : 'Unknown',
            studentName: submission.studentId ? submission.studentId.name : 'Unknown',
            assignmentId: submission.assignmentId ? submission.assignmentId._id : 'Unknown',
            assignmentTitle: submission.assignmentId ? submission.assignmentId.title : 'Unknown',
            totalMarks: submission.assignmentId ? submission.assignmentId.points : 'Unknown',
            submissionDate: submission.submissionDate,
            marks: submission.marks,
            remarks: submission.remarks
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching submitted assignments:', error);
        res.status(500).json({ message: "Failed to fetch submitted assignments", error: error.message || error });
    }
};

const getFailedAssignmentsForClass = async (req, res) => {
    const { teacherId } = req.params;

    try {
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        const teacherClass = teacher.class;

        const assignments = await Assignment.find({ class: teacherClass, dueDate: { $lt: new Date() } });
        if (!assignments || assignments.length === 0) {
            return res.status(200).json({ message: 'No overdue assignments found for this class' });
        }

        const assignmentIds = assignments.map(assignment => assignment._id.toString());

        const students = await Student.find({ class: teacherClass });
        if (!students || students.length === 0) {
            return res.status(200).json({ message: 'No students found for this class' });
        }

        const submissions = await Submission.find({
            studentId: { $in: students.map(student => student._id.toString()) },
            assignmentId: { $in: assignmentIds }
        });

        // Create a submission map to track which students submitted which assignments
        const submissionsMap = new Map();
        submissions.forEach(submission => {
            const key = `${submission.assignmentId}-${submission.studentId}`;
            submissionsMap.set(key, true);
        });

        // Track failed submissions for each assignment
        const failedAssignments = assignments.map(assignment => {
            const studentsNotSubmitted = students.filter(student => {
                const key = `${assignment._id}-${student._id}`;
                return !submissionsMap.has(key);
            });

            return {
                assignmentId: assignment._id,
                assignmentTitle: assignment.title,
                dueDate: assignment.dueDate,
                studentsNotSubmitted: studentsNotSubmitted.map(student => ({
                    studentId: student._id,
                    studentName: student.name
                }))
            };
        });

        // Filter assignments where all students submitted
        const result = failedAssignments.filter(
            assignment => assignment.studentsNotSubmitted.length > 0
        );

        res.status(200).json(result);
        console.log(result)
    } catch (error) {
        console.error('Error fetching failed assignments:', error);
        res.status(500).json({ message: "Failed to fetch failed assignments", error: error.message || error });
    }
};

const updateMarks = async (req, res) => {
    const { submissionId } = req.params;
    const { marks } = req.body;

    try {
        // Find the submission by ID and update marks
        const updatedSubmission = await Submission.findByIdAndUpdate(
            submissionId,
            { marks },
            { new: true }
        );

        if (!updatedSubmission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        res.status(200).json({ message: 'Marks updated successfully', submission: updatedSubmission });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update marks', error: error.message });
    }
};

const updateRemarks = async (req, res) => {
    const { submissionId } = req.params;
    const { remarks } = req.body;

    try {
        // Find the submission by ID and update remarks
        const updatedSubmission = await Submission.findByIdAndUpdate(
            submissionId,
            { remarks },
            { new: true }
        );

        if (!updatedSubmission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        res.status(200).json({ message: 'Remarks updated successfully', submission: updatedSubmission });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update remarks', error: error.message });
    }
};
module.exports = {
    getSubmittedAssignmentsForClass,getFailedAssignmentsForClass,updateMarks,updateRemarks
};