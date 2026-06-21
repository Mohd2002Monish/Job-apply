import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import OutreachModal from './OutreachModal';
import CoverLetterModal from './CoverLetterModal';
import KanbanBoard from './KanbanBoard';
import JobTimeline from './JobTimeline';
import SalaryNegotiationModal from './SalaryNegotiationModal';
import VoiceInterviewTab from './VoiceInterviewTab';
import AutoFormFillPreview from './AutoFormFillPreview';

const BACKEND = 'http://localhost:3000';
axios.defaults.withCredentials = true;

// ─── Inline Icons ─────────────────────────────────────────────────────────────
const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const SearchIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const EditIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const XIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const ChevronIcon = ({ up }) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points={up ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/></svg>;
const EyeIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const MailIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const LinkIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const SendIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const SparkleIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const RefreshIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const MessageIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const BrainIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>;
const StarIcon = ({ filled }) => <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ size = 16 }) => (
  <div style={{ width: size, height: size }} className="border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
);

// ─── Toast system ─────────────────────────────────────────────────────────────
let _toastId = 0;
export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const show = (msg, type = 'success') => {
    const id = ++_toastId;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };
  return { toasts, success: msg => show(msg, 'success'), error: msg => show(msg, 'error'), info: msg => show(msg, 'info') };
};

export const ToastContainer = ({ toasts }) => (
  <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`px-4 py-3 rounded-xl text-sm font-medium shadow-lg border backdrop-blur animate-fade-in pointer-events-auto ${
        t.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' :
        t.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20' :
        'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
      }`}>
        {t.msg}
      </div>
    ))}
  </div>
);

// ─── ATS Score Ring ───────────────────────────────────────────────────────────
const AtsRing = ({ score }) => {
  if (score == null) return <span className="text-xs text-slate-400 dark:text-zinc-500">—</span>;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = 14, cx = 18, cy = 18, circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-1.5">
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-zinc-700" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round" transform="rotate(-90 18 18)" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="8" fontWeight="700" fill={color}>{score}</text>
      </svg>
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ sent, opened, clicked, hasReply }) => {
  if (hasReply) return <span className="badge badge-success">Replied</span>;
  if (opened) return <span className="badge bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">Opened</span>;
  if (sent) return <span className="badge bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">Sent</span>;
  return <span className="badge badge-pending">Pending</span>;
};

// ─── Upload Icon (inline, no emoji) ──────────────────────────────────────────
const UploadCloudIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);
const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

// ─── Add/Edit Job Modal ───────────────────────────────────────────────────────
const JobFormModal = ({ job, onClose, onSaved, toast }) => {
  const isEdit = !!job?._id;
  const [form, setForm] = useState({
    job: job?.job || '',
    companyName: job?.companyName || '',
    email: job?.email || '',
    hrName: job?.hrName || '',
    description: job?.description || '',
    status: job?.status || 'saved',
  });
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [jdFile, setJdFile] = useState(null);
  const [jdFileName, setJdFileName] = useState('');
  const [extractError, setExtractError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleFileSelect = (file) => {
    if (!file) return;
    setJdFile(file);
    setJdFileName(file.name);
    setExtractError('');
    handleExtract(file);
  };

  const handleExtract = async (file) => {
    setExtracting(true);
    setExtractError('');
    try {
      const formData = new FormData();
      formData.append('jdFile', file);
      const res = await axios.post(`${BACKEND}/jobs/extract-jd`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data;
      setForm(f => ({
        ...f,
        job:         data.jobTitle    || f.job,
        companyName: data.companyName || f.companyName,
        email:       data.hrEmail     || f.email,
        hrName:      data.hrName      || f.hrName,
        description: data.description || f.description,
      }));
      toast.success('Details extracted from file!');
    } catch (err) {
      setExtractError(err.response?.data?.error || 'Could not extract text from file.');
    } finally {
      setExtracting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await axios.patch(`${BACKEND}/jobs/${job._id}`, form);
        toast.success('Job updated!');
      } else {
        await axios.post(`${BACKEND}/jobs`, form);
        toast.success('Job added!');
      }
      onSaved();
      onClose();
    } catch (err) {
      let errMsg = 'Save failed.';
      if (err.response?.data?.details) {
        errMsg = Object.entries(err.response.data.details)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
      } else if (err.response?.data?.error) {
        errMsg = err.response.data.error;
      }
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{isEdit ? 'Edit Job' : 'Add New Job'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors" aria-label="Close"><XIcon /></button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* JD File Upload — only on Add mode */}
            {!isEdit && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Upload JD File (auto-fills fields)</label>

                <div
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                    isDragOver
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                      : 'border-slate-200 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {extracting ? (
                    <><Spinner size={20} /><span className="text-xs text-slate-500 dark:text-zinc-400">Extracting details...</span></>
                  ) : jdFileName ? (
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <FileIcon />
                      <span className="text-xs font-medium truncate max-w-[240px]">{jdFileName}</span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setJdFile(null); setJdFileName(''); }}
                        className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <XIcon />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-slate-300 dark:text-zinc-600"><UploadCloudIcon /></span>
                      <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">Drop a JD file here or click to browse</span>
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500">PDF, DOCX, PNG, JPG, WEBP — up to 15 MB</span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    onChange={e => handleFileSelect(e.target.files?.[0])}
                    id="jd-file-upload"
                  />
                </div>

                {extractError && (
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">{extractError}</p>
                )}
              </div>
            )}

            {/* Fields */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Job Title *</label>
              <input type="text" required value={form.job} onChange={setField('job')} className="input" placeholder="e.g. Senior Software Engineer" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Company Name *</label>
              <input type="text" required value={form.companyName} onChange={setField('companyName')} className="input" placeholder="e.g. Google" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Recruiter Email *</label>
              <input type="email" required value={form.email} onChange={setField('email')} className="input" placeholder="e.g. recruiter@company.com" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Recruiter Name</label>
              <input type="text" value={form.hrName} onChange={setField('hrName')} className="input" placeholder="e.g. Jane Doe" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Job Description *</label>
              <textarea required value={form.description} onChange={setField('description')} rows={5} className="input resize-none" placeholder="Paste or upload a JD file above to auto-fill..." />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Application Status</label>
              <select value={form.status} onChange={setField('status')} className="input cursor-pointer">
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="opened">Opened</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={saving || extracting} className="btn-primary flex-1">
                {saving ? <><Spinner size={14} /> Saving...</> : (isEdit ? 'Save Changes' : 'Add Job')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── Interview Prep Tab ───────────────────────────────────────────────────────
const InterviewPrepTab = ({ job, toast }) => {
  const [questions, setQuestions] = useState(job.interviewQuestions || []);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [grading, setGrading] = useState(false);
  const [gradeFeedback, setGradeFeedback] = useState(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [practiceMode, setPracticeMode] = useState('written');

  const typeColors = {
    Technical: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    Behavioral: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
    Situational: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(`${BACKEND}/jobs/${job._id}/interview-prep`);
      setQuestions(res.data.interviewQuestions || []);
      setSelected(null);
      toast.success('Interview questions generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectQuestion = (q) => {
    setSelected(q);
    setNotes(q.userNotes || '');
    setGradeFeedback(null);
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    try {
      await axios.patch(`${BACKEND}/jobs/${job._id}/interview-notes`, {
        questionId: selected._id,
        userNotes: notes,
      });
      setQuestions(qs => qs.map(q => q._id === selected._id ? { ...q, userNotes: notes } : q));
      toast.success('Notes saved!');
    } catch (err) {
      toast.error('Failed to save notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleGrade = async () => {
    if (!selected) return;
    setGrading(true);
    setGradeFeedback(null);
    try {
      await handleSaveNotes();
      const res = await axios.post(`${BACKEND}/jobs/${job._id}/grade-answer`, { questionId: selected._id });
      setGradeFeedback(res.data);
      setQuestions(qs => qs.map(q => q._id === selected._id ? { ...q, score: res.data.score, aiFeedback: res.data.aiFeedback } : q));
      toast.success('Answer graded!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Grading failed.');
    } finally {
      setGrading(false);
    }
  };

  const handleVoiceSaved = (qId, score, aiFeedback, transcript) => {
    setQuestions(qs => qs.map(q => q._id === qId ? { ...q, score, aiFeedback, userNotes: transcript } : q));
    setSelected(prev => prev?._id === qId ? { ...prev, score, aiFeedback, userNotes: transcript } : prev);
    setNotes(transcript);
  };

  const ScoreStars = ({ score }) => {
    if (!score) return null;
    const filled = Math.round(score / 2);
    return (
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(i => (
          <span key={i} className={i <= filled ? 'text-amber-500' : 'text-slate-300 dark:text-zinc-600'}><StarIcon filled={i <= filled} /></span>
        ))}
        <span className="ml-1 text-xs font-bold text-slate-600 dark:text-zinc-300">{score}/10</span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Interview Prep</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Tailored questions based on this job & your resume</p>
        </div>
        <button onClick={handleGenerate} disabled={generating} className="btn-primary text-xs gap-1.5 py-1.5">
          {generating ? <><Spinner size={12} /> Generating...</> : <><RefreshIcon /> {questions.length ? 'Regenerate' : 'Generate Questions'}</>}
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-10">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <BrainIcon />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">No questions yet</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500">Click "Generate Questions" to create AI-powered interview prep</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
          {/* Question List */}
          <div className="w-2/5 flex flex-col gap-1.5 overflow-y-auto pr-1">
            {questions.map((q, i) => (
              <button
                key={q._id || i}
                onClick={() => handleSelectQuestion(q)}
                className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                  selected?._id === q._id
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/40'
                    : 'bg-white dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-500/40'
                }`}
              >
                <div className="flex items-start gap-2 mb-1">
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${typeColors[q.type] || typeColors.Technical}`}>
                    {q.type}
                  </span>
                  {q.score && <ScoreStars score={q.score} />}
                </div>
                <p className="text-slate-700 dark:text-zinc-300 line-clamp-2 leading-relaxed">{q.question}</p>
              </button>
            ))}
          </div>

          {/* Question Detail */}
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-0">
            {selected ? (
              <>
                <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700">
                  <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">{selected.question}</p>
                  {selected.suggestedPoints && (
                    <>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mb-1">Key Points to Cover</p>
                      <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{selected.suggestedPoints}</p>
                    </>
                  )}
                </div>

                {/* Sub-tab selection */}
                <div className="flex border-b border-slate-200 dark:border-zinc-700 p-0.5 bg-slate-100 dark:bg-zinc-800 rounded-lg">
                  <button
                    onClick={() => setPracticeMode('written')}
                    className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      practiceMode === 'written'
                        ? 'bg-white dark:bg-zinc-700 text-indigo-650 dark:text-indigo-400 shadow-sm border-0'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 border-0 bg-transparent'
                    }`}
                  >
                    ✍️ Written Notes
                  </button>
                  <button
                    onClick={() => setPracticeMode('spoken')}
                    className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      practiceMode === 'spoken'
                        ? 'bg-white dark:bg-zinc-700 text-indigo-650 dark:text-indigo-400 shadow-sm border-0'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 border-0 bg-transparent'
                    }`}
                  >
                    🎙️ Spoken Practice
                  </button>
                </div>

                {practiceMode === 'written' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Your Answer / Notes</label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={5}
                        placeholder="Draft your answer here..."
                        className="input resize-none text-xs"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button onClick={handleSaveNotes} disabled={savingNotes} className="btn-ghost text-xs py-1.5 flex-1">
                        {savingNotes ? <><Spinner size={12} /> Saving...</> : 'Save Notes'}
                      </button>
                      <button onClick={handleGrade} disabled={grading || !notes.trim()} className="btn-primary text-xs py-1.5 flex-1">
                        {grading ? <><Spinner size={12} /> Grading...</> : <><SparkleIcon /> Grade Answer</>}
                      </button>
                    </div>

                    {gradeFeedback && (
                      <div className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">AI Feedback</p>
                          <ScoreStars score={gradeFeedback.score} />
                        </div>
                        <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">{gradeFeedback.aiFeedback}</p>
                        {gradeFeedback.improvedVersion && (
                          <>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mt-2">Stronger Version</p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed italic">{gradeFeedback.improvedVersion}</p>
                          </>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <VoiceInterviewTab 
                    job={job} 
                    question={selected} 
                    onSaved={handleVoiceSaved} 
                    toast={toast} 
                  />
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center py-8">
                <p className="text-xs text-slate-400 dark:text-zinc-500">Select a question to start practicing</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Messages Tab ─────────────────────────────────────────────────────────────
const MessagesTab = ({ job, user, toast }) => {
  const [messages, setMessages] = useState(job.recruiterMessages || []);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [addingManual, setAddingManual] = useState(false);
  const [manualMsg, setManualMsg] = useState({ from: '', subject: '', body: '' });
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${BACKEND}/jobs/${job._id}/messages`);
      setMessages(res.data.recruiterMessages || []);
    } catch (_) {}
  };

  const handleSendReply = async () => {
    if (!newMsg.trim()) return;
    setSending(true);
    try {
      const res = await axios.post(`${BACKEND}/jobs/${job._id}/messages`, {
        from: user?.email || 'Me',
        subject: `Re: ${job.job}`,
        body: newMsg,
        isFromRecruiter: false,
      });
      setMessages(res.data.recruiterMessages || []);
      setNewMsg('');
      toast.success('Reply sent!');
    } catch (err) {
      toast.error('Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  const handleSuggestReply = async () => {
    setSuggesting(true);
    try {
      const res = await axios.post(`${BACKEND}/jobs/${job._id}/suggest-reply`);
      setNewMsg(res.data.suggestedReply || '');
      toast.info('AI draft ready — review and send!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No recruiter message to reply to yet.');
    } finally {
      setSuggesting(false);
    }
  };

  const handleAddManual = async () => {
    setSending(true);
    try {
      const res = await axios.post(`${BACKEND}/jobs/${job._id}/messages`, {
        from: manualMsg.from || job.hrName || job.email,
        subject: manualMsg.subject,
        body: manualMsg.body,
        isFromRecruiter: true,
      });
      setMessages(res.data.recruiterMessages || []);
      setManualMsg({ from: '', subject: '', body: '' });
      setAddingManual(false);
      toast.success('Recruiter message logged!');
    } catch (err) {
      toast.error('Failed to add message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recruiter Inbox</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Track your conversation thread with {job.companyName || 'recruiter'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchMessages} className="btn-ghost text-xs py-1 px-2.5 gap-1"><RefreshIcon /> Refresh</button>
          <button onClick={() => setAddingManual(v => !v)} className="btn-primary text-xs py-1 px-2.5 gap-1"><PlusIcon /> Log Message</button>
        </div>
      </div>

      {/* Add Manual Message */}
      {addingManual && (
        <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 space-y-2">
          <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Log a Recruiter Message</p>
          <input type="text" placeholder="From (recruiter name/email)" value={manualMsg.from} onChange={e => setManualMsg(m => ({ ...m, from: e.target.value }))} className="input text-xs" />
          <input type="text" placeholder="Subject" value={manualMsg.subject} onChange={e => setManualMsg(m => ({ ...m, subject: e.target.value }))} className="input text-xs" />
          <textarea rows={3} placeholder="Message body..." value={manualMsg.body} onChange={e => setManualMsg(m => ({ ...m, body: e.target.value }))} className="input resize-none text-xs" />
          <div className="flex gap-2">
            <button onClick={() => setAddingManual(false)} className="btn-ghost text-xs py-1.5 flex-1">Cancel</button>
            <button onClick={handleAddManual} disabled={sending || !manualMsg.body.trim()} className="btn-primary text-xs py-1.5 flex-1">
              {sending ? <Spinner size={12} /> : 'Log Message'}
            </button>
          </div>
        </div>
      )}

      {/* Messages thread */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0 pb-1">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-10">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <MessageIcon />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">No messages yet</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Log a recruiter message or send a reply</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={msg._id || i} className={`flex ${msg.isFromRecruiter ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.isFromRecruiter
                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-tl-md'
                  : 'bg-indigo-600 text-white rounded-tr-md'
              }`}>
                {msg.subject && <p className="text-[10px] font-bold opacity-60 mb-0.5">{msg.subject}</p>}
                <p className="text-xs leading-relaxed whitespace-pre-line">{msg.body}</p>
                <p className={`text-[10px] mt-1 opacity-50 ${msg.isFromRecruiter ? '' : 'text-right'}`}>
                  {msg.isFromRecruiter ? (msg.from || 'Recruiter') : 'You'} · {new Date(msg.receivedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply input */}
      <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-2">
        <textarea
          rows={3}
          placeholder="Write your reply..."
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          className="input resize-none text-xs"
          onKeyDown={e => e.key === 'Enter' && e.metaKey && handleSendReply()}
        />
        <div className="flex gap-2">
          <button onClick={handleSuggestReply} disabled={suggesting} className="btn-ghost text-xs py-1.5 flex-1">
            {suggesting ? <><Spinner size={12} /> Thinking...</> : <><SparkleIcon /> AI Draft</>}
          </button>
          <button onClick={handleSendReply} disabled={sending || !newMsg.trim()} className="btn-primary text-xs py-1.5 flex-1">
            {sending ? <><Spinner size={12} /> Sending...</> : <><SendIcon /> Send Reply</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Follow-up Scheduler Component ───────────────────────────────────────────
const FollowUpScheduler = ({ job, onRefresh, toast }) => {
  const [date, setDate] = useState(job.followUpDate ? job.followUpDate.split('T')[0] : '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (selectedDate) => {
    setSaving(true);
    try {
      await axios.patch(`${BACKEND}/jobs/${job._id}`, {
        followUpDate: selectedDate || null,
        followUpStatus: selectedDate ? 'pending' : 'none'
      });
      toast.success(selectedDate ? 'Follow-up scheduled!' : 'Follow-up unscheduled.');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update follow-up date.');
    } finally {
      setSaving(false);
    }
  };

  const addDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const formatted = d.toISOString().split('T')[0];
    setDate(formatted);
    handleSave(formatted);
  };

  // Calculate days remaining
  let badgeText = '';
  let badgeColor = '';
  if (job.followUpDate && job.followUpStatus === 'pending') {
    const diff = new Date(job.followUpDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) {
      badgeText = `Follow-up overdue by ${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''}`;
      badgeColor = 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
    } else if (days === 0) {
      badgeText = 'Follow-up due today!';
      badgeColor = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    } else {
      badgeText = `Due in ${days} day${days > 1 ? 's' : ''}`;
      badgeColor = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
    }
  }

  return (
    <div className="p-4 rounded-lg border border-slate-200/60 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/10 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Recruiter Follow-up</p>
        {badgeText && <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badgeColor}`}>{badgeText}</span>}
      </div>

      {job.followUpStatus === 'sent' ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-600 dark:text-zinc-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Follow-up email dispatched on {new Date(job.updatedAt).toLocaleDateString()}
          </p>
          {job.followUpText && (
            <details className="text-xs bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded p-2.5 cursor-pointer">
              <summary className="font-semibold text-slate-700 dark:text-slate-350 select-none">View Sent Email Content</summary>
              <p className="mt-2 text-slate-500 dark:text-zinc-400 leading-relaxed whitespace-pre-line border-t border-slate-100 dark:border-zinc-800/80 pt-2">{job.followUpText}</p>
            </details>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); handleSave(e.target.value); }}
              className="bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-700 text-xs font-semibold px-2 py-1.5 rounded outline-none focus:border-indigo-500 cursor-pointer text-slate-800 dark:text-slate-250"
              disabled={saving}
            />
            <button
              type="button"
              onClick={() => addDays(3)}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-750 text-[11px] font-semibold px-2 py-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              disabled={saving}
            >
              +3 Days
            </button>
            <button
              type="button"
              onClick={() => addDays(7)}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-750 text-[11px] font-semibold px-2 py-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              disabled={saving}
            >
              +7 Days
            </button>
            <button
              type="button"
              onClick={() => addDays(14)}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-750 text-[11px] font-semibold px-2 py-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              disabled={saving}
            >
              +14 Days
            </button>
            {date && (
              <button
                type="button"
                onClick={() => { setDate(''); handleSave(''); }}
                className="text-[11px] text-red-500 hover:text-red-600 font-bold ml-auto cursor-pointer"
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Detail Drawer ────────────────────────────────────────────────────────────
const JobDrawer = ({ job, user, onClose, onRefresh, toast }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const [autofillOpen, setAutofillOpen] = useState(false);
  const drawerRef = useRef(null);

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'interview', label: 'Interview Prep' },
    { id: 'messages', label: 'Messages' },
  ];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-fade-in" onClick={onClose} />

      {/* Drawer */}
      <div ref={drawerRef} className="fixed right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-zinc-900 shadow-2xl border-l border-slate-200 dark:border-zinc-800 z-50 flex flex-col animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{job.job}</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{job.companyName || '—'} · {job.email}</p>
          </div>
          <button onClick={onClose} className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors" aria-label="Close drawer">
            <XIcon />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 border-b border-slate-100 dark:border-zinc-800 flex gap-1 shrink-0">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeTab === t.id
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
            }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden p-6">
          {activeTab === 'overview' && (
            <div className="h-full overflow-y-auto space-y-5">
              {/* Status & ATS */}
              <div className="flex items-center justify-between">
                <StatusBadge sent={job.isEmailSent} opened={job.isOpened} clicked={job.linkClicksCount > 0} hasReply={job.hasReply} />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-zinc-400">ATS Score</span>
                  <AtsRing score={job.atsAnalysis?.score} />
                </div>
              </div>

              {/* Tracking */}
              {job.isEmailSent && (
                <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 space-y-2">
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Outreach Engagement</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`p-2 rounded text-center ${job.isEmailSent ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'bg-slate-100 dark:bg-zinc-800'}`}>
                      <div className="flex justify-center mb-1 text-indigo-500"><MailIcon /></div>
                      <p className="text-[10px] font-semibold text-slate-600 dark:text-zinc-400">Sent</p>
                    </div>
                    <div className={`p-2 rounded text-center ${job.isOpened ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-slate-100 dark:bg-zinc-800'}`}>
                      <div className={`flex justify-center mb-1 ${job.isOpened ? 'text-emerald-500' : 'text-slate-400 dark:text-zinc-500'}`}><EyeIcon /></div>
                      <p className="text-[10px] font-semibold text-slate-600 dark:text-zinc-400">{job.isOpened ? 'Opened' : 'Not Opened'}</p>
                    </div>
                    <div className={`p-2 rounded text-center ${job.linkClicksCount > 0 ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-slate-100 dark:bg-zinc-800'}`}>
                      <div className={`flex justify-center mb-1 ${job.linkClicksCount > 0 ? 'text-amber-500' : 'text-slate-400 dark:text-zinc-500'}`}><LinkIcon /></div>
                      <p className="text-[10px] font-semibold text-slate-600 dark:text-zinc-400">{job.linkClicksCount > 0 ? `${job.linkClicksCount} Click(s)` : 'No Clicks'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ATS Keywords */}
              {job.atsAnalysis?.matchingKeywords?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Keyword Match</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.atsAnalysis.matchingKeywords.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">{kw}</span>
                    ))}
                  </div>
                  {job.atsAnalysis.missingKeywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {job.atsAnalysis.missingKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Status Timeline */}
              <div className="p-4 rounded-lg border border-slate-200/60 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 space-y-3">
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Status History & Timeline</p>
                <JobTimeline statusHistory={job.statusHistory} />
              </div>

              {/* Follow-up Scheduler */}
              <FollowUpScheduler job={job} onRefresh={onRefresh} toast={toast} />

              {/* Description */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Job Description</p>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line line-clamp-10">{job.description}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-1">
                {job.status === 'offer' && (
                  <button 
                    onClick={() => setNegotiationOpen(true)} 
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] transition-all text-white font-bold text-xs shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer border-0"
                  >
                    <SparkleIcon /> Negotiate Offer (AI Benchmark)
                  </button>
                )}

                <button 
                  onClick={() => setAutofillOpen(true)} 
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-650 to-violet-650 hover:from-indigo-700 hover:to-violet-750 active:scale-[0.99] transition-all text-white font-bold text-xs shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer border-0"
                >
                  <SparkleIcon /> Autofill Application Form (AI Agent)
                </button>

                <div className="flex gap-2">
                  <button onClick={() => setCoverOpen(true)} className="btn-ghost text-xs flex-1">Cover Letter</button>
                  <button onClick={() => setOutreachOpen(true)} className="btn-primary text-xs flex-1"><SparkleIcon /> Optimize & Outreach</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'interview' && (
            <div className="h-full">
              <InterviewPrepTab job={job} toast={toast} />
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="h-full">
              <MessagesTab job={job} user={user} toast={toast} />
            </div>
          )}
        </div>
      </div>

      {/* Outreach Modal */}
      {outreachOpen && (
        <OutreachModal
          job={job}
          user={user}
          onClose={() => setOutreachOpen(false)}
          onSuccess={() => { setOutreachOpen(false); onRefresh(); }}
        />
      )}

      {/* Cover Letter Modal */}
      {coverOpen && (
        <CoverLetterModal
          job={job}
          onClose={() => setCoverOpen(false)}
          onSaved={() => { setCoverOpen(false); onRefresh(); }}
        />
      )}

      {/* Salary Negotiation Modal */}
      <SalaryNegotiationModal
        job={job}
        user={user}
        isOpen={negotiationOpen}
        onClose={() => setNegotiationOpen(false)}
        onRefresh={onRefresh}
        toast={toast}
      />

      {/* Auto Form-Fill Modal */}
      <AutoFormFillPreview
        job={job}
        user={user}
        isOpen={autofillOpen}
        onClose={() => setAutofillOpen(false)}
        onRefresh={onRefresh}
        toast={toast}
      />
    </>
  );
};

// ─── Main Jobs Table ───────────────────────────────────────────────────────────
const JobsTable = ({ user }) => {
  const { toasts, success, error, info } = useToast();
  const toast = { success, error, info };

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', dir: 'desc' });
  const [drawerJob, setDrawerJob] = useState(null);
  const [formJob, setFormJob] = useState(null); // null = closed, {} = new, job = edit
  const [formOpen, setFormOpen] = useState(false);

  // Pagination, Search, and Status filter states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'

  const fetchJobs = async (currentPage = page, searchVal = search, statusVal = status, sortVal = sortConfig) => {
    setLoading(true);
    try {
      const sortBy = `${sortVal.key}:${sortVal.dir}`;
      const res = await axios.get(`${BACKEND}/jobs`, {
        params: {
          page: currentPage,
          limit,
          search: searchVal,
          status: statusVal,
          sortBy
        }
      });
      setJobs(res.data.jobs || []);
      setTotalJobs(res.data.totalJobs || 0);
      setTotalPages(res.data.totalPages || 1);
      setPage(res.data.page || currentPage);
    } catch (err) {
      error('Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  const checkDueFollowups = async () => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const res = await axios.get(`${BACKEND}/jobs/due-followups`);
      const dueJobs = res.data.jobs || [];
      dueJobs.forEach(j => {
        const title = `Follow-up Due: ${j.job}`;
        const options = {
          body: `It's time to follow up with ${j.hrName || 'the recruiter'} at ${j.companyName || 'their company'}.`,
          icon: '/app_favicon_1781991748218.png',
        };
        new Notification(title, options);
      });
    } catch (err) {
      console.error('Failed to check due follow-ups:', err.message);
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') checkDueFollowups();
        });
      } else if (Notification.permission === 'granted') {
        checkDueFollowups();
      }
    }
  }, [user]);

  // Debounce search input (350ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page to 1 when search query or status filter is modified
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    } else {
      fetchJobs(1, search, status, sortConfig);
    }
  }, [search, status]);

  // Re-run search query on page limit or sorting edits
  useEffect(() => {
    fetchJobs(page, search, status, sortConfig);
  }, [page, limit, sortConfig]);

  const handleDelete = async (jobId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this job?')) return;
    try {
      await axios.delete(`${BACKEND}/jobs/${jobId}`);
      if (drawerJob?._id === jobId) setDrawerJob(null);
      success('Job deleted.');
      fetchJobs(page, search, status, sortConfig);
    } catch (err) {
      error('Failed to delete job.');
    }
  };

  const handleEdit = (job, e) => {
    e.stopPropagation();
    setFormJob(job);
    setFormOpen(true);
  };

  const handleSort = key => setSortConfig(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  const sortedFiltered = jobs;

  const SortIcon = ({ col }) => sortConfig.key !== col ? null : <ChevronIcon up={sortConfig.dir === 'asc'} />;

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} />

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none"><SearchIcon /></span>
          <input
            type="search"
            placeholder="Search jobs, companies, description..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="input pl-9"
            id="jobs-search-input"
          />
        </div>

        {/* Status Filter */}
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold px-3 py-2 h-9 rounded-lg text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer transition-colors"
          id="jobs-status-filter"
        >
          <option value="all">All Statuses</option>
          <option value="saved">Saved</option>
          <option value="applied">Applied</option>
          <option value="opened">Opened</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200/40 dark:border-zinc-700/40 shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-zinc-750 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/20 dark:border-zinc-700/30'
                : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="List View"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-zinc-750 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/20 dark:border-zinc-700/30'
                : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="Kanban Board"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/>
              <rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>
            </svg>
          </button>
        </div>

        <button
          onClick={() => { setFormJob({}); setFormOpen(true); }}
          className="btn-primary shrink-0 gap-1.5 h-9 flex items-center justify-center"
          id="add-job-btn"
        >
          <PlusIcon /> Add Job
        </button>
      </div>

      {/* Table / Kanban Board conditional container */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          jobs={jobs}
          setJobs={setJobs}
          onRefresh={fetchJobs}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSelectJob={setDrawerJob}
          toast={toast}
        />
      ) : (
        <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-800">
                {[
                  ['job', 'Job Title'],
                  ['companyName', 'Company'],
                  ['email', 'Email'],
                  ['atsAnalysis.score', 'ATS'],
                  ['isEmailSent', 'Status'],
                  ['createdAt', 'Added'],
                ].map(([key, label]) => (
                  <th key={key} onClick={() => handleSort(key)} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide cursor-pointer hover:text-slate-700 dark:hover:text-zinc-200 transition-colors select-none">
                    <span className="flex items-center gap-1">{label} <SortIcon col={key} /></span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="px-4 py-12 text-center"><div className="flex items-center justify-center gap-2 text-slate-400"><Spinner /> Loading jobs...</div></td></tr>
              ) : sortedFiltered.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-12 text-center text-sm text-slate-400 dark:text-zinc-500">{(searchInput || status !== 'all') ? 'No jobs match your filters.' : 'No jobs yet. Click "Add Job" to get started!'}</td></tr>
              ) : (
                sortedFiltered.map(job => (
                  <tr key={job._id} onClick={() => setDrawerJob(job)} className="border-b border-slate-50 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors group">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[160px]">{job.job}</p>
                      {job.hrName && <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{job.hrName}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-zinc-400 truncate max-w-[120px]">{job.companyName || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-zinc-400 text-xs truncate max-w-[140px]">{job.email}</td>
                    <td className="px-4 py-3"><AtsRing score={job.atsAnalysis?.score} /></td>
                    <td className="px-4 py-3">
                      <StatusBadge sent={job.isEmailSent} opened={job.isOpened} clicked={job.linkClicksCount > 0} hasReply={job.hasReply} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 dark:text-zinc-500 whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => handleEdit(job, e)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                          title="Edit job"
                          id={`edit-job-${job._id}`}
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={e => handleDelete(job._id, e)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="Delete job"
                          id={`delete-job-${job._id}`}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination Controls */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{jobs.length}</span> of{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{totalJobs}</span> jobs
            </span>
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={e => { setLimit(parseInt(e.target.value)); setPage(1); }}
                className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-semibold px-2 py-0.5 rounded outline-none focus:border-indigo-500 cursor-pointer"
              >
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-medium hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                const isCurrent = pageNum === page;
                const isNearCurrent = Math.abs(pageNum - page) <= 1;
                const isFirstOrLast = pageNum === 1 || pageNum === totalPages;

                if (isFirstOrLast || isNearCurrent) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 rounded flex items-center justify-center font-semibold transition-all ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                          : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-700/50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === 2 || pageNum === totalPages - 1) {
                  return <span key={pageNum} className="text-slate-400 dark:text-zinc-600">...</span>;
                }
                return null;
              })}

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-medium hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    )}

      {/* Detail Drawer */}
      {drawerJob && (
        <JobDrawer
          job={drawerJob}
          user={user}
          onClose={() => setDrawerJob(null)}
          onRefresh={fetchJobs}
          toast={toast}
        />
      )}

      {/* Add / Edit Modal */}
      {formOpen && (
        <JobFormModal
          job={formJob?._id ? formJob : null}
          onClose={() => { setFormOpen(false); setFormJob(null); }}
          onSaved={fetchJobs}
          toast={toast}
        />
      )}
    </div>
  );
};

export default JobsTable;
