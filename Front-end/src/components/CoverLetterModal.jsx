import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  XIcon,
  UploadIcon,
  WandIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon
} from './Icons';

const BACKEND = 'http://localhost:3000';

const INDUSTRIES = [
  'Software Engineering', 'Technology & IT', 'Finance & Banking', 'Healthcare & Medical',
  'Marketing & Advertising', 'Sales & Business Development', 'Education & Training',
  'Legal & Compliance', 'Consulting', 'Design & Creative', 'Data Science & AI',
  'Product Management', 'Operations & Logistics', 'Human Resources', 'E-commerce & Retail',
];

const TONES = [
  { id: 'Professional', emoji: '💼', desc: 'Formal & structured' },
  { id: 'Confident', emoji: '🎯', desc: 'Assertive & results-driven' },
  { id: 'Creative', emoji: '✨', desc: 'Unique & personality-forward' },
  { id: 'Executive', emoji: '👔', desc: 'Authoritative & commanding' },
  { id: 'Friendly', emoji: '😊', desc: 'Warm & approachable' },
];

const WORD_COUNT_PRESETS = [
  { id: 150, label: 'Short', desc: '~150 words' },
  { id: 250, label: 'Medium', desc: '~250 words' },
  { id: 350, label: 'Standard', desc: '~350 words' },
  { id: 500, label: 'Detailed', desc: '~500 words' },
];

const ACCEPTED_EXTS = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp';

// Custom inline Copy SVG to keep imports simple
const CopyIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

/**
 * CoverLetterModal
 *
 * Props:
 *   job        — the full job object
 *   onClose    — function to close the modal
 *   onSaved    — callback(jobId, updatedCoverLetter) after saving
 */
const CoverLetterModal = ({ job, onClose, onSaved }) => {
  const [description, setDescription] = useState(job.jdFileContent || job.description || '');
  const [wordCount, setWordCount] = useState(300);
  const [industry, setIndustry] = useState('Software Engineering');
  const [tone, setTone] = useState('Professional');
  const [customInstructions, setCustomInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState(job.coverLetter || '');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(job.jdFileName || '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  
  // Tab control when letter is generated: 'settings' or 'jd'
  const [leftTab, setLeftTab] = useState('settings');

  const fileInputRef = useRef(null);
  const letterRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Scroll to letter when generated
  useEffect(() => {
    if (generatedLetter && letterRef.current) {
      setTimeout(() => letterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [generatedLetter]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setError('');
    setUploadingFile(true);
    try {
      const form = new FormData();
      form.append('jdFile', file);
      const res = await axios.post(`${BACKEND}/jobs/${job._id}/upload-jd`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
        timeout: 60000,
      });
      setDescription(res.data.rawText || '');
      setUploadedFileName(file.name);
    } catch (err) {
      setError('Failed to parse file: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploadingFile(false);
    }
  };

  const handleClearFile = () => {
    setUploadedFileName('');
    setDescription(job.jdFileContent || job.description || '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please provide a job description before generating.');
      return;
    }
    setError('');
    setGenerating(true);
    try {
      const res = await axios.post(
        `${BACKEND}/jobs/${job._id}/generate-cover-letter`,
        { wordCount, industry, tone, description, customInstructions },
        { withCredentials: true, timeout: 90000 }
      );
      setGeneratedLetter(res.data.coverLetter);
    } catch (err) {
      setError('Generation failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await axios.patch(`${BACKEND}/jobs/${job._id}`, { coverLetter: generatedLetter }, { withCredentials: true });
      onSaved(job._id, generatedLetter);
    } catch (err) {
      setError('Failed to save: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderSettingsPanel = () => {
    return (
      <div className="space-y-4">
        {/* Word Count */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-2.5">
            Word Count: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{wordCount} words</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {WORD_COUNT_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setWordCount(preset.id)}
                className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  wordCount === preset.id
                    ? 'bg-indigo-600 text-white border-indigo-650 shadow-sm shadow-indigo-500/25'
                    : 'bg-white dark:bg-zinc-800 text-slate-655 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-500'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <input
            type="range"
            min="100"
            max="600"
            step="25"
            value={wordCount}
            onChange={(e) => setWordCount(Number(e.target.value))}
            className="w-full accent-indigo-650 h-1 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
            Industry / Domain
          </label>
          <div className="relative">
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full pl-3 pr-10 py-2 text-xs bg-white dark:bg-zinc-805 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 dark:focus:ring-indigo-500/10 appearance-none text-slate-800 dark:text-slate-200 font-medium"
              id="cl-industry-select"
            >
              {INDUSTRIES.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
            Writing Tone
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TONES.map(t => {
              const isSelected = tone === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all duration-200 relative group cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 dark:border-indigo-505 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm ring-1 ring-indigo-600/30'
                      : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50/50 dark:hover:bg-zinc-850/35'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base shrink-0 mt-0.5">{t.emoji}</span>
                    <div className="overflow-hidden">
                      <p className={`text-[11px] font-bold truncate transition-colors ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-750 dark:text-slate-200'}`}>
                        {t.id}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5 leading-tight truncate">
                        {t.desc}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600 dark:bg-indigo-400"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Instructions */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
            Custom Instructions <span className="text-slate-400 dark:text-zinc-600 font-normal normal-case">(optional)</span>
          </label>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="e.g. Emphasize my remote experience, use active verbs..."
            rows={2}
            className="w-full p-2.5 text-xs bg-white dark:bg-zinc-850 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 dark:focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-zinc-500 resize-none leading-relaxed"
            id="cl-custom-instructions"
          />
        </div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-5xl bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md border border-slate-205 dark:border-zinc-800 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col max-h-[85vh] overflow-hidden transform transition-all duration-300 scale-100 animate-fade-in">
        
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTS}
          className="hidden"
          id="jd-file-input"
          onChange={(e) => handleFileUpload(e.target.files[0])}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-zinc-800 shrink-0 bg-gradient-to-r from-indigo-50/50 via-slate-50/50 to-indigo-50/50 dark:from-indigo-950/10 dark:via-zinc-900/10 dark:to-indigo-950/10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-100/50 dark:border-indigo-500/20">
              AI Assistant
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2 flex items-center gap-2">
              Generate Cover Letter
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Position: <span className="font-semibold text-slate-805 dark:text-slate-205">{job.job}</span> • Recruiter: <span className="font-mono text-slate-600 dark:text-slate-350">{job.email}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 min-h-0">
          {!generatedLetter ? (
            <>
              {/* STATE 1: Empty state (No cover letter generated yet) */}
              {/* LEFT: Job Description Editor */}
              <div className="lg:col-span-7 flex flex-col min-h-0 gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
                    Job Description
                  </label>
                  <div className="flex items-center gap-2">
                    {uploadedFileName && (
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-150 dark:border-emerald-500/20 pl-2 pr-1 py-0.5 rounded-full">
                        <span>📎 {uploadedFileName.length > 20 ? uploadedFileName.slice(0, 18) + '…' : uploadedFileName}</span>
                        <button
                          type="button"
                          onClick={handleClearFile}
                          className="p-0.5 text-emerald-600 hover:text-rose-500 dark:text-emerald-400 dark:hover:text-rose-450 transition-colors"
                          title="Clear file"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-650 dark:text-indigo-400 hover:text-indigo-755 dark:hover:text-indigo-305 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-150 dark:border-indigo-500/20 rounded-lg transition-all cursor-pointer"
                    >
                      {uploadingFile ? (
                        <div className="w-3 h-3 border border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UploadIcon size={12} />
                      )}
                      {uploadingFile ? 'Parsing...' : 'Upload JD File'}
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-normal">
                  Paste the job description or upload a file (PDF, DOCX, image) to extract requirements automatically.
                </p>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Paste the full job description here, or upload a file above..."
                  className="flex-1 w-full p-4 text-xs bg-slate-50 dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 dark:focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 leading-relaxed resize-none overflow-y-auto"
                  id="jd-description-textarea"
                />
              </div>

              {/* RIGHT: Settings Panel */}
              <div className="lg:col-span-5 flex flex-col min-h-0 gap-4">
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 py-1">
                  {renderSettingsPanel()}
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs font-semibold text-red-700 dark:text-red-400 animate-fade-in">
                    <span className="text-red-500 text-sm flex-shrink-0">⚠</span>
                    <p className="flex-1">{error}</p>
                  </div>
                )}

                <div className="shrink-0 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating || !description.trim()}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-650 to-violet-650 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-md shadow-indigo-500/15 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {generating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating Cover Letter...</span>
                      </>
                    ) : (
                      <>
                        <WandIcon size={13} />
                        <span>Generate Cover Letter</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* STATE 2: Cover letter generated */}
              {/* LEFT: Tabbed configuration */}
              <div className="lg:col-span-5 flex flex-col min-h-0 gap-4">
                {/* Tabs Header */}
                <div className="flex bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setLeftTab('settings')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      leftTab === 'settings'
                        ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-100 shadow-sm'
                        : 'text-slate-500 dark:text-zinc-450 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    ⚙ AI Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeftTab('jd')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      leftTab === 'jd'
                        ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-100 shadow-sm'
                        : 'text-slate-500 dark:text-zinc-450 hover:text-slate-805 dark:hover:text-slate-200'
                    }`}
                  >
                    📝 Job Description
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 py-1">
                  {leftTab === 'settings' ? (
                    renderSettingsPanel()
                  ) : (
                    <div className="flex flex-col h-full gap-3 min-h-[280px]">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-[10px] font-bold text-slate-455 dark:text-zinc-550 uppercase tracking-wider">
                          Source Job Description
                        </label>
                        <div className="flex items-center gap-2">
                          {uploadedFileName && (
                            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-150 dark:border-emerald-500/20 pl-2 pr-1 py-0.5 rounded-full">
                              <span>📎 {uploadedFileName.length > 18 ? uploadedFileName.slice(0, 15) + '…' : uploadedFileName}</span>
                              <button
                                type="button"
                                onClick={handleClearFile}
                                className="p-0.5 text-emerald-600 hover:text-rose-500 dark:text-emerald-400 dark:hover:text-rose-455 transition-colors"
                                title="Clear file"
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingFile}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-bold text-indigo-650 dark:text-indigo-400 hover:text-indigo-750 dark:hover:text-indigo-305 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-150 dark:border-indigo-500/20 rounded-lg transition-all cursor-pointer"
                          >
                            {uploadingFile ? (
                              <div className="w-2.5 h-2.5 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <UploadIcon size={11} />
                            )}
                            {uploadingFile ? 'Parsing...' : 'Upload File'}
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Paste the job description here..."
                        className="flex-1 w-full p-3 bg-slate-50 dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 dark:focus:ring-indigo-500/10 text-slate-805 dark:text-slate-200 leading-relaxed resize-none"
                        id="jd-description-textarea"
                      />
                    </div>
                  )}
                </div>

                {/* Left Column sticky Regenerate Button */}
                <div className="shrink-0 pt-3 border-t border-slate-100 dark:border-zinc-800/85">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating || !description.trim()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-650 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-md shadow-indigo-500/15 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {generating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Regenerating...</span>
                      </>
                    ) : (
                      <>
                        <WandIcon size={13} />
                        <span>Regenerate Cover Letter</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* RIGHT: Generated Cover Letter Editor */}
              <div className="lg:col-span-7 flex flex-col min-h-0 gap-3">
                {generating ? (
                  <div className="flex-1 w-full border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-50/50 dark:bg-zinc-950/30 flex flex-col items-center justify-center p-6 text-sm text-slate-400 dark:text-zinc-500 leading-normal min-h-[350px] animate-pulse">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                    AI is crafting your personalized cover letter...
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          Cover Letter Draft
                          <span className="text-[10px] text-slate-350 dark:text-zinc-500 font-normal normal-case ml-1">
                            (edit directly in the editor below)
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-zinc-750 text-slate-605 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                          id="copy-cl-btn"
                        >
                          {copied ? '✅' : <CopyIcon size={12} />}
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <textarea
                      ref={letterRef}
                      value={generatedLetter}
                      onChange={(e) => setGeneratedLetter(e.target.value)}
                      className="flex-1 w-full p-4 text-xs font-mono border border-slate-250 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-950/40 text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 dark:focus:ring-indigo-500/10 resize-none overflow-y-auto leading-relaxed min-h-[350px]"
                      placeholder="AI cover letter text will appear here..."
                      id="generated-cl-textarea"
                    />
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Global Error/Success inside modal */}
        {error && generatedLetter && (
          <div className="mx-6 mb-4 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2 animate-fade-in">
            <AlertTriangleIcon size={14} className="shrink-0 animate-bounce" />
            {error}
          </div>
        )}

        {/* Persistent Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4.5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 shrink-0">
          {saving && (
            <div className="mr-auto text-xs font-semibold text-indigo-650 dark:text-indigo-400 flex items-center gap-2">
              <div className="w-3 h-3 border border-indigo-650 border-t-transparent rounded-full animate-spin" />
              <span>Saving changes...</span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-205 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-400 hover:bg-slate-105 dark:hover:bg-zinc-800 transition-colors cursor-pointer select-none"
          >
            Cancel
          </button>
          {generatedLetter && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              id="save-generated-cl-btn"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer select-none"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-sm font-bold">✓</span>
              )}
              {saving ? 'Saving...' : 'Save Cover Letter'}
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};

export default CoverLetterModal;
