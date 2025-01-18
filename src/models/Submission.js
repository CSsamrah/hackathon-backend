const mongoose = require('mongoose');
const { Schema } = mongoose;

const SubmissionSchema = new mongoose.Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    submissionDate: { type: Date, required: true },
    marks: { type: Number, default: 0 },
    remarks: { type: String, default: '' },
    status: { type: String, enum: ['submitted', 'failed'], required: true },
    file: { type: String, required: true }
});

const Submission = mongoose.model('Submission', SubmissionSchema);
module.exports=Submission;
