const express = require('express');
const app = express();
require('dotenv').config();
const connectDB = require('./db/db');
const userRoutes = require('./routes/user.routes.js');
const astroRoutes = require('./routes/astro.routes.js');
const appointmentRoutes = require('./routes/appointment.routes.js');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/v1/users',userRoutes);
app.use('/api/v1/astrologers', astroRoutes);
app.use('/api/v1/appointments', appointmentRoutes);

const PORT = process.env.PORT || 3000;

connectDB();
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
