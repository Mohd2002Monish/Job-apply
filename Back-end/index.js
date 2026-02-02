require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Job = require("./models/Job");
const Contact = require("./models/Contact");
const {
  startCronJob,
  singleSend,
} = require("./utils/cronService");
const { sendEmail } = require("./utils/emailService");

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// MongoDB connection URI from environment variables
const dbURI = process.env.MONGO_URI;
mongoose
  .connect(dbURI)
  .then(() => {
    console.log("MongoDB connected successfully");
    // startCronJob(); // Removed automatic start
  })
  .catch((err) =>
    console.error("MongoDB connection error:", err)
  );

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
app.get("/", async (req, res) => {
  res.send("node s working fine");
});

// Route to get all job postings
app.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find({});
    res.status(200).send(jobs);
  } catch (error) {
    res.status(500).send(error);
  }
});
app.get("/send-mail-single", async (req, res) => {
  const id = req.query.id;

  try {
    const job = await Job.findOne({ _id: id });
    if (!job) {
      return res
        .status(404)
        .send({ error: "Job not found." });
    }

    const emailContent = `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <p>
      Dear ${job?.recuiterName || "Hiring Manager"},
    </p>

    <p>
      I am applying for the <strong>${
        job?.job
      } Developer</strong> role. With
      <strong>3+ years of experience</strong>, I have built scalable applications
      using React.js/Next.js, Node.js, Express.js, MongoDB, AWS, and Docker.
    </p>

    <p>
      I have independently developed and deployed production-ready systems and
      enjoy building clean, efficient, and user-focused solutions.
    </p>

    <p>
      <strong>Total Experience:</strong> 3+ Years<br />
      <strong>Notice Period:</strong> Immediate
    </p>

    <p>
      Regards,<br />
      <strong>Mohd Monish</strong><br />
      +91 8532083765
    </p>
  </body>
</html>`;

    const success = await sendEmail(
      job?.email,
      `Job Application For ${job?.job} Developer`,
      emailContent
    );

    if (success) {
      res.status(200).send({
        message: "Email sent successfully.",
        success: true,
        jobTitle: job.job,
        recruiterEmail: job.email,
      });
    } else {
      res.status(500).send({
        error: "Failed to send email. Please try again.",
        success: false,
      });
    }
  } catch (error) {
    res.status(500).send({
      error: "Failed to send email. " + error.message,
      success: false,
    });
  }
});
app.put("/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!job)
      return res
        .status(404)
        .send({ error: "Job not found." });
    res.status(200).send(job);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.delete("/delete-job", async (req, res) => {
  const id = req.query.id;
  try {
    await Job.deleteOne({ _id: id });
    res
      .status(200)
      .send({ message: "deleted successfully." });
  } catch (error) {
    res
      .status(500)
      .send({ error: "Failed to start send-mail-single." });
  }
});

// Route to send emails to all jobs
app.get("/send-mail-all", async (req, res) => {
  try {
    const jobs = await Job.find({});
    let successCount = 0;
    let failureCount = 0;
    for (const job of jobs) {
      const emailContent = `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <p>
      Dear ${job?.recuiterName || "Hiring Manager"},
    </p>

    <p>
      I am applying for the <strong>${
        job?.job
      } Developer</strong> role. With
      <strong>3+ years of experience</strong>, I have built scalable applications
      using React.js/Next.js, Node.js, Express.js, MongoDB, AWS, and Docker.
    </p>

    <p>
      I have independently developed and deployed production-ready systems and
      enjoy building clean, efficient, and user-focused solutions.
    </p>

    <p>
      <strong>Total Experience:</strong> 3+ Years<br />
      <strong>Notice Period:</strong> Immediate
    </p>

    <p>
      Regards,<br />
      <strong>Mohd Monish</strong><br />
      +91 8532083765
    </p>
  </body>
</html>`;

      const success = await sendEmail(
        job?.email,
        `Job Application For ${job?.job} Developer`,
        emailContent
      );

      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    res.status(200).send({
      message: `Emails sent successfully. Success: ${successCount}, Failed: ${failureCount}`,
      successCount,
      failureCount,
      totalJobs: jobs.length,
    });
  } catch (error) {
    res
      .status(500)
      .send({
        error: "Failed to send emails to all jobs.",
      });
  }
});

// Route to start the cron job manually
app.get("/start-cron", (req, res) => {
  try {
    startCronJob();
    res
      .status(200)
      .send({ message: "Cron job started successfully." });
  } catch (error) {
    res
      .status(500)
      .send({ error: "Failed to start cron job." });
  }
});

// ============ CONTACTS CRUD OPERATIONS ============

// Route to create a new contact
app.post("/contacts", async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    res.status(201).send(contact);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Route to get all contacts
app.get("/contacts", async (req, res) => {
  try {
    const contacts = await Contact.find({});
    res.status(200).send(contacts);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Route to get a single contact by ID
app.get("/contacts/:id", async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact)
      return res
        .status(404)
        .send({ error: "Contact not found." });
    res.status(200).send(contact);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Route to update a contact
app.put("/contacts/:id", async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!contact)
      return res
        .status(404)
        .send({ error: "Contact not found." });
    res.status(200).send(contact);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Route to delete a contact
app.delete("/contacts/:id", async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(
      req.params.id
    );
    if (!contact)
      return res
        .status(404)
        .send({ error: "Contact not found." });
    res
      .status(200)
      .send({ message: "Contact deleted successfully." });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
