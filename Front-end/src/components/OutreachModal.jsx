import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { 
  XIcon, 
  SendIcon, 
  WandIcon, 
  RefreshIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon,
  ClockIcon
} from './Icons';
import ResumeDiffViewer from './ResumeDiffViewer';
import AiModelSelector, { getStoredAiModel } from './AiModelSelector';

const BACKEND = 'http://localhost:3000';

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" className="inline mr-1 shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 23 23" className="inline mr-1 shrink-0">
    <rect x="0" y="0" width="11" height="11" fill="#f25022" />
    <rect x="12" y="0" width="11" height="11" fill="#7fba00" />
    <rect x="0" y="12" width="11" height="11" fill="#00a4ef" />
    <rect x="12" y="12" width="11" height="11" fill="#ffb900" />
  </svg>
);

export default function OutreachModal({ job, user, onClose, onSuccess, initialStep = 'edit' }) {
  const [step, setStep] = useState(initialStep || 'edit');
  const [selectedAiModel, setSelectedAiModel] = useState(getStoredAiModel());
  const [coverLetter, setCoverLetter] = useState(job.coverLetter || '');
  const [atsScore, setAtsScore] = useState(job.atsAnalysis?.score ?? null);
  const [atsAnalysis, setAtsAnalysis] = useState(job.atsAnalysis || null);
  const [atsScoreBefore, setAtsScoreBefore] = useState(null);
  const [atsScoreAfter, setAtsScoreAfter] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [tailoredResumeData, setTailoredResumeData] = useState(job.tailoredResume?.json || null);
  const [keywordSuggestions, setKeywordSuggestions] = useState(null);
  const [templateId, setTemplateId] = useState(job.templateId || 'classic');
  const [wordCount, setWordCount] = useState(150);
  const [attachCoverLetter, setAttachCoverLetter] = useState(false);

  const [savingCL, setSavingCL] = useState(false);
  const [regeneratingCL, setRegeneratingCL] = useState(false);
  const [calculatingAts, setCalculatingAts] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [clStatus, setClStatus] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [previewingResume, setPreviewingResume] = useState(false);
  const [previewingCL, setPreviewingCL] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerTitle, setPdfViewerTitle] = useState('');
  const [pdfViewerUrl, setPdfViewerUrl] = useState('');

  const handlePreviewResumePdf = async (e) => {
    if (e) e.stopPropagation();
    setPreviewingResume(true);
    setModalError('');
    try {
      const res = await axios.post(
        `${BACKEND}/export-resume`,
        { templateId, format: 'pdf' },
        { responseType: 'blob' }
      );
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      setPdfViewerUrl(fileURL);
      setPdfViewerTitle(`Active Resume Preview (${templateId.toUpperCase()} Style)`);
      setPdfViewerOpen(true);
    } catch (err) {
      console.error(err);
      setModalError('Failed to generate resume PDF preview.');
    } finally {
      setPreviewingResume(false);
    }
  };

  const handlePreviewCoverLetterPdf = async (e) => {
    if (e) e.stopPropagation();
    setPreviewingCL(true);
    setModalError('');
    try {
      const res = await axios.post(
        `${BACKEND}/resume/cover-letter/export`,
        { jobId: job._id, templateId, format: 'pdf' },
        { responseType: 'blob' }
      );
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      setPdfViewerUrl(fileURL);
      setPdfViewerTitle(`Cover Letter PDF (${job.job} @ ${job.companyName || 'Recruiter'})`);
      setPdfViewerOpen(true);
    } catch (err) {
      console.error(err);
      setModalError('Failed to generate cover letter PDF preview.');
    } finally {
      setPreviewingCL(false);
    }
  };

  const [tailoringProgress, setTailoringProgress] = useState(0);
  const [tailoringLog, setTailoringLog] = useState('');
  const tailorEsRef = React.useRef(null);

  const activeResumeId = user?.activeResumeId;
  const activeResume = user?.resumes?.find(r => r.id === activeResumeId) || user?.resumes?.[0] || null;
  const resumeName = activeResume?.resumeFileName || user?.resumeFileName || 'Default Resume';

  const provider = user?.activeProvider || 'google';
  const isAuthenticated = provider === 'microsoft' ? !!user?.hasMicrosoftTokens : !!user?.hasGoogleTokens;

  useEffect(() => {
    return () => {
      if (tailorEsRef.current) {
        tailorEsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (job.coverLetter && !coverLetter) {
      setCoverLetter(job.coverLetter);
    }
  }, [job.coverLetter]);

  const handleCalculateAts = async () => {
    setCalculatingAts(true);
    setModalError('');
    try {
      const res = await axios.post(`${BACKEND}/resume/ats-score`, { jobId: job._id, aiModel: selectedAiModel });
      if (res.data.atsAnalysis) {
        setAtsScore(res.data.atsAnalysis.score);
        setAtsAnalysis(res.data.atsAnalysis);
      }
    } catch (err) {
      console.error(err);
      let errorMsg = 'Failed to calculate ATS match score.';
      if (err.response?.data?.details) {
        errorMsg = Object.entries(err.response.data.details)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      setModalError(errorMsg);
    } finally {
      setCalculatingAts(false);
    }
  };

  const handleTailorResume = async () => {
    setTailoring(true);
    setModalError('');
    setModalSuccess('');
    setTailoringProgress(0);
    setTailoringLog('');

    if (atsScore !== null) setAtsScoreBefore(atsScore);

    try {
      const res = await axios.post(`${BACKEND}/resume/tailor`, { jobId: job._id, aiModel: selectedAiModel });
      if (res.data.success) {
        setTailoringLog('Background tailoring task enqueued...');
      }

      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('jaa_session_token='))
        ?.split('=')[1];

      const url = new URL(`${BACKEND}/resume/stream`);
      if (token) url.searchParams.append('token', token);

      if (tailorEsRef.current) tailorEsRef.current.close();

      const es = new EventSource(url.toString(), { withCredentials: true });
      tailorEsRef.current = es;

      es.addEventListener('tailor-progress', (e) => {
        const data = JSON.parse(e.data);
        if (data.jobId !== job._id) return;

        if (data.progress !== undefined) {
          setTailoringProgress(data.progress);
        }
        if (data.log) {
          setTailoringLog(data.log);
        }

        if (data.status === 'complete') {
          es.close();
          setTailoring(false);
          
          const newScore = data.atsAnalysis?.score ?? null;
          setAtsScore(newScore);
          setAtsScoreAfter(newScore);
          setAtsAnalysis(data.atsAnalysis);
          setTailoredResumeData(data.tailoredResumeData);
          if (data.keywordSuggestions) setKeywordSuggestions(data.keywordSuggestions);
          setModalSuccess('Resume optimized for this job! Your primary resume is unchanged.');
        } else if (data.status === 'failed') {
          es.close();
          setTailoring(false);
          setModalError(data.log || 'Tailoring failed.');
        }
      });

      es.onerror = (err) => {
        console.error('Tailor SSE error:', err);
        es.close();
        setTailoring(false);
        setModalError('Connection to resume tailoring stream lost.');
      };

    } catch (err) {
      console.error(err);
      let errorMsg = 'Failed to tailor resume.';
      if (err.response?.data?.details) {
        errorMsg = Object.entries(err.response.data.details)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      setModalError(errorMsg);
      setTailoring(false);
    }
  };

  const handleSaveCoverLetter = async () => {
    setSavingCL(true);
    setModalError('');
    try {
      await axios.patch(`${BACKEND}/jobs/${job._id}`, { coverLetter });
      setClStatus('saved');
      setTimeout(() => setClStatus(''), 2500);
    } catch (err) {
      console.error(err);
      let errorMsg = 'Failed to save cover letter changes.';
      if (err.response?.data?.details) {
        errorMsg = Object.entries(err.response.data.details)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      setModalError(errorMsg);
    } finally {
      setSavingCL(false);
    }
  };

  const handleRegenerateCoverLetter = async (targetWords = wordCount) => {
    setRegeneratingCL(true);
    setModalError('');
    try {
      const res = await axios.post(`${BACKEND}/jobs/${job._id}/generate-cover-letter`, { 
        wordCount: targetWords,
        tone: 'Professional',
        description: job.description,
        aiModel: selectedAiModel
      });
      if (res.data.coverLetter) {
        setCoverLetter(res.data.coverLetter);
        setClStatus('dirty');
        setModalSuccess('Cover letter generated and updated.');
        setTimeout(() => setModalSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      let errorMsg = 'Failed to generate cover letter.';
      if (err.response?.data?.details) {
        errorMsg = Object.entries(err.response.data.details)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      setModalError(errorMsg);
    } finally {
      setRegeneratingCL(false);
    }
  };

  useEffect(() => {
    if (initialStep === 'review') {
      setAttachCoverLetter(false);
    }
  }, [initialStep]);

  const handleSend = async () => {
    setSending(true);
    setModalError('');
    try {
      await axios.patch(`${BACKEND}/jobs/${job._id}`, { coverLetter, templateId });
      
      // Direct Send forces attachCoverLetter to false (only CV goes out)
      const isDirect = initialStep === 'review';
      const res = await axios.post(`${BACKEND}/apply`, { 
        jobIds: [job._id], 
        email: user.email,
        attachCoverLetter: isDirect ? false : attachCoverLetter 
      });

      const result = res.data.results?.[0];
      if (result?.success) {
        setModalSuccess('Application successfully emailed to HR recruiter!');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setModalError(result?.error || 'Failed to dispatch application email.');
      }
    } catch (err) {
      console.error(err);
      let errorMsg = 'Dispatch application failed.';
      if (err.response?.data?.details) {
        errorMsg = Object.entries(err.response.data.details)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      setModalError(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const scoreColor = atsScore >= 85 ? 'text-emerald-500 stroke-emerald-500' : atsScore >= 60 ? 'text-amber-500 stroke-amber-500' : 'text-rose-500 stroke-rose-500';
  const circ = 100.5;
  const strokeDashoffset = circ - ((atsScore || 0) / 100) * circ;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-5xl bg-bg-card border border-border-card rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden origin-aware-popover">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-border-card shrink-0 gap-3">
          <div>
            <h3 className="text-base font-extrabold text-text-main flex items-center gap-2">
              <SendIcon size={16} className="text-brand-primary" />
              Application Dispatch & Outreach Studio
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Target Job: <strong className="text-text-main">{job.job}</strong> @ <span className="font-bold text-brand-primary">{job.companyName || 'Recruiter'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AiModelSelector 
              selectedModel={selectedAiModel} 
              onSelectModel={setSelectedAiModel} 
              compact={true} 
              currentUseCase={step === 'review' ? 'email-outreach' : 'tailoring'}
            />

            <div className="flex items-center bg-bg-app border border-border-card rounded-xl p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setStep('edit')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  step === 'edit'
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                1. Edit & Tailor
              </button>
              <button
                type="button"
                onClick={() => setStep('review')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  step === 'review'
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                2. Pre-Send Inspection
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-bg-card-hover transition-colors btn-tactile ml-1"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {step === 'review' ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-text-main">
            <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold">
                  <CheckCircleIcon size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main text-sm">Final Pre-Send Application Inspection</h4>
                  <p className="text-text-muted text-[11px]">Review your recruiter email details, attached resume profile, and outreach text below before sending.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('edit')}
                className="px-3 py-1.5 rounded-xl border border-brand-primary/30 text-brand-primary font-bold hover:bg-brand-primary/10 transition-all btn-tactile shrink-0"
              >
                ← Edit Content
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* CARD 1: Recruiter Email Details */}
              <div className="bg-bg-card border border-border-card rounded-2xl p-4.5 space-y-3 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">
                    1. Recruiter Email Details
                  </span>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-text-muted block font-medium">Recipient:</span>
                      <p className="font-bold text-text-main font-mono text-[11px] truncate">{job.email || 'No email specified'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block font-medium">Hiring Manager:</span>
                      <p className="font-bold text-text-main text-[11px]">{job.hrName || 'Hiring Team'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block font-medium">Subject Line:</span>
                      <p className="font-semibold text-brand-primary text-[11px] bg-brand-primary/10 border border-brand-primary/20 p-2 rounded-xl">
                        Job Application: {job.job} {job.companyName ? `@ ${job.companyName}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-border-card text-[10px] text-text-muted">
                  Sending via: <strong className="text-text-main capitalize">{provider} ({user?.email})</strong>
                </div>
              </div>

              {/* CARD 2: Active Resume Document */}
              <div className="bg-bg-card border border-border-card rounded-2xl p-4.5 space-y-3 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                      2. Attached Resume Profile
                    </span>
                    <button
                      type="button"
                      onClick={handlePreviewResumePdf}
                      disabled={previewingResume}
                      className="text-[10px] font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {previewingResume ? 'Loading PDF...' : 'View PDF ↗'}
                    </button>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div 
                      onClick={handlePreviewResumePdf}
                      className="p-3 rounded-xl bg-bg-app border border-border-card hover:border-brand-primary/50 flex items-center gap-2.5 cursor-pointer transition-all btn-tactile group"
                      title="Click to view/download PDF version of selected resume"
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs shrink-0">
                        PDF
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-text-main truncate text-xs group-hover:text-brand-primary transition-colors">{resumeName}</p>
                        <p className="text-[10px] text-text-muted truncate">{activeResume?.title || 'Active Resume Builder'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted text-[11px]">Export Style:</span>
                      <span className="font-bold text-text-main bg-bg-app border border-border-card px-2 py-0.5 rounded-lg capitalize text-[11px]">
                        {templateId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted text-[11px]">ATS Match Score:</span>
                      <span className="font-bold text-emerald-500 font-mono text-[11px]">
                        {atsScore ? `${atsScore}%` : 'Standard Match'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-border-card text-[10px] text-text-muted flex items-center justify-between">
                  <span>Status: <strong className="text-emerald-500">{tailoredResumeData ? 'AI Tailored PDF' : 'Active Builder Resume'}</strong></span>
                  <button type="button" onClick={handlePreviewResumePdf} className="text-brand-primary font-bold hover:underline cursor-pointer">
                    View PDF ↗
                  </button>
                </div>
              </div>

              {/* CARD 3: Dispatch Attachment Details */}
              <div className="bg-bg-card border border-border-card rounded-2xl p-4.5 space-y-3 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                      3. Dispatch Attachment Details
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div 
                      onClick={handlePreviewResumePdf}
                      className="p-2.5 rounded-xl bg-bg-app border border-border-card hover:border-brand-primary/50 space-y-1 cursor-pointer transition-all btn-tactile group"
                      title="Click to view/download Resume PDF"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-text-muted font-medium block">Email Attachment:</span>
                        <span className="text-[10px] font-bold text-brand-primary group-hover:underline">View PDF ↗</span>
                      </div>
                      <p className="font-bold text-text-main text-[11px] group-hover:text-brand-primary transition-colors">
                        1 PDF (Resume PDF Only — Direct Send)
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block font-medium mb-1">Outreach Email Length:</span>
                      <span className="font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-full font-mono text-[10px]">
                        {coverLetter ? coverLetter.trim().split(/\s+/).filter(Boolean).length : 0} words
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-border-card text-[10px] font-bold text-emerald-500 flex items-center justify-between">
                  <span>Direct resume attachment verified</span>
                  <button type="button" onClick={handlePreviewResumePdf} className="text-brand-primary font-bold hover:underline cursor-pointer">
                    View Resume PDF ↗
                  </button>
                </div>
              </div>
            </div>

            {/* Email Body Full Preview Sheet */}
            <div className="bg-bg-card border border-border-card rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-border-card pb-2.5">
                <h5 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-2">
                  Full Email Outreach Content Preview
                </h5>
                <button
                  type="button"
                  onClick={() => setStep('edit')}
                  className="text-[11px] font-bold text-brand-primary hover:underline"
                >
                  Edit Email Text
                </button>
              </div>
              <div className="p-4 rounded-xl bg-bg-app border border-border-card text-xs font-mono leading-relaxed text-text-main min-h-[160px] max-h-[260px] overflow-y-auto whitespace-pre-line">
                {coverLetter || 'No email text content generated.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 text-text-main">
          
          {/* Left: Cover Letter Editor */}
          <div className="lg:col-span-7 flex flex-col gap-3 min-h-[300px]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                Outreach Cover Letter / Email Body
                {clStatus === 'dirty' && <span className="text-[10px] text-amber-500 font-bold font-mono">(Unsaved)</span>}
                {clStatus === 'saved' && <span className="text-[10px] text-emerald-500 font-bold font-mono">Saved draft</span>}
              </label>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleRegenerateCoverLetter()}
                  disabled={regeneratingCL}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border border-border-card text-brand-primary hover:bg-bg-card-hover transition-all btn-tactile"
                >
                  <WandIcon size={12} className={regeneratingCL ? "animate-spin" : ""} />
                  {regeneratingCL ? 'Generating...' : 'Regenerate'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveCoverLetter}
                  disabled={savingCL || regeneratingCL}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-bg-app border border-border-card text-text-main hover:bg-bg-card-hover transition-all btn-tactile"
                >
                  {savingCL ? 'Saving...' : 'Save Draft'}
                </button>
              </div>
            </div>

            {/* Word Length Selector */}
            <div className="flex items-center gap-3 py-1.5 px-3 bg-bg-app border border-border-card rounded-xl mb-2 shrink-0">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Email Length:</span>
              <div className="flex gap-1.5">
                {[
                  { id: 50, label: 'Pitch (50w)' },
                  { id: 100, label: 'Concise (100w)' },
                  { id: 180, label: 'Standard (180w)' },
                  { id: 300, label: 'Detailed (300w)' }
                ].map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setWordCount(preset.id);
                      handleRegenerateCoverLetter(preset.id);
                    }}
                    disabled={regeneratingCL}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer btn-tactile ${
                      wordCount === preset.id
                        ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                        : 'bg-bg-card text-text-muted border-border-card hover:border-brand-primary hover:text-brand-primary'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Letter Text Area */}
            <div className="flex-1 flex flex-col relative min-h-[300px]">
              {regeneratingCL ? (
                <div className="absolute inset-0 bg-bg-card/80 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center gap-2 z-10">
                  <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-brand-primary animate-pulse">Drafting Email Outreach...</span>
                </div>
              ) : null}
              <textarea
                value={coverLetter}
                onChange={e => {
                  setCoverLetter(e.target.value);
                  setClStatus('dirty');
                }}
                className="w-full flex-1 p-4 text-xs font-mono border border-border-card rounded-xl bg-bg-app text-text-main focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none overflow-y-auto leading-relaxed min-h-[350px]"
                placeholder="Write or generate your cover letter/email outreach content here..."
              />
            </div>
          </div>

          {/* Right: Resume tailoring & ATS Score */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Active Resume Card */}
            <div className="bg-bg-card p-4 border border-border-card rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                  Active Resume Profile
                </span>
                <button
                  type="button"
                  onClick={handlePreviewResumePdf}
                  disabled={previewingResume}
                  className="text-[10px] font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {previewingResume ? 'Loading...' : 'View PDF ↗'}
                </button>
              </div>

              <div 
                onClick={handlePreviewResumePdf}
                className="flex items-center gap-3 mt-2 p-2.5 rounded-xl bg-bg-app border border-border-card hover:border-brand-primary/50 cursor-pointer transition-all btn-tactile group"
                title="Click to view/download PDF version of selected resume"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 border border-brand-primary/20 font-bold text-xs">
                  PDF
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-text-main truncate group-hover:text-brand-primary transition-colors">
                    {resumeName}
                  </h4>
                  <p className="text-[10px] text-text-muted truncate mt-0.5">
                    {activeResume?.title || 'Active Resume Document'}
                  </p>
                </div>
              </div>

              {/* Template Selector */}
              <div className="mt-3 pt-3 border-t border-border-card">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-2">Export Template</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'classic', label: 'Classic' },
                    { id: 'modern', label: 'Modern' },
                    { id: 'minimal', label: 'ATS Clean' },
                    { id: 'executive', label: 'Executive' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplateId(t.id)}
                      className={`px-1.5 py-1.5 rounded-lg text-[9.5px] font-bold transition-all border cursor-pointer btn-tactile ${
                        templateId === t.id
                          ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                          : 'bg-bg-app text-text-muted border-border-card hover:border-brand-primary hover:text-brand-primary'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attach Cover Letter PDF Switch */}
              <div className="mt-3 pt-3 border-t border-border-card flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-text-main block">
                    Attach Cover Letter PDF
                  </span>
                  <span className="text-[9px] text-text-muted block mt-0.5">
                    {attachCoverLetter
                      ? 'Sends 2 PDFs: Resume PDF + Cover Letter PDF'
                      : 'Sends 1 PDF: Resume PDF only'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attachCoverLetter}
                    onChange={(e) => setAttachCoverLetter(e.target.checked)}
                    className="sr-only peer"
                    id="attach-cl-toggle"
                  />
                  <div className="w-9 h-5 bg-bg-app border border-border-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-muted peer-checked:after:bg-white after:border-border-card after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary" />
                </label>
              </div>

              {tailoredResumeData && (
                <div className="mt-2.5 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9.5px] font-bold text-emerald-500">
                  Tailored version ready for this job
                </div>
              )}
            </div>

            {/* ATS Match Score */}
            <div className="bg-bg-card p-4 border border-border-card rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                  ATS Compatibility Match
                </span>
                {atsScore !== null && !calculatingAts && (
                  <button
                    type="button"
                    onClick={handleCalculateAts}
                    className="text-[10px] flex items-center gap-1 text-text-muted hover:text-brand-primary transition-colors btn-tactile"
                    title="Recalculate ATS Score"
                  >
                    <RefreshIcon size={10} /> Recalculate
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                {calculatingAts ? (
                  <div className="flex items-center gap-2 py-2.5 text-xs text-text-muted font-medium">
                    <div className="w-3.5 h-3.5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    Calculating ATS Score...
                  </div>
                ) : atsScore !== null ? (
                  <div className="flex items-center gap-3.5 w-full">

                    {atsScoreBefore !== null && atsScoreAfter !== null && (
                      <div className="flex flex-col items-center">
                        <span className="text-[8.5px] text-text-muted font-bold uppercase tracking-wider mb-1">Before</span>
                        <div className="relative flex items-center justify-center w-10 h-10">
                          <svg className="w-10 h-10 transform -rotate-90">
                            <circle cx="20" cy="20" r="14" className="stroke-border-card" strokeWidth="3" fill="transparent" />
                            <circle cx="20" cy="20" r="14" className="stroke-text-muted" strokeWidth="3" fill="transparent" strokeDasharray="88" strokeDashoffset={88 - (atsScoreBefore / 100) * 88} strokeLinecap="round" />
                          </svg>
                          <span className="absolute text-[9px] font-bold text-text-muted font-mono">{atsScoreBefore}%</span>
                        </div>
                      </div>
                    )}

                    {atsScoreBefore !== null && atsScoreAfter !== null && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-primary shrink-0">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}

                    <div className="flex flex-col items-center">
                      {atsScoreAfter !== null && <span className="text-[8.5px] text-emerald-500 font-bold uppercase tracking-wider mb-1">After</span>}
                      <div className="relative flex items-center justify-center w-12 h-12">
                        <svg className="w-12 h-12 transform -rotate-90">
                          <circle cx="24" cy="24" r="16" className="stroke-border-card" strokeWidth="3.5" fill="transparent" />
                          <circle
                            cx="24" cy="24" r="16"
                            className={`transition-all duration-700 ease-out ${scoreColor}`}
                            strokeWidth="3.5" fill="transparent"
                            strokeDasharray={circ}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-[11px] font-extrabold font-mono text-text-main">{atsScore}%</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-main">
                        {atsScore >= 85 ? 'Strong ATS Alignment' : atsScore >= 60 ? 'Moderate ATS Alignment' : 'Low ATS Alignment'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAnalysis(!showAnalysis)}
                        className="text-[10px] text-brand-primary font-bold hover:underline mt-1 flex items-center gap-1 cursor-pointer btn-tactile"
                      >
                        {showAnalysis ? 'Hide Analysis ▲' : 'Show Keyword Analysis ▼'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleCalculateAts}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-primary/10 text-brand-primary border border-brand-primary/20 btn-tactile cursor-pointer"
                  >
                    <RefreshIcon size={12} />
                    Calculate ATS Match Score
                  </button>
                )}
              </div>

              {atsScore !== null && atsScore < 85 && (
                <div className="mt-1.5 pt-3 border-t border-border-card space-y-3">
                  <div className="flex gap-2 p-2.5 rounded-lg bg-rose-500/10 text-rose-500 text-[10.5px] border border-rose-500/20 mb-2 leading-relaxed animate-pulse">
                    <AlertTriangleIcon size={13} className="shrink-0 mt-0.5" />
                    <span>
                      ATS score is lower than recommended (85%). Tailor keywords and project highlights using AI to maximize recruiter response.
                    </span>
                  </div>

                  <button
                    onClick={handleTailorResume}
                    disabled={tailoring || calculatingAts}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs shadow-md shadow-brand-primary/20 transition-all cursor-pointer btn-tactile"
                  >
                    {tailoring ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        AI Optimizing ({tailoringProgress}%)
                      </>
                    ) : (
                      <>
                        <WandIcon size={13} />
                        Optimize Resume for 100% Match
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Email Provider Auth */}
            <div className="bg-bg-card p-4 border border-border-card rounded-xl flex flex-col gap-2.5">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                Auth Status & Dispatch Provider
              </span>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-bg-app border border-border-card flex items-center justify-center shadow-sm shrink-0">
                    {provider === 'microsoft' ? <MicrosoftIcon /> : <GoogleIcon />}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-text-main capitalize">
                      {provider === 'microsoft' ? 'Microsoft Outlook' : 'Google Gmail'}
                    </h5>
                    <p className="text-[9.5px] text-text-muted font-medium">
                      Sending from: {user?.email}
                    </p>
                  </div>
                </div>

                {isAuthenticated ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse">
                    Disconnected
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

        {/* Global Error/Success inside modal */}
        {modalError && (
          <div className="mx-6 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-500 flex items-center gap-2">
            <AlertTriangleIcon size={14} className="shrink-0 animate-bounce" />
            {modalError}
          </div>
        )}
        {modalSuccess && (
          <div className="mx-6 mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-500 flex items-center gap-2">
            <CheckCircleIcon size={14} className="shrink-0" />
            {modalSuccess}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-border-card bg-bg-card shrink-0">
          <p className="text-[10.5px] text-text-muted font-medium flex items-center gap-1">
            <strong className="text-text-main">Pre-Send Verification:</strong> {step === 'review' ? 'Inspect all 3 items (Resume, Cover Letter, Recruiter Email) before final send.' : 'Edit email text or ATS score, then proceed to inspection.'}
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {step === 'review' ? (
              <>
                <button
                  onClick={() => setStep('edit')}
                  disabled={sending}
                  className="px-4 py-2 border border-border-card rounded-xl text-xs font-bold text-text-muted hover:bg-bg-card-hover transition-colors btn-tactile"
                >
                  ← Back to Edit
                </button>
                
                <button
                  onClick={handleSend}
                  disabled={sending || !isAuthenticated || tailoring || regeneratingCL}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md bg-emerald-600 hover:bg-emerald-500 text-white btn-tactile"
                >
                  {sending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Dispatching Application...
                    </>
                  ) : (
                    <>
                      <SendIcon size={12} />
                      Confirm & Dispatch Application
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  disabled={sending}
                  className="px-4 py-2 border border-border-card rounded-xl text-xs font-bold text-text-muted hover:bg-bg-card-hover transition-colors btn-tactile"
                >
                  Cancel
                </button>
                
                <button
                  onClick={() => setStep('review')}
                  disabled={tailoring || regeneratingCL}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md bg-brand-primary hover:bg-brand-primary-hover text-white btn-tactile"
                >
                  Proceed to Review & Confirm →
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* In-Page PDF Modal Viewer */}
      {pdfViewerOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl h-[90vh] bg-bg-card border border-border-card rounded-2xl shadow-2xl flex flex-col overflow-hidden origin-aware-popover">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-card bg-bg-card shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs">
                  PDF
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-text-main">{pdfViewerTitle}</h4>
                  <p className="text-[11px] text-text-muted">Live PDF document generated in application context</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={pdfViewerUrl}
                  download={`${pdfViewerTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
                  className="px-3.5 py-1.5 rounded-xl border border-border-card text-xs font-bold text-text-main hover:bg-bg-app transition-all btn-tactile flex items-center gap-1.5"
                >
                  Download PDF ⤓
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setPdfViewerOpen(false);
                    if (pdfViewerUrl) URL.revokeObjectURL(pdfViewerUrl);
                  }}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-bg-card-hover transition-colors btn-tactile"
                >
                  <XIcon size={18} />
                </button>
              </div>
            </div>

            {/* PDF Viewer Frame */}
            <div className="flex-1 bg-slate-900 overflow-hidden relative">
              <iframe
                src={`${pdfViewerUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                className="w-full h-full border-0"
                title={pdfViewerTitle}
              />
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
