const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
    {
        job: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            unique: true,
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [/^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/, "Please fill a valid email address"],
        },
        description: {
            type: String,
            required: false,
            trim: true,
        },
        number: {
            type: String,
            required: false,
            trim: true,
        },
        recuiterName: {
            type: String,
            required: false,
            trim: true,
        },
        city: {
            type: String,
            required: false,
            trim: true,
        },
        isEmailSent: {
            type: Boolean,
            default: false,
        },
        includeInCron: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;