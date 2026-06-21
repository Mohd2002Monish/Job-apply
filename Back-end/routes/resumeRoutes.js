const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  uploadResume,
  getResumeData,
  exportUserResume,
  previewTemplate,
  listResumes,
  selectResume,
  deleteResume,
  updateResumeData,
  calculateAtsScore,
  createCoverLetter,
  exportCoverLetterDoc,
  tailorResume,
  analyzeJd,
  gapAnalysis
} = require('../controllers/resumeController');
const { authenticate, requireAuth } = require('../middlewares/authMiddleware');
const { aiLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// ─── Multer (resume uploads) ───────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resume_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Only PDF, Word, or Image files allowed'));
  },
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// Single & Multiple Resume operations
router.post('/upload-resume', authenticate, requireAuth, upload.single('resume'), uploadResume);
router.get('/resume-data', authenticate, requireAuth, getResumeData);
router.post('/export-resume', authenticate, requireAuth, exportUserResume);
router.post('/preview-template', authenticate, requireAuth, previewTemplate);

// Multi-resume routes
router.get('/resume/list', authenticate, requireAuth, listResumes);
router.post('/resume/select', authenticate, requireAuth, selectResume);
router.post('/resume/delete', authenticate, requireAuth, deleteResume);
router.put('/resume/update', authenticate, requireAuth, updateResumeData);

// ATS & Cover Letter routes
router.post('/resume/ats-score', authenticate, requireAuth, aiLimiter, calculateAtsScore);
router.post('/resume/cover-letter', authenticate, requireAuth, aiLimiter, createCoverLetter);
router.post('/resume/cover-letter/export', authenticate, requireAuth, exportCoverLetterDoc);
router.post('/resume/tailor', authenticate, requireAuth, aiLimiter, tailorResume);

// ATS Pipeline routes (Step 1 & Step 2)
router.post('/resume/analyze-jd', authenticate, requireAuth, aiLimiter, analyzeJd);
router.post('/resume/gap-analysis', authenticate, requireAuth, aiLimiter, gapAnalysis);

// SSE Stream route for resume tailoring progress
router.get('/resume/stream', authenticate, requireAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const { addClient, removeClient } = require('../utils/sseService');
  addClient(req.user._id, res);

  res.write(`data: ${JSON.stringify({ message: 'connected' })}\n\n`);

  req.on('close', () => {
    removeClient(req.user._id, res);
  });
});

module.exports = router;
