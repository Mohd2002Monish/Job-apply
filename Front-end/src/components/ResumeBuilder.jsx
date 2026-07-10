import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import Select from 'react-select';
import { getReactSelectStyles } from '../utils/reactSelectStyles';
import { setAuth, setResumesInfo } from '../store/authSlice';
import ConfirmModal from './ConfirmModal';
import InlineCVEditor, { useDebounce } from './InlineCVEditor.jsx';
import { captureResumeExportHTML } from '../utils/resumeExportCapture.js';
import { getStoredAiModel } from './AiModelSelector';

const BACKEND = 'http://localhost:3000';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const BackArrowIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M5 12l7-7M5 12l7 7"/></svg>;
const BrushIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M7.5 10.5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5z"/><path d="M11.5 7.5c.828 0 1.5-.672 1.5-1.5S12.328 4.5 11.5 4.5 10 5.172 10 6s.672 1.5 1.5 1.5z"/><path d="M16.5 9.5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5z"/><path d="M6 14c0-2 2-3 6-3s6 1 6 3-2 5-6 5-6-3-6-5z"/></svg>;
const SparklesIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m10.607 10.607l.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/></svg>;
const ExportIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const DesktopIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
const MobileIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>;
const PageLayoutIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
const DotsIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
const BinIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
const PencilIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const SettingsSliderIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>;
const AddIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const ChevronDownIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const HandIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5m0 0V5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6m0 0V7a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v10a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/></svg>;
const LayersIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
const CheckCircleIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const MailIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;

// ─── Template definitions (for selector screen) ───────────────────────────────
const TEMPLATES = [
  { id: 'profile-classic', name: 'Profile Classic', desc: 'Classic layout with profile picture', accent: '#1a1a1a' },
  { id: 'profile-modern', name: 'Profile Modern', desc: 'Modern sidebar with profile picture', accent: '#1e40af' },
  { id: 'classic', name: 'Classic', desc: 'Traditional serif layout, clean and timeless', accent: '#1a1a1a' },
  { id: 'modern', name: 'Modern', desc: 'Bold blue sidebar with card-based sections', accent: '#1e40af' },
  { id: 'minimal', name: 'Minimal', desc: 'Ultra-clean whitespace, typography-first', accent: '#111111' },
];

const INLINE_SUPPORTED = new Set(['classic', 'profile-classic', 'modern', 'profile-modern', 'minimal']);

const FORMATS = [
  { id: 'pdf', label: 'PDF' },
  { id: 'docx', label: 'DOCX' },
  { id: 'jpg', label: 'JPG' },
];

// ─── ColorPickerField ──────────────────────────────────────────────────────────
const ColorPickerField = ({ label, value, defaultValue, onChange }) => (
  <div className="flex items-center justify-between border border-slate-100 dark:border-zinc-800 rounded-xl p-2 bg-slate-50/50 dark:bg-zinc-950/20">
    <div className="flex items-center gap-3">
      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 cursor-pointer shadow-sm shrink-0">
        <input 
          type="color" 
          value={value || defaultValue} 
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] p-0 m-0 border-0 cursor-pointer"
        />
      </div>
      <div>
        <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{label}</div>
        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 font-mono mt-0.5">{value || defaultValue}</div>
      </div>
    </div>
    <div className="flex items-center gap-1.5">
      <span className="text-slate-300 dark:text-zinc-700"><PencilIcon /></span>
      {value && value !== defaultValue && (
        <button 
          onClick={() => onChange('')} 
          className="text-[10px] font-bold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-md transition-colors"
        >
          Reset
        </button>
      )}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ResumeBuilder = ({ user, initialResumeData, toast, onUploadClick }) => {
  const dispatch = useDispatch();
  const { resumes, activeResumeId } = useSelector(state => state.auth);

  const [resumeData, setResumeData] = useState(initialResumeData || null);
  const [selectedTemplate, setSelectedTemplate] = useState(
    () => localStorage.getItem('rb_template') || user?.preferences?.defaultResumeTemplate || 'classic'
  );
  const [step, setStep] = useState('select'); // 'select' | 'edit'
  const [templatePreviews, setTemplatePreviews] = useState({});
  const [exporting, setExporting] = useState(null);
  const [exportError, setExportError] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // '' | 'saving' | 'saved' | 'error'
  const [resumeToDelete, setResumeToDelete] = useState(null);

  // Canvas zoom & viewMode
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState('page'); // 'desktop' | 'mobile' | 'page'
  const [pageCount, setPageCount] = useState(1);

  // Phones: auto-fit the 794px A4 canvas to the viewport width so the whole
  // page is visible without horizontal panning. Users can still pinch/zoom
  // via the zoom controls afterwards.
  useEffect(() => {
    const fitZoom = () => {
      if (window.innerWidth < 768) {
        const fit = Math.min(1, (window.innerWidth - 24) / 794);
        setZoom(Math.max(0.3, Math.round(fit * 100) / 100));
      }
    };
    fitZoom();
    window.addEventListener('resize', fitZoom);
    return () => window.removeEventListener('resize', fitZoom);
  }, []);

  // Panels
  const [designOpen, setDesignOpen] = useState(true); // default open on split
  const [coverLetterOpen, setCoverLetterOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);

  // Cover Letter
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [coverLetterText, setCoverLetterText] = useState('');
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  const [savingCoverLetter, setSavingCoverLetter] = useState(false);
  const [exportingCoverLetter, setExportingCoverLetter] = useState(null);
  const selectedAiModel = getStoredAiModel();

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
      // Let hover/active editor chrome unmount and the page-break engine
      // settle before snapshotting the DOM (clicking Export blurs the canvas,
      // which triggers a relayout).
      await new Promise((r) => setTimeout(r, 150));

      const styleEl = document.getElementById('cv-pdf-margins');
      const injectedStyles = styleEl ? styleEl.textContent : '';

      // PDF/JPG print the editor's exact rendered DOM — pixel-perfect WYSIWYG.
      // DOCX stays data-driven (it is a reflowable format by nature).
      const exportHtml = (format === 'pdf' || format === 'jpg')
        ? captureResumeExportHTML(resumeData?.theme)
        : null;

      const res = await axios.post(`${BACKEND}/export-resume`, {
        templateId: selectedTemplate, format, resumeData, injectedStyles,
        exportHtml: exportHtml || undefined,
        pageCount,
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

  const handleDeleteResume = (id) => {
    setResumeToDelete(id);
  };

  const executeDeleteResume = async () => {
    if (!resumeToDelete) return;
    const id = resumeToDelete;
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
    finally { setResumeToDelete(null); }
  };

  const handleSwitchResume = async (id) => {
    try {
      const res = await axios.post(`${BACKEND}/resume/select`, { id });
      dispatch(setAuth({ authenticated: true, user, resumeName: res.data.resumeFileName, resumeData: res.data.resumeData }));
      dispatch(setResumesInfo({ resumes, activeResumeId: id }));
      setResumeData(res.data.resumeData);
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
      const res = await axios.post(`${BACKEND}/resume/cover-letter`, { jobId: selectedJobId, aiModel: selectedAiModel });
      setCoverLetterText(res.data.coverLetter);
      setJobs(prev => prev.map(j => j._id === selectedJobId ? { ...j, coverLetter: res.data.coverLetter } : j));
    } catch (err) {
      if (toast) {
        toast.error('Failed to generate cover letter: ' + (err.response?.data?.error || err.message));
      } else {
        alert('Failed: ' + (err.response?.data?.error || err.message));
      }
    } finally { setGeneratingCoverLetter(false); }
  };

  const handleSaveCoverLetter = async () => {
    if (!selectedJobId) return;
    setSavingCoverLetter(true);
    try {
      await axios.patch(`${BACKEND}/jobs/${selectedJobId}`, { coverLetter: coverLetterText });
      setJobs(prev => prev.map(j => j._id === selectedJobId ? { ...j, coverLetter: coverLetterText } : j));
    } catch (err) {
      if (toast) {
        toast.error('Save failed: ' + (err.response?.data?.error || err.message));
      } else {
        alert('Save failed: ' + (err.response?.data?.error || err.message));
      }
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
      if (toast) {
        toast.error('Export failed.');
      } else {
        alert('Export failed.');
      }
    }
    finally { setExportingCoverLetter(null); }
  };

  // ── Theme helpers ────────────────────────────────────────────────────────
  const updTheme = (k, v) => handleUpdate({ theme: { ...(resumeData?.theme || {}), [k]: v } });
  const activeTpl = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];

  const handleResetTheme = () => {
    handleUpdate({
      theme: {
        primary: activeTpl.accent,
        secondary: '#3b82f6',
        fontHeading: 'Poppins',
        fontBody: 'Inter',
        pageSize: 'A4',
        margins: 'normal',
        showIcons: true,
        sectionDividers: true,
      }
    });
  };

  // Appends empty experience block to expand pages naturally
  const handleAddPage = () => {
    handleUpdate({
      experience: [
        ...(resumeData.experience || []),
        { role: 'New Role', company: 'Add experience to build page content', startDate: '', endDate: '', achievements: [] }
      ]
    });
    if (toast) toast.info('Appended dummy experience block to extend canvas height.');
  };

  // Zoom helpers
  const handleZoomOut = () => setZoom(z => Math.max(0.75, z - 0.15));
  const handleZoomIn = () => setZoom(z => Math.min(1.25, z + 0.15));

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!resumeData) {
    return (
      <div className="card shadow-sm mb-6 max-w-2xl mx-auto mt-10">
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-5 shadow-sm">
            <LayersIcon />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">No resume uploaded yet</h3>
          <p className="text-sm text-slate-450 dark:text-zinc-500 max-w-xs mb-5">
            Upload your resume first. AI will parse and structure it, then you can customize and design it dynamically.
          </p>
          <button onClick={() => onUploadClick?.()} className="btn-primary text-sm font-semibold flex items-center gap-1.5">
            <AddIcon /> Upload Resume
          </button>
        </div>
      </div>
    );
  }

  const p = resumeData.personalInfo || {};

  // ── Template Selector Screen ─────────────────────────────────────────────
  if (step === 'select') {
    return (
      <div className="max-w-6xl mx-auto space-y-6 py-6 px-4">
        {/* Hero Header */}
        <div className="card shadow-sm overflow-hidden">
          <div className="relative px-6 py-6 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                    <LayersIcon />
                  </div>
                  <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Resume Builder</span>
                </div>
                <h2 className="text-xl font-bold text-white">{p.name || 'Your Resume'}</h2>
                <p className="text-indigo-150 text-sm mt-0.5">{p.jobTitle || 'Ready to build your perfect resume'}</p>
              </div>
              <button
                onClick={() => setStep('edit')}
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-sm shadow-md hover:bg-indigo-50 transition-all duration-200 active:scale-95"
              >
                <PencilIcon />
                Continue Editing
              </button>
            </div>
          </div>
        </div>

        {/* Template Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Choose a Template</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Select a layout to launch the real-time canvas editor.</p>
            </div>
            <span className="text-xs text-slate-450 dark:text-zinc-500 hidden sm:block">Templates can be switched anytime.</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t.id)}
                className={`group relative flex flex-col rounded-xl border-2 overflow-hidden text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${selectedTemplate === t.id ? 'border-indigo-400 dark:border-indigo-500 shadow-md shadow-indigo-100 dark:shadow-indigo-500/10' : 'border-slate-200 dark:border-zinc-700 hover:border-slate-350 dark:hover:border-zinc-650'}`}
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
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-550 flex items-center justify-center shadow-sm">
                    <CheckCircleIcon />
                  </div>
                )}

                <div className="px-3 py-3 bg-white/75 dark:bg-zinc-900/70 backdrop-blur-xl border-t border-slate-100 dark:border-zinc-800">
                  <p className={`text-xs font-bold ${selectedTemplate === t.id ? 'text-indigo-650 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>{t.name}</p>
                  <p className="text-[10px] text-slate-450 dark:text-zinc-550 mt-0.5 leading-tight">{t.desc}</p>
                  {INLINE_SUPPORTED.has(t.id) && (
                    <span className="text-[8px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold mt-1.5 inline-block">Inline Editing</span>
                  )}
                </div>

                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-100 bg-slate-900/40 backdrop-blur-sm`}>
                  <span className="px-4 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold shadow-lg">Use This Layout</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Inline Editor Screen ─────────────────────────────────────────────
  const supportsInline = INLINE_SUPPORTED.has(selectedTemplate);
  const theme = resumeData.theme || {};

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50 dark:bg-zinc-950">
      
      {/* ── Top Header Toolbar ── */}
      <header className="h-14 border-b border-slate-200 dark:border-zinc-850 bg-white/75 dark:bg-zinc-900/70 backdrop-blur-xl px-4 flex items-center justify-between shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep('select')}
            className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <BackArrowIcon />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">Resume Builder</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-medium">
                {saveStatus === 'saving' ? 'Autosaving...' : 'Autosaved'}
              </span>
            </div>
          </div>
        </div>

        {/* Middle Toolbar Control elements */}
        <div className="hidden md:flex items-center gap-4">
          {/* Resume Selector */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="hidden lg:inline text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Resume</span>
            <div className="relative flex items-center gap-1">
              <button
                id="rb-resume-select-btn"
                onClick={() => { setResumeOpen(o => !o); setTemplateOpen(false); setExportOpen(false); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors max-w-[150px] truncate"
              >
                {resumes.find(r => r.id === activeResumeId)?.title || 'Select Resume'}
                <ChevronDownIcon />
              </button>

              <button
                onClick={() => onUploadClick?.()}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-slate-100 transition-colors flex items-center justify-center"
                title="Upload/Create New Resume"
              >
                <AddIcon />
              </button>

              {resumeOpen && (
                <div className="absolute top-full left-0 mt-1.5 bg-white/75 dark:bg-zinc-900/70 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 rounded-xl p-1.5 shadow-xl z-50 min-w-[200px] max-h-60 overflow-y-auto">
                  {resumes.map(r => (
                    <div
                      key={r.id}
                      onClick={() => { handleSwitchResume(r.id); setResumeOpen(false); }}
                      className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${r.id === activeResumeId ? 'bg-indigo-50 dark:bg-indigo-550/10 text-indigo-700 dark:text-indigo-400' : 'text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                    >
                      <span className="truncate pr-4">{r.title}</span>
                      {r.id === activeResumeId ? (
                        <CheckCircleIcon />
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteResume(r.id); setResumeOpen(false); }}
                          className="p-0.5 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        >
                          <BinIcon />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Template picker selector */}
          <div className="flex items-center gap-1.5">
            <span className="hidden lg:inline text-[11px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider">Template</span>
            <div className="relative">
              <button
                id="rb-template-select-btn"
                onClick={() => { setTemplateOpen(o => !o); setResumeOpen(false); setExportOpen(false); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {TEMPLATES.find(t => t.id === selectedTemplate)?.name || 'Classic'}
                <ChevronDownIcon />
              </button>
              {templateOpen && (
                <div className="absolute top-full left-0 mt-1.5 bg-white/75 dark:bg-zinc-900/70 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 rounded-xl p-1.5 shadow-xl z-50 min-width-[160px]">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setSelectedTemplate(t.id); localStorage.setItem('rb_template', t.id); setTemplateOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${selectedTemplate === t.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                    >
                      {t.name}
                      {selectedTemplate === t.id && <CheckCircleIcon />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* View mode device preview selector */}
          <div className="flex border border-slate-100 dark:border-zinc-800 rounded-xl p-0.5 bg-slate-50 dark:bg-zinc-950">
            <button 
              onClick={() => setViewMode('page')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'page' ? 'bg-white/75 dark:bg-zinc-900/70 backdrop-blur-xl text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-450 hover:text-slate-600'}`}
            >
              <PageLayoutIcon />
            </button>
            <button 
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'desktop' ? 'bg-white/75 dark:bg-zinc-900/70 backdrop-blur-xl text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-450 hover:text-slate-600'}`}
            >
              <DesktopIcon />
            </button>
            <button 
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'mobile' ? 'bg-white/75 dark:bg-zinc-900/70 backdrop-blur-xl text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-450 hover:text-slate-600'}`}
            >
              <MobileIcon />
            </button>
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* Design panel toggle */}
          <button
            onClick={() => setDesignOpen(o => !o)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${designOpen ? 'border-indigo-400 bg-indigo-50/50 text-indigo-700 dark:text-indigo-400' : 'border-slate-200 dark:border-zinc-800 text-slate-655 hover:border-slate-350 dark:text-slate-350 dark:hover:border-zinc-700'}`}
          >
            <BrushIcon />
            <span className="hidden lg:inline">Design</span>
          </button>

          {/* AI Cover letter assistant */}
          <button
            onClick={() => { setCoverLetterOpen(o => !o); setDesignOpen(false); }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${coverLetterOpen ? 'border-violet-400 bg-violet-50/50 text-violet-700 dark:text-violet-400' : 'border-slate-200 dark:border-zinc-800 text-slate-655 hover:border-slate-350 dark:text-slate-350 dark:hover:border-zinc-700'}`}
          >
            <SparklesIcon />
            <span className="hidden lg:inline">AI Assistant</span>
          </button>

          {/* Export button */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(o => !o)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              {exporting ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <ExportIcon />}
              <span className="hidden lg:inline">Export</span>
              <ChevronDownIcon />
            </button>
            {exportOpen && (
              <div className="absolute top-full right-0 mt-1.5 bg-white/75 dark:bg-zinc-900/70 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 rounded-xl p-1.5 shadow-xl z-50 min-width-[140px]">
                {FORMATS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => { handleExport(f.id); setExportOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg text-left"
                  >
                    <ExportIcon />
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── CENTER EDITOR PANEL (Canvas workspace) ── */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-100 dark:bg-zinc-950">
          
          {/* Scrollable Canvas container */}
          <div className="flex-1 overflow-auto flex items-start justify-center p-6 relative">
            <div className={`${viewMode === 'mobile' ? 'max-w-xs' : viewMode === 'desktop' ? 'max-w-4xl' : 'max-w-full'} transition-all duration-300 w-full flex justify-center`}>
              {supportsInline ? (
                <InlineCVEditor
                  resumeData={resumeData}
                  onUpdate={handleUpdate}
                  selectedTemplate={selectedTemplate}
                  saveStatus={saveStatus}
                  zoom={zoom}
                  onPageCountChange={setPageCount}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 py-20 text-center max-w-sm">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 text-xl">
                    <PencilIcon />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">Inline Editing coming soon</p>
                    <p className="text-xs text-slate-450 dark:text-zinc-550 mt-1">
                      This template doesn't support live editing yet. Switch layouts to continue.
                    </p>
                  </div>
                  <button onClick={() => setStep('select')} className="btn-primary text-xs font-semibold">Choose layout</button>
                </div>
              )}
            </div>
          </div>

          {/* Floating zoom and view controls at the bottom */}
          <div className="h-11 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2">
              <button 
                onClick={handleZoomOut} 
                className="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-bold flex items-center justify-center"
              >
                -
              </button>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 w-10 text-center font-mono">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={handleZoomIn} 
                className="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-bold flex items-center justify-center"
              >
                +
              </button>
            </div>

            {/* Middle: Add Page button */}
            <button 
              onClick={handleAddPage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 text-xs font-semibold text-slate-655 hover:text-slate-850 dark:border-zinc-850 dark:hover:border-zinc-750 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50/50 hover:bg-slate-100/50 dark:bg-zinc-950/20 transition-all"
            >
              <AddIcon />
              <span>Add Page</span>
            </button>

            <div className="flex items-center gap-3">
              <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-850" title="Hand Tool">
                <HandIcon />
              </button>

              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-555 dark:text-slate-400 font-sans">
                <span>Page 1 of {pageCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── COVER LETTER SIDE DRAWER (conditionally slided open) ── */}
        {coverLetterOpen && (
          <aside className="w-80 border-l border-slate-200 dark:border-zinc-800 bg-white/75 dark:bg-zinc-900/70 backdrop-blur-xl flex flex-col shrink-0 z-20 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-zinc-850 shrink-0">
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase tracking-widest">AI Cover Letter</span>
              <button onClick={() => setCoverLetterOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider mb-1.5">Target Job</label>
                {jobs.length > 0 ? (
                  <Select
                    value={jobs.map(j => ({ value: j._id, label: `${j.job} · ${j.email}` })).find(o => o.value === selectedJobId)}
                    onChange={(opt) => setSelectedJobId(opt ? opt.value : '')}
                    options={jobs.map(j => ({ value: j._id, label: `${j.job} · ${j.email}` }))}
                    styles={getReactSelectStyles()}
                    id="resume-cover-job-select"
                  />
                ) : (
                  <p className="text-xs text-slate-450 dark:text-zinc-500">No applications tracked. Add contacts in Outreach first.</p>
                )}
              </div>

              {selectedJobId && coverLetterText ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[{ f: 'pdf', label: 'PDF' }, { f: 'docx', label: 'DOCX' }].map(({ f, label }) => (
                        <button key={f} onClick={() => handleExportCoverLetter(f)} disabled={exportingCoverLetter === f} className="inline-flex items-center gap-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {exportingCoverLetter === f ? <div className="w-2.5 h-2.5 border border-indigo-650 border-t-transparent rounded-full animate-spin" /> : <ExportIcon />}
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={handleSaveCoverLetter} disabled={savingCoverLetter} className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold">
                      {savingCoverLetter ? <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircleIcon />}
                      <span>Save</span>
                    </button>
                  </div>
                  <textarea
                    value={coverLetterText}
                    onChange={(e) => setCoverLetterText(e.target.value)}
                    rows={18}
                    className="w-full font-mono text-xs leading-relaxed p-3 bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                  />
                </div>
              ) : selectedJobId ? (
                <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-550/10 flex items-center justify-center text-indigo-600"><MailIcon /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No cover letter generated</p>
                    <p className="text-[10px] text-slate-450 dark:text-zinc-550 mt-0.5">Let AI structure a tailored application letter.</p>
                  </div>
                  <button onClick={handleGenerateCoverLetter} disabled={generatingCoverLetter} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-650 text-white rounded-lg text-[10px] font-bold">
                    {generatingCoverLetter ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <SparklesIcon />}
                    <span>{generatingCoverLetter ? 'Generating...' : 'Generate Letter'}</span>
                  </button>
                </div>
              ) : null}
            </div>
          </aside>
        )}

        {/* ── RIGHT SIDE PANEL (Design sidebar) ── */}
        {designOpen && (
          <aside className="w-64 bg-white/75 dark:bg-zinc-900/70 backdrop-blur-xl border-l border-slate-200 dark:border-zinc-850 flex flex-col shrink-0 select-none overflow-y-auto p-4 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-850 pb-3 shrink-0">
              <span className="text-slate-400"><SettingsSliderIcon /></span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Design Options</span>
            </div>

            {/* Theme Colors */}
            <div className="space-y-2">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">Theme Colors</span>
              <ColorPickerField label="Primary Color" value={theme.primary} defaultValue={activeTpl.accent} onChange={v => updTheme('primary', v)} />
              {activeTpl.id?.includes('modern') && (
                <ColorPickerField label="Secondary Color" value={theme.secondary} defaultValue="#3b82f6" onChange={v => updTheme('secondary', v)} />
              )}
            </div>

            {/* Profile Photo */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-zinc-850">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">Profile Photo</span>
              <div className="flex items-center gap-3 bg-slate-50/40 dark:bg-zinc-950/20 p-2 rounded-xl border border-slate-150/40 dark:border-zinc-850/50">
                {p.picture ? (
                  <img src={p.picture} alt="Profile preview" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shadow-sm shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100/70 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-750 flex items-center justify-center text-[10px] text-slate-400 font-bold shrink-0">None</div>
                )}
                <div className="flex flex-col gap-0.5">
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="design-photo-upload" 
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => handleUpdate({ personalInfo: { ...p, picture: ev.target.result } });
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                  <label htmlFor="design-photo-upload" className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">Change</label>
                  {p.picture && (
                    <button onClick={() => handleUpdate({ personalInfo: { ...p, picture: '' } })} className="text-[9px] font-bold text-red-500 hover:text-red-600 bg-transparent border-0 text-left cursor-pointer">Delete</button>
                  )}
                </div>
              </div>
            </div>

            {/* Font settings */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-850">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-555 uppercase tracking-wider block">Font Customization</span>
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Heading Font</label>
                <select
                  value={theme.fontHeading || 'Poppins'}
                  onChange={e => updTheme('fontHeading', e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg p-2 focus:outline-none"
                >
                  <option value="Poppins">Poppins</option>
                  <option value="Outfit">Outfit</option>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Inter">Inter</option>
                  <option value="Montserrat">Montserrat</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Body Font</label>
                <select
                  value={theme.fontBody || 'Inter'}
                  onChange={e => updTheme('fontBody', e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg p-2 focus:outline-none"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Arial">Arial</option>
                </select>
              </div>
            </div>

            {/* Page & Layout settings */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-850">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-555 uppercase tracking-wider block">Page &amp; Layout</span>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Page Size</label>
                <select
                  value={theme.pageSize || 'A4'}
                  onChange={e => updTheme('pageSize', e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg p-2 focus:outline-none"
                >
                  <option value="A4">A4 (210 x 297 mm)</option>
                  <option value="Letter">Letter (8.5 x 11 in)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Margins</label>
                <select
                  value={theme.margins || 'normal'}
                  onChange={e => updTheme('margins', e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg p-2 focus:outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="compact">Compact</option>
                  <option value="wide">Wide</option>
                </select>
              </div>
            </div>

            {/* Section Style toggles */}
            <div className="space-y-3.5 pt-3 border-t border-slate-100 dark:border-zinc-850">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-555 uppercase tracking-wider block">Section Style</span>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-650 dark:text-slate-350">Show Icons</span>
                <button
                  onClick={() => updTheme('showIcons', theme.showIcons !== false ? false : true)}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors border border-transparent focus:outline-none ${theme.showIcons !== false ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-zinc-800'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${theme.showIcons !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-650 dark:text-slate-350">Section Dividers</span>
                <button
                  onClick={() => updTheme('sectionDividers', theme.sectionDividers !== false ? false : true)}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors border border-transparent focus:outline-none ${theme.sectionDividers !== false ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-zinc-800'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${theme.sectionDividers !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Reset Theme options */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-850 shrink-0">
              <button 
                onClick={handleResetTheme}
                className="w-full py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-600 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                Reset to Default
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Confirmation delete dialog modal */}
      <ConfirmModal
        isOpen={resumeToDelete !== null}
        title="Delete Resume"
        message="Are you sure you want to delete this resume? This action cannot be undone."
        onConfirm={executeDeleteResume}
        onCancel={() => setResumeToDelete(null)}
      />
    </div>
  );
};

export default ResumeBuilder;
