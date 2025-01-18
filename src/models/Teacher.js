const mongoose = require('mongoose');
const { Schema } = mongoose;

const TeacherSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    class: { type: String, required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User',required: true }
});

const Teacher= mongoose.model('Teacher', TeacherSchema);
module.exports =Teacher;