const mongoose = require('mongoose');
require('dotenv').config();

const dbConn = process.env.mongo;

const connectToDatabase = async function () {
    try {
        await mongoose.connect(dbConn,{
        useNewUrlParser: true,
        useUnifiedTopology: true,
        });
        
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

module.exports = connectToDatabase