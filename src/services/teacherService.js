const Assignment = require('../models/Assignment');
const Teacher=require('../models/Teacher')

const createAssign = async (classTeaches, points, topic, title, description, dueDate, fileUrl, courseName) => {
    try {
        const assignment = new Assignment({
            class: classTeaches,
            points: points, 
            topic,
            title,
            description,
            dueDate: new Date(dueDate), 
            courseName, 
            file: fileUrl, 
            createdAt: new Date()
        });

        await assignment.save();
        return assignment;
    } catch (error) {
        throw new Error(`Error saving assignment: ${error.message}`);
    }
};
const createTeacher = async (registrationId, name, classTeaches,email) => {
    try {
        const newTeacher = new Teacher({
            name,
            teacherId: registrationId,
            class:classTeaches,
            email
        });

        const savedTeacher = await newTeacher.save();
        return savedTeacher;
    } catch (error) {
        throw new Error(`Error creating teacher: ${error.message}`);
    }
};
module.exports = {
    createAssign,createTeacher
};
