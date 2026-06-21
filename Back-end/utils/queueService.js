// queueService.js
// Asynchronous background task queue manager with Redis/BullMQ detection and MemoryQueue fallback.

const { emitToUser } = require('./sseService');

let redisAvailable = false;
let Queue = null;
let Worker = null;
let taskQueue = null;

try {
  const ioredis = require('ioredis');
  const bullmq = require('bullmq');
  
  const connection = new ioredis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
    connectTimeout: 2000
  });

  connection.on('connect', () => {
    console.log('✅ Redis connected successfully. Initializing BullMQ tasks...');
    redisAvailable = true;
    Queue = bullmq.Queue;
    Worker = bullmq.Worker;
    taskQueue = new Queue('JobTasks', { connection });
    initializeBullWorkers(connection);
  });

  connection.on('error', (err) => {
    console.warn('⚠️ Redis down or connection timed out. Switching to MemoryQueue event loop...');
    redisAvailable = false;
  });
} catch (e) {
  console.log('ℹ️ BullMQ or ioredis packages not found. Operating with MemoryQueue fallback.');
  redisAvailable = false;
}

// MemoryQueue fallback class matching standard BullMQ interface
class MemoryQueue {
  async add(jobName, data) {
    console.log(`[MemoryQueue] Enqueued task: ${jobName}`);
    setImmediate(async () => {
      try {
        await processJob(jobName, data);
      } catch (err) {
        console.error(`[MemoryQueue] Task execution failed for ${jobName}:`, err.message);
      }
    });
    return { id: `mem_${Date.now()}` };
  }
}

const memoryQueue = new MemoryQueue();

const addJob = async (jobName, data) => {
  if (redisAvailable && taskQueue) {
    try {
      const job = await taskQueue.add(jobName, data);
      console.log(`[BullMQ] Enqueued task ${job.id} for: ${jobName}`);
      return job;
    } catch (err) {
      console.error('[BullMQ] Failed to add task, falling back to MemoryQueue:', err.message);
      return await memoryQueue.add(jobName, data);
    }
  } else {
    return await memoryQueue.add(jobName, data);
  }
};

// Background task execution handler
const processJob = async (jobName, data) => {
  console.log(`[QueueWorker] Processing task: ${jobName}`);
  
  if (jobName === 'scrape-jobs') {
    const { userId, role, location } = data;
    const { crawlAllJobs } = require('./scraperService');
    const ScrapedJob = require('../models/ScrapedJob');

    emitToUser(userId, 'scrape-progress', { progress: 10, log: '⚙️ Initializing crawler cluster...' });
    await new Promise(r => setTimeout(r, 800));

    emitToUser(userId, 'scrape-progress', { progress: 30, log: '🕵️‍♂️ Spoofing request agent and loading search parameters...' });
    await new Promise(r => setTimeout(r, 800));

    emitToUser(userId, 'scrape-progress', { progress: 50, log: `🔗 Searching matching listings for "${role}"...` });
    
    // Trigger crawler
    const jobs = await crawlAllJobs(role, location);
    emitToUser(userId, 'scrape-progress', { progress: 75, log: '📋 Parsing matched results grid...' });
    await new Promise(r => setTimeout(r, 800));

    const savedJobs = [];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const jobData of jobs) {
      const duplicate = await ScrapedJob.findOne({
        userId,
        jobTitle: jobData.jobTitle,
        companyName: jobData.companyName,
        scrapedAt: { $gte: sevenDaysAgo }
      });

      if (!duplicate) {
        const newScraped = new ScrapedJob({ userId, ...jobData });
        await newScraped.save();
        savedJobs.push(newScraped);
      }
    }

    emitToUser(userId, 'scrape-progress', { 
      progress: 100, 
      log: `✅ Complete! Found ${jobs.length} matches. Synced ${savedJobs.length} new listings.`,
      status: 'complete'
    });
  } 
  
  else if (jobName === 'tailor-resume') {
    const { userId, jobId } = data;
    const Job = require('../models/Job');
    const User = require('../models/User');
    const { 
      tailorResumeData, 
      calculateDeterministicAtsScore, 
      generateAtsScore, 
      generateKeywordSuggestions 
    } = require('./geminiService');

    emitToUser(userId, 'tailor-progress', { jobId, progress: 10, log: '⚙️ Querying database credentials...' });
    await new Promise(r => setTimeout(r, 800));

    const job = await Job.findById(jobId);
    const user = await User.findById(userId);

    if (!job || !user) {
      emitToUser(userId, 'tailor-progress', { jobId, progress: 100, log: '❌ Error: Job or user not found.', status: 'failed' });
      return;
    }

    emitToUser(userId, 'tailor-progress', { jobId, progress: 30, log: '🧠 Analyzing job description & gaps...' });
    
    const activeResume = user.resumes.find(r => r.id === user.activeResumeId) || user.resumes[0] || user;
    const resumeData = activeResume.resumeData || user.resumeData;

    try {
      // Step 1: Run 3-step chain (jdAnalysis → gapAnalysis → tailored resume)
      emitToUser(userId, 'tailor-progress', { jobId, progress: 50, log: '🧠 Synthesizing resume data against target description...' });
      const tailoredData = await tailorResumeData(job.description, resumeData);

      // Extract metadata attached by tailorResumeData (Step 1 & 2 results)
      const jdAnalysis = tailoredData._jdAnalysis || null;
      const gapAnalysisResult = tailoredData._gapAnalysis || null;
      delete tailoredData._jdAnalysis;
      delete tailoredData._gapAnalysis;

      emitToUser(userId, 'tailor-progress', { jobId, progress: 70, log: '📊 Running ATS alignment grading & keyword scan...' });

      // Step 2: Deterministic ATS scoring
      let deterministicResult = { score: null, breakdown: {} };
      if (jdAnalysis) {
        deterministicResult = calculateDeterministicAtsScore(tailoredData, jdAnalysis);
      }

      // Step 3: AI analysis for keyword lists
      const aiAnalysis = await generateAtsScore(job.description, tailoredData);

      // Combine: deterministic score + AI keyword lists
      const finalAnalysis = {
        ...aiAnalysis,
        score: deterministicResult.score !== null ? deterministicResult.score : aiAnalysis.score,
        scoreBreakdown: deterministicResult.breakdown
      };

      // Step 4: Keyword suggestions
      let keywordSuggestions = null;
      if (jdAnalysis) {
        try {
          keywordSuggestions = await generateKeywordSuggestions(tailoredData, jdAnalysis);
        } catch (kErr) {
          console.warn('Keyword suggestions failed (non-critical):', kErr.message);
        }
      }

      emitToUser(userId, 'tailor-progress', { jobId, progress: 85, log: '💾 Saving tailored resume profile to database...' });
      await new Promise(r => setTimeout(r, 800));

      job.tailoredResume = {
        score: finalAnalysis.score,
        generatedAt: new Date(),
        json: tailoredData
      };
      job.atsAnalysis = finalAnalysis;
      await job.save();

      emitToUser(userId, 'tailor-progress', { 
        jobId, 
        progress: 100, 
        log: '✅ Success! Custom resume generated.', 
        status: 'complete',
        tailoredResumeData: tailoredData,
        atsAnalysis: finalAnalysis,
        gapAnalysis: gapAnalysisResult,
        keywordSuggestions
      });
    } catch (err) {
      console.error(err);
      emitToUser(userId, 'tailor-progress', { jobId, progress: 100, log: `❌ Tailoring failed: ${err.message}`, status: 'failed' });
    }
  }
};

function initializeBullWorkers(connection) {
  const { Worker } = require('bullmq');
  new Worker('JobTasks', async (job) => {
    await processJob(job.name, job.data);
  }, { connection });
}

module.exports = {
  addJob
};
