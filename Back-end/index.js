require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Job = require("./models/Job");
const { startCronJob } = require("./utils/cronService");

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// MongoDB connection URI from environment variables
const dbURI = process.env.MONGODB_URI;
mongoose
    .connect(dbURI)
    .then(() => {
        console.log("MongoDB connected successfully");
        // startCronJob(); // Removed automatic start
    })
    .catch((err) => console.error("MongoDB connection error:", err));

// Route to create a new job posting
app.post("/jobs", async (req, res) => {
    try {
        const job = new Job(req.body);
        await job.save();
        res.status(201).send(job);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Route to get all job postings
app.get("/jobs", async (req, res) => {
    console.group("sjkaskdbb");
    try {
        const jobs = await Job.find({});
        res.status(200).send(jobs);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Route to start the cron job manually
app.get("/start-cron", (req, res) => {
    try {
        startCronJob();
        res.status(200).send({ message: "Cron job started successfully." });
    } catch (error) {
        res.status(500).send({ error: "Failed to start cron job." });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
