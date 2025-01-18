const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./src/routes/mainRoutes');
const port = 8000;
const app = express();

app.use(cors({
    origin: 'https://hackathon-frontend-gules.vercel.app', // Frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
    credentials: true // Allows cookies to be sent
})); 
app.use(express.json());

let connectToDatabase = require("./dbConnect");

app.use('/api', userRoutes); // Use the routes

mongoose.set("strictQuery", false);
connectToDatabase();

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});

module.exports = app;
