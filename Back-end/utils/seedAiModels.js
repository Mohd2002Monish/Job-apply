const AiModel = require('../models/AiModel');

const defaultModels = [
  {
    modelId: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google Gemini',
    caption: 'Fast ATS Scan & Autofill',
    isActive: true,
    isCustom: false
  },
  {
    modelId: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google Gemini',
    caption: 'Deep Reasoning & Tailoring',
    isActive: true,
    isCustom: false
  },
  {
    modelId: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google Gemini',
    caption: 'Balanced Standard',
    isActive: true,
    isCustom: false
  },
  {
    modelId: 'gpt-4o',
    name: 'GPT-4o (Omni)',
    provider: 'OpenAI',
    caption: 'Persuasive Outreach & Letters',
    isActive: true,
    isCustom: false
  },
  {
    modelId: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    caption: 'Lightweight & Direct',
    isActive: true,
    isCustom: false
  },
  {
    modelId: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic Claude',
    caption: 'Nuanced Executive Writing',
    isActive: true,
    isCustom: false
  },
  {
    modelId: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic Claude',
    caption: 'Fast Conversational Replies',
    isActive: true,
    isCustom: false
  }
];

const seedAiModels = async () => {
  try {
    const count = await AiModel.countDocuments();
    if (count === 0) {
      console.log('Seeding default AI models...');
      await AiModel.insertMany(defaultModels);
      console.log('Default AI models seeded successfully.');
    }
  } catch (err) {
    console.error('Failed to seed default AI models:', err.message);
  }
};

module.exports = seedAiModels;
