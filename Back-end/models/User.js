const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  company: { type: String, default: '' },
  role: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  current: { type: Boolean, default: false },
  location: { type: String, default: '' },
  description: { type: String, default: '' },
  achievements: [{ type: String }],
}, { _id: false });

const educationSchema = new mongoose.Schema({
  institution: { type: String, default: '' },
  degree: { type: String, default: '' },
  field: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  gpa: { type: String, default: '' },
  location: { type: String, default: '' },
}, { _id: false });

const certificationSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  issuer: { type: String, default: '' },
  date: { type: String, default: '' },
  url: { type: String, default: '' },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  techStack: [{ type: String }],
  url: { type: String, default: '' },
  github: { type: String, default: '' },
}, { _id: false });

const resumeDataSchema = new mongoose.Schema({
  personalInfo: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    website: { type: String, default: '' },
    jobTitle: { type: String, default: '' },
  },
  summary: { type: String, default: '' },
  experience: [experienceSchema],
  education: [educationSchema],
  skills: {
    technical: [{ type: String }],
    soft: [{ type: String }],
    languages: [{ type: String }],
    tools: [{ type: String }],
  },
  certifications: [certificationSchema],
  projects: [projectSchema],
  awards: [{ type: String }],
}, { _id: false });

const resumeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  rawText: { type: String, default: '' },
  resumeData: { type: resumeDataSchema, default: null },
  resumeFileName: { type: String, default: '' },
  resumePath: { type: String, default: '' },
  lastParsedAt: { type: Date, default: null }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  name: { type: String, default: '' },
  picture: { type: String, default: '' },
  rawText: { type: String, default: '' },
  resumeData: { type: resumeDataSchema, default: null },
  resumeFileName: { type: String, default: '' },
  lastParsedAt: { type: Date, default: null },
  googleTokens: { type: Object, default: null },
  microsoftTokens: { type: Object, default: null },
  activeProvider: { type: String, enum: ['google', 'microsoft'], default: 'google' },
  resumePath: { type: String, default: '' },
  resumes: { type: [resumeSchema], default: [] },
  activeResumeId: { type: String, default: '' },
    targetProfile: {
      targetRole: { type: String, default: '' },
      targetLocation: { type: String, default: '' },
      salaryExpectation: { type: Number, default: 0 },
      digestEnabled: { type: Boolean, default: false },
      digestFrequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' }
    },
    subscriptionTier: { type: String, enum: ['free', 'pro'], default: 'free' },
    stripeCustomerId: { type: String, default: '' },
    stripeSubscriptionId: { type: String, default: '' },
    aiRequestCount: { type: Number, default: 0 },
    role: { type: String, enum: ['user', 'owner'], default: 'user' },
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 }
    },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    referralClicks: { type: Number, default: 0 }
  }, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
