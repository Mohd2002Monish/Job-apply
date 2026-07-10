const AiModel = require('../models/AiModel');

// Get all AI models for administration (Owner Only)
const getAdminAiModels = async (req, res) => {
  try {
    const models = await AiModel.find().sort({ provider: 1, name: 1 });
    res.json({ success: true, models });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch AI models: ' + err.message });
  }
};

// Get all active AI models for standard users (Public/Authenticated)
const getActiveAiModels = async (req, res) => {
  try {
    const models = await AiModel.find({ isActive: true }).sort({ provider: 1, name: 1 });
    res.json({ success: true, models });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active AI models: ' + err.message });
  }
};

// Add or update an AI model (Owner Only)
const upsertAiModel = async (req, res) => {
  try {
    const { modelId, name, provider, caption, isActive, isCustom } = req.body;
    if (!modelId || !name || !provider) {
      return res.status(400).json({ error: 'modelId, name, and provider are required fields.' });
    }
    if (!['Google Gemini', 'OpenAI', 'Anthropic Claude'].includes(provider)) {
      return res.status(400).json({ error: 'Provider must be "Google Gemini", "OpenAI", or "Anthropic Claude".' });
    }

    let model = await AiModel.findOne({ modelId: modelId.trim().toLowerCase() });
    if (!model) {
      model = new AiModel({ modelId: modelId.trim().toLowerCase() });
    }

    model.name = name.trim();
    model.provider = provider;
    model.caption = caption ? caption.trim() : '';
    if (isActive !== undefined) model.isActive = Boolean(isActive);
    if (isCustom !== undefined) model.isCustom = Boolean(isCustom);

    await model.save();

    res.json({
      success: true,
      message: `AI model "${model.name}" saved successfully.`,
      model
    });
  } catch (err) {
    res.status(555).json({ error: 'Failed to save AI model: ' + err.message });
  }
};

// Delete an AI model (Owner Only)
const deleteAiModel = async (req, res) => {
  try {
    const { id } = req.params;
    const model = await AiModel.findByIdAndDelete(id);
    if (!model) {
      return res.status(404).json({ error: 'AI model not found.' });
    }
    res.json({ success: true, message: `AI model "${model.name}" deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete AI model: ' + err.message });
  }
};

module.exports = {
  getAdminAiModels,
  getActiveAiModels,
  upsertAiModel,
  deleteAiModel
};
