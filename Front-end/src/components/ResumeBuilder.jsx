import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import {
  EyeIcon, EditIcon, DownloadIcon, LayersIcon, CheckCircleIcon,
  ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon, XIcon, MailIcon
} from './Icons';
import { setResumesInfo, setAuth } from '../store/authSlice';

const BACKEND = 'http://localhost:3000';

// ─── Template definitions ─────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic',
    desc: 'Traditional serif layout, clean and timeless',
    accent: '#1a1a1a',
    thumb: (
      <svg viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="160" fill="#fff"/>
        <rect x="8" y="10" width="60" height="7" rx="1" fill="#1a1a1a"/>
        <rect x="8" y="20" width="35" height="3" rx="1" fill="#6b7280"/>
        <rect x="8" y="26" width="104" height="1" fill="#1a1a1a"/>
        <rect x="8" y="32" width="20" height="2.5" rx="0.5" fill="#1a1a1a"/>
        <rect x="8" y="37" width="100" height="2" rx="1" fill="#9ca3af"/>
        <rect x="8" y="41" width="90" height="2" rx="1" fill="#9ca3af"/>
        <rect x="8" y="48" width="20" height="2.5" rx="0.5" fill="#1a1a1a"/>
        <rect x="8" y="53" width="80" height="2" rx="1" fill="#d1d5db"/>
        <rect x="8" y="57" width="70" height="2" rx="1" fill="#d1d5db"/>
        <rect x="8" y="61" width="75" height="2" rx="1" fill="#d1d5db"/>
        <rect x="8" y="68" width="20" height="2.5" rx="0.5" fill="#1a1a1a"/>
        <rect x="8" y="73" width="80" height="2" rx="1" fill="#d1d5db"/>
        <rect x="8" y="77" width="65" height="2" rx="1" fill="#d1d5db"/>
        <rect x="8" y="84" width="20" height="2.5" rx="0.5" fill="#1a1a1a"/>
        <rect x="8" y="89" width="42" height="4" rx="2" fill="#f3f4f6"/>
        <rect x="52" y="89" width="32" height="4" rx="2" fill="#f3f4f6"/>
        <rect x="8" y="95" width="36" height="4" rx="2" fill="#f3f4f6"/>
      </svg>
    )
  },
  {
    id: 'modern',
    name: 'Modern',
    desc: 'Bold blue sidebar with card-based sections',
    accent: '#1e40af',
    thumb: (
      <svg viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="160" fill="#fff"/>
        <rect width="120" height="36" fill="#1e40af"/>
        <rect x="8" y="8" width="55" height="8" rx="1" fill="#fff"/>
        <rect x="8" y="19" width="35" height="3" rx="1" fill="rgba(255,255,255,0.6)"/>
        <rect width="34" height="160" x="0" y="36" fill="#f1f5f9"/>
        <rect x="4" y="42" width="10" height="2" rx="0.5" fill="#1e40af"/>
        <rect x="4" y="46" width="24" height="2" rx="1" fill="#94a3b8"/>
        <rect x="4" y="50" width="20" height="2" rx="1" fill="#94a3b8"/>
        <rect x="4" y="54" width="22" height="2" rx="1" fill="#94a3b8"/>
        <rect x="4" y="62" width="10" height="2" rx="0.5" fill="#1e40af"/>
        <rect x="4" y="66" width="24" height="3.5" rx="1.5" fill="#dbeafe"/>
        <rect x="4" y="71" width="20" height="3.5" rx="1.5" fill="#dbeafe"/>
        <rect x="4" y="76" width="22" height="3.5" rx="1.5" fill="#dbeafe"/>
        <rect x="4" y="81" width="18" height="3.5" rx="1.5" fill="#dbeafe"/>
        <rect x="38" y="42" width="18" height="2.5" rx="0.5" fill="#1e40af"/>
        <rect x="38" y="47" width="75" height="2" rx="1" fill="#e2e8f0"/>
        <rect x="38" y="51" width="65" height="2" rx="1" fill="#e2e8f0"/>
        <rect x="38" y="58" width="18" height="2.5" rx="0.5" fill="#1e40af"/>
        <rect x="38" y="63" width="70" height="2" rx="1" fill="#e2e8f0"/>
        <rect x="38" y="67" width="60" height="2" rx="1" fill="#e2e8f0"/>
        <rect x="38" y="71" width="55" height="2" rx="1" fill="#e2e8f0"/>
      </svg>
    )
  },
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Ultra-clean whitespace, typography-first',
    accent: '#111111',
    thumb: (
      <svg viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="160" fill="#fff"/>
        <rect x="10" y="14" width="45" height="9" rx="1" fill="#111"/>
        <rect x="10" y="26" width="28" height="3" rx="1" fill="#9ca3af"/>
        <rect x="10" y="32" width="100" height="0.75" fill="#f3f4f6"/>
        <rect x="10" y="35" width="70" height="2" rx="1" fill="#d1d5db"/>
        <rect x="10" y="39" width="80" height="2" rx="1" fill="#d1d5db"/>
        <rect x="10" y="49" width="12" height="2" rx="0.5" fill="#9ca3af"/>
        <rect x="10" y="54" width="100" height="0.75" fill="#f3f4f6"/>
        <rect x="10" y="57" width="65" height="2" rx="1" fill="#e5e7eb"/>
        <rect x="10" y="61" width="55" height="2" rx="1" fill="#e5e7eb"/>
        <rect x="10" y="65" width="70" height="2" rx="1" fill="#e5e7eb"/>
        <rect x="10" y="75" width="12" height="2" rx="0.5" fill="#9ca3af"/>
        <rect x="10" y="80" width="100" height="0.75" fill="#f3f4f6"/>
        <rect x="10" y="83" width="36" height="4" rx="2" fill="#f3f4f6"/>
        <rect x="48" y="83" width="28" height="4" rx="2" fill="#f3f4f6"/>
        <rect x="78" y="83" width="30" height="4" rx="2" fill="#f3f4f6"/>
        <rect x="10" y="89" width="30" height="4" rx="2" fill="#f3f4f6"/>
      </svg>
    )
  },
  {
    id: 'creative',
    name: 'Creative',
    desc: 'Emerald green sidebar, vibrant and modern',
    accent: '#065f46',
    thumb: (
      <svg viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="160" fill="#fff"/>
        <rect width="38" height="160" fill="url(#creativeGrad)"/>
        <defs>
          <linearGradient id="creativeGrad" x1="0" y1="0" x2="0" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#065f46"/>
            <stop offset="1" stopColor="#059669"/>
          </linearGradient>
        </defs>
        <circle cx="19" cy="22" r="12" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
        <rect x="5" y="38" width="28" height="4" rx="1" fill="rgba(255,255,255,0.9)"/>
        <rect x="5" y="44" width="22" height="2" rx="1" fill="rgba(255,255,255,0.5)"/>
        <rect x="5" y="52" width="12" height="1.5" rx="0.5" fill="rgba(255,255,255,0.4)"/>
        <rect x="5" y="56" width="26" height="2" rx="1" fill="rgba(255,255,255,0.6)"/>
        <rect x="5" y="60" width="20" height="2" rx="1" fill="rgba(255,255,255,0.6)"/>
        <rect x="5" y="66" width="12" height="1.5" rx="0.5" fill="rgba(255,255,255,0.4)"/>
        <rect x="5" y="69" width="26" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
        <rect x="5" y="74" width="20" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
        <rect x="5" y="79" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
        <rect x="44" y="10" width="14" height="1.5" rx="0.5" fill="#065f46"/>
        <rect x="44" y="14" width="70" height="0.5" fill="#d1fae5"/>
        <rect x="44" y="17" width="68" height="2" rx="1" fill="#e5e7eb"/>
        <rect x="44" y="21" width="55" height="2" rx="1" fill="#e5e7eb"/>
        <rect x="44" y="30" width="14" height="1.5" rx="0.5" fill="#065f46"/>
        <rect x="44" y="34" width="70" height="0.5" fill="#d1fae5"/>
        <rect x="44" y="37" width="68" height="8" rx="2" fill="#f0fdf4"/>
        <rect x="47" y="39" width="40" height="2" rx="1" fill="#374151"/>
        <rect x="47" y="43" width="30" height="1.5" rx="0.5" fill="#9ca3af"/>
        <rect x="44" y="47" width="68" height="8" rx="2" fill="#f0fdf4"/>
        <rect x="44" y="60" width="14" height="1.5" rx="0.5" fill="#065f46"/>
        <rect x="44" y="64" width="68" height="8" rx="2" fill="#f0fdf4"/>
      </svg>
    )
  },
  {
    id: 'executive',
    name: 'Executive',
    desc: 'Navy & gold prestige — command the room',
    accent: '#0f2d52',
    thumb: (
      <svg viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="160" fill="#fff"/>
        <rect width="120" height="40" fill="#0f2d52"/>
        <rect x="0" y="39" width="120" height="3" fill="url(#goldGrad)"/>
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c9a84c"/>
            <stop offset="0.5" stopColor="#e8c97e"/>
            <stop offset="1" stopColor="#c9a84c"/>
          </linearGradient>
        </defs>
        <rect x="8" y="9" width="60" height="9" rx="1" fill="#fff"/>
        <rect x="8" y="21" width="30" height="3" rx="1" fill="#c9a84c"/>
        <rect x="8" y="27" width="90" height="2" rx="1" fill="rgba(255,255,255,0.3)"/>
        <rect x="8" y="47" width="18" height="2" rx="0.5" fill="#0f2d52"/>
        <rect x="8" y="51" width="72" height="0.5" fill="#c9a84c"/>
        <rect x="8" y="54" width="65" height="2" rx="1" fill="#e5e7eb"/>
        <rect x="8" y="58" width="55" height="2" rx="1" fill="#e5e7eb"/>
        <rect x="8" y="64" width="18" height="2" rx="0.5" fill="#0f2d52"/>
        <rect x="8" y="68" width="72" height="0.5" fill="#c9a84c"/>
        <rect x="8" y="71" width="65" height="2" rx="1" fill="#e5e7eb"/>
        <rect x="8" y="75" width="55" height="2" rx="1" fill="#e5e7eb"/>
        <rect x="8" y="79" width="50" height="2" rx="1" fill="#e5e7eb"/>
        <rect x="86" y="47" width="26" height="2" rx="0.5" fill="#0f2d52"/>
        <rect x="86" y="51" width="26" height="0.5" fill="#e5e7eb"/>
        <rect x="86" y="54" width="22" height="2" rx="1" fill="#d1d5db"/>
        <rect x="86" y="58" width="20" height="2" rx="1" fill="#d1d5db"/>
        <rect x="86" y="62" width="18" height="2" rx="1" fill="#d1d5db"/>
        <rect x="86" y="66" width="24" height="2" rx="1" fill="#d1d5db"/>
      </svg>
    )
  },
];

const FORMATS = [
  { id: 'pdf', label: 'PDF' },
  { id: 'docx', label: 'DOCX' },
  { id: 'jpg', label: 'JPG' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const Field = ({ label, value, onChange, multiline = false, placeholder = '', rows = 3 }) => (
  <div>
    <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">
      {label}
    </label>
    {multiline ? (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="input resize-y"
      />
    ) : (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
      />
    )}
  </div>
);

const Section = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</span>
        {open ? <ChevronUpIcon size={14} className="text-slate-400" /> : <ChevronDownIcon size={14} className="text-slate-400" />}
      </button>
      {open && <div className="px-4 py-4 bg-white dark:bg-zinc-900 space-y-3">{children}</div>}
    </div>
  );
};

const TagInput = ({ label, items = [], onChange }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim();
    if (t && !items.includes(t)) { onChange([...items, t]); setInput(''); }
  };
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {items.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs font-medium text-indigo-700 dark:text-indigo-400">
            {tag}
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
               <XIcon size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Type and press Enter"
          className="input flex-1"
        />
        <button onClick={add} className="btn-ghost px-3 py-2">
          <PlusIcon size={14} />
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ResumeBuilder = ({ user, initialResumeData }) => {
  const dispatch = useDispatch();
  const { resumes, activeResumeId } = useSelector(state => state.auth);

  const [resumeData, setResumeData] = useState(initialResumeData || null);
  const [selectedTemplate, setSelectedTemplate] = useState(() => localStorage.getItem('rb_template') || 'classic');
  const [step, setStep] = useState('select'); // 'select' | 'edit'
  const [previewHtml, setPreviewHtml] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [exportError, setExportError] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // '' | 'saving' | 'saved' | 'error'
  const [editTab, setEditTab] = useState('edit'); // 'edit' | 'coverLetter'
  const [historyOpen, setHistoryOpen] = useState(false);

  // Cover Letter
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [coverLetterText, setCoverLetterText] = useState('');
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  const [savingCoverLetter, setSavingCoverLetter] = useState(false);
  const [exportingCoverLetter, setExportingCoverLetter] = useState(null);

  const previewTimer = useRef(null);
  const saveTimer = useRef(null);

  // Sync resumeData when parent sends a new one (e.g. resume switch)
  useEffect(() => {
    if (initialResumeData) setResumeData(initialResumeData);
  }, [initialResumeData]);

  // Load from backend if not yet loaded
  useEffect(() => {
    if (!resumeData && user?.email) {
      axios.get(`${BACKEND}/resume-data`)
        .then(res => { if (res.data.hasData) setResumeData(res.data.resumeData); })
        .catch(() => {});
    }
  }, [user?.email]);

  // Auto-preview with debounce
  useEffect(() => {
    if (!resumeData || step !== 'edit') return;
    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(fetchPreview, 700);
    return () => clearTimeout(previewTimer.current);
  }, [resumeData, selectedTemplate, step]);

  // Auto-save with debounce
  const autoSave = useCallback((data) => {
    clearTimeout(saveTimer.current);
    setSaveStatus('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        await axios.put(`${BACKEND}/resume/update`, { resumeData: data });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch {
        setSaveStatus('error');
      }
    }, 2000);
  }, []);

  const fetchPreview = async () => {
    if (!resumeData) return;
    setLoadingPreview(true);
    try {
      const res = await axios.post(`${BACKEND}/preview-template`, { templateId: selectedTemplate, resumeData }, { responseType: 'text' });
      setPreviewHtml(res.data);
    } catch (_) {}
    setLoadingPreview(false);
  };

  const handleExport = async (format) => {
    setExporting(format);
    setExportError('');
    try {
      const res = await axios.post(`${BACKEND}/export-resume`, {
        templateId: selectedTemplate, format, resumeData,
      }, { responseType: 'blob', timeout: 60000 });
      const mimes = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', jpg: 'image/jpeg' };
      const blob = new Blob([res.data], { type: mimes[format] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `resume_${selectedTemplate}.${format}`; a.click();
      URL.revokeObjectURL(url);
    } catch (_) {
      setExportError('Export failed. Ensure the backend is running.');
    }
    setExporting(null);
  };

  const handleSelectTemplate = (tid) => {
    setSelectedTemplate(tid);
    localStorage.setItem('rb_template', tid);
    setStep('edit');
  };

  const handleDeleteResume = async (id) => {
    if (!confirm('Delete this resume?')) return;
    try {
      const res = await axios.post(`${BACKEND}/resume/delete`, { id });
      dispatch(setResumesInfo({ resumes: res.data.resumes, activeResumeId: res.data.activeResumeId }));
      if (id === activeResumeId) {
        const next = res.data.resumes.find(r => r.id === res.data.activeResumeId);
        if (next) {
          setResumeData(next.resumeData);
          dispatch(setAuth({ authenticated: true, user, resumeName: next.resumeFileName, resumeData: next.resumeData }));
        } else {
          setResumeData(null);
          dispatch(setAuth({ authenticated: true, user, resumeName: null, resumeData: null }));
        }
      }
    } catch (err) {
      console.error('Delete error:', err.message);
    }
  };

  const handleSwitchResume = async (id) => {
    try {
      const res = await axios.post(`${BACKEND}/resume/select`, { id });
      dispatch(setAuth({ authenticated: true, user, resumeName: res.data.resumeFileName, resumeData: res.data.resumeData }));
      dispatch(setResumesInfo({ resumes, activeResumeId: id }));
      setResumeData(res.data.resumeData);
      setHistoryOpen(false);
    } catch (err) {
      console.error('Switch error:', err.message);
    }
  };

  // Fetch jobs for cover letter tab
  useEffect(() => {
    if (editTab === 'coverLetter') fetchJobs();
  }, [editTab]);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${BACKEND}/jobs`);
      setJobs(res.data);
      if (res.data.length > 0 && !selectedJobId) {
        setSelectedJobId(res.data[0]._id);
        setCoverLetterText(res.data[0].coverLetter || '');
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (selectedJobId) {
      const job = jobs.find(j => j._id === selectedJobId);
      if (job) setCoverLetterText(job.coverLetter || '');
    } else setCoverLetterText('');
  }, [selectedJobId, jobs]);

  const handleGenerateCoverLetter = async () => {
    if (!selectedJobId) return;
    setGeneratingCoverLetter(true);
    try {
      const res = await axios.post(`${BACKEND}/resume/cover-letter`, { jobId: selectedJobId });
      setCoverLetterText(res.data.coverLetter);
      setJobs(prev => prev.map(j => j._id === selectedJobId ? { ...j, coverLetter: res.data.coverLetter } : j));
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.error || err.message));
    } finally { setGeneratingCoverLetter(false); }
  };

  const handleSaveCoverLetter = async () => {
    if (!selectedJobId) return;
    setSavingCoverLetter(true);
    try {
      await axios.patch(`${BACKEND}/jobs/${selectedJobId}`, { coverLetter: coverLetterText });
      setJobs(prev => prev.map(j => j._id === selectedJobId ? { ...j, coverLetter: coverLetterText } : j));
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.error || err.message));
    } finally { setSavingCoverLetter(false); }
  };

  const handleExportCoverLetter = async (format) => {
    if (!selectedJobId) return;
    setExportingCoverLetter(format);
    try {
      const res = await axios.post(`${BACKEND}/resume/cover-letter/export`, { jobId: selectedJobId, format }, { responseType: 'blob' });
      const mimes = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
      const blob = new Blob([res.data], { type: mimes[format] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `cover_letter_${selectedJobId}.${format}`; a.click();
      URL.revokeObjectURL(url);
    } catch (_) {
      alert('Export failed.');
    } finally { setExportingCoverLetter(null); }
  };

  // Data update helpers
  const upd = (patch) => {
    const next = d => ({ ...d, ...patch });
    setResumeData(d => { const n = next(d); autoSave(n); return n; });
  };
  const updPI = (k, v) => setResumeData(d => {
    const n = { ...d, personalInfo: { ...d.personalInfo, [k]: v } };
    autoSave(n); return n;
  });
  const updExp = (i, k, v) => setResumeData(d => {
    const a = [...(d.experience || [])]; a[i] = { ...a[i], [k]: v };
    const n = { ...d, experience: a }; autoSave(n); return n;
  });
  const updEdu = (i, k, v) => setResumeData(d => {
    const a = [...(d.education || [])]; a[i] = { ...a[i], [k]: v };
    const n = { ...d, education: a }; autoSave(n); return n;
  });
  const updSkills = (k, v) => setResumeData(d => {
    const n = { ...d, skills: { ...(d.skills || {}), [k]: v } }; autoSave(n); return n;
  });
  const updPr = (i, k, v) => setResumeData(d => {
    const a = [...(d.projects || [])]; a[i] = { ...a[i], [k]: v };
    const n = { ...d, projects: a }; autoSave(n); return n;
  });

  // ─── Empty state ────────────────────────────────────────────────────────────
  if (!resumeData) {
    return (
      <div className="card shadow-sm mb-6">
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-5 shadow-sm">
            <LayersIcon size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">No resume uploaded yet</h3>
          <p className="text-sm text-slate-400 dark:text-zinc-500 max-w-xs mb-5">
            Upload your resume — AI will parse and structure it, then you can pick a template and edit here.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="btn-primary text-sm"
          >
            ↑ Upload Resume
          </button>
        </div>
      </div>
    );
  }

  const p = resumeData.personalInfo || {};
  const activeTpl = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];

  // ─── Template Selector Screen ───────────────────────────────────────────────
  if (step === 'select') {
    return (
      <div className="space-y-6 mb-6">
        {/* Hero CTA */}
        <div className="card shadow-sm overflow-hidden">
          <div className="relative px-6 py-5 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                    <LayersIcon size={13} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Resume Builder</span>
                </div>
                <h2 className="text-xl font-bold text-white">{p.name || 'Your Resume'}</h2>
                <p className="text-indigo-200 text-sm mt-0.5">{p.jobTitle || 'Ready to build your perfect resume'}</p>
              </div>
              <button
                onClick={() => setStep('edit')}
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-semibold text-sm shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all duration-200 active:scale-95"
              >
                <EditIcon size={14} />
                Continue with this resume
              </button>
            </div>
          </div>

          {/* Resume history */}
          {resumes && resumes.length > 1 && (
            <div className="border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold">{resumes.length}</span>
                  Saved Resumes
                </span>
                {historyOpen ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />}
              </button>
              {historyOpen && (
                <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in">
                  {resumes.map(r => (
                    <div key={r.id} className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${r.id === activeResumeId ? 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'}`}>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${r.id === activeResumeId ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {r.title}
                          {r.id === activeResumeId && <span className="ml-1.5 text-[9px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">Active</span>}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">{r.resumeFileName}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {r.id !== activeResumeId && (
                          <button
                            onClick={() => handleSwitchResume(r.id)}
                            className="text-[10px] px-2 py-1 rounded-md bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:text-indigo-700 dark:hover:text-indigo-400 font-medium transition-colors"
                          >
                            Switch
                          </button>
                        )}
                        {r.id !== activeResumeId && (
                          <button onClick={() => handleDeleteResume(r.id)} className="p-1 text-slate-300 dark:text-zinc-600 hover:text-red-500 transition-colors">
                            <TrashIcon size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Template Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Choose a Template</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Select a design to preview and edit your resume</p>
            </div>
            <span className="text-xs text-slate-400 dark:text-zinc-500 hidden sm:block">You can switch anytime</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t.id)}
                className={`group relative flex flex-col rounded-xl border-2 overflow-hidden text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  selectedTemplate === t.id
                    ? 'border-indigo-400 dark:border-indigo-500 shadow-md shadow-indigo-100 dark:shadow-indigo-500/10'
                    : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600'
                }`}
              >
                {/* Thumbnail */}
                <div className={`aspect-[3/4] w-full bg-white flex items-center justify-center p-1 transition-transform duration-300 group-hover:scale-105 origin-center`}>
                  <div className="w-full h-full">
                    {t.thumb}
                  </div>
                </div>

                {/* Selected overlay */}
                {selectedTemplate === t.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shadow-sm">
                    <CheckCircleIcon size={12} className="text-white" />
                  </div>
                )}

                {/* Label */}
                <div className="px-2.5 py-2.5 bg-white dark:bg-zinc-800 border-t border-slate-100 dark:border-zinc-700">
                  <p className={`text-xs font-bold ${selectedTemplate === t.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>{t.name}</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 leading-tight">{t.desc}</p>
                </div>

                {/* Use button on hover */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${selectedTemplate === t.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'} bg-slate-900/40 backdrop-blur-sm`}>
                  <span className="px-4 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold shadow-lg">Use This</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Side-by-Side Editor Screen ─────────────────────────────────────────────
  return (
    <div className="mb-6 flex flex-col" style={{ minHeight: '85vh' }}>
      {/* Editor top bar */}
      <div className="flex items-center gap-2 flex-wrap mb-3 px-1">
        {/* Back */}
        <button
          onClick={() => setStep('select')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
          </svg>
          Templates
        </button>
        <span className="text-slate-200 dark:text-zinc-700 text-sm">|</span>

        {/* Template switcher pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => { setSelectedTemplate(t.id); localStorage.setItem('rb_template', t.id); }}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                selectedTemplate === t.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Auto-save indicator */}
        {saveStatus && (
          <span className={`text-[10px] font-medium ${saveStatus === 'saved' ? 'text-emerald-500' : saveStatus === 'saving' ? 'text-amber-500' : 'text-red-500'}`}>
            {saveStatus === 'saving' ? '⏳ Saving…' : saveStatus === 'saved' ? '✓ Saved' : '⚠ Save failed'}
          </span>
        )}

        {/* Export buttons */}
        <div className="flex items-center gap-1.5">
          {FORMATS.map(f => (
            <button
              key={f.id}
              onClick={() => handleExport(f.id)}
              disabled={!!exporting}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all disabled:opacity-50"
            >
              {exporting === f.id ? (
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              ) : <DownloadIcon size={11} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {exportError && <p className="text-xs text-red-500 dark:text-red-400 mb-2 px-1">{exportError}</p>}

      {/* Side-by-side layout */}
      <div className="flex gap-3 flex-1" style={{ minHeight: 0 }}>

        {/* LEFT: Editor panel */}
        <div className="w-[42%] min-w-0 flex flex-col" style={{ maxHeight: '80vh' }}>
          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 rounded-xl p-1 mb-3 flex-shrink-0">
            {[
              { id: 'edit', label: 'Edit Data', Icon: EditIcon },
              { id: 'coverLetter', label: 'Cover Letter', Icon: MailIcon },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setEditTab(id)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  editTab === id
                    ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Editor form (scrollable) */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {editTab === 'edit' ? (
              <>
                <Section title="Personal Information" defaultOpen>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Full Name" value={p.name} onChange={v => updPI('name', v)} placeholder="Jane Smith" />
                    <Field label="Job Title" value={p.jobTitle} onChange={v => updPI('jobTitle', v)} placeholder="Full Stack Developer" />
                    <Field label="Email" value={p.email} onChange={v => updPI('email', v)} placeholder="jane@example.com" />
                    <Field label="Phone" value={p.phone} onChange={v => updPI('phone', v)} placeholder="+1 555 000 0000" />
                    <Field label="Location" value={p.location} onChange={v => updPI('location', v)} placeholder="San Francisco, CA" />
                    <Field label="LinkedIn" value={p.linkedin} onChange={v => updPI('linkedin', v)} placeholder="linkedin.com/in/..." />
                    <Field label="GitHub" value={p.github} onChange={v => updPI('github', v)} placeholder="github.com/..." />
                    <Field label="Website" value={p.website} onChange={v => updPI('website', v)} placeholder="yoursite.com" />
                  </div>
                </Section>

                <Section title="Professional Summary">
                  <Field label="Summary" value={resumeData.summary} onChange={v => upd({ summary: v })} multiline rows={4} placeholder="Brief professional overview..." />
                </Section>

                <Section title="Work Experience">
                  {(resumeData.experience || []).map((exp, i) => (
                    <div key={i} className="border border-slate-200 dark:border-zinc-700 rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Experience {i + 1}</span>
                        <button onClick={() => setResumeData(d => { const n = { ...d, experience: d.experience.filter((_, j) => j !== i) }; autoSave(n); return n; })} className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors">
                          <TrashIcon size={13} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Role" value={exp.role} onChange={v => updExp(i, 'role', v)} />
                        <Field label="Company" value={exp.company} onChange={v => updExp(i, 'company', v)} />
                        <Field label="Start Date" value={exp.startDate} onChange={v => updExp(i, 'startDate', v)} placeholder="Jan 2022" />
                        <Field label="End Date" value={exp.current ? 'Present' : exp.endDate} onChange={v => { if (v === 'Present') { updExp(i, 'current', true); } else { updExp(i, 'endDate', v); updExp(i, 'current', false); } }} placeholder="Present" />
                        <Field label="Location" value={exp.location} onChange={v => updExp(i, 'location', v)} />
                      </div>
                      <Field label="Description" value={exp.description} onChange={v => updExp(i, 'description', v)} multiline />
                    </div>
                  ))}
                  <button onClick={() => setResumeData(d => { const n = { ...d, experience: [...(d.experience || []), { company: '', role: '', startDate: '', endDate: '', current: false, location: '', description: '', achievements: [] }] }; autoSave(n); return n; })}
                    className="w-full py-2 rounded-lg border border-dashed border-slate-200 dark:border-zinc-700 text-xs text-slate-400 dark:text-zinc-500 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-1.5">
                    <PlusIcon size={13} /> Add Experience
                  </button>
                </Section>

                <Section title="Education">
                  {(resumeData.education || []).map((edu, i) => (
                    <div key={i} className="border border-slate-200 dark:border-zinc-700 rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Education {i + 1}</span>
                        <button onClick={() => setResumeData(d => { const n = { ...d, education: d.education.filter((_, j) => j !== i) }; autoSave(n); return n; })} className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors">
                          <TrashIcon size={13} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Institution" value={edu.institution} onChange={v => updEdu(i, 'institution', v)} />
                        <Field label="Degree" value={edu.degree} onChange={v => updEdu(i, 'degree', v)} />
                        <Field label="Field of Study" value={edu.field} onChange={v => updEdu(i, 'field', v)} />
                        <Field label="End Year" value={edu.endDate} onChange={v => updEdu(i, 'endDate', v)} placeholder="2023" />
                        <Field label="GPA" value={edu.gpa} onChange={v => updEdu(i, 'gpa', v)} placeholder="3.8" />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setResumeData(d => { const n = { ...d, education: [...(d.education || []), { institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' }] }; autoSave(n); return n; })}
                    className="w-full py-2 rounded-lg border border-dashed border-slate-200 dark:border-zinc-700 text-xs text-slate-400 dark:text-zinc-500 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-1.5">
                    <PlusIcon size={13} /> Add Education
                  </button>
                </Section>

                <Section title="Skills">
                  <div className="space-y-4">
                    <TagInput label="Technical Skills" items={resumeData.skills?.technical || []} onChange={v => updSkills('technical', v)} />
                    <TagInput label="Tools & Frameworks" items={resumeData.skills?.tools || []} onChange={v => updSkills('tools', v)} />
                    <TagInput label="Soft Skills" items={resumeData.skills?.soft || []} onChange={v => updSkills('soft', v)} />
                    <TagInput label="Languages" items={resumeData.skills?.languages || []} onChange={v => updSkills('languages', v)} />
                  </div>
                </Section>

                <Section title="Projects">
                  {(resumeData.projects || []).map((pr, i) => (
                    <div key={i} className="border border-slate-200 dark:border-zinc-700 rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Project {i + 1}</span>
                        <button onClick={() => setResumeData(d => { const n = { ...d, projects: d.projects.filter((_, j) => j !== i) }; autoSave(n); return n; })} className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors">
                          <TrashIcon size={13} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Project Name" value={pr.name} onChange={v => updPr(i, 'name', v)} />
                        <Field label="Live URL" value={pr.url} onChange={v => updPr(i, 'url', v)} />
                        <Field label="GitHub URL" value={pr.github} onChange={v => updPr(i, 'github', v)} />
                      </div>
                      <Field label="Description" value={pr.description} onChange={v => updPr(i, 'description', v)} multiline />
                      <TagInput label="Tech Stack" items={pr.techStack || []} onChange={v => updPr(i, 'techStack', v)} />
                    </div>
                  ))}
                  <button onClick={() => setResumeData(d => { const n = { ...d, projects: [...(d.projects || []), { name: '', description: '', techStack: [], url: '', github: '' }] }; autoSave(n); return n; })}
                    className="w-full py-2 rounded-lg border border-dashed border-slate-200 dark:border-zinc-700 text-xs text-slate-400 dark:text-zinc-500 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-1.5">
                    <PlusIcon size={13} /> Add Project
                  </button>
                </Section>
              </>
            ) : (
              /* Cover Letter Tab */
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 bg-slate-50 dark:bg-zinc-850/40 rounded-xl border border-slate-200/50 dark:border-zinc-850 space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Select Target Job</label>
                  {jobs.length > 0 ? (
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="input w-full text-xs"
                    >
                      {jobs.map(j => (
                        <option key={j._id} value={j._id}>{j.job} · {j.email}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-zinc-500">No jobs found. Add contacts in Outreach first.</p>
                  )}
                </div>
                {selectedJobId && coverLetterText ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Cover Letter</span>
                      <div className="flex items-center gap-1.5">
                        {[{f:'pdf', label:'PDF'}, {f:'docx', label:'DOCX'}].map(({f, label}) => (
                          <button key={f} onClick={() => handleExportCoverLetter(f)} disabled={exportingCoverLetter === f} className="btn-ghost text-xs px-2 py-1">
                            {exportingCoverLetter === f ? <div className="w-3 h-3 border border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <DownloadIcon size={11} />}
                            {label}
                          </button>
                        ))}
                        <button onClick={handleSaveCoverLetter} disabled={savingCoverLetter} className="btn-primary text-xs px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700">
                          {savingCoverLetter ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircleIcon size={11} />}
                          Save
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={coverLetterText}
                      onChange={(e) => setCoverLetterText(e.target.value)}
                      rows={18}
                      className="input w-full font-mono text-xs leading-relaxed p-3 bg-slate-50 dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800 resize-y"
                    />
                  </div>
                ) : selectedJobId ? (
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <MailIcon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No cover letter yet</p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Generate an AI-tailored cover letter for this job</p>
                    </div>
                    <button onClick={handleGenerateCoverLetter} disabled={generatingCoverLetter} className="btn-primary text-xs">
                      {generatingCoverLetter ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                      {generatingCoverLetter ? 'Generating…' : '✨ Generate Letter'}
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Live Preview panel */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Preview header */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-zinc-800 rounded-t-xl border border-b-0 border-slate-200 dark:border-zinc-700 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs text-slate-500 dark:text-zinc-400">
                {activeTpl.name} — Live Preview
              </span>
            </div>
            {loadingPreview && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">Rendering…</span>
              </div>
            )}
          </div>

          {/* iframe */}
          <div className="relative flex-1 border border-slate-200 dark:border-zinc-700 rounded-b-xl overflow-hidden bg-white">
            {loadingPreview && (
              <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Rendering preview…</p>
                </div>
              </div>
            )}
            {previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full bg-white border-0 block"
                style={{ minHeight: '78vh' }}
                title="Resume Preview"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-zinc-500 min-h-64">
                <div className="text-center">
                  <div className="w-10 h-10 border-2 border-slate-200 dark:border-zinc-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs">Loading preview…</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
