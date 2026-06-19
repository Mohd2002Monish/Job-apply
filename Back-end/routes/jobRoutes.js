const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getJobs,
  createJob,
  getAnalytics,
  updateJob,
  extractJdInfo,
  extractUrlInfo,
  uploadJobDescription,
  generateCoverLetterCustom,
  deleteJob,
  trackOpen,
  trackClick,
  importJobFromExtension,
  generateInterviewPrep,
  saveInterviewNotes,
  gradeInterviewAnswer,
  getRecruiterMessages,
  addRecruiterMessage,
  suggestReply
} = require('../controllers/jobController');
const { authenticate, requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

// ─── Tracking Routes (Public, no authentication) ─────────────────────────────
router.get('/tracking/open/:id', trackOpen);
router.get('/tracking/click/:id', trackClick);

// ─── Multer for Job Description file uploads ──────────────────────────────────
const jdUploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'jd');
if (!fs.existsSync(jdUploadsDir)) fs.mkdirSync(jdUploadsDir, { recursive: true });

const jdStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, jdUploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `jd_${Date.now()}${ext}`);
  },
});

const jdUpload = multer({
  storage: jdStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Only PDF, Word, or Image files allowed'));
  },
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// ─── Routes ───────────────────────────────────────────────────────────────────
router.get('/', authenticate, requireAuth, getJobs);
router.post('/', authenticate, requireAuth, createJob);
router.get('/analytics', authenticate, requireAuth, getAnalytics);

// Import a job via the Chrome Extension
router.post('/import', authenticate, requireAuth, importJobFromExtension);

// Extract info from a JD file (PDF/DOCX/image) BEFORE saving a job
// Must be defined before /:id routes so Express doesn't treat 'extract-jd' as an ID
router.post('/extract-jd', authenticate, requireAuth, jdUpload.single('jdFile'), extractJdInfo);
router.post('/extract-url', authenticate, requireAuth, extractUrlInfo);

router.patch('/:id', authenticate, requireAuth, updateJob);
router.delete('/:id', authenticate, requireAuth, deleteJob);

// Job description file upload — parses file and saves extracted text to job
router.post('/:id/upload-jd', authenticate, requireAuth, jdUpload.single('jdFile'), uploadJobDescription);

// Custom cover letter generation with user options
router.post('/:id/generate-cover-letter', authenticate, requireAuth, generateCoverLetterCustom);

// ─── Phase 4: Interview Prep ──────────────────────────────────────────────────
router.post('/:id/interview-prep', authenticate, requireAuth, generateInterviewPrep);
router.patch('/:id/interview-notes', authenticate, requireAuth, saveInterviewNotes);
router.post('/:id/grade-answer', authenticate, requireAuth, gradeInterviewAnswer);

// ─── Phase 5: Recruiter Inbox ─────────────────────────────────────────────────
router.get('/:id/messages', authenticate, requireAuth, getRecruiterMessages);
router.post('/:id/messages', authenticate, requireAuth, addRecruiterMessage);
router.post('/:id/suggest-reply', authenticate, requireAuth, suggestReply);

module.exports = router;
