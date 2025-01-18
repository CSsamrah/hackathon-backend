const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssignmentSchema = new mongoose.Schema({
    class: { type: String, required: true },
    points: { type: Number, required: true },  // Ensure points is of type Number
    dueDate: { type: Date, required: true },
    topic: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    courseName: { type: String, required: true }, // Make sure this field is provided
    file: { type: String, required: true },  // Ensure file is of type String
    createdAt: { type: Date, default: Date.now }
});

const Assignment = mongoose.model('Assignment', AssignmentSchema);
module.exports =Assignment;