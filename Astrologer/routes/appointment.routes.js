const express = require('express');
const router = express.Router();
const {
    createAppointment,
    getAllAppointments,
    getAppointmentById,
    updateAppointmentStatus,
    deleteAppointment
} = require('../controller/appointment.controller');

router.post('/create', createAppointment);
router.get('/all', getAllAppointments);
router.get('/:id', getAppointmentById);
router.put('/:id', updateAppointmentStatus);
router.delete('/:id', deleteAppointment);

module.exports = router;
