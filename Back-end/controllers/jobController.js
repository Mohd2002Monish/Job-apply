const Job = require('../models/Job');
const { parseResume } = require('../utils/resumeParser');
const { generateCustomCoverLetter, extractJobInfoFromText, generateInterviewPrepQuestions, evaluateInterviewAnswer, suggestRecruiterReply } = require('../utils/geminiService');
const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');

const getJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Scope queries to current user, falling back to legacy jobs without userId
    if (req.user) {
      query.$or = [
        { userId: req.user._id },
        { userId: { $exists: false } }
      ];
    }

    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    // Search filter (text index / regex-safe search matching multiple fields)
    if (req.query.search) {
      const searchStr = req.query.search.trim();
      if (searchStr) {
        const safeSearch = searchStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { job: { $regex: safeSearch, $options: 'i' } },
            { companyName: { $regex: safeSearch, $options: 'i' } },
            { hrName: { $regex: safeSearch, $options: 'i' } },
            { description: { $regex: safeSearch, $options: 'i' } }
          ]
        });
      }
    }

    // Sorting
    let sortQuery = { createdAt: -1 };
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sortQuery = { [parts[0]]: parts[1] === 'desc' ? -1 : 1 };
    }

    const totalJobs = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalJobs / limit);

    res.status(200).json({
      jobs,
      totalJobs,
      page,
      totalPages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createJob = async (req, res) => {
  try {
    const status = req.body.status || 'saved';
    const job = new Job({
      ...req.body,
      userId: req.user?._id,
      status,
      statusHistory: [{ status, changedAt: new Date() }]
    });
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Track status transitions and push to timeline
    if (req.body.status && req.body.status !== job.status) {
      job.statusHistory = job.statusHistory || [];
      if (job.statusHistory.length === 0) {
        job.statusHistory.push({ status: job.status, changedAt: job.createdAt || new Date() });
      }
      job.statusHistory.push({ status: req.body.status, changedAt: new Date() });
    }

    // Apply all incoming payload updates
    Object.keys(req.body).forEach(key => {
      job[key] = req.body[key];
    });

    await job.save();
    res.status(200).json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
      userId: user._id,
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

const getDueFollowups = async (req, res) => {
  try {
    const today = new Date();
    const query = {
      isEmailSent: true,
      followUpStatus: 'pending',
      followUpDate: { $lte: today }
    };
    if (req.user) {
      query.$or = [
        { userId: req.user._id },
        { userId: { $exists: false } }
      ];
    }
    const jobs = await Job.find(query).select('job companyName hrName email followUpDate');
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const negotiateSalary = async (req, res) => {
  const { id } = req.params;
  const { offeredSalary, targetSalary, currency, location } = req.body;
  const user = req.user;

  try {
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const { getActiveResume } = require('./resumeController');
    const active = getActiveResume(user);
    const resumeData = active?.resumeData || user.resumeData;

    if (!resumeData) {
      return res.status(400).json({ error: 'Please upload/parse a resume first to extract your value propositions.' });
    }

    const { getSalaryBenchmarksWithGrounding } = require('../utils/geminiService');
    
    console.log(`Analyzing salary negotiation benchmarks for ${job.job} at ${job.companyName}...`);
    
    const analysis = await getSalaryBenchmarksWithGrounding({
      jobTitle: job.job,
      location: location || job.location || user.resumeData?.personalInfo?.location || '',
      companyName: job.companyName,
      resumeData,
      offeredSalary,
      targetSalary,
      currency: currency || 'USD'
    });

    job.salaryNegotiation = {
      offeredSalary: offeredSalary || null,
      targetSalary: targetSalary || null,
      currency: currency || 'USD',
      location: location || job.location || '',
      marketLow: analysis.benchmarks?.low || null,
      marketAverage: analysis.benchmarks?.average || null,
      marketHigh: analysis.benchmarks?.high || null,
      marketInsights: analysis.benchmarks?.marketInsights || '',
      sources: analysis.sources || [],
      talkingPoints: analysis.talkingPoints || [],
      emailDraft: analysis.emailDraft || '',
      generatedAt: new Date()
    };

    await job.save();

    res.json({
      success: true,
      salaryNegotiation: job.salaryNegotiation
    });
  } catch (err) {
    console.error('Salary negotiation generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const gradeVoiceAnswer = async (req, res) => {
  const { id } = req.params;
  const { questionId, transcript, durationSeconds, pacingWpm, fillerCount } = req.body;
  try {
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const question = job.interviewQuestions.id(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const { evaluateSpokenInterviewAnswer } = require('../utils/geminiService');

    console.log(`AI Mock Delivery Grading for question: ${question.question.substring(0, 50)}...`);
    const result = await evaluateSpokenInterviewAnswer({
      question: question.question,
      transcript,
      jobDescription: job.description,
      pacingWpm: pacingWpm || 120,
      durationSeconds: durationSeconds || 30,
      fillerCount: fillerCount || {}
    });

    // Update database fields
    question.score = result.score || null;
    question.aiFeedback = result.aiFeedback || '';
    question.userNotes = transcript || ''; // Save speech transcript as notes
    await job.save();

    res.json({
      success: true,
      score: result.score,
      breakdown: result.breakdown || { content: result.score, structure: result.score, delivery: result.score },
      aiFeedback: result.aiFeedback,
      fillerAnalysis: result.fillerAnalysis || '',
      improvedVersion: result.improvedVersion || ''
    });
  } catch (err) {
    console.error('Grade spoken answer error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const getJobFormFields = async (req, res) => {
  let browser;
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Determine target URL: fallback to local mock page if not a valid URL or contains 'mock'
    const localUrl = `${req.protocol}://${req.get('host')}/mock-application-form.html`;
    const urlToScrape = job.sourceUrl && (job.sourceUrl.startsWith('http://') || job.sourceUrl.startsWith('https://')) && !job.sourceUrl.includes('mock') ? job.sourceUrl : localUrl;

    console.log(`[Autofill] Launching Puppeteer to scrape fields from: ${urlToScrape}`);
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 1000 });

    // Navigate with a timeout
    await page.goto(urlToScrape, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const frames = page.frames();
    const scrapedFields = [];

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      try {
        const frameFields = await frame.evaluate((frameIdx) => {
          const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
          const fields = [];
          
          inputs.forEach((el, index) => {
            const tagName = el.tagName.toLowerCase();
            const type = el.getAttribute('type') ? el.getAttribute('type').toLowerCase() : 'text';
            
            // Skip buttons, hidden, submit inputs
            if (tagName === 'input' && ['hidden', 'submit', 'button', 'image', 'reset'].includes(type)) {
              return;
            }
            
            let labelText = '';
            if (el.id) {
              const lbl = document.querySelector(`label[for="${el.id}"]`);
              if (lbl) labelText = lbl.innerText.trim();
            }
            if (!labelText) {
              const parentLbl = el.closest('label');
              if (parentLbl) labelText = parentLbl.innerText.trim();
            }
            if (!labelText) {
              labelText = el.getAttribute('aria-label') || '';
            }
            if (!labelText) {
              labelText = el.getAttribute('placeholder') || '';
            }
            if (!labelText) {
              labelText = el.getAttribute('name') || '';
            }
            
            labelText = labelText.replace(/[*:]/g, '').trim();
            
            let selector = '';
            if (el.id) {
              selector = `#${el.id}`;
            } else if (el.getAttribute('name')) {
              selector = `${tagName}[name="${el.getAttribute('name')}"]`;
            } else {
              const sameTag = Array.from(document.querySelectorAll(tagName));
              const idx = sameTag.indexOf(el);
              selector = `${tagName}:nth-of-type(${idx + 1})`;
            }
            
            let options = [];
            if (tagName === 'select') {
              options = Array.from(el.options).map(opt => ({
                value: opt.value,
                text: opt.text.trim()
              }));
            }
            
            fields.push({
              id: el.id || `field_${frameIdx}_${index}`,
              name: el.getAttribute('name') || '',
              type: tagName === 'textarea' ? 'textarea' : (tagName === 'select' ? 'select' : type),
              label: labelText || el.getAttribute('name') || `Field ${frameIdx}_${index + 1}`,
              placeholder: el.getAttribute('placeholder') || '',
              selector: selector,
              options: options,
              frameIndex: frameIdx
            });
          });
          return fields;
        }, i);
        
        scrapedFields.push(...frameFields);
      } catch (err) {
        console.warn(`Could not access iframe ${i}:`, err.message);
      }
    }

    await browser.close();
    browser = null;

    // Get user resume details
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    let resumeData = user.resumeData;
    if (!resumeData && user.resumes && user.resumes.length > 0) {
      const active = user.resumes.find(r => r.id === user.activeResumeId) || user.resumes[0];
      resumeData = active.resumeData;
    }

    if (!resumeData) {
      resumeData = {
        personalInfo: {
          name: user.name || 'Candidate Name',
          email: user.email || 'candidate@example.com',
          phone: '',
          location: ''
        }
      };
    }

    // Call Gemini to map fields
    const { mapFieldsForFormFill } = require('../utils/geminiService');
    const mapped = await mapFieldsForFormFill(scrapedFields, resumeData);

    job.autofillStatus = 'previewed';
    await job.save();

    res.status(200).json({
      fields: mapped,
      urlUsed: urlToScrape
    });

  } catch (err) {
    if (browser) await browser.close();
    console.error('Scrape form fields error:', err.message);
    res.status(500).json({ error: 'Failed to scan page fields. ' + err.message });
  }
};

const fillJobForm = async (req, res) => {
  let browser;
  try {
    const { mappings } = req.body;
    if (!mappings || !Array.isArray(mappings)) {
      return res.status(400).json({ error: 'Mappings array is required' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    job.autofillStatus = 'started';
    await job.save();

    const localUrl = `${req.protocol}://${req.get('host')}/mock-application-form.html`;
    const urlToScrape = job.sourceUrl && (job.sourceUrl.startsWith('http://') || job.sourceUrl.startsWith('https://')) && !job.sourceUrl.includes('mock') ? job.sourceUrl : localUrl;

    console.log(`[Autofill] Launching Puppeteer to fill form at: ${urlToScrape}`);

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 1000 });

    await page.goto(urlToScrape, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const User = require('../models/User');
    const user = await User.findById(req.user._id);

    const frames = page.frames();

    for (const mapping of mappings) {
      const frame = frames[mapping.frameIndex] || page;
      const selector = mapping.selector;
      
      try {
        const el = await frame.$(selector);
        if (!el) {
          console.warn(`[Autofill] Element not found: ${selector}`);
          continue;
        }

        if (mapping.type === 'file') {
          let uploadPath = '';
          if (mapping.mappedValue === '[RESUME_FILE]') {
            uploadPath = user.resumePath ? path.resolve(__dirname, '..', 'public', user.resumePath.replace(/^public\//, '')) : '';
            if (!uploadPath || !fs.existsSync(uploadPath)) {
              const fallbackDoc = path.resolve(__dirname, '..', 'public', 'Mohd_Monish.docx');
              if (fs.existsSync(fallbackDoc)) {
                uploadPath = fallbackDoc;
              } else {
                uploadPath = path.resolve(__dirname, '..', 'public', 'uploads', `temp_resume_${user._id}.txt`);
                fs.writeFileSync(uploadPath, user.rawText || "Mohd Monish - Resume Profile Details");
              }
            }
          } else if (mapping.mappedValue === '[COVER_LETTER_FILE]') {
            uploadPath = path.resolve(__dirname, '..', 'public', 'uploads', `temp_cl_${job._id}.txt`);
            fs.writeFileSync(uploadPath, job.coverLetter || "Dear Hiring Manager, Please find my job application...");
          }

          if (uploadPath && fs.existsSync(uploadPath)) {
            console.log(`[Autofill] Uploading file to ${selector}: ${uploadPath}`);
            await el.uploadFile(uploadPath);
          }
        } else if (mapping.type === 'select') {
          console.log(`[Autofill] Selecting ${mapping.mappedValue} in ${selector}`);
          await frame.select(selector, mapping.mappedValue);
        } else if (mapping.type === 'checkbox' || mapping.type === 'radio') {
          const valLower = String(mapping.mappedValue).toLowerCase();
          if (valLower === 'true' || valLower === 'on' || valLower === '1' || valLower === 'yes') {
            console.log(`[Autofill] Checking ${selector}`);
            const checked = await frame.evaluate((sel) => {
              const input = document.querySelector(sel);
              return input ? input.checked : false;
            }, selector);
            if (!checked) {
              await el.click();
            }
          }
        } else {
          console.log(`[Autofill] Typing value into ${selector}`);
          await frame.evaluate((sel) => {
            const input = document.querySelector(sel);
            if (input) input.value = '';
          }, selector);
          await el.type(String(mapping.mappedValue));
        }
      } catch (elErr) {
        console.error(`[Autofill] Failed to fill field ${mapping.label} (${selector}):`, elErr.message);
      }
    }

    // Let any dynamic validation script finish
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Capture screenshot
    const screenshotsDir = path.join(__dirname, '..', 'public', 'uploads', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const screenshotFilename = `screenshot_${job._id}_${Date.now()}.png`;
    const fullScreenshotPath = path.join(screenshotsDir, screenshotFilename);
    const screenshotUrl = `/uploads/screenshots/${screenshotFilename}`;

    console.log(`[Autofill] Saving screenshot to: ${fullScreenshotPath}`);
    await page.screenshot({ path: fullScreenshotPath, fullPage: false });

    await browser.close();
    browser = null;

    job.autofillScreenshot = screenshotUrl;
    job.autofillStatus = 'completed';
    job.autofillLastAttempt = new Date();
    await job.save();

    res.status(200).json({
      success: true,
      screenshotUrl,
      message: 'Application form filled out successfully!'
    });

  } catch (err) {
    if (browser) await browser.close();
    console.error('Fill form error:', err.message);
    
    const job = await Job.findById(req.params.id);
    if (job) {
      job.autofillStatus = 'failed';
      job.autofillLastAttempt = new Date();
      await job.save();
    }
    
    res.status(500).json({ error: 'Failed to fill application form. ' + err.message });
  }
};

module.exports = {
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
};
