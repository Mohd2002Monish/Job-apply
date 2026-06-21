require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const emailRoutes = require("./routes/emailRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const scrapedJobRoutes = require("./routes/scrapedJobRoutes");
const stripeRoutes = require("./routes/stripeRoutes");

const { startCronJob } = require("./utils/cronService");

const app = express();
const port = process.env.PORT || 3000;

const { globalLimiter } = require("./middlewares/rateLimiter");

// Enable trust proxy for accurate IP rate-limiting behind reverse proxies
app.set("trust proxy", 1);

// Apply global rate limiting to all requests
app.use(globalLimiter);


// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowed = ["http://localhost:5173", "http://localhost:5174", "http://localhost:4173"];
    if (!origin || allowed.includes(origin) || origin.startsWith("chrome-extension://")) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));

// ─── Request Logger ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`→ ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

// ─── MongoDB ───────────────────────────────────────────────────────────────────
let dbConnected = false;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => { console.log("MongoDB connected"); dbConnected = true; })
  .catch((err) => {
    console.error("MongoDB error:", err.message);
  });

process.on("uncaughtException", (err) => console.error("Uncaught:", err.message));
process.on("unhandledRejection", (err) => console.error("Rejection:", err?.message));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", db: dbConnected ? "connected" : "disconnected" });
});

app.use("/auth", authRoutes);
app.use("/jobs", jobRoutes);
app.use("/", emailRoutes); // Mounts /apply and /emails/replies
app.use("/", resumeRoutes); // Mounts /upload-resume, /resume-data, /export-resume, /preview-template
app.use("/scraped-jobs", scrapedJobRoutes);
app.use("/", stripeRoutes);

// ─── Legacy cron route ─────────────────────────────────────────────────────────
app.get("/start-cron", (req, res) => {
  try {
    startCronJob();
    res.status(200).send({ message: "Cron job started." });
  } catch (error) {
    res.status(500).send({ error: "Failed to start cron job." });
  }
});

// ─── Start server ──────────────────────────────────────────────────────────────
app.listen(port, () => console.log(`Server running on port ${port}`));
