const { createUser, findUserByEmail,findStudentByUserId,findTeacherByUserId } = require('../services/user')
const User=require('../models/Registration')
const Teacher=require('../models/Teacher')
const Student=require('../models/Student')
const createStudent=require("../services/studentServices")
const createTeacher=require("../services/teacherService")
const authentication=require("../middleware/auth")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const jwtSecret = process.env.jwtSecret;

const signupUser = async (req, res) => {
    const data = req.body;
    let token = null;

    try {
        data.password = bcrypt.hashSync(data.password, 8);
        const user = await createUser(data);

        if (user && user.email) {
            token = jwt.sign({ email: user.email, role: user.role }, jwtSecret, {
                expiresIn: 86400 // 24 hours
            });

            res.status(201).send({ token: token, email: user.email, msg: 'Successfully signed up' });
        } else {
            res.status(400).send({ token: token, msg: 'Could not sign up', error: user });
        }
    } catch (e) {
        res.status(500).send({ token: token, msg: 'Could not sign up', error: e.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send({ msg: 'Email and password are required.' });
        }

        // Find user by email in User collection
        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(404).send({ msg: 'User not found.' });
        }

        const authenticated = bcrypt.compareSync(password, user.password);
        if (authenticated) {
            const token = jwt.sign({ email: user.email, role: user.role }, jwtSecret, {
                expiresIn: 86400 // expires in 24 hours
            });

            let response = {
                msg: 'Login successful.',
                token,
                role: user.role,
            };

            // Based on the role, find the specific user ID
            if (user.role === 'teacher') {
                const teacher = await Teacher.findOne({ teacherId: user._id });
                response.userId = teacher._id;
            } else if (user.role === 'student') {
                const student = await Student.findOne({ studentId: user._id });
                response.userId = student._id;
            }

            res.status(200).send(response);
        } else {
            res.status(403).send({ msg: 'Incorrect email or password.' });
        }
    } catch (error) {
        console.error('Login error:', error); // Log the error
        res.status(500).send({ msg: 'An error occurred while processing your request.' });
    }
};
const logout= async (req, res) => {
    const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  res.status(200).json({ message: 'Logged out successfully' });
};


module.exports={
    loginUser,
    signupUser,logout
}