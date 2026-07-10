const mongoose = require('mongoose');

const aiModelSchema = new mongoose.Schema({
  modelId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: { type: String, required: true, trim: true },
  provider: {
    type: String,
    required: true,
    enum: ['Google Gemini', 'OpenAI', 'Anthropic Claude'],
    trim: true
  },
  caption: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  isCustom: { type: Boolean, default: true }
}, { timestamps: true });

const AiModel = mongoose.model('AiModel', aiModelSchema);
module.exports = AiModel;
