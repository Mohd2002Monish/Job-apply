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
    <svg className="w-3.5 h-3.5 text-brand-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ), desc: 'Formal' },
  { id: 'Confident', icon: (
    <svg className="w-3.5 h-3.5 text-brand-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
    </svg>
  ), desc: 'Assertive' },
  { id: 'Creative', icon: (
    <svg className="w-3.5 h-3.5 text-brand-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M3 21l9-9" />
    </svg>
  ), desc: 'Unique' },
  { id: 'Executive', icon: (
    <svg className="w-3.5 h-3.5 text-brand-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ), desc: 'Authoritative' },
  { id: 'Friendly', icon: (
    <svg className="w-3.5 h-3.5 text-brand-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ), desc: 'Warm' }
];

const TEMPLATES = [
  { id: 'classic', label: 'Classic', desc: 'Serif font with centered headers' },
  { id: 'modern', label: 'Modern Accent', desc: 'Clean sans-serif with top accent strip' },
  { id: 'minimal', label: 'Minimalist', desc: 'High margins and light typography' },
  { id: 'executive', label: 'Executive', desc: 'Formal look with a solid left bar' }
];

const CopyIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = ({ size = 14, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function CoverLetterTab({ user }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  
  const [wordCount, setWordCount] = useState(250);
  const [industry, setIndustry] = useState('Software Engineering');
  const [tone, setTone] = useState('Professional');
  const [customInstructions, setCustomInstructions] = useState('');
  
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [isDirty, setIsDirty] = useState(false);
  const [copied, setCopied] = useState(false);

  const [loadingJobs, setLoadingJobs] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleJobChange = (jobId) => {
    setSelectedJobId(jobId);
    const job = jobs.find(j => j._id === jobId) || null;
    setSelectedJob(job);
    setCoverLetter(job ? job.coverLetter || '' : '');
    setIsDirty(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

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
        setSuccessMsg('Cover letter generated by Gemini AI!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Generation failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setGenerating(false);
    }
  };

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
      setSuccessMsg('Cover letter saved & attached to job outreach!');
      setJobs(prev => prev.map(j => j._id === selectedJobId ? { ...j, coverLetter, templateId: selectedTemplate } : j));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to save cover letter: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (!selectedJobId) return;
    setExporting(true);
    setErrorMsg('');
    
    try {
      await axios.patch(`${BACKEND}/jobs/${selectedJobId}`, { coverLetter, templateId: selectedTemplate }, { withCredentials: true });
      
      const res = await axios.post(
        `${BACKEND}/resume/cover-letter/export`, 
        { jobId: selectedJobId, format: 'pdf', templateId: selectedTemplate },
        { responseType: 'blob', withCredentials: true }
      );
      
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `cover_letter_${selectedJob?.companyName || 'application'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccessMsg('PDF cover letter downloaded!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to export PDF document.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportDocx = async () => {
    if (!selectedJobId) return;
    setExporting(true);
    setErrorMsg('');
    
    try {
      await axios.patch(`${BACKEND}/jobs/${selectedJobId}`, { coverLetter, templateId: selectedTemplate }, { withCredentials: true });
      
      const res = await axios.post(
        `${BACKEND}/resume/cover-letter/export`, 
        { jobId: selectedJobId, format: 'docx', templateId: selectedTemplate },
        { responseType: 'blob', withCredentials: true }
      );
      
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `cover_letter_${selectedJob?.companyName || 'application'}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccessMsg('DOCX cover letter downloaded!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to export DOCX document.');
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTemplateStyles = () => {
    switch (selectedTemplate) {
      case 'modern':
        return {
          paper: 'font-sans border-t-[6px] border-brand-primary p-8 md:p-12 bg-white text-slate-900',
          header: 'border-b border-slate-200 pb-4 mb-6',
          title: 'text-brand-primary text-xl md:text-2xl font-bold tracking-tight',
          body: 'text-sm leading-relaxed text-slate-800 font-normal space-y-4'
        };
      case 'minimal':
        return {
          paper: 'font-sans p-8 md:p-12 bg-white text-slate-800 tracking-wide font-light',
          header: 'mb-8 border-l border-slate-300 pl-4 py-1',
          title: 'text-lg font-semibold tracking-widest text-slate-500 uppercase',
          body: 'text-sm leading-loose text-slate-700 font-light space-y-5'
        };
      case 'executive':
        return {
          paper: 'font-serif border-l-[6px] border-slate-800 p-8 md:p-12 bg-white text-zinc-950',
          header: 'mb-6 pb-4 border-b border-zinc-200',
          title: 'text-lg md:text-xl font-bold uppercase tracking-wider text-zinc-800',
          body: 'text-sm leading-relaxed text-zinc-850 font-medium space-y-4'
        };
      case 'classic':
      default:
        return {
          paper: 'font-serif p-8 md:p-12 bg-white text-slate-950',
          header: 'text-center border-b border-slate-100 pb-5 mb-6',
          title: 'text-xl md:text-2xl font-bold font-serif text-slate-850',
          body: 'text-sm leading-relaxed text-slate-900 font-normal space-y-4'
        };
    }
  };

  const style = getTemplateStyles();
  const activeResume = user?.resumes?.find(r => r.id === user.activeResumeId) || user?.resumes?.[0] || null;
  const candidateName = activeResume?.resumeData?.personalInfo?.name || user?.name || 'Applicant Name';
  const candidateEmail = activeResume?.resumeData?.personalInfo?.email || user?.email || 'email@example.com';
  const candidatePhone = activeResume?.resumeData?.personalInfo?.phone || '';

  const wordCountActual = coverLetter ? coverLetter.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCountActual = coverLetter ? coverLetter.length : 0;

  return (
    <div className="space-y-6 w-full animate-fade-in text-text-main">
      {/* ─── Header Workspace Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-card pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-main flex items-center gap-2.5">
            Cover Letter Studio
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Build, style, and attach tailored cover letters to your active job applications with AI.
          </p>
        </div>

        {/* Global Export Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting || !selectedJobId || !coverLetter}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-primary text-white hover:bg-brand-primary-hover flex items-center gap-2 shadow-md shadow-brand-primary/20 transition-all disabled:opacity-50 cursor-pointer btn-tactile whitespace-nowrap"
          >
            <DownloadIcon size={14} className={exporting ? 'animate-bounce' : ''} />
            <span>Export PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportDocx}
            disabled={exporting || !selectedJobId || !coverLetter}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-bg-card text-text-main border border-border-card hover:bg-bg-card-hover flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer btn-tactile whitespace-nowrap"
          >
            <DownloadIcon size={14} className={exporting ? 'animate-bounce' : ''} />
            <span>Export DOCX</span>
          </button>
        </div>
      </div>

      {/* Alert Messaging */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircleIcon size={14} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <AlertTriangleIcon size={14} />
          {errorMsg}
        </div>
      )}

      {/* ─── Main Grid Layout ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Controls Panel */}
        <div className="lg:col-span-4 bg-bg-card border border-border-card rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-card pb-3">
            <h2 className="text-xs font-extrabold text-text-main uppercase tracking-wider">
              AI Configuration
            </h2>
            <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
              Gemini 1.5 Pro
            </span>
          </div>

          {/* 1. Job Selector */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
              1. Select Job Application
            </label>
            {loadingJobs ? (
              <div className="h-9 rounded-xl bg-bg-app animate-pulse border border-border-card" />
            ) : jobs.length === 0 ? (
              <div className="text-xs text-amber-500 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 font-semibold">
                <AlertTriangleIcon size={14} />
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

          {/* 2. Word Count */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                2. Target Word Length
              </label>
              <span className="text-[11px] font-extrabold text-brand-primary font-mono">
                {wordCount} words
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[150, 250, 350, 500].map(words => (
                <button
                  key={words}
                  type="button"
                  onClick={() => setWordCount(words)}
                  className={`py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer btn-tactile ${
                    wordCount === words
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                      : 'bg-bg-app text-text-muted border-border-card hover:text-text-main'
                  }`}
                >
                  {words === 150 ? 'Short' : words === 250 ? 'Medium' : words === 350 ? 'Standard' : 'Detailed'}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Industry Selector */}
          <div className="space-y-1 pt-1">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
              3. Industry Focus
            </label>
            <Select
              value={INDUSTRIES.map(ind => ({ value: ind, label: ind })).find(o => o.value === industry)}
              onChange={(opt) => setIndustry(opt ? opt.value : '')}
              options={INDUSTRIES.map(ind => ({ value: ind, label: ind }))}
              styles={getReactSelectStyles()}
              id="cl-workspace-industry"
            />
          </div>

          {/* 4. Tone Selector */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
              4. Writing Tone
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {TONES.map(t => {
                const isSelected = tone === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`p-2 rounded-xl border text-center transition-all btn-tactile ${
                      isSelected
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-sm'
                        : 'border-border-card bg-bg-app hover:bg-bg-card-hover text-text-muted'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      {t.icon}
                      <span className="text-[10px] truncate w-full">{t.id}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Custom Prompt Context */}
          <div className="space-y-1 pt-1">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
              5. Custom Prompt Context
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Highlight leadership, remote work experience, and React..."
              rows={2}
              className="w-full p-2.5 text-xs bg-bg-app border border-border-card text-text-main rounded-xl focus:border-brand-primary transition-all focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Main Triggers */}
          <div className="pt-3 space-y-2 border-t border-border-card">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !selectedJobId}
              className="w-full py-3 rounded-xl font-extrabold text-xs text-white bg-brand-primary hover:bg-brand-primary-hover shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer btn-tactile disabled:opacity-50"
            >
              <WandIcon size={14} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Drafting Cover Letter...' : 'Generate with Gemini'}
            </button>

            <button
              type="button"
              onClick={handleSaveAndAttach}
              disabled={saving || !selectedJobId || !coverLetter}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer btn-tactile ${
                isDirty
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/10 hover:bg-emerald-500'
                  : 'bg-bg-app border-border-card text-text-muted hover:text-text-main hover:bg-bg-card-hover'
              }`}
            >
              <CheckCircleIcon size={14} />
              {saving ? 'Saving...' : 'Save & Link to Job'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Realistic Document Canvas */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Document Preview Canvas Box */}
          <div className="bg-bg-card border border-border-card rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Template Selector & Canvas Header */}
            <div className="p-3.5 px-5 border-b border-border-card bg-bg-app/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Template Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider shrink-0 mr-1">
                  Style:
                </span>
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border shrink-0 cursor-pointer btn-tactile ${
                      selectedTemplate === t.id
                        ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                        : 'bg-bg-card text-text-muted border-border-card hover:text-text-main hover:bg-bg-card-hover'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Stats & Copy Button */}
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                {coverLetter && (
                  <span className="text-[10px] font-mono text-text-muted bg-bg-card border border-border-card px-2.5 py-0.5 rounded-full">
                    {wordCountActual} words · {charCountActual} chars
                  </span>
                )}
                {coverLetter && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border border-border-card bg-bg-card text-text-muted hover:text-text-main hover:bg-bg-card-hover transition-all cursor-pointer btn-tactile shadow-sm"
                  >
                    {copied ? <CheckIcon size={13} className="text-emerald-500" /> : <CopyIcon size={13} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
            </div>

            {/* Off-White Canvas Area containing Realistic Document */}
            <div className="p-6 md:p-10 bg-slate-100/70 dark:bg-zinc-950/70 min-h-[640px] flex justify-center items-start">
              
              {/* Actual Paper Document Sheet */}
              <div className={`w-full max-w-2xl rounded-xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.15)] transition-all duration-300 relative ${style.paper}`}>
                
                {/* Document Header Section */}
                <div className={style.header}>
                  <h3 className={style.title}>{candidateName}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-xs mt-1.5">
                    <span>{candidateEmail}</span>
                    {candidatePhone && <span>• {candidatePhone}</span>}
                    {selectedJob && (
                      <span className="text-brand-primary font-bold font-mono">
                        • Job Application: {selectedJob.job} @ {selectedJob.companyName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Document Letter Body Area */}
                <div className={style.body}>
                  {generating ? (
                    <div className="flex flex-col items-center justify-center py-28 text-slate-400 gap-3">
                      <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-semibold">Gemini is scanning resume context & drafting letter...</p>
                    </div>
                  ) : (
                    <textarea
                      value={coverLetter}
                      onChange={(e) => {
                        setCoverLetter(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="Cover letter text will appear here after generation. Click to edit any line freely..."
                      className="w-full min-h-[460px] p-0 border-0 bg-transparent text-slate-900 text-sm focus:outline-none focus:ring-0 leading-relaxed font-sans overflow-y-auto resize-none"
                      style={{ fontFamily: selectedTemplate === 'classic' || selectedTemplate === 'executive' ? 'Georgia, serif' : 'inherit' }}
                    />
                  )}
                </div>

                {/* Unsaved Draft Floating Badge */}
                {isDirty && !generating && (
                  <span className="absolute bottom-4 right-4 bg-amber-500 text-white font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                    Unsaved Draft Changes
                  </span>
                )}
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
