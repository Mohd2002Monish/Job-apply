const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ScrapedJob = require('../models/ScrapedJob');
const Job = require('../models/Job');
const { crawlAllJobs } = require('../utils/scraperService');

// Middleware to authenticate user
const { authenticate, requireAuth } = require('../middlewares/authMiddleware');

// Get all scraped jobs matching user's profile
router.get('/', authenticate, requireAuth, async (req, res) => {
  try {
    const scrapedJobs = await ScrapedJob.find({ userId: req.user._id })
      .sort({ scrapedAt: -1 })
      .limit(100);
    res.json({ success: true, scrapedJobs });
  } catch (err) {
    console.error('Error fetching scraped jobs:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update target profile settings
router.patch('/profile', authenticate, requireAuth, async (req, res) => {
  try {
    const { targetRole, targetLocation, salaryExpectation, digestEnabled, digestFrequency } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.targetProfile = {
      targetRole: typeof targetRole === 'string' ? targetRole.trim() : user.targetProfile.targetRole,
      targetLocation: typeof targetLocation === 'string' ? targetLocation.trim() : user.targetProfile.targetLocation,
      salaryExpectation: typeof salaryExpectation === 'number' ? salaryExpectation : user.targetProfile.salaryExpectation,
      digestEnabled: typeof digestEnabled === 'boolean' ? digestEnabled : user.targetProfile.digestEnabled,
      digestFrequency: ['daily', 'weekly'].includes(digestFrequency) ? digestFrequency : user.targetProfile.digestFrequency
    };

    await user.save();
    res.json({ success: true, targetProfile: user.targetProfile });
  } catch (err) {
    console.error('Error updating target profile:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// SSE stream route for scraping progress
router.get('/stream', authenticate, requireAuth, (req, res) => {
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

// Manually trigger job scraping for target role and location
router.post('/trigger', authenticate, requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const role = user.targetProfile?.targetRole;
    if (!role) {
      return res.status(400).json({ error: 'Please set a Target Job Role in your settings before searching.' });
    }

    const location = user.targetProfile?.targetLocation || '';
    console.log(`Manual scrape triggered (Background) by ${user.email} for role "${role}" in "${location}"`);

    const { addJob } = require('../utils/queueService');
    await addJob('scrape-jobs', { userId: user._id, role, location });

    res.status(202).json({ 
      success: true, 
      message: 'Scraping task enqueued in background.'
    });
  } catch (err) {
    console.error('Error in manual scrape trigger:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Import a scraped job into the user's primary tracker
router.post('/import/:id', authenticate, requireAuth, async (req, res) => {
  try {
    const scrapedJob = await ScrapedJob.findOne({ _id: req.params.id, userId: req.user._id });
    if (!scrapedJob) {
      return res.status(404).json({ error: 'Scraped job listing not found or unauthorized.' });
    }

    // Check if user already has a tracker job for this exact role and company to prevent duplicates
    const existingTrackerJob = await Job.findOne({
      userId: req.user._id,
      job: scrapedJob.jobTitle,
      companyName: scrapedJob.companyName
    });

    if (existingTrackerJob) {
      return res.status(400).json({ error: `You are already tracking "${scrapedJob.jobTitle}" at "${scrapedJob.companyName}"!` });
    }

    // Normalize company name for default email address (required field in Job schema)
    const cleanedCompany = scrapedJob.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const defaultEmail = `hr@${cleanedCompany || 'company'}.com`;

    // Create new main Job entry
    const newJob = new Job({
      userId: req.user._id,
      job: scrapedJob.jobTitle,
      companyName: scrapedJob.companyName,
      email: defaultEmail, // Satisfy validation
      description: scrapedJob.description || `Scraped from ${scrapedJob.source}. View listing at: ${scrapedJob.url}`,
      status: 'saved',
      statusHistory: [{ status: 'saved', changedAt: new Date() }],
      followUpStatus: 'none'
    });

    await newJob.save();

    // Mark as imported
    scrapedJob.imported = true;
    await scrapedJob.save();

    res.json({ 
      success: true, 
      message: `Successfully tracking "${scrapedJob.jobTitle}" at "${scrapedJob.companyName}"!`,
      job: newJob 
    });
  } catch (err) {
    console.error('Error importing scraped job:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Live external search portal
router.get('/search', authenticate, requireAuth, async (req, res) => {
  try {
    const { role, location } = req.query;
    if (!role) {
      return res.status(400).json({ error: 'Search role is required' });
    }

    console.log(`Live external search for role: "${role}", location: "${location || 'any'}"`);
    
    // Call the scraper dynamically
    const results = await crawlAllJobs(role, location || '');
    
    // Check user's tracked jobs to flag already imported ones
    const existingJobs = await Job.find({ userId: req.user._id });
    const formattedResults = results.map(j => {
      const isAlreadyTracked = existingJobs.some(ej => 
        (ej.sourceUrl === j.url) || 
        (ej.job.toLowerCase() === j.jobTitle.toLowerCase() && ej.companyName.toLowerCase() === j.companyName.toLowerCase())
      );
      return {
        ...j,
        imported: isAlreadyTracked
      };
    });

    res.json({ success: true, results: formattedResults });
  } catch (err) {
    console.error('Error during live external search:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Import an external search job directly
router.post('/import-external', authenticate, requireAuth, async (req, res) => {
  try {
    const { jobTitle, companyName, location, salary, description, url, source } = req.body;
    if (!jobTitle || !companyName) {
      return res.status(400).json({ error: 'Job title and company name are required.' });
    }

    // Check for duplicates
    const existingTrackerJob = await Job.findOne({
      userId: req.user._id,
      $or: [
        { sourceUrl: url },
        { job: jobTitle, companyName: companyName }
      ]
    });

    if (existingTrackerJob) {
      return res.status(400).json({ error: `You are already tracking "${jobTitle}" at "${companyName}"!` });
    }

    // Clean company name for default email address
    const cleanedCompany = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const defaultEmail = `hr@${cleanedCompany || 'company'}.com`;

    const newJob = new Job({
      userId: req.user._id,
      job: jobTitle,
      companyName: companyName,
      email: defaultEmail,
      description: description || `Scraped from ${source}. View listing at: ${url}`,
      sourceUrl: url,
      status: 'saved',
      statusHistory: [{ status: 'saved', changedAt: new Date() }],
      followUpStatus: 'none'
    });

    await newJob.save();

    res.json({
      success: true,
      message: `Successfully tracking "${jobTitle}" at "${companyName}"!`,
      job: newJob
    });
  } catch (err) {
    console.error('Error importing external job:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
