const redis = require('redis');
const Appointment = require('../models/appointment.models.js');

// Create Redis client
const redisClient = redis.createClient();

// Handle Redis errors
redisClient.on('error', (err) => {
    console.log('Redis Error:', err);
});

// @desc Create a new appointment
// @route POST /api/v1/appointments
exports.createAppointment = async (req, res) => {
    try {
        const { userId, astroId, appointmentDate } = req.body;
        const newAppointment = new Appointment({
            userId,
            astroId,
            appointmentDate,
            status: 'pending',
        });

        const savedAppointment = await newAppointment.save();
        
        // Clear cached appointments to ensure data consistency
        redisClient.del('allAppointments');

        res.status(201).json(savedAppointment);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create appointment', error });
    }
};

// @desc Get all appointments (with caching)
// @route GET /api/v1/appointments
exports.getAllAppointments = async (req, res) => {
    redisClient.get('allAppointments', async (err, data) => {
        if (err) throw err;

        if (data) {
            // Cache hit – return cached data
            return res.status(200).json(JSON.parse(data));
        } else {
            try {
                const appointments = await Appointment.find()
                    .populate('userId', 'name email')
                    .populate('astroId', 'name specialization');

                // Store the data in Redis cache with 1-hour TTL
                redisClient.setex('allAppointments', 3600, JSON.stringify(appointments));

                res.status(200).json(appointments);
            } catch (error) {
                res.status(500).json({ message: 'Failed to fetch appointments', error });
            }
        }
    });
};

// @desc Get an appointment by ID (with caching)
// @route GET /api/v1/appointments/:id
exports.getAppointmentById = async (req, res) => {
    const appointmentId = req.params.id;

    redisClient.get(`appointment:${appointmentId}`, async (err, data) => {
        if (err) throw err;

        if (data) {
            // Cache hit
            return res.status(200).json(JSON.parse(data));
        } else {
            try {
                const appointment = await Appointment.findById(appointmentId)
                    .populate('userId', 'name email')
                    .populate('astroId', 'name specialization');

                if (!appointment) {
                    return res.status(404).json({ message: 'Appointment not found' });
                }

                // Cache the result with 1-hour TTL
                redisClient.setex(`appointment:${appointmentId}`, 3600, JSON.stringify(appointment));

                res.status(200).json(appointment);
            } catch (error) {
                res.status(500).json({ message: 'Error retrieving appointment', error });
            }
        }
    });
};

// @desc Update an appointment's status by ID
// @route PUT /api/v1/appointments/:id
exports.updateAppointmentStatus = async (req, res) => {
    const { status } = req.body;
    const appointmentId = req.params.id;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { status },
            { new: true, runValidators: true }
        );

        if (!updatedAppointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Update cache after modifying appointment
        redisClient.setex(`appointment:${appointmentId}`, 3600, JSON.stringify(updatedAppointment));
        redisClient.del('allAppointments');  // Clear cached list

        res.status(200).json(updatedAppointment);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update appointment', error });
    }
};

// @desc Delete an appointment by ID
// @route DELETE /api/v1/appointments/:id
exports.deleteAppointment = async (req, res) => {
    const appointmentId = req.params.id;

    try {
        const deletedAppointment = await Appointment.findByIdAndDelete(appointmentId);

        if (!deletedAppointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Remove from Redis cache
        redisClient.del(`appointment:${appointmentId}`);
        redisClient.del('allAppointments');

        res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete appointment', error });
    }
};
