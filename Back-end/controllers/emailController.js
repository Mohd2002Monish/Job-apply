const fs = require('fs');
const path = require('path');
const Job = require('../models/Job');
const { sendEmailViaGmailAPI, checkThreadForReply } = require('../utils/emailService');
const {
  sendEmailViaGraphAPI,
  checkOutlookThreadForReply,
  getValidMicrosoftToken,
  sendOutlookFollowUp
} = require('../utils/microsoftService');
const { generateEmailContent, generateFollowUpEmail } = require('../utils/geminiService');
const { exportResume } = require('../utils/exportService');

const wrapLinksWithTracking = (text, jobId) => {
  const trackingBaseUrl = process.env.TRACKING_BASE_URL || 'http://localhost:3000';
  const urlRegex = /(https?:\/\/[^\s<"']+)/g;
  return text.replace(urlRegex, (url) => {
    if (url.includes('/tracking/click/')) return url;
    return `${trackingBaseUrl}/tracking/click/${jobId}?url=${encodeURIComponent(url)}`;
  });
};

const apply = async (req, res) => {
  const { jobIds } = req.body;
  const user = req.user;

  if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
    return res.status(400).json({ error: 'No jobs selected.' });
  }

  // Get active resume
  const activeResume = user.resumes.find(r => r.id === user.activeResumeId) || user.resumes[0] || user;
  const resumeData = activeResume.resumeData || user.resumeData;
  const provider = user.activeProvider || 'google';

  const results = [];

  for (const jobId of jobIds) {
    let tempResumePath = null;
    try {
      const job = await Job.findById(jobId);
      if (!job) { results.push({ jobId, success: false, error: 'Job not found' }); continue; }
      if (job.isEmailSent) { results.push({ jobId, success: false, error: 'Already applied' }); continue; }

      // Use existing cover letter if present, otherwise generate dynamic email using active resume
      let emailText = job.coverLetter || '';
      if (!emailText) {
        try {
          emailText = await generateEmailContent(job, resumeData);
        } catch (err) {
          console.error(`Error generating email content with Gemini: ${err.message}`);
          results.push({ jobId, success: false, error: `AI generation failed: ${err.message}` });
          continue;
        }
      }
      if (!emailText) { results.push({ jobId, success: false, error: 'Email content generation returned empty' }); continue; }

      // HTML Conversion & Tracking Injection
      const trackingBaseUrl = process.env.TRACKING_BASE_URL || 'http://localhost:3000';
      let emailHtml = emailText.replace(/\n/g, '<br />');
      emailHtml = `
        <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
          ${emailHtml}
          <!-- Open Tracking Pixel -->
          <img src="${trackingBaseUrl}/tracking/open/${job._id}" width="1" height="1" style="display:none;" />
        </div>
      `;
      emailHtml = wrapLinksWithTracking(emailHtml, job._id);

      // Dynamic resume compilation: if resumeData is available, compile a new PDF
      let attachmentPath = activeResume.resumePath || user.resumePath;
      if (resumeData) {
        try {
          console.log(`Compiling resume PDF dynamically for ${user.email} applying to ${job.job}...`);
          const { buffer } = await exportResume(resumeData, 'classic', 'pdf');
          const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          
          tempResumePath = path.join(uploadsDir, `temp_tailored_resume_${user._id}_${Date.now()}.pdf`);
          fs.writeFileSync(tempResumePath, buffer);
          attachmentPath = tempResumePath;
          console.log(`Dynamically compiled resume saved to temp path: ${tempResumePath}`);
        } catch (exportErr) {
          console.error(`Error compiling resume dynamically: ${exportErr.message}. Falling back to default path.`);
        }
      }

      if (!attachmentPath || !fs.existsSync(attachmentPath)) {
        attachmentPath = path.join(__dirname, '..', 'public', 'Mohd_Monish.docx');
      }

      let result;
      if (provider === 'microsoft') {
        if (!user.microsoftTokens) {
          results.push({ jobId, success: false, error: 'Microsoft credentials missing. Please log in again.' });
          continue;
        }

        const fakeStore = { tokens: user.microsoftTokens };
        const fakeAuthStore = {
          set: async (email, updatedStore) => {
            user.microsoftTokens = updatedStore.tokens;
            await user.save();
          }
        };

        const token = await getValidMicrosoftToken(user.email, fakeStore, fakeAuthStore);
        result = await sendEmailViaGraphAPI(
          job.email,
          `Job Application: ${job.job}`,
          emailHtml, // Send HTML formatted body
          attachmentPath,
          token
        );
      } else {
        if (!user.googleTokens) {
          results.push({ jobId, success: false, error: 'Google credentials missing. Please log in again.' });
          continue;
        }
        result = await sendEmailViaGmailAPI(
          job.email,
          `Job Application: ${job.job}`,
          emailHtml, // Send HTML formatted body
          attachmentPath,
          user.googleTokens
        );
      }

      if (result.success) {
        job.isEmailSent = true;
        job.gmailThreadId = result.threadId || null;
        job.emailProvider = provider;
        
        // Automatically schedule follow up for 7 days in the future
        job.followUpDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        job.followUpStatus = 'pending';
        
        await job.save();
        results.push({ jobId, success: true, threadId: result.threadId });
      } else {
        results.push({ jobId, success: false, error: 'Send failed' });
      }
    } catch (err) {
      results.push({ jobId, success: false, error: err.message });
    } finally {
      if (tempResumePath && fs.existsSync(tempResumePath)) {
        try {
          fs.unlinkSync(tempResumePath);
          console.log(`Cleaned up temp tailored resume: ${tempResumePath}`);
        } catch (cleanupErr) {
          console.error(`Failed to clean up temp resume at ${tempResumePath}:`, cleanupErr.message);
        }
      }
    }
  }

  res.json({ results });
};

const checkReplies = async (req, res) => {
  const user = req.user;

  try {
    const jobs = await Job.find({ isEmailSent: true, gmailThreadId: { $ne: null } });
    const updates = [];

    for (const job of jobs) {
      const jobProvider = job.emailProvider || 'google';
      let hasReply = false;
      let replyDate = null;

      try {
        if (jobProvider === 'microsoft') {
          if (user.activeProvider !== 'microsoft' || !user.microsoftTokens) continue;

          const fakeStore = { tokens: user.microsoftTokens };
          const fakeAuthStore = {
            set: async (email, updatedStore) => {
              user.microsoftTokens = updatedStore.tokens;
              await user.save();
            }
          };

          const token = await getValidMicrosoftToken(user.email, fakeStore, fakeAuthStore);
          const replyResult = await checkOutlookThreadForReply(job.gmailThreadId, user.email, token);
          hasReply = replyResult.hasReply;
          replyDate = replyResult.replyDate;
        } else {
          if (user.activeProvider !== 'google' || !user.googleTokens) continue;

          const replyResult = await checkThreadForReply(job.gmailThreadId, user.googleTokens);
          hasReply = replyResult.hasReply;
          replyDate = replyResult.replyDate;
        }

        if (hasReply && !job.hasReply) {
          job.hasReply = true;
          job.repliedAt = replyDate || new Date();
          // Clear follow up schedule once replied
          job.followUpStatus = 'none';
          await job.save();
          updates.push({ jobId: job._id, hasReply: true, repliedAt: job.repliedAt });
        } else {
          updates.push({ jobId: job._id, hasReply: job.hasReply, repliedAt: job.repliedAt });
        }
      } catch (err) {
        console.error(`Error checking replies for job ${job._id} via ${jobProvider}:`, err.message);
      }
    }

    res.json({ checked: updates.length, updates });
  } catch (err) {
    console.error('Error checking replies:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const processJobFollowUp = async (job, user) => {
  // Retrieve active resume details
  const activeResume = user.resumes.find(r => r.id === user.activeResumeId) || user.resumes[0] || user;
  const resumeData = activeResume.resumeData || user.resumeData;

  // Generate simulated original email body to provide context to AI
  const originalEmailBody = await generateEmailContent(job, resumeData);
  
  // Generate follow up text
  const followUpText = await generateFollowUpEmail(job, originalEmailBody, activeResume);
  if (!followUpText) {
    throw new Error('Failed to generate follow-up email content.');
  }

  const provider = job.emailProvider || 'google';
  let result;

  if (provider === 'microsoft') {
    if (!user.microsoftTokens) throw new Error('Microsoft credentials missing.');
    
    const fakeStore = { tokens: user.microsoftTokens };
    const fakeAuthStore = {
      set: async (email, updatedStore) => {
        user.microsoftTokens = updatedStore.tokens;
        await user.save();
      }
    };

    const token = await getValidMicrosoftToken(user.email, fakeStore, fakeAuthStore);
    result = await sendOutlookFollowUp(job.gmailThreadId, followUpText, token);
  } else {
    if (!user.googleTokens) throw new Error('Google credentials missing.');
    
    result = await sendEmailViaGmailAPI(
      job.email,
      `Re: Job Application: ${job.job}`,
      followUpText,
      null,
      user.googleTokens,
      job.gmailThreadId
    );
  }

  if (result.success) {
    job.followUpStatus = 'sent';
    job.followUpText = followUpText;
    await job.save();
    return followUpText;
  } else {
    throw new Error('Failed to send follow-up email.');
  }
};

const sendFollowUp = async (req, res) => {
  const { jobId } = req.body;
  const user = req.user;

  try {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (!job.isEmailSent || !job.gmailThreadId) {
      return res.status(400).json({ error: 'Cannot send follow-up before applying.' });
    }

    const followUpText = await processJobFollowUp(job, user);
    res.json({ message: 'Follow-up email sent successfully!', followUpText });
  } catch (err) {
    console.error('Follow-up dispatch error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  apply,
  checkReplies,
  sendFollowUp,
  processJobFollowUp
};
