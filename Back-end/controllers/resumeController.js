const fs = require('fs');
const User = require('../models/User');
const Job = require('../models/Job');
const { parseResume } = require('../utils/resumeParser');
const { structureResume } = require('../utils/resumeStructurer');
const { exportResume, exportCoverLetter, buildClassicHTML, buildModernHTML, buildMinimalHTML, buildCreativeHTML, buildExecutiveHTML, buildProfileClassicHTML, buildProfileModernHTML, buildProfileCreativeHTML } = require('../utils/exportService');
const { generateAtsScore, analyzeJobDescription, analyzeResumeGap, generateKeywordSuggestions, calculateDeterministicAtsScore, generateCoverLetter, tailorResumeData } = require('../utils/geminiService');

/**
 * Migration helper to ensure active resume profile is loaded.
 * Backwards compatible with legacy single resume properties.
 */
const getActiveResume = (user) => {
  if (user.resumes.length === 0 && user.resumeFileName) {
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
  }

  if (user.resumes.length === 0) return null;

  const activeId = user.activeResumeId || user.resumes[0].id;
  return user.resumes.find(r => r.id === activeId) || user.resumes[0];
};

const listResumes = async (req, res) => {
  const user = req.user;
  try {
    getActiveResume(user);
    await user.save();
    res.json({
      resumes: user.resumes.map(r => ({ id: r.id, title: r.title, resumeFileName: r.resumeFileName, lastParsedAt: r.lastParsedAt })),
      activeResumeId: user.activeResumeId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const selectResume = async (req, res) => {
  const { id } = req.body;
  const user = req.user;
  try {
    const active = user.resumes.find(r => r.id === id);
    if (!active) return res.status(404).json({ error: 'Resume not found' });

    user.activeResumeId = id;
    await user.save();

    res.json({
      message: 'Resume switched successfully',
      activeResumeId: id,
      resumeData: active.resumeData,
      resumeFileName: active.resumeFileName
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteResume = async (req, res) => {
  const { id } = req.body;
  const user = req.user;
  try {
    const target = user.resumes.find(r => r.id === id);
    if (target && target.resumePath && fs.existsSync(target.resumePath)) {
      try { fs.unlinkSync(target.resumePath); } catch (_) {}
    }

    user.resumes = user.resumes.filter(r => r.id !== id);
    if (user.activeResumeId === id) {
      user.activeResumeId = user.resumes.length > 0 ? user.resumes[0].id : '';
    }
    await user.save();

    res.json({
      message: 'Resume deleted successfully',
      resumes: user.resumes.map(r => ({ id: r.id, title: r.title, resumeFileName: r.resumeFileName, lastParsedAt: r.lastParsedAt })),
      activeResumeId: user.activeResumeId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const uploadResume = async (req, res) => {
  const user = req.user;
  const title = req.body.title || req.file?.originalname.split('.')[0] || "New Resume";

  if (!req.file) {
    return res.status(400).json({ error: 'No file received.' });
  }

  // ── Step 1: Parse raw text ──
  let rawText = '';
  try {
    rawText = await parseResume(req.file.path);
    console.log(`✅ Parsed ${rawText.length} chars from ${req.file.originalname}`);
  } catch (parseErr) {
    console.error('Parse error:', parseErr.message);
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    return res.status(422).json({ error: `Could not extract text: ${parseErr.message}` });
  }

  if (!rawText || rawText.trim().length < 20) {
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    return res.status(422).json({ error: 'Could not extract enough text from the file.' });
  }

  // ── Step 2: AI structuring ──
  let resumeData = null;
  try {
    resumeData = await structureResume(rawText);
    console.log(`✅ AI structured resume`);
  } catch (aiErr) {
    console.error('AI structuring error:', aiErr.message);
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    return res.status(500).json({ error: `AI structuring failed: ${aiErr.message}` });
  }

  // ── Step 3: Save to User Resumes list
  try {
    const newResume = {
      id: Date.now().toString(),
      title,
      rawText,
      resumeData,
      resumeFileName: req.file.originalname,
      resumePath: req.file.path,
      lastParsedAt: new Date()
    };

    user.resumes.push(newResume);
    user.activeResumeId = newResume.id;
    
    // Sync legacy root fields for backward compatibility
    user.rawText = rawText;
    user.resumeData = resumeData;
    user.resumeFileName = req.file.originalname;
    user.resumePath = req.file.path;
    user.lastParsedAt = newResume.lastParsedAt;

    await user.save();
    console.log(`✅ Resume data added to resumes list for ${user.email}`);

    res.json({
      message: 'Resume uploaded and parsed successfully',
      activeResumeId: newResume.id,
      resumeData,
      resumes: user.resumes.map(r => ({ id: r.id, title: r.title, resumeFileName: r.resumeFileName, lastParsedAt: r.lastParsedAt }))
    });
  } catch (dbErr) {
    console.error('DB save error:', dbErr.message);
    res.status(500).json({ error: dbErr.message });
  }
};

const getResumeData = async (req, res) => {
  const user = req.user;
  try {
    const active = getActiveResume(user);
    await user.save();
    if (!active || !active.resumeData) {
      return res.json({ hasData: false, resumeData: null });
    }
    res.json({
      hasData: true,
      resumeData: active.resumeData,
      resumeFileName: active.resumeFileName,
      lastParsedAt: active.lastParsedAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const exportUserResume = async (req, res) => {
  const { templateId = 'classic', format = 'pdf', resumeData: clientData } = req.body;
  const user = req.user;
  
  try {
    const active = getActiveResume(user);
    await user.save();
    let resumeData = clientData || (active ? active.resumeData : null);

    if (!resumeData) {
      return res.status(404).json({ error: 'No resume data found. Please upload and parse a resume first.' });
    }

    console.log(`Exporting resume: format=${format}, template=${templateId}`);
    const { buffer, mime, ext } = await exportResume(resumeData, templateId, format);
    const filename = `resume_${templateId}_${Date.now()}.${ext}`;

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Export error:', err.message);
    res.status(500).json({ error: `Export failed: ${err.message}` });
  }
};

const previewTemplate = (req, res) => {
  const { templateId = 'classic', resumeData } = req.body;
  if (!resumeData) return res.status(400).json({ error: 'resumeData required' });

  const builders = {
    classic: buildClassicHTML,
    modern: buildModernHTML,
    minimal: buildMinimalHTML,
    creative: buildCreativeHTML,
    executive: buildExecutiveHTML,
    'profile-classic': buildProfileClassicHTML,
    'profile-modern': buildProfileModernHTML,
    'profile-creative': buildProfileCreativeHTML,
  };
  const builder = builders[templateId] || buildClassicHTML;
  const html = builder(resumeData);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};

const calculateAtsScore = async (req, res) => {
  const { jobId } = req.body;
  const user = req.user;

  try {
    const active = getActiveResume(user);
    await user.save();

    if (!active || !active.resumeData) {
      return res.status(400).json({ error: 'Please upload and parse a resume first.' });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    console.log(`Calculating ATS match score for Job ${job.job}...`);

    // Use the 2-step process: JD Analysis -> Deterministic Score
    const jdAnalysis = await analyzeJobDescription(job.description);
    const deterministicResult = calculateDeterministicAtsScore(active.resumeData, jdAnalysis);

    // Get keyword analysis
    const analysis = await generateAtsScore(job.description, active.resumeData);

    const finalAnalysis = {
      ...analysis,
      score: deterministicResult.score,
      scoreBreakdown: deterministicResult.breakdown
    };

    job.atsAnalysis = finalAnalysis;
    await job.save();

    res.json({ message: 'ATS Matching score calculated successfully', atsAnalysis: finalAnalysis });
  } catch (err) {
    console.error('ATS Scoring error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const createCoverLetter = async (req, res) => {
  const { jobId } = req.body;
  const user = req.user;

  try {
    const active = getActiveResume(user);
    await user.save();

    if (!active || !active.resumeData) {
      return res.status(400).json({ error: 'Please upload and parse a resume first.' });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    console.log(`Generating cover letter for Job ${job.job}...`);
    const letter = await generateCoverLetter(job, active.resumeData);
    job.coverLetter = letter;
    await job.save();

    res.json({ message: 'Cover letter generated successfully', coverLetter: letter });
  } catch (err) {
    console.error('Cover Letter error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const updateResumeData = async (req, res) => {
  const { resumeData } = req.body;
  const user = req.user;
  if (!resumeData) return res.status(400).json({ error: 'resumeData is required' });
  try {
    const activeId = user.activeResumeId || (user.resumes.length > 0 ? user.resumes[0].id : null);
    const resumeIdx = user.resumes.findIndex(r => r.id === activeId);
    if (resumeIdx === -1) return res.status(404).json({ error: 'Active resume not found' });
    user.resumes[resumeIdx].resumeData = resumeData;
    user.markModified('resumes');
    // Also keep root legacy field in sync
    user.resumeData = resumeData;
    await user.save();
    res.json({ message: 'Resume data updated', resumeData });
  } catch (err) {
    console.error('updateResumeData error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const exportCoverLetterDoc = async (req, res) => {
  const { jobId, format = 'pdf' } = req.body;

  try {
    const job = await Job.findById(jobId);
    if (!job || !job.coverLetter) {
      return res.status(404).json({ error: 'Cover letter not found. Generate it first.' });
    }

    console.log(`Exporting cover letter for Job ${job.job} as ${format}...`);
    const { buffer, mime, ext } = await exportCoverLetter(job.coverLetter, format);
    const filename = `cover_letter_${Date.now()}.${ext}`;

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Cover letter export error:', err.message);
    res.status(500).json({ error: `Export failed: ${err.message}` });
  }
};

/**
 * POST /resume/analyze-jd
 * Step 1: Analyze a job description and return structured JSON.
 */
const analyzeJd = async (req, res) => {
  const { jobId, jdText } = req.body;

  try {
    let text = jdText;

    // If a jobId was supplied, load jd text from the job record
    if (!text && jobId) {
      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ error: 'Job not found' });
      text = job.description || job.jdFileContent || '';
    }

    if (!text) return res.status(400).json({ error: 'jdText or jobId with description is required' });

    console.log('Analyzing job description...');
    const analysis = await analyzeJobDescription(text);
    res.json({ message: 'JD analyzed successfully', jdAnalysis: analysis });
  } catch (err) {
    console.error('JD analysis error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /resume/gap-analysis
 * Step 2: Compare user's active resume against a JD to find gaps.
 */
const gapAnalysis = async (req, res) => {
  const { jobId, jdText } = req.body;
  const user = req.user;

  try {
    const active = getActiveResume(user);
    if (!active || !active.resumeData) {
      return res.status(400).json({ error: 'Please upload and parse a resume first.' });
    }

    let text = jdText;
    if (!text && jobId) {
      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ error: 'Job not found' });
      text = job.description || job.jdFileContent || '';
    }

    if (!text) return res.status(400).json({ error: 'jdText or jobId with description is required' });

    console.log('Running gap analysis...');
    const jdAnalysis = await analyzeJobDescription(text);
    const gap = await analyzeResumeGap(active.resumeData, jdAnalysis);
    res.json({ message: 'Gap analysis complete', jdAnalysis, gapAnalysis: gap });
  } catch (err) {
    console.error('Gap analysis error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const tailorResume = async (req, res) => {
  const { jobId } = req.body;
  const user = req.user;

  try {
    const active = getActiveResume(user);
    if (!active || !active.resumeData) {
      return res.status(400).json({ error: 'Please upload and parse a resume first.' });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    console.log(`Tailoring resume for Job "${job.job}" at ${job.companyName || 'Unknown company'}...`);

    // Run 3-step chain (jdAnalysis → gapAnalysis → tailored resume)
    const tailoredData = await tailorResumeData(job.description, active.resumeData);

    // Extract metadata attached by tailorResumeData (Step 1 & 2 results)
    const jdAnalysis = tailoredData._jdAnalysis || null;
    const gapAnalysisResult = tailoredData._gapAnalysis || null;
    delete tailoredData._jdAnalysis;
    delete tailoredData._gapAnalysis;

    // Step 4: Deterministic ATS scoring
    let deterministicResult = { score: null, breakdown: {} };
    if (jdAnalysis) {
      deterministicResult = calculateDeterministicAtsScore(tailoredData, jdAnalysis);
    }

    // AI analysis for keyword lists
    console.log(`Recalculating ATS score for tailored resume...`);
    const aiAnalysis = await generateAtsScore(job.description, tailoredData);

    // Combine: deterministic score + AI keyword lists
    const finalAnalysis = {
      ...aiAnalysis,
      score: deterministicResult.score !== null ? deterministicResult.score : aiAnalysis.score,
      scoreBreakdown: deterministicResult.breakdown
    };

    // Step 5: Keyword suggestions
    let keywordSuggestions = null;
    if (jdAnalysis) {
      try {
        keywordSuggestions = await generateKeywordSuggestions(tailoredData, jdAnalysis);
      } catch (kErr) {
        console.warn('Keyword suggestions failed (non-critical):', kErr.message);
      }
    }

    // ✅ Save tailored resume PER-JOB — does NOT overwrite user's primary resume
    job.tailoredResume = {
      score: finalAnalysis.score,
      generatedAt: new Date(),
      json: tailoredData
    };
    job.atsAnalysis = finalAnalysis;
    await job.save();

    res.json({
      message: 'Resume tailored successfully',
      tailoredResumeData: tailoredData,
      atsAnalysis: finalAnalysis,
      gapAnalysis: gapAnalysisResult,
      keywordSuggestions
    });
  } catch (err) {
    console.error('Resume tailoring error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
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
  gapAnalysis,
  getActiveResume
};
