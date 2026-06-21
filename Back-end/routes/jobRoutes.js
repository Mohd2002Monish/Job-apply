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
  suggestReply,
  getDueFollowups,
  negotiateSalary,
  gradeVoiceAnswer,
  getJobFormFields,
  fillJobForm
} = require('../controllers/jobController');
const { authenticate, requireAuth } = require('../middlewares/authMiddleware');
const { validate, createJobSchema, updateJobSchema, salaryNegotiationSchema } = require('../middlewares/validate');
const { aiLimiter } = require('../middlewares/rateLimiter');
const { checkLimits, incrementAiUsage } = require('../middlewares/subscriptionMiddleware');


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
router.post('/', authenticate, requireAuth, checkLimits('job'), validate(createJobSchema), createJob);
router.get('/analytics', authenticate, requireAuth, getAnalytics);
router.get('/due-followups', authenticate, requireAuth, getDueFollowups);

// Import a job via the Chrome Extension
router.post('/import', authenticate, requireAuth, checkLimits('job'), importJobFromExtension);

// Extract info from a JD file (PDF/DOCX/image) BEFORE saving a job
// Must be defined before /:id routes so Express doesn't treat 'extract-jd' as an ID
router.post('/extract-jd', authenticate, requireAuth, checkLimits('ai'), aiLimiter, jdUpload.single('jdFile'), incrementAiUsage, extractJdInfo);
router.post('/extract-url', authenticate, requireAuth, checkLimits('ai'), aiLimiter, incrementAiUsage, extractUrlInfo);

router.patch('/:id', authenticate, requireAuth, validate(updateJobSchema), updateJob);
router.delete('/:id', authenticate, requireAuth, deleteJob);

// Job description file upload — parses file and saves extracted text to job
router.post('/:id/upload-jd', authenticate, requireAuth, jdUpload.single('jdFile'), uploadJobDescription);

// Custom cover letter generation with user options
router.post('/:id/generate-cover-letter', authenticate, requireAuth, checkLimits('ai'), aiLimiter, incrementAiUsage, generateCoverLetterCustom);

// ─── Phase 4: Interview Prep ──────────────────────────────────────────────────
router.post('/:id/interview-prep', authenticate, requireAuth, checkLimits('ai'), aiLimiter, incrementAiUsage, generateInterviewPrep);
router.patch('/:id/interview-notes', authenticate, requireAuth, saveInterviewNotes);
router.post('/:id/grade-answer', authenticate, requireAuth, checkLimits('ai'), aiLimiter, incrementAiUsage, gradeInterviewAnswer);

// ─── Phase 5: Recruiter Inbox ─────────────────────────────────────────────────
router.get('/:id/messages', authenticate, requireAuth, getRecruiterMessages);
router.post('/:id/messages', authenticate, requireAuth, addRecruiterMessage);
router.post('/:id/suggest-reply', authenticate, requireAuth, checkLimits('ai'), aiLimiter, incrementAiUsage, suggestReply);

// ─── Phase 5 (Salary Negotiation): AI Negotiation Agent ───────────────────────
router.post('/:id/salary-negotiation', authenticate, requireAuth, validate(salaryNegotiationSchema), checkLimits('ai'), aiLimiter, incrementAiUsage, negotiateSalary);

// ─── Phase 6: Voice Interview Prep ────────────────────────────────────────────
router.post('/:id/grade-voice-answer', authenticate, requireAuth, checkLimits('ai'), aiLimiter, incrementAiUsage, gradeVoiceAnswer);

// ─── Phase 10: Auto Form-Fill ────────────────────────────────────────────────
router.get('/:id/form-fields', authenticate, requireAuth, getJobFormFields);
router.post('/:id/form-fill', authenticate, requireAuth, fillJobForm);

module.exports = router;
