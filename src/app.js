const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db.js');
const authRoutes = require('./routes/authRoutes.js');
const availabilityRoutes = require('./routes/availabilityRoutes.js');
const appointmentRoutes = require('./routes/appointmentRoutes.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);

//Database connection
// Database connection
// require('./config/db.js')(); // Assuming connectDB is exported as default from db.js

module.exports = app; // Add this at the end of your app.js