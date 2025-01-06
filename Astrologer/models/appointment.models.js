const mongoose = require('mongoose');

const appointment = new mongoose.Schema({
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    astroId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Astro',
        required: true
    },
    appointmentDate : {
        type: Date,
        required: true
    },
    status : {
        type: String,
        default: 'pending',
        enum: ['pending', 'approved', 'rejected']
    },

},{
    timestamps: true
});

module.exports = mongoose.model('Appointment', appointment);