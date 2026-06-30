import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import {
  DownloadIcon, LayersIcon, CheckCircleIcon,
  ChevronDownIcon, ChevronUpIcon, TrashIcon, XIcon, MailIcon, EditIcon, WandIcon,
} from './Icons';
import Select from 'react-select';
import { getReactSelectStyles } from '../utils/reactSelectStyles';
import { setResumesInfo, setAuth } from '../store/authSlice';
import InlineCVEditor, { useDebounce } from './InlineCVEditor.jsx';

const BACKEND = 'http://localhost:3000';

// ─── Template definitions (for selector screen) ───────────────────────────────
const TEMPLATES = [
  { id: 'profile-classic', name: 'Profile Classic', desc: 'Classic layout with profile picture', accent: '#1a1a1a' },
  { id: 'profile-modern', name: 'Profile Modern', desc: 'Modern sidebar with profile picture', accent: '#1e40af' },
  { id: 'classic', name: 'Classic', desc: 'Traditional serif layout, clean and timeless', accent: '#1a1a1a' },
  { id: 'modern', name: 'Modern', desc: 'Bold blue sidebar with card-based sections', accent: '#1e40af' },
  { id: 'minimal', name: 'Minimal', desc: 'Ultra-clean whitespace, typography-first', accent: '#111111' },
];

// Templates with inline editor support (V1)
const INLINE_SUPPORTED = new Set(['classic', 'profile-classic', 'modern', 'profile-modern', 'minimal']);

const FORMATS = [
  { id: 'pdf', label: 'PDF' },
  { id: 'docx', label: 'DOCX' },
  { id: 'jpg', label: 'JPG' },
];

// ─── ColorPickerField (used in Design panel) ──────────────────────────────────
const ColorPickerField = ({ label, value, defaultValue, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <input type="color" value={value || defaultValue} onChange={(e) => onChange(e.target.value)}
      style={{ width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer', border: 'none', padding: '0' }} />
    <div>
      <div style={{ fontSize: '10px', color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'monospace' }}>{value || defaultValue}</div>
    </div>
    {value && value !== defaultValue && (
      <button onClick={() => onChange('')} style={{ fontSize: '9px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>Reset</button>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ResumeBuilder = ({ user, initialResumeData }) => {
  const dispatch = useDispatch();
  const { resumes, activeResumeId } = useSelector(state => state.auth);

  const [resumeData, setResumeData] = useState(initialResumeData || null);
  const [selectedTemplate, setSelectedTemplate] = useState(
    () => localStorage.getItem('rb_template') || 'classic'
  );
  const [step, setStep] = useState('select'); // 'select' | 'edit'
  const [templatePreviews, setTemplatePreviews] = useState({});
  const [exporting, setExporting] = useState(null);
  const [exportError, setExportError] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // '' | 'saving' | 'saved' | 'error'
  const [historyOpen, setHistoryOpen] = useState(false);

  // Panels
  const [designOpen, setDesignOpen] = useState(false);
  const [coverLetterOpen, setCoverLetterOpen] = useState(false);

  // Cover Letter
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [coverLetterText, setCoverLetterText] = useState('');
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  const [savingCoverLetter, setSavingCoverLetter] = useState(false);
  const [exportingCoverLetter, setExportingCoverLetter] = useState(null);

  const saveTimer = useRef(null);

  // ── Sync resumeData when parent sends a new one ──────────────────────────
  useEffect(() => {
    if (initialResumeData) {
      let data = { ...initialResumeData };
      if (user?.picture && (!data.personalInfo || !data.personalInfo.picture)) {
        data.personalInfo = { ...(data.personalInfo || {}), picture: user.picture };
      }
      setResumeData(data);
    }
  }, [initialResumeData, user]);

  // ── Load from backend if not yet loaded ─────────────────────────────────
  useEffect(() => {
    if (!resumeData && user?.email) {
      axios.get(`${BACKEND}/resume-data`, { withCredentials: true })
        .then(res => {
          if (res.data.hasData) {
            let data = { ...res.data.resumeData };
            if (user?.picture && (!data.personalInfo || !data.personalInfo.picture)) {
              data.personalInfo = { ...(data.personalInfo || {}), picture: user.picture };
            }
            setResumeData(data);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // ── Fetch thumbnails for template grid ──────────────────────────────────
  useEffect(() => {
    if (step === 'select' && resumeData && Object.keys(templatePreviews).length === 0) {
      const fetchPreviews = async () => {
        const previews = {};
        await Promise.all(TEMPLATES.map(async (t) => {
          try {
            const res = await axios.post(`${BACKEND}/preview-template`, { templateId: t.id, resumeData }, { withCredentials: true });
            previews[t.id] = res.data;
          } catch (e) { console.error(e); }
        }));
        setTemplatePreviews(previews);
      };
      fetchPreviews();
    }
  }, [step, resumeData, templatePreviews]);

  // ── Debounced autosave ───────────────────────────────────────────────────
  // Debounce the resumeData by 1500ms, then persist
  const debouncedResumeData = useDebounce(resumeData, 1500);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!debouncedResumeData) return;
    const persist = async () => {
      setSaveStatus('saving');
      try {
        await axios.put(`${BACKEND}/resume/update`, { resumeData: debouncedResumeData });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch {
        setSaveStatus('error');
      }
    };
    persist();
  }, [debouncedResumeData]);

  // ── handleUpdate — merge patch into local state ──────────────────────────
  const handleUpdate = useCallback((patch) => {
    setResumeData(prev => {
      if (!prev) return prev;
      // Deep merge personalInfo / skills objects, shallow merge everything else
      const next = { ...prev };
      Object.entries(patch).forEach(([key, val]) => {
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          next[key] = { ...(prev[key] || {}), ...val };
        } else {
          next[key] = val;
        }
      });
      return next;
    });
  }, []);

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = async (format) => {
    setExporting(format);
    setExportError('');
    try {
      const styleEl = document.getElementById('cv-dynamic-margins');
      const injectedStyles = styleEl ? styleEl.textContent : '';

      const res = await axios.post(`${BACKEND}/export-resume`, {
        templateId: selectedTemplate, format, resumeData, injectedStyles,
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
    } catch (err) { console.error('Delete error:', err.message); }
  };

  const handleSwitchResume = async (id) => {
    try {
      const res = await axios.post(`${BACKEND}/resume/select`, { id });
      dispatch(setAuth({ authenticated: true, user, resumeName: res.data.resumeFileName, resumeData: res.data.resumeData }));
      dispatch(setResumesInfo({ resumes, activeResumeId: id }));
      setResumeData(res.data.resumeData);
      setHistoryOpen(false);
    } catch (err) { console.error('Switch error:', err.message); }
  };

  // ── Cover Letter ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (coverLetterOpen) fetchJobs();
  }, [coverLetterOpen]);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${BACKEND}/jobs`, { params: { limit: 1000, sortBy: 'createdAt:desc' } });
      const rawJobs = res.data.jobs || (Array.isArray(res.data) ? res.data : []);
      const sorted = [...rawJobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setJobs(sorted);
      if (sorted.length > 0 && !selectedJobId) {
        setSelectedJobId(sorted[0]._id);
        setCoverLetterText(sorted[0].coverLetter || '');
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
    } catch (_) { alert('Export failed.'); }
    finally { setExportingCoverLetter(null); }
  };

  // ── Theme helpers ────────────────────────────────────────────────────────
  const updTheme = (k, v) => handleUpdate({ theme: { ...(resumeData?.theme || {}), [k]: v } });
  const activeTpl = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!resumeData) {
    return (
      <div className="card shadow-sm mb-6">
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-5 shadow-sm">
            <LayersIcon size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">No resume uploaded yet</h3>
          <p className="text-sm text-slate-400 dark:text-zinc-500 max-w-xs mb-5">
            Upload your resume — AI will parse and structure it, then you can pick a template and edit directly on the CV.
          </p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn-primary text-sm">
            ↑ Upload Resume
          </button>
        </div>
      </div>
    );
  }

  const p = resumeData.personalInfo || {};

  // ── Template Selector Screen ─────────────────────────────────────────────
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
                Continue editing
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
                          <button onClick={() => handleSwitchResume(r.id)} className="text-[10px] px-2 py-1 rounded-md bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:text-indigo-700 dark:hover:text-indigo-400 font-medium transition-colors">Switch</button>
                        )}
                        {r.id !== activeResumeId && (
                          <button onClick={() => handleDeleteResume(r.id)} className="p-1 text-slate-300 dark:text-zinc-600 hover:text-red-500 transition-colors"><TrashIcon size={11} /></button>
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
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Select a design — you'll edit directly on the CV</p>
            </div>
            <span className="text-xs text-slate-400 dark:text-zinc-500 hidden sm:block">You can switch anytime</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t.id)}
                className={`group relative flex flex-col rounded-xl border-2 overflow-hidden text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${selectedTemplate === t.id ? 'border-indigo-400 dark:border-indigo-500 shadow-md shadow-indigo-100 dark:shadow-indigo-500/10' : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600'}`}
              >
                <div className="aspect-[3/4] w-full bg-white flex items-center justify-center p-1 transition-transform duration-300 group-hover:scale-105 origin-center overflow-hidden">
                  <div className="w-full h-full relative">
                    {templatePreviews[t.id] ? (
                      <iframe
                        srcDoc={templatePreviews[t.id]}
                        title={`Preview ${t.name}`}
                        className="absolute top-0 left-0"
                        style={{ width: '400%', height: '400%', transform: 'scale(0.25)', transformOrigin: 'top left', border: 'none', pointerEvents: 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {selectedTemplate === t.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shadow-sm">
                    <CheckCircleIcon size={12} className="text-white" />
                  </div>
                )}

                <div className="px-2.5 py-2.5 bg-white dark:bg-zinc-800 border-t border-slate-100 dark:border-zinc-700">
                  <p className={`text-xs font-bold ${selectedTemplate === t.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>{t.name}</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 leading-tight">{t.desc}</p>
                  {INLINE_SUPPORTED.has(t.id) && (
                    <span className="text-[8px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block">Inline editing</span>
                  )}
                </div>

                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-100 bg-slate-900/40 backdrop-blur-sm`}>
                  <span className="px-4 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold shadow-lg">Use This</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Inline Editor Screen ─────────────────────────────────────────────────
  const supportsInline = INLINE_SUPPORTED.has(selectedTemplate);

  return (
    <div className="mb-6">
      {/* ── Top Toolbar ── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'var(--bg-card, white)',
        borderBottom: '1px solid #e2e8f0',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '0',
        backdropFilter: 'blur(8px)',
      }} className="dark:bg-zinc-900/95 dark:border-zinc-800">

        {/* Back to templates */}
        <button
          onClick={() => setStep('select')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" />
          </svg>
          Templates
        </button>
        <span className="text-slate-200 dark:text-zinc-700">|</span>

        {/* Template pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 flex-1 min-w-0">
          {TEMPLATES.filter(t => INLINE_SUPPORTED.has(t.id) || t.id === selectedTemplate).map(t => (
            <button
              key={t.id}
              onClick={() => { setSelectedTemplate(t.id); localStorage.setItem('rb_template', t.id); }}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${selectedTemplate === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'}`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Save status */}
        {saveStatus && (
          <span className={`text-[10px] font-medium flex-shrink-0 flex items-center gap-1 ${saveStatus === 'saved' ? 'text-emerald-500' : saveStatus === 'saving' ? 'text-amber-500' : 'text-red-500'}`}>
            {saveStatus === 'saving' && <div className="w-2.5 h-2.5 border border-amber-500 border-t-transparent rounded-full animate-spin" />}
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : '⚠ Save failed'}
          </span>
        )}

        {/* Design button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setDesignOpen(o => !o); setCoverLetterOpen(false); }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${designOpen ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'}`}
          >
            🎨 Design
          </button>
          {designOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              zIndex: 100,
              minWidth: '200px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }} className="dark:bg-zinc-900 dark:border-zinc-700">
              <div style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Theme Colors</div>
              <ColorPickerField label="Primary Color" value={resumeData.theme?.primary} defaultValue={activeTpl.accent} onChange={v => updTheme('primary', v)} />
              {activeTpl.id?.includes('modern') && (
                <ColorPickerField label="Secondary Color" value={resumeData.theme?.secondary} defaultValue="#3b82f6" onChange={v => updTheme('secondary', v)} />
              )}
              {/* Photo upload */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Profile Photo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {p.picture ? (
                    <img src={p.picture} alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8' }}>None</div>
                  )}
                  <div>
                    <input type="file" accept="image/*" id="photo-upload" style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => handleUpdate({ personalInfo: { ...p, picture: ev.target.result } });
                          reader.readAsDataURL(file);
                        }
                      }} />
                    <label htmlFor="photo-upload" style={{ fontSize: '10px', color: '#6366f1', cursor: 'pointer', fontWeight: '600' }}>Upload photo</label>
                    {p.picture && <button onClick={() => handleUpdate({ personalInfo: { ...p, picture: '' } })} style={{ display: 'block', fontSize: '9px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0', marginTop: '2px' }}>Remove</button>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cover Letter */}
        <button
          onClick={() => { setCoverLetterOpen(o => !o); setDesignOpen(false); }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${coverLetterOpen ? 'border-violet-400 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400' : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:border-violet-300'}`}
        >
          <MailIcon size={11} /> Cover Letter
        </button>

        {/* Export buttons */}
        <div className="flex items-center gap-1">
          {FORMATS.map(f => (
            <button
              key={f.id}
              onClick={() => handleExport(f.id)}
              disabled={!!exporting}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all disabled:opacity-50"
            >
              {exporting === f.id ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <DownloadIcon size={11} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {exportError && <p className="text-xs text-red-500 dark:text-red-400 px-3 py-2">{exportError}</p>}

      {/* ── Main layout ── */}
      <div style={{ display: 'flex', gap: '0', minHeight: '85vh', alignItems: 'flex-start' }}>

        {/* ── Cover Letter Drawer ── */}
        {coverLetterOpen && (
          <div style={{
            width: '340px',
            minWidth: '300px',
            borderRight: '1px solid #e2e8f0',
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '85vh',
            overflowY: 'auto',
            position: 'sticky',
            top: '56px',
            flexShrink: 0,
          }} className="dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-zinc-800 flex-shrink-0">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Cover Letter</span>
              <button onClick={() => setCoverLetterOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 transition-colors"><XIcon size={13} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Job selector */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Target Job</label>
                {jobs.length > 0 ? (
                  <Select
                    value={jobs.map(j => ({ value: j._id, label: `${j.job} · ${j.email}` })).find(o => o.value === selectedJobId)}
                    onChange={(opt) => setSelectedJobId(opt ? opt.value : '')}
                    options={jobs.map(j => ({ value: j._id, label: `${j.job} · ${j.email}` }))}
                    styles={getReactSelectStyles()}
                    id="resume-cover-job-select"
                  />
                ) : (
                  <p className="text-xs text-slate-400 dark:text-zinc-500">No jobs found. Add contacts in Outreach first.</p>
                )}
              </div>

              {selectedJobId && coverLetterText ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[{ f: 'pdf', label: 'PDF' }, { f: 'docx', label: 'DOCX' }].map(({ f, label }) => (
                        <button key={f} onClick={() => handleExportCoverLetter(f)} disabled={exportingCoverLetter === f} className="btn-ghost text-xs px-2 py-1">
                          {exportingCoverLetter === f ? <div className="w-3 h-3 border border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <DownloadIcon size={11} />}
                          {label}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleSaveCoverLetter} disabled={savingCoverLetter} className="btn-primary text-xs px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700">
                      {savingCoverLetter ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircleIcon size={11} />}
                      Save
                    </button>
                  </div>
                  <textarea
                    value={coverLetterText}
                    onChange={(e) => setCoverLetterText(e.target.value)}
                    rows={22}
                    className="input w-full font-mono text-xs leading-relaxed p-3 bg-slate-50 dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800 resize-y"
                  />
                </div>
              ) : selectedJobId ? (
                <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600"><MailIcon size={18} /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No cover letter yet</p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Generate an AI-tailored cover letter</p>
                  </div>
                  <button onClick={handleGenerateCoverLetter} disabled={generatingCoverLetter} className="btn-primary text-xs">
                    {generatingCoverLetter ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <WandIcon size={12} />}
                    {generatingCoverLetter ? 'Generating…' : 'Generate Letter'}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ── CV Canvas ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '24px 16px',
          background: '#f1f5f9',
          minHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }} className="dark:bg-zinc-950">
          {supportsInline ? (
            <InlineCVEditor
              resumeData={resumeData}
              onUpdate={handleUpdate}
              selectedTemplate={selectedTemplate}
              saveStatus={saveStatus}
            />
          ) : (
            /* Fallback: template doesn't have inline editor yet — show notice */
            <div className="flex flex-col items-center gap-4 py-20 text-center max-w-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 text-xl">
                <EditIcon size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Inline editing coming soon</p>
                <p className="text-sm text-slate-400 dark:text-zinc-500 mt-1">
                  This template doesn't support inline editing yet.<br />
                  Switch to <strong>Classic, Modern, or Minimal</strong> to edit directly on the CV.
                </p>
              </div>
              <button onClick={() => setStep('select')} className="btn-primary text-sm">Choose a template</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
