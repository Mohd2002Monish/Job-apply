const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
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
  }]
}, {
  timestamps: true
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;