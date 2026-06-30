import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  WandIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon, 
  RefreshIcon, 
  DownloadIcon 
} from './Icons';
import Select from 'react-select';
import { getReactSelectStyles } from '../utils/reactSelectStyles';

const BACKEND = 'http://localhost:3000';

const INDUSTRIES = [
  'Software Engineering', 'Technology & IT', 'Finance & Banking', 'Healthcare & Medical',
  'Marketing & Advertising', 'Sales & Business Development', 'Education & Training',
  'Legal & Compliance', 'Consulting', 'Design & Creative', 'Data Science & AI',
  'Product Management', 'Operations & Logistics', 'Human Resources', 'E-commerce & Retail'
];

const TONES = [
  { id: 'Professional', icon: (
    <svg className="w-4 h-4 text-brand-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ), desc: 'Formal & structured' },
  { id: 'Confident', icon: (
    <svg className="w-4 h-4 text-brand-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ), desc: 'Assertive & results-driven' },
  { id: 'Creative', icon: (
    <svg className="w-4 h-4 text-brand-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M3 21l9-9" />
    </svg>
  ), desc: 'Unique & style-forward' },
  { id: 'Executive', icon: (
    <svg className="w-4 h-4 text-brand-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ), desc: 'Authoritative & commanding' },
  { id: 'Friendly', icon: (
    <svg className="w-4 h-4 text-brand-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ), desc: 'Warm & approachable' }
];

const TEMPLATES = [
  { id: 'classic', label: 'Classic Elegance', desc: 'Serif font with centered headers' },
  { id: 'modern', label: 'Modern Accent', desc: 'Clean sans-serif with top accent strip' },
  { id: 'minimal', label: 'Minimalist Clean', desc: 'High margins and light typography' },
  { id: 'executive', label: 'Executive Border', desc: 'Formal look with a solid left bar' }
];

export default function CoverLetterTab({ user }) {
  // Data State
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Custom Generation State
  const [wordCount, setWordCount] = useState(250);
  const [industry, setIndustry] = useState('Software Engineering');
  const [tone, setTone] = useState('Professional');
  const [customInstructions, setCustomInstructions] = useState('');
  
  // Editor State
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [isDirty, setIsDirty] = useState(false);

  // Statuses
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch tracked jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await axios.get(`${BACKEND}/jobs`, { 
        params: { limit: 1000, sortBy: 'createdAt:desc' },
        withCredentials: true 
      });
      const sorted = (res.data.jobs || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setJobs(sorted);
      if (sorted.length > 0) {
        setSelectedJobId(sorted[0]._id);
        setSelectedJob(sorted[0]);
        setCoverLetter(sorted[0].coverLetter || '');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load tracked jobs.');
    } finally {
      setLoadingJobs(false);
    }
  };

  // Handle selected job change
  const handleJobChange = (jobId) => {
    setSelectedJobId(jobId);
    const job = jobs.find(j => j._id === jobId) || null;
    setSelectedJob(job);
    setCoverLetter(job ? job.coverLetter || '' : '');
    setIsDirty(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Generate cover letter via backend Custom AI generator
  const handleGenerate = async () => {
    if (!selectedJobId) {
      setErrorMsg('Please select a tracked job to link the cover letter to.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setGenerating(true);

    try {
      const res = await axios.post(
        `${BACKEND}/jobs/${selectedJobId}/generate-cover-letter`,
        { 
          wordCount, 
          industry, 
          tone, 
          description: selectedJob?.description || '', 
          customInstructions 
        },
        { withCredentials: true, timeout: 90000 }
      );
      if (res.data.coverLetter) {
        setCoverLetter(res.data.coverLetter);
        setIsDirty(true);
        setSuccessMsg('Cover letter successfully generated by Gemini!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Generation failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setGenerating(false);
    }
  };

  // Save changes and attach cover letter to the selected job in database
  const handleSaveAndAttach = async () => {
    if (!selectedJobId) return;
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await axios.patch(
        `${BACKEND}/jobs/${selectedJobId}`, 
        { coverLetter, templateId: selectedTemplate }, 
        { withCredentials: true }
      );
      setIsDirty(false);
      setSuccessMsg('Cover letter successfully saved & attached to job outreach!');
      // Update local jobs list cache
      setJobs(prev => prev.map(j => j._id === selectedJobId ? { ...j, coverLetter, templateId: selectedTemplate } : j));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to save cover letter: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Export cover letter to Word format (docx)
  const handleExportDocx = async () => {
    if (!selectedJobId) return;
    setExporting(true);
    setErrorMsg('');
    
    try {
      // First auto-save any unsaved draft changes
      await axios.patch(`${BACKEND}/jobs/${selectedJobId}`, { coverLetter }, { withCredentials: true });
      
      // Request file buffer from backend
      const res = await axios.post(
        `${BACKEND}/resume/cover-letter/export`, 
        { jobId: selectedJobId, format: 'docx' },
        { responseType: 'blob', withCredentials: true }
      );
      
      // Trigger browser file download
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `cover_letter_${selectedJob?.companyName || 'application'}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccessMsg('DOCX cover letter file downloaded successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to export DOCX document.');
    } finally {
      setExporting(false);
    }
  };

  // Map CSS formatting styles dynamically based on the selected template style
  const getTemplateStyles = () => {
    switch (selectedTemplate) {
      case 'modern':
        return {
          paper: 'font-sans border-t-[8px] border-brand-primary pl-8 pr-8 py-10 bg-white text-slate-900',
          header: 'border-b border-slate-200 pb-4 mb-6',
          title: 'text-brand-primary text-xl font-bold tracking-tight',
          body: 'text-sm leading-relaxed text-slate-800 font-normal space-y-4'
        };
      case 'minimal':
        return {
          paper: 'font-sans px-10 py-12 bg-white text-slate-800 tracking-wide font-light',
          header: 'mb-8 border-l border-slate-300 pl-4 py-1',
          title: 'text-lg font-semibold tracking-widest text-slate-500 uppercase',
          body: 'text-sm leading-loose text-slate-700 font-light space-y-5'
        };
      case 'executive':
        return {
          paper: 'font-serif border-l-[6px] border-slate-800 pl-8 pr-6 py-10 bg-white text-zinc-950',
          header: 'mb-6 pb-4 border-b border-zinc-100',
          title: 'text-lg font-bold uppercase tracking-wider text-zinc-800',
          body: 'text-sm leading-relaxed text-zinc-850 font-medium space-y-4'
        };
      case 'classic':
      default:
        return {
          paper: 'font-serif px-8 py-10 bg-white text-slate-950',
          header: 'text-center border-b border-slate-100 pb-5 mb-6',
          title: 'text-xl font-bold font-serif text-slate-850',
          body: 'text-sm leading-relaxed text-slate-900 font-normal space-y-4'
        };
    }
  };

  const style = getTemplateStyles();
  const activeResume = user?.resumes?.find(r => r.id === user.activeResumeId) || user?.resumes?.[0] || null;
  const candidateName = activeResume?.resumeData?.personalInfo?.name || user?.name || 'Applicant Name';
  const candidateEmail = activeResume?.resumeData?.personalInfo?.email || user?.email || 'email@example.com';
  const candidatePhone = activeResume?.resumeData?.personalInfo?.phone || '';

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-text-main flex items-center gap-2">
            Cover Letter Workspace
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Build, tailor, style, and link personalized cover letters to your active job applications using Gemini AI.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Controls Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-5 space-y-4 backdrop-blur-md">
            <h2 className="text-xs font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest">
              Configuration Panel
            </h2>

            {/* Job Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                1. Select Tracked Job
              </label>
              {loadingJobs ? (
                <div className="h-9 rounded-lg bg-bg-card-hover animate-pulse" />
              ) : jobs.length === 0 ? (
                <div className="text-xs text-amber-600 dark:text-amber-400 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-center gap-2">
                  <AlertTriangleIcon size={12} />
                  Add a job in Outreach tab first!
                </div>
              ) : (
                <Select
                  value={jobs.map(j => ({ value: j._id, label: `${j.companyName} — ${j.job}` })).find(o => o.value === selectedJobId)}
                  onChange={(opt) => handleJobChange(opt ? opt.value : '')}
                  options={jobs.map(j => ({ value: j._id, label: `${j.companyName} — ${j.job}` }))}
                  styles={getReactSelectStyles()}
                  id="cl-job-selector"
                />
              )}
            </div>

            {/* Word Count */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2 flex justify-between">
                <span>2. Word Length</span>
                <span className="text-brand-primary font-extrabold">{wordCount} words</span>
              </label>
              <div className="flex gap-1 mb-2.5">
                {[150, 250, 350, 500].map(words => (
                  <button
                    key={words}
                    type="button"
                    onClick={() => setWordCount(words)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      wordCount === words
                        ? 'bg-brand-primary text-white border-brand-primary shadow-sm shadow-brand-primary/20'
                        : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-450 border-slate-200 dark:border-zinc-800 hover:border-brand-primary hover:text-brand-primary'
                    }`}
                  >
                    {words === 150 ? 'Short' : words === 250 ? 'Medium' : words === 350 ? 'Standard' : 'Detailed'}
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
                className="w-full accent-brand-primary h-1 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Industry Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                3. Industry Domain
              </label>
              <Select
                value={INDUSTRIES.map(ind => ({ value: ind, label: ind })).find(o => o.value === industry)}
                onChange={(opt) => setIndustry(opt ? opt.value : '')}
                options={INDUSTRIES.map(ind => ({ value: ind, label: ind }))}
                styles={getReactSelectStyles()}
                id="cl-workspace-industry"
              />
            </div>

            {/* Tone Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                4. Writing Tone
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map(t => {
                  const isSelected = tone === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={`p-2 rounded-xl border text-left transition-all relative group cursor-pointer ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 shadow-sm'
                          : 'border-border-card bg-bg-card hover:bg-bg-card-hover'
                      }`}
                    >
                      <div className="flex gap-1.5 items-center">
                        <span className="shrink-0">{t.icon}</span>
                        <div className="overflow-hidden">
                          <p className={`text-[10px] font-bold truncate ${isSelected ? 'text-brand-primary' : 'text-text-main'}`}>
                            {t.id}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Prompt Context */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                5. Custom Instructions (Optional)
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Example: Focus heavily on my leadership skills and React project experience..."
                className="w-full min-h-[60px] p-2.5 text-xs bg-bg-card border border-border-card text-text-main rounded-xl focus:border-brand-primary transition-all focus:outline-none resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !selectedJobId}
                className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-primary/10"
              >
                <WandIcon size={14} className={generating ? 'animate-spin' : ''} />
                {generating ? 'Generating Draft...' : 'Generate with Gemini'}
              </button>

              <button
                type="button"
                onClick={handleSaveAndAttach}
                disabled={saving || !selectedJobId || !coverLetter}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                  isDirty
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/10 hover:bg-emerald-500'
                    : 'bg-bg-card border-border-card text-text-muted hover:text-text-main hover:bg-bg-card-hover'
                }`}
              >
                <CheckCircleIcon size={13} />
                {saving ? 'Saving...' : 'Save & Attach to Job'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Visual document preview canvas */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Style Template Selector Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider block">
                Template Structure:
              </span>
              <div className="flex flex-wrap gap-1">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                      selectedTemplate === t.id
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                        : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-zinc-800 hover:border-slate-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportDocx}
              disabled={exporting || !selectedJobId || !coverLetter}
              className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-zinc-750 flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <DownloadIcon size={12} className={exporting ? 'animate-bounce' : ''} />
              Export DOCX
            </button>
          </div>

          {/* Success & Error alerts banner */}
          {successMsg && (
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircleIcon size={13} />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/5 border border-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <AlertTriangleIcon size={13} />
              {errorMsg}
            </div>
          )}

          {/* A4 Sheet Editor Canvas */}
          <div className="relative group/canvas">
            <div className={`w-full border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-300 min-h-[600px] ${style.paper}`}>
              
              {/* Document Header Section */}
              <div className={style.header}>
                <h3 className={style.title}>{candidateName}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 dark:text-zinc-500 text-[11px] mt-1">
                  <span>{candidateEmail}</span>
                  {candidatePhone && <span>• {candidatePhone}</span>}
                  {selectedJob && (
                    <span className="text-brand-primary dark:text-indigo-400 font-semibold font-mono">
                      • Job Application: {selectedJob.job} @ {selectedJob.companyName}
                    </span>
                  )}
                </div>
              </div>

              {/* Document Letter Body Area */}
              <div className={style.body}>
                {generating ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm font-medium">Gemini is scanning resume context & drafting details...</p>
                  </div>
                ) : (
                  <textarea
                    value={coverLetter}
                    onChange={(e) => {
                      setCoverLetter(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Cover letter content will appear here after generation. You can edit this text area freely to make custom changes..."
                    className="w-full min-h-[450px] p-0 border-0 bg-transparent text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-0 leading-relaxed font-sans overflow-y-auto resize-none"
                    style={{ fontFamily: selectedTemplate === 'classic' || selectedTemplate === 'executive' ? 'Georgia, serif' : 'inherit' }}
                  />
                )}
              </div>
            </div>

            {/* Floating indicator for visual feedback */}
            {isDirty && !generating && (
              <span className="absolute bottom-4 right-4 bg-amber-500 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse">
                Unsaved Draft Changes
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
