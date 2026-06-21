const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  job: {
    type: String,
    required: true,
    trim: true
  },
  hrName: {
    type: String,
    default: '',
    trim: true
  },
  companyName: {
    type: String,
    default: '',
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/, 'Please fill a valid email address']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  isEmailSent: {
    type: Boolean,
    default: false
  },
  gmailThreadId: {
    type: String,
    default: null         // populated after email is sent via Gmail API
  },
  emailProvider: {
    type: String,
    enum: ['google', 'microsoft'],
    default: 'google'
  },
  hasReply: {
    type: Boolean,
    default: false        // true when HR replies detected in Gmail thread
  },
  repliedAt: {
    type: Date,
    default: null
  },
  atsAnalysis: {
    score: { type: Number, default: null },
    matchSummary: { type: String, default: '' },
    matchingKeywords: [{ type: String }],
    missingKeywords: [{ type: String }],
    suggestions: [{ type: String }]
  },
  coverLetter: { type: String, default: '' },
  // Per-job tailored resume (does NOT overwrite user's primary resume)
  tailoredResume: {
    score: { type: Number, default: null },
    generatedAt: { type: Date, default: null },
    json: { type: Object, default: null }
  },
  templateId: { type: String, default: 'classic' },
  status: {
    type: String,
    enum: ['saved', 'applied', 'opened', 'interview', 'offer', 'rejected'],
    default: 'saved'
  },
  statusHistory: [{
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now }
  }],
  followUpDate: { type: Date, default: null },
  followUpStatus: { type: String, enum: ['none', 'pending', 'sent'], default: 'none' },
  followUpText: { type: String, default: '' },
  // Job Description file upload
  jdFileName: { type: String, default: '' },
  jdFilePath: { type: String, default: '' },
  jdFileContent: { type: String, default: '' },
  // Email Tracking
  isOpened: { type: Boolean, default: false },
  openedAt: { type: Date, default: null },
  linkClicksCount: { type: Number, default: 0 },
  clicks: [{
    url: { type: String, required: true },
    clickedAt: { type: Date, default: Date.now }
  }],
  // Interview Prep
  interviewPrepGeneratedAt: { type: Date, default: null },
  interviewQuestions: [{
    question: { type: String },
    type: { type: String, enum: ['Technical', 'Behavioral', 'Situational'], default: 'Technical' },
    suggestedPoints: { type: String, default: '' },
    userNotes: { type: String, default: '' },
    aiFeedback: { type: String, default: '' },
    score: { type: Number, default: null }
  }],
  // Recruiter Inbox Messages
  recruiterMessages: [{
    messageId: { type: String, default: '' },
    from: { type: String, default: '' },
    subject: { type: String, default: '' },
    body: { type: String, default: '' },
    receivedAt: { type: Date, default: Date.now },
    isFromRecruiter: { type: Boolean, default: true }
  }],
  // Salary Negotiation Data
  salaryNegotiation: {
    offeredSalary: { type: Number, default: null },
    targetSalary: { type: Number, default: null },
    currency: { type: String, default: 'USD' },
    location: { type: String, default: '' },
    marketLow: { type: Number, default: null },
    marketAverage: { type: Number, default: null },
    marketHigh: { type: Number, default: null },
    marketInsights: { type: String, default: '' },
    sources: [{
      title: { type: String },
      url: { type: String }
    }],
    talkingPoints: [{ type: String }],
    emailDraft: { type: String, default: '' },
    generatedAt: { type: Date, default: null }
  }
}, {
  timestamps: true
});

jobSchema.index({ userId: 1, createdAt: -1 });
jobSchema.index({ userId: 1, status: 1 });
jobSchema.index({ companyName: 'text', job: 'text', description: 'text' });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;