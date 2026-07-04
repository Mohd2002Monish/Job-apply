import React, { useState, useEffect } from 'react';

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

  const currentModelObj = AI_MODELS.find(m => m.id === activeModel) || AI_MODELS[0];

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
              {AI_MODELS.map((m) => {
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-main uppercase tracking-wider block">
          AI Intelligence Engine & Model Selection
        </span>
        <span className="text-[11px] font-semibold text-brand-primary">
          Active: {currentModelObj.name} ({currentModelObj.provider})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {AI_MODELS.map((m) => {
          const isSelected = m.id === activeModel;
          const isRecommended = m.recommendedFor.includes(currentUseCase);

          return (
            <div
              key={m.id}
              onClick={() => handleSelect(m.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 btn-tactile ${
                isSelected
                  ? 'bg-brand-primary/10 border-brand-primary ring-1 ring-brand-primary/30 shadow-sm'
                  : 'bg-bg-app border-border-card hover:border-brand-primary/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h5 className="font-extrabold text-xs text-text-main font-mono">{m.name}</h5>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-bg-card border border-border-card text-text-muted">
                    {m.provider}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">{m.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border-card/60">
                <span className="text-[9.5px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                  {m.badge}
                </span>
                {isSelected ? (
                  <span className="text-[10px] font-bold text-brand-primary flex items-center gap-1">
                    Selected
                  </span>
                ) : isRecommended ? (
                  <span className="text-[9.5px] font-bold text-emerald-500">Recommended ↗</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
