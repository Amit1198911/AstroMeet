const mongoose = require('mongoose');

const astroSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    curr_connections: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    isTopAstro : {
        type: Boolean,
        default: false
    },
    flow_multiplier : {
        type: Number,
        default: 1
    },
    specialization : {
        type: String,
    },
    availability  : {
        type: Boolean,
        default: true
    }

},{
    timestamps: true
});

module.exports = mongoose.model('Astro', astroSchema);