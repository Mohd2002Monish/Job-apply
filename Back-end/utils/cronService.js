const Job = require("../models/Job");
const { sendEmail } = require("./emailService");
const { generateEmailContent } = require("./chatGptService");

// Function to process unsent emails
const processUnsentEmails = async () => {
    try {
        // Find all jobs where emails haven't been sent
        const unsentJobs = await Job.find({ isEmailSent: false });
        for (const job of unsentJobs) {
            // Generate personalized email content using ChatGPT
            const emailText = await generateEmailContent(job);
            if (!emailText) {
                console.error(`Failed to generate email content for job: ${job._id}`);
                continue;
            }

            // Send email
            const emailSent = await sendEmail(job.email, `Job Application: ${job.job}`, emailText);

            if (emailSent) {
                // Update the job document to mark email as sent
                job.isEmailSent = true;
                await job.save();
                console.log(`Email sent successfully for job: ${job._id}`);
            }
        }
    } catch (error) {
        console.error("Error processing unsent emails:", error);
    }
};

// Run processUnsentEmails immediately when called
const startCronJob = async () => {
    console.log("Running processUnsentEmails immediately...");
    await processUnsentEmails();
};

module.exports = { startCronJob };
