import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { setAuth } from '../store/authSlice';

const BACKEND = 'http://localhost:3000';

const RESUME_TEMPLATES = [
  { id: 'profile-classic', name: 'Profile Classic (with picture)' },
  { id: 'profile-modern', name: 'Profile Modern (with sidebar)' },
  { id: 'classic', name: 'Classic Serif' },
  { id: 'modern', name: 'Modern Sans' },
  { id: 'minimalist', name: 'Clean Minimalist' }
];

const COVER_LETTER_LENGTHS = [
  { id: 'short', name: 'Short (~150 words)' },
  { id: 'medium', name: 'Medium (~300 words)' },
  { id: 'long', name: 'Long (~500 words)' }
];

// Custom styled select component to replace basic browser dropdowns
function CustomSelect({ value, onChange, options, placeholder = "Select option" }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.id === value) || options[0];

  return (
    <div className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 text-xs bg-slate-50/50 dark:bg-zinc-800/25 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-semibold transition-all flex items-center justify-between cursor-pointer border-0"
      >
        <span>{selectedOption ? selectedOption.name : placeholder}</span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Options List */}
      {isOpen && (
        <>
          {/* Overlay backdrop to dismiss */}
          <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsOpen(false)} />
          
          <div className="absolute left-0 right-0 mt-1.5 bg-white/75 dark:bg-zinc-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-black/40 z-50 py-1.5 max-h-60 overflow-y-auto scrollbar-thin animate-fade-in">
            {options.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-xs transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/60 block border-0 cursor-pointer ${
                  option.id === value
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/40 dark:bg-indigo-500/5'
                    : 'text-slate-700 dark:text-zinc-300 font-medium bg-transparent'
                }`}
              >
                {option.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SettingsTab({ toast }) {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [aiModels, setAiModels] = useState([]);
  const [saving, setSaving] = useState(false);

  const [prefs, setPrefs] = useState({
    aiModelForResume: user?.preferences?.aiModelForResume || 'gemini-1.5-pro',
    aiModelForCoverLetter: user?.preferences?.aiModelForCoverLetter || 'gemini-1.5-pro',
    aiModelForOutreach: user?.preferences?.aiModelForOutreach || 'gpt-4o',
    aiModelForInterview: user?.preferences?.aiModelForInterview || 'gemini-2.5-flash',
    defaultResumeTemplate: user?.preferences?.defaultResumeTemplate || 'profile-classic',
    defaultCoverLetterLength: user?.preferences?.defaultCoverLetterLength || 'medium',
    defaultEmailWordCount: user?.preferences?.defaultEmailWordCount || 100
  });

  useEffect(() => {
    axios.get(`${BACKEND}/auth/ai-models`)
      .then(res => {
        if (res.data.success && res.data.models) {
          setAiModels(res.data.models);
        }
      })
      .catch(err => console.error('Failed to load active AI models:', err));
  }, []);

  const handleChange = (key, value) => {
    setPrefs(p => ({ ...p, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post(`${BACKEND}/auth/profile/update`, {
        name: user.name,
        email: user.email,
        preferences: prefs
      }, { withCredentials: true });

      if (res.data.success) {
        dispatch(setAuth({
          authenticated: true,
          user: res.data.user
        }));
        toast.success('Configuration preferences saved successfully.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to save configuration preferences.');
    } finally {
      setSaving(false);
    }
  };

  const modelOptions = aiModels.map(m => ({
    id: m.modelId,
    name: `${m.name} (${m.provider})`
  }));

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Settings</h2>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Configure your global preferences, document templates, and task-specific AI routing engines.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: AI MODEL ROUTING */}
        <div className="bg-white/75 dark:bg-zinc-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-800/60 rounded-[24px] p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-wider mb-1">Task-Specific AI Routing</h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 leading-relaxed mb-4">
              Map individual application tasks to specific artificial intelligence engines to optimize for cost, speed, or quality.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Resume Tailoring & ATS Analysis</label>
                <CustomSelect
                  value={prefs.aiModelForResume}
                  onChange={val => handleChange('aiModelForResume', val)}
                  options={modelOptions}
                  placeholder="Select model"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Cover Letter Generation</label>
                <CustomSelect
                  value={prefs.aiModelForCoverLetter}
                  onChange={val => handleChange('aiModelForCoverLetter', val)}
                  options={modelOptions}
                  placeholder="Select model"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider">Recruiter Email Outreach</label>
                <CustomSelect
                  value={prefs.aiModelForOutreach}
                  onChange={val => handleChange('aiModelForOutreach', val)}
                  options={modelOptions}
                  placeholder="Select model"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider">Mock Interview Practice</label>
                <CustomSelect
                  value={prefs.aiModelForInterview}
                  onChange={val => handleChange('aiModelForInterview', val)}
                  options={modelOptions}
                  placeholder="Select model"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: DEFAULT PREFERENCES */}
        <div className="bg-white/75 dark:bg-zinc-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-800/60 rounded-[24px] p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-wider mb-1">Default Preferences</h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 leading-relaxed mb-4">
              Set default choices for templates, lengths, and limits when using the application builders.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Default Resume Template</label>
                <CustomSelect
                  value={prefs.defaultResumeTemplate}
                  onChange={val => handleChange('defaultResumeTemplate', val)}
                  options={RESUME_TEMPLATES}
                  placeholder="Select template"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider">Default Cover Letter Length</label>
                <CustomSelect
                  value={prefs.defaultCoverLetterLength}
                  onChange={val => handleChange('defaultCoverLetterLength', val)}
                  options={COVER_LETTER_LENGTHS}
                  placeholder="Select length"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Default Outreach Email Word Count</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="30"
                    max="300"
                    value={prefs.defaultEmailWordCount}
                    onChange={e => handleChange('defaultEmailWordCount', Number(e.target.value))}
                    className="w-32 px-4 py-2.5 text-xs bg-slate-50/50 dark:bg-zinc-800/25 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-mono"
                  />
                  <span className="text-xs text-slate-400 dark:text-zinc-500">words (Recommended: 75-120 words for higher response rates).</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SAVE PREFERENCES TRIGGER */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer border-0"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving Preferences...
              </>
            ) : (
              'Save Configuration'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
