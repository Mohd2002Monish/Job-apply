const Job = require('../models/Job');
const { parseResume } = require('../utils/resumeParser');
const { generateCustomCoverLetter, extractJobInfoFromText, generateInterviewPrepQuestions, evaluateInterviewAnswer, suggestRecruiterReply } = require('../utils/geminiService');
const fs = require('fs');

const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({});
    res.status(200).send(jobs);
  } catch (error) {
    res.status(500).send(error);
  }
};

const createJob = async (req, res) => {
  try {
    const job = new Job(req.body);
    await job.save();
    res.status(201).send(job);
  } catch (error) {
    res.status(400).send(error);
  }
};

const getAnalytics = async (req, res) => {
  try {
    const total = await Job.countDocuments({});
    const applied = await Job.countDocuments({ isEmailSent: true });
    const pending = total - applied;
    const replied = await Job.countDocuments({ hasReply: true });

    // Funnel calculations
    const responseRate = applied > 0 ? Math.round((replied / applied) * 100) : 0;

    // Average time to reply (in hours)
    const jobsWithReplies = await Job.find({ hasReply: true, repliedAt: { $ne: null } });
    let avgReplyTimeHours = 0;
    if (jobsWithReplies.length > 0) {
      let totalDiffMs = 0;
      let counted = 0;
      jobsWithReplies.forEach(j => {
        const appliedDate = j.updatedAt || j.createdAt;
        const diff = new Date(j.repliedAt) - new Date(appliedDate);
        if (diff > 0) {
          totalDiffMs += diff;
          counted++;
        }
      });
      if (counted > 0) {
        avgReplyTimeHours = Math.round((totalDiffMs / counted) / (1000 * 60 * 60));
      }
    }

    res.json({
      total,
      applied,
      pending,
      replied,
      responseRate,
      avgReplyTimeHours
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.status(200).send(job);
  } catch (error) {
    res.status(400).send(error);
  }
};

/**
 * Extract job info from an uploaded file (PDF, DOCX, image/LinkedIn screenshot).
 * Returns: { jobTitle, hrName, hrEmail, companyName, description, rawText }
 * Does NOT save to DB — caller uses this to pre-fill the "Add HR Contact" form.
 */
const extractJdInfo = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const rawText = await parseResume(req.file.path);
    if (!rawText || rawText.trim().length < 10) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(422).json({ error: 'Could not extract meaningful text from the file. Try a clearer image or a text-based PDF.' });
    }

    console.log(`✅ JD extract: ${rawText.length} chars from ${req.file.originalname}`);

    // Use Gemini to structure the raw text
    const extracted = await extractJobInfoFromText(rawText);

    // Clean up temp file
    try { fs.unlinkSync(req.file.path); } catch (_) {}

    res.json({
      ...extracted,
      rawText,
      fileName: req.file.originalname,
    });
  } catch (err) {
    console.error('extractJdInfo error:', err.message);
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    res.status(500).json({ error: err.message });
  }
};

/**
 * Extract job info from a URL using Puppeteer and Gemini AI.
 * Scrapes the URL, extracts details, calculates ATS score, and saves the job to the DB.
 */
const extractUrlInfo = async (req, res) => {
  const { url } = req.body;
  const user = req.user;

  if (!url) return res.status(400).json({ error: 'URL is required' });

  let browser;
  try {
    const puppeteer = require('puppeteer');
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Extract visible text from the page body
    const rawText = await page.evaluate(() => document.body.innerText);
    await browser.close();

    if (!rawText || rawText.trim().length < 50) {
      return res.status(422).json({ error: 'Could not extract meaningful text from the provided URL.' });
    }

    console.log(`✅ URL extract: ${rawText.length} chars from ${url}`);

    // Use Gemini to structure the raw text
    const extracted = await extractJobInfoFromText(rawText);

    // Prepare job data
    const jobData = {
      job: extracted.jobTitle || 'Unknown Title',
      companyName: extracted.companyName || 'Unknown Company',
      hrName: extracted.hrName || '',
      email: extracted.hrEmail || '',
      description: extracted.description || rawText.substring(0, 5000), // Fallback if AI fails to isolate description
      sourceUrl: url,
    };

    const job = new Job(jobData);

    // Calculate ATS Score if user has a resume
    const { getActiveResume } = require('./resumeController');
    const active = getActiveResume(user);
    if (active && active.resumeData) {
      console.log(`Calculating ATS match score for scraped job ${job.job}...`);
      try {
        const { generateAtsScore } = require('../utils/geminiService');
        const analysis = await generateAtsScore(job.description, active.resumeData);
        job.atsAnalysis = analysis;
      } catch (atsErr) {
        console.error('Failed to calculate ATS score in background during url extract:', atsErr.message);
      }
    }

    await job.save();
    res.status(201).json(job);
  } catch (err) {
    if (browser) await browser.close();
    console.error('extractUrlInfo error:', err.message);
    res.status(500).json({ error: 'Failed to scrape or analyze the URL. ' + err.message });
  }
};

/**
 * Upload and parse a job description file (PDF, DOCX, image).
 * Stores extracted text + file metadata on the job document.
 */
const uploadJobDescription = async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const rawText = await parseResume(req.file.path);
    if (!rawText || rawText.trim().length < 10) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(422).json({ error: 'Could not extract meaningful text from the file.' });
    }

    const job = await Job.findByIdAndUpdate(
      id,
      {
        jdFileContent: rawText,
        jdFilePath: req.file.path,
        jdFileName: req.file.originalname,
        description: rawText  // also update description field
      },
      { new: true }
    );
    if (!job) return res.status(404).json({ error: 'Job not found' });

    console.log(`✅ JD file parsed for job ${id}: ${rawText.length} chars from ${req.file.originalname}`);
    res.json({ message: 'Job description file parsed successfully', rawText, job });
  } catch (err) {
    console.error('JD upload error:', err.message);
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    res.status(500).json({ error: err.message });
  }
};

/**
 * Generate a customized cover letter for a specific job using Gemini AI.
 * Accepts wordCount, industry, tone, description override, and customInstructions.
 */
const generateCoverLetterCustom = async (req, res) => {
  const { id } = req.params;
  const { wordCount, industry, tone, description, customInstructions } = req.body;
  const user = req.user;

  try {
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Get active resume data from user
    let resumeData = null;
    if (user) {
      if (user.resumes && user.resumes.length === 0 && user.resumeFileName) {
        user.resumes.push({
          id: 'default',
          title: 'Default Resume',
          rawText: user.rawText,
          resumeData: user.resumeData,
          resumeFileName: user.resumeFileName,
          resumePath: user.resumePath,
          lastParsedAt: user.lastParsedAt
        });
        user.activeResumeId = 'default';
        await user.save();
      }
      const activeId = user.activeResumeId || (user.resumes && user.resumes[0]?.id);
      const activeResume = (user.resumes && user.resumes.find(r => r.id === activeId)) || (user.resumes && user.resumes[0]) || user;
      resumeData = (activeResume && activeResume.resumeData) || user.resumeData || null;
    }

    console.log(`Generating custom cover letter for job ${id} — tone: ${tone}, words: ${wordCount}, industry: ${industry}`);
    console.log(`Using resumeData: ${resumeData ? 'Found (name: ' + resumeData.personalInfo?.name + ', title: ' + resumeData.personalInfo?.jobTitle + ')' : 'None (fallback to generic)'}`);


    const letter = await generateCustomCoverLetter(
      {
        jobTitle: job.job,
        hrName: job.hrName || '',
        companyName: job.companyName || '',
        description: description || job.description,
        wordCount: parseInt(wordCount) || 300,
        industry: industry || 'Technology',
        tone: tone || 'Professional',
        customInstructions: customInstructions || ''
      },
      resumeData
    );

    // Save the generated letter back to the job
    job.coverLetter = letter;
    await job.save();

    res.json({ coverLetter: letter, job });
  } catch (err) {
    console.error('Custom cover letter generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const deleteJob = async (req, res) => {
  const { id } = req.params;
  try {
    const job = await Job.findByIdAndDelete(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const trackOpen = async (req, res) => {
  const { id } = req.params;
  try {
    const job = await Job.findById(id);
    if (job) {
      job.isOpened = true;
      if (!job.openedAt) {
        job.openedAt = new Date();
      }
      await job.save();
    }
  } catch (err) {
    console.error('Open tracking error:', err.message);
  }

  // Return a transparent 1x1 GIF
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private'
  });
  res.end(pixel);
};

const trackClick = async (req, res) => {
  const { id } = req.params;
  const { url } = req.query;
  try {
    const decodedUrl = url ? decodeURIComponent(url) : null;
    const job = await Job.findById(id);
    if (job && decodedUrl) {
      job.linkClicksCount += 1;
      job.clicks.push({ url: decodedUrl, clickedAt: new Date() });
      await job.save();
    }

    if (decodedUrl) {
      return res.redirect(302, decodedUrl);
    }
  } catch (err) {
    console.error('Click tracking error:', err.message);
  }
  res.redirect(302, 'http://localhost:5173/');
};

const importJobFromExtension = async (req, res) => {
  const { jobTitle, companyName, location, description, hrName, email } = req.body;
  const user = req.user;

  if (!jobTitle || !companyName || !email || !description) {
    return res.status(400).json({ error: 'Job title, company name, email, and description are required.' });
  }

  try {
    const jobData = {
      job: jobTitle,
      companyName,
      location: location || '',
      description,
      hrName: hrName || '',
      email,
    };

    const job = new Job(jobData);

    const { getActiveResume } = require('./resumeController');
    const active = getActiveResume(user);
    if (active && active.resumeData) {
      console.log(`Calculating ATS match score for imported job ${job.job}...`);
      try {
        const { generateAtsScore } = require('../utils/geminiService');
        const analysis = await generateAtsScore(description, active.resumeData);
        job.atsAnalysis = analysis;
      } catch (atsErr) {
        console.error('Failed to calculate ATS score in background during import:', atsErr.message);
      }
    }

    await job.save();
    res.status(201).json(job);
  } catch (error) {
    console.error('Import job error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────── Phase 4: Interview Prep ─────────────────────────

const generateInterviewPrep = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  try {
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const { getActiveResume } = require('./resumeController');
    const active = getActiveResume(user);

    console.log(`Generating interview prep questions for Job: ${job.job}...`);
    const result = await generateInterviewPrepQuestions(job.description, active?.resumeData || null);

    const questions = (result.questions || []).map(q => ({
      question: q.question || '',
      type: q.type || 'Technical',
      suggestedPoints: q.suggestedPoints || '',
      userNotes: '',
      aiFeedback: '',
      score: null
    }));

    job.interviewQuestions = questions;
    job.interviewPrepGeneratedAt = new Date();
    await job.save();

    res.json({ message: 'Interview prep generated', interviewQuestions: job.interviewQuestions, interviewPrepGeneratedAt: job.interviewPrepGeneratedAt });
  } catch (err) {
    console.error('Interview prep error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const saveInterviewNotes = async (req, res) => {
  const { id } = req.params;
  const { questionId, userNotes } = req.body;
  try {
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const question = job.interviewQuestions.id(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    question.userNotes = userNotes || '';
    await job.save();

    res.json({ message: 'Notes saved', question });
  } catch (err) {
    console.error('Save notes error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const gradeInterviewAnswer = async (req, res) => {
  const { id } = req.params;
  const { questionId } = req.body;
  try {
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const question = job.interviewQuestions.id(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    console.log(`Grading interview answer for question: ${question.question.substring(0, 50)}...`);
    const result = await evaluateInterviewAnswer(question.question, question.userNotes, job.description);

    question.score = result.score || null;
    question.aiFeedback = result.aiFeedback || '';
    await job.save();

    res.json({ message: 'Answer graded', score: result.score, aiFeedback: result.aiFeedback, improvedVersion: result.improvedVersion });
  } catch (err) {
    console.error('Grade answer error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────── Phase 5: Recruiter Inbox ────────────────────────

const getRecruiterMessages = async (req, res) => {
  const { id } = req.params;
  try {
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ recruiterMessages: job.recruiterMessages || [] });
  } catch (err) {
    console.error('Get messages error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const addRecruiterMessage = async (req, res) => {
  const { id } = req.params;
  const { from, subject, body, isFromRecruiter } = req.body;
  try {
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const message = {
      from: from || '',
      subject: subject || '',
      body: body || '',
      receivedAt: new Date(),
      isFromRecruiter: isFromRecruiter !== false
    };

    job.recruiterMessages.push(message);
    if (isFromRecruiter) {
      job.hasReply = true;
      job.repliedAt = new Date();
    }
    await job.save();

    res.status(201).json({ message: 'Message added', recruiterMessages: job.recruiterMessages });
  } catch (err) {
    console.error('Add message error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const suggestReply = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  try {
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const messages = job.recruiterMessages || [];
    const latestRecruiterMsg = messages.filter(m => m.isFromRecruiter).pop();

    if (!latestRecruiterMsg) {
      return res.status(400).json({ error: 'No recruiter message found to reply to.' });
    }

    const { getActiveResume } = require('./resumeController');
    const active = getActiveResume(user);

    console.log(`Generating AI reply suggestion for Job: ${job.job}...`);
    const result = await suggestRecruiterReply(
      latestRecruiterMsg.body,
      job.job,
      job.companyName,
      active?.resumeData || null
    );

    res.json({ suggestedReply: result.suggestedReply, subject: result.subject });
  } catch (err) {
    console.error('Suggest reply error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getJobs,
  createJob,
  getAnalytics,
  updateJob,
  extractJdInfo,
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
};
