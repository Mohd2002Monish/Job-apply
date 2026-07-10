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
const adminRoutes = require("./routes/adminRoutes");
const referralRoutes = require("./routes/referralRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const { startCronJob } = require("./utils/cronService");
const { authenticate, requireOwner } = require("./middlewares/authMiddleware");

const app = express();
const port = process.env.PORT || 3000;

const contextStore = require("./utils/contextStore");
app.use((req, res, next) => {
  contextStore.run(req, next);
});

const { globalLimiter } = require("./middlewares/rateLimiter");

// Enable trust proxy for accurate IP rate-limiting behind reverse proxies
app.set("trust proxy", 1);

// Apply global rate limiting to all requests
app.use(globalLimiter);


// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // 5173/5174 vite dev, 4173 vite preview, 8081 expo web (Mobile-App)
    const allowed = ["http://localhost:5173", "http://localhost:5174", "http://localhost:4173", "http://localhost:8081"];
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

// 3mb limit: WYSIWYG resume exports POST the rendered editor HTML for pixel-perfect PDFs
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true, limit: '3mb' }));
app.use(cookieParser());

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

// ─── MongoDB ───────────────────────────────────────────────────────────────────
let dbConnected = false;
const seedAiModels = require("./utils/seedAiModels");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("MongoDB connected");
    dbConnected = true;
    await seedAiModels();
  })
  .catch((err) => {
    console.error("MongoDB error:", err.message);
  });

process.on("uncaughtException", (err) => console.error("Uncaught:", err.message));
process.on("unhandledRejection", (err) => console.error("Rejection:", err?.message));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", db: dbConnected ? "connected" : "disconnected" });
});

app.get("/api-docs", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "api-docs.html"));
});

app.use("/auth", authRoutes);
app.use("/jobs", jobRoutes);
app.use("/", emailRoutes);       // Mounts /apply and /emails/replies
app.use("/", resumeRoutes);      // Mounts /upload-resume, /resume-data, /export-resume
app.use("/scraped-jobs", scrapedJobRoutes);
app.use("/", paymentRoutes);     // Mounts /packages, /payment/*, /payment/webhook/*
app.use("/admin", adminRoutes);
app.use("/", referralRoutes);

// ─── Legacy cron route — owner only ───────────────────────────────────────────
app.get("/start-cron", authenticate, requireOwner, (req, res) => {
  try {
    startCronJob();
    res.status(200).send({ message: "Cron job started." });
  } catch (error) {
    res.status(500).send({ error: "Failed to start cron job." });
  }
});

// ─── Start server ──────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

module.exports = app;
