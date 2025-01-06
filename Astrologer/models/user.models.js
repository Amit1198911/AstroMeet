const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    email : {
        type: String,
        required: true,
        unique: true
    },
    password : {
        type: String,
        required: true
    },
    role : {
        type: String,
        default: "user",
        enum: ["user", "admin"]
    },
    assignedAstrologer : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Astro"
    }
},{
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);