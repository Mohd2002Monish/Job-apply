const cron = require('node-cron');
const Job = require('../models/Job');
const User = require('../models/User');
const { processJobFollowUp } = require('../controllers/emailController');

// Helper function to process unsent emails (legacy method retained for start-cron compatibility)
const processUnsentEmails = async () => {
  try {
    const unsentJobs = await Job.find({ isEmailSent: false });
    for (const job of unsentJobs) {
      if (!job.userId) continue;
      const user = await User.findById(job.userId);
      if (!user) continue;

      const { generateEmailContent } = require('./geminiService');
      const activeResume = user.resumes.find(r => r.id === user.activeResumeId) || user.resumes[0] || user;
      const resumeData = activeResume.resumeData || user.resumeData;
      
      const emailText = await generateEmailContent(job, resumeData);
      if (!emailText) continue;

      const { sendEmailViaGmailAPI } = require('./emailService');
      const emailSent = await sendEmailViaGmailAPI(
        job.email,
        `Job Application: ${job.job}`,
        emailText,
        activeResume.resumePath || user.resumePath,
        user.googleTokens
      );

      if (emailSent.success) {
        job.isEmailSent = true;
        job.gmailThreadId = emailSent.threadId;
        job.followUpDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        job.followUpStatus = 'pending';
        await job.save();
      }
    }
  } catch (error) {
    console.error('Error processing unsent emails:', error);
  }
};

// Scheduler entrypoint
const startCronJob = () => {
  console.log('✅ Background task cron scheduler initialized.');

  // 1. Run unsent email processing immediately on start
  processUnsentEmails();

  // 2. Schedule daily follow-ups check at 9:00 AM every day
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running daily follow-up automation check...');
    try {
      const today = new Date();
      // Find all pending follow-ups due today or earlier
      const jobs = await Job.find({
        isEmailSent: true,
        followUpStatus: 'pending',
        followUpDate: { $lte: today }
      });

      console.log(`Found ${jobs.length} follow-up dispatches due today.`);

      for (const job of jobs) {
        if (!job.userId) {
          console.warn(`Skipping job ${job._id} follow-up: No user associated.`);
          continue;
        }

        const user = await User.findById(job.userId);
        if (!user) {
          console.warn(`Skipping job ${job._id} follow-up: User ${job.userId} not found.`);
          continue;
        }

        try {
          console.log(`Sending automated follow-up for Job: ${job.job} to Recruiter: ${job.email}`);
          await processJobFollowUp(job, user);
          console.log(`✅ Automated follow-up sent successfully for job: ${job._id}`);
        } catch (err) {
          console.error(`❌ Failed automated follow-up for job ${job._id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('Error in daily follow-up automation cron:', err.message);
    }
  });

  // 3. Schedule daily job scraper digest at 9:10 AM every day
  cron.schedule('10 9 * * *', async () => {
    console.log('⏰ Running daily job scraper digest check...');
    try {
      const users = await User.find({ 'targetProfile.digestEnabled': true });
      console.log(`Found ${users.length} users with job scraper digest enabled.`);

      const { crawlAllJobs } = require('./scraperService');
      const ScrapedJob = require('../models/ScrapedJob');
      const { sendEmailViaGmailAPI } = require('./emailService');
      const nodemailer = require('nodemailer');

      const systemTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      for (const user of users) {
        const { targetRole, targetLocation } = user.targetProfile;
        if (!targetRole) {
          console.log(`Skipping scraper digest for user ${user.email}: No targetRole set.`);
          continue;
        }

        console.log(`Running scraper digest for user ${user.email} (Role: ${targetRole}, Location: ${targetLocation})...`);
        const jobs = await crawlAllJobs(targetRole, targetLocation);

        if (!jobs || jobs.length === 0) {
          console.log(`No jobs scraped for user ${user.email} and role ${targetRole}.`);
          continue;
        }

        const savedJobs = [];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        for (const jobData of jobs) {
          // Check for duplicate scraped jobs in the last 7 days
          const duplicate = await ScrapedJob.findOne({
            userId: user._id,
            jobTitle: jobData.jobTitle,
            companyName: jobData.companyName,
            scrapedAt: { $gte: sevenDaysAgo }
          });

          if (!duplicate) {
            const newScrapedJob = new ScrapedJob({
              userId: user._id,
              ...jobData
            });
            await newScrapedJob.save();
            savedJobs.push(newScrapedJob);
          }
        }

        if (savedJobs.length === 0) {
          console.log(`All scraped jobs for user ${user.email} were already scraped recently.`);
          continue;
        }

        // Compile HTML email body
        const jobRows = savedJobs.map(job => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 8px; font-family: sans-serif; font-size: 14px; font-weight: bold; color: #1e293b;">
              ${job.jobTitle}
            </td>
            <td style="padding: 12px 8px; font-family: sans-serif; font-size: 13px; color: #475569;">
              ${job.companyName}
            </td>
            <td style="padding: 12px 8px; font-family: sans-serif; font-size: 13px; color: #64748b;">
              ${job.location || 'Remote'}
            </td>
            <td style="padding: 12px 8px; font-family: sans-serif; font-size: 12px; font-weight: bold; color: #6366f1;">
              ${job.source}
            </td>
            <td style="padding: 12px 8px; font-family: sans-serif; font-size: 13px; color: #059669; font-weight: 500;">
              ${job.salary || 'Competitive'}
            </td>
            <td style="padding: 12px 8px; font-family: sans-serif; font-size: 13px; text-align: center;">
              <a href="http://localhost:5173/?importScrapedJobId=${job._id}" 
                 style="background-color: #4f46e5; color: white; padding: 6px 12px; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: bold; display: inline-block;">
                Track Job
              </a>
            </td>
          </tr>
        `).join('');

        const emailHtml = `
          <div style="max-width: 600px; margin: 0 auto; font-family: sans-serif; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <div style="background-color: #4f46e5; color: white; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: bold;">Daily Job Discovery Digest</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Matches for "${targetRole}" in "${targetLocation || 'Anywhere'}"</p>
            </div>
            <div style="padding: 24px; background-color: #ffffff;">
              <p style="font-size: 14px; color: #334155; margin-top: 0; margin-bottom: 20px;">
                Hello ${user.name || 'Job Seeker'},<br/><br/>
                We found ${savedJobs.length} new matching job listings from your crawler integrations. You can add any of these to your job tracker with a single click.
              </p>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="border-bottom: 2px solid #cbd5e1; text-align: left;">
                    <th style="padding: 8px; font-size: 12px; text-transform: uppercase; color: #64748b;">Title</th>
                    <th style="padding: 8px; font-size: 12px; text-transform: uppercase; color: #64748b;">Company</th>
                    <th style="padding: 8px; font-size: 12px; text-transform: uppercase; color: #64748b;">Location</th>
                    <th style="padding: 8px; font-size: 12px; text-transform: uppercase; color: #64748b;">Source</th>
                    <th style="padding: 8px; font-size: 12px; text-transform: uppercase; color: #64748b;">Salary</th>
                    <th style="padding: 8px; font-size: 12px; text-transform: uppercase; color: #64748b; text-align: center;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${jobRows}
                </tbody>
              </table>

              <div style="text-align: center; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <a href="http://localhost:5173/" style="color: #4f46e5; text-decoration: none; font-size: 13px; font-weight: bold;">
                  Go to Job Discovery Panel &rarr;
                </a>
              </div>
            </div>
            <div style="background-color: #f8fafc; color: #94a3b8; padding: 16px; text-align: center; font-size: 11px; border-top: 1px solid #e2e8f0;">
              You received this email because you enabled Job Scraper digests. You can disable this anytime in your settings.
            </div>
          </div>
        `;

        const subject = `📬 [RecoCareer.ai] ${savedJobs.length} New Job Listings Scraped for "${targetRole}"`;

        // Send email
        let emailSent = false;
        if (user.googleTokens) {
          const res = await sendEmailViaGmailAPI(user.email, subject, emailHtml, null, user.googleTokens);
          emailSent = res.success;
        }

        if (!emailSent) {
          // Fallback to legacy mailer
          try {
            await systemTransporter.sendMail({
              from: process.env.EMAIL_USER,
              to: user.email,
              subject,
              html: emailHtml
            });
            console.log(`✅ Scraper digest sent via system mailer to ${user.email}`);
          } catch (mailErr) {
            console.error(`❌ Failed to send scraper digest email to ${user.email}:`, mailErr.message);
          }
        } else {
          console.log(`✅ Scraper digest sent via user Gmail API to ${user.email}`);
        }
      }
    } catch (err) {
      console.error('Error in daily scraper digest automation cron:', err.message);
    }
  });
};

module.exports = { startCronJob };
