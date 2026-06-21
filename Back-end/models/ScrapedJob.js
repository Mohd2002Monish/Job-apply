const mongoose = require('mongoose');

const scrapedJobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  salary: {
    type: String,
    default: '',
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  url: {
    type: String,
    default: '',
    trim: true
  },
  source: {
    type: String,
    enum: ['Naukri', 'Indeed', 'LinkedIn'],
    default: 'Indeed'
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  },
  imported: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Avoid duplicate scrapings for the same user, role, and company within a 7-day period
scrapedJobSchema.index({ userId: 1, jobTitle: 1, companyName: 1 }, { unique: false });

const ScrapedJob = mongoose.model('ScrapedJob', scrapedJobSchema);

module.exports = ScrapedJob;
