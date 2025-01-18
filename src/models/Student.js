const mongoose = require('mongoose');
const { Schema } = mongoose;

const StudentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    class: { type: String, required: true },
    scores: { type: Number, default: 0 },
    email:{ type: String, required: true, unique: true }
});

 const Student= mongoose.model('Student', StudentSchema);
 module.exports=Student;