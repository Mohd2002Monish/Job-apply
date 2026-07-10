import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const AI_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google Gemini',
    badge: 'Recommended Speed & ATS',
    description: 'Ultra-fast responses with high accuracy. Best for rapid ATS scanning and form filling.',
    recommendedFor: ['ats', 'autofill', 'quick-email'],
    color: 'emerald'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google Gemini',
    badge: 'Recommended Deep Tailoring',
    description: '1M+ token context window with deep reasoning. Best for detailed resume tailoring and gap analysis.',
    recommendedFor: ['tailoring', 'gap-analysis', 'detailed-cover-letter'],
    color: 'blue'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o (Omni)',
    provider: 'OpenAI',
    badge: 'Recommended Executive Outreach',
    description: 'High-persuasion professional writing & executive tone. Best for high-impact recruiter outreach.',
    recommendedFor: ['email-outreach', 'salary-negotiation', 'executive-cv'],
    color: 'indigo'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    badge: 'Fast & Concise OpenAI',
    description: 'Lightweight OpenAI model optimized for quick 50-word pitches and concise cover letters.',
    recommendedFor: ['pitch', 'quick-email'],
    color: 'amber'
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic Claude',
    badge: 'Maximum Creative Quality',
    description: 'Advanced reasoning, logic, and nuanced writing. Best for creative pitches and tailored executive summaries.',
    recommendedFor: ['tailoring', 'email-outreach'],
    color: 'purple'
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic Claude',
    badge: 'Highly Efficient Intelligence',
    description: 'Lightning-fast, highly intelligent, and conversational. Best for quick recruiter reply suggestions.',
    recommendedFor: ['pitch', 'quick-email', 'autofill'],
    color: 'orange'
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google Gemini',
    badge: 'Balanced Standard',
    description: 'Standard Gemini model providing balanced speed and response quality.',
    recommendedFor: ['standard'],
    color: 'slate'
  }
];

export const getStoredAiModel = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('user_ai_model_preference') || 'gemini-2.5-flash';
  }
  return 'gemini-2.5-flash';
};

export const setStoredAiModel = (modelId) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_ai_model_preference', modelId);
  }
};

export default function AiModelSelector({ selectedModel, onSelectModel, compact = true, currentUseCase = 'email-outreach' }) {
  const [activeModel, setActiveModel] = useState(selectedModel || getStoredAiModel());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [models, setModels] = useState(AI_MODELS);

  useEffect(() => {
    const BACKEND = 'http://localhost:3000';
    axios.get(`${BACKEND}/auth/ai-models`)
      .then(res => {
        if (res.data.success && res.data.models?.length > 0) {
          const mapped = res.data.models.map(m => ({
            id: m.modelId,
            name: m.name,
            provider: m.provider,
            badge: m.caption || 'Active',
            description: m.caption || '',
            recommendedFor: m.modelId.includes('flash') || m.modelId.includes('mini') || m.modelId.includes('haiku') ? ['ats', 'autofill', 'quick-email', 'pitch'] : ['tailoring', 'detailed-cover-letter', 'salary-negotiation'],
            color: m.provider === 'Google Gemini' ? 'emerald' : m.provider === 'OpenAI' ? 'indigo' : 'purple'
          }));
          setModels(mapped);
        }
      })
      .catch(err => console.error('Failed to load active AI models:', err.message));
  }, []);

  useEffect(() => {
    if (selectedModel && selectedModel !== activeModel) {
      setActiveModel(selectedModel);
    }
  }, [selectedModel]);

  const handleSelect = (modelId) => {
    setActiveModel(modelId);
    setStoredAiModel(modelId);
    if (onSelectModel) {
      onSelectModel(modelId);
    }
    setDropdownOpen(false);
  };

  const currentModelObj = models.find(m => m.id === activeModel) || models[0] || AI_MODELS[0];

  if (compact) {
    return (
      <div className="relative inline-block text-left z-20">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-app border border-border-card hover:border-brand-primary/50 text-text-main text-xs font-bold transition-all btn-tactile cursor-pointer shadow-xs"
        >
          <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          <span className="font-mono text-[11px] font-bold">{currentModelObj.name}</span>
          <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20 font-sans font-semibold">
            {currentModelObj.provider}
          </span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-bg-card border border-border-card rounded-2xl shadow-xl overflow-hidden z-50 p-2 origin-top-right animate-fade-in">
            <div className="px-3 py-2 border-b border-border-card mb-1">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Select AI Model Engine</span>
              <p className="text-[10.5px] text-text-muted mt-0.5">Choose OpenAI or Gemini according to your task preference.</p>
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto">
              {models.map((m) => {
                const isSelected = m.id === activeModel;
                const isRecommended = m.recommendedFor.includes(currentUseCase);

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(m.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex flex-col gap-1 cursor-pointer border ${
                      isSelected
                        ? 'bg-brand-primary/10 border-brand-primary text-text-main'
                        : 'border-transparent hover:bg-bg-app hover:border-border-card text-text-muted hover:text-text-main'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-text-main font-mono">{m.name}</span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-bg-app border border-border-card text-text-muted">
                          {m.provider}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-brand-primary">Active</span>
                      )}
                    </div>

                    <p className="text-[10px] text-text-muted leading-tight line-clamp-2">{m.description}</p>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-full">
                        {m.badge}
                      </span>
                      {isRecommended && (
                        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-md">
                          Best for this task
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  const groupedModels = {
    'Google Gemini': models.filter(m => m.provider === 'Google Gemini'),
    'OpenAI': models.filter(m => m.provider === 'OpenAI'),
    'Anthropic Claude': models.filter(m => m.provider === 'Anthropic Claude')
  };

  const getModelCaption = (id) => {
    switch (id) {
      case 'gemini-2.5-flash': return 'Fast ATS Scan & Autofill';
      case 'gemini-1.5-pro': return 'Deep Reasoning & Tailoring';
      case 'gemini-1.5-flash': return 'Balanced Standard';
      case 'gpt-4o': return 'Persuasive Outreach & Letters';
      case 'gpt-4o-mini': return 'Lightweight & Direct';
      case 'claude-3-5-sonnet': return 'Nuanced Executive Writing';
      case 'claude-3-5-haiku': return 'Fast Conversational Replies';
      default: return 'General Purpose';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border-card pb-3">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
          AI Intelligence Engine & Model Selection
        </span>
        <span className="text-[11px] font-semibold text-brand-primary">
          Active: {currentModelObj.name} ({currentModelObj.provider})
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(groupedModels).map(([provider, models]) => (
          <div key={provider} className="flex flex-col gap-2">
            <h4 className="text-[10.5px] font-bold text-text-muted uppercase tracking-widest pl-1 mb-1">
              {provider}
            </h4>
            <div className="space-y-2">
              {models.map((m) => {
                const isSelected = m.id === activeModel;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelect(m.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-brand-primary/10 border-brand-primary shadow-xs'
                        : 'bg-bg-app border-border-card hover:border-brand-primary/50 hover:bg-bg-card-hover/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Radio button circle */}
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-brand-primary' 
                          : 'border-text-muted/40'
                      }`}>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                        )}
                      </div>
                      
                      <div className="flex flex-col">
                        <span className={`text-[12px] font-semibold ${isSelected ? 'text-text-main font-bold' : 'text-text-main'}`}>
                          {m.name}
                        </span>
                        <span className="text-[10px] text-text-muted mt-0.5 leading-none">
                          {getModelCaption(m.id)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
