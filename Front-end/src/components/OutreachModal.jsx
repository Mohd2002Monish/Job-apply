import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
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
import { setResumeInfo } from '../store/authSlice';

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

export default function OutreachModal({ job, user, onClose, onSuccess }) {
  const dispatch = useDispatch();

  // Local States
  const [coverLetter, setCoverLetter] = useState(job.coverLetter || '');
  const [atsScore, setAtsScore] = useState(job.atsAnalysis?.score ?? null);
  const [atsAnalysis, setAtsAnalysis] = useState(job.atsAnalysis || null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  const [savingCL, setSavingCL] = useState(false);
  const [regeneratingCL, setRegeneratingCL] = useState(false);
  const [calculatingAts, setCalculatingAts] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [clStatus, setClStatus] = useState(''); // 'saved', 'dirty', etc.
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Active Resume details
  const activeResumeId = user?.activeResumeId;
  const activeResume = user?.resumes?.find(r => r.id === activeResumeId) || user?.resumes?.[0] || null;
  const resumeName = activeResume?.resumeFileName || user?.resumeFileName || 'Default Resume';

  // Check auth provider
  const provider = user?.activeProvider || 'google';
  const isAuthenticated = provider === 'microsoft' ? !!user?.microsoftTokens : !!user?.googleTokens;

  // Auto calculate ATS score and auto-generate cover letter on load if not present
  useEffect(() => {
    if (atsScore === null) {
      handleCalculateAts();
    }
    if (!job.coverLetter && !coverLetter) {
      handleRegenerateCoverLetter();
    }
  }, []);

  // Update cover letter state if prop updates
  useEffect(() => {
    if (job.coverLetter && !coverLetter) {
      setCoverLetter(job.coverLetter);
    }
  }, [job.coverLetter]);

  // Calculate ATS Match Score
  const handleCalculateAts = async () => {
    setCalculatingAts(true);
    setModalError('');
    try {
      const res = await axios.post(`${BACKEND}/resume/ats-score`, { jobId: job._id });
      if (res.data.atsAnalysis) {
        setAtsScore(res.data.atsAnalysis.score);
        setAtsAnalysis(res.data.atsAnalysis);
      }
    } catch (err) {
      console.error(err);
      setModalError('Failed to calculate ATS match score.');
    } finally {
      setCalculatingAts(false);
    }
  };

  // Tailor Resume JSON for 100% match
  const handleTailorResume = async () => {
    setTailoring(true);
    setModalError('');
    setModalSuccess('');
    try {
      const res = await axios.post(`${BACKEND}/resume/tailor`, { jobId: job._id });
      if (res.data.resumeData) {
        // Update Redux state with updated active resume JSON
        dispatch(setResumeInfo({
          resumeName: resumeName,
          resumeData: res.data.resumeData
        }));
        
        // Update ATS score and details from tailoring response
        setAtsScore(res.data.atsAnalysis.score);
        setAtsAnalysis(res.data.atsAnalysis);
        setModalSuccess('Resume optimized successfully for 100% ATS score! The layout will use this updated version.');
      }
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.error || 'Failed to tailor resume.');
    } finally {
      setTailoring(false);
    }
  };

  // Save Cover Letter changes
  const handleSaveCoverLetter = async () => {
    setSavingCL(true);
    setModalError('');
    try {
      await axios.patch(`${BACKEND}/jobs/${job._id}`, { coverLetter });
      setClStatus('saved');
      setTimeout(() => setClStatus(''), 2500);
    } catch (err) {
      setModalError('Failed to save cover letter changes.');
    } finally {
      setSavingCL(false);
    }
  };

  // Regenerate Cover Letter dynamically
  const handleRegenerateCoverLetter = async () => {
    setRegeneratingCL(true);
    setModalError('');
    try {
      const res = await axios.post(`${BACKEND}/resume/cover-letter`, { jobId: job._id });
      if (res.data.coverLetter) {
        setCoverLetter(res.data.coverLetter);
        setClStatus('dirty');
        setModalSuccess('Cover letter generated and updated.');
        setTimeout(() => setModalSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setModalError('Failed to generate cover letter.');
    } finally {
      setRegeneratingCL(false);
    }
  };

  // Send application
  const handleSend = async () => {
    setSending(true);
    setModalError('');
    try {
      // First save the current cover letter to the database
      await axios.patch(`${BACKEND}/jobs/${job._id}`, { coverLetter });
      
      // Send application
      const res = await axios.post(`${BACKEND}/apply`, { 
        jobIds: [job._id], 
        email: user.email 
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
      setModalError(err.response?.data?.error || 'Dispatch application failed.');
    } finally {
      setSending(false);
    }
  };

  // Status mapping
  const scoreColor = atsScore >= 85 ? 'text-emerald-500 stroke-emerald-500' : atsScore >= 60 ? 'text-amber-500 stroke-amber-500' : 'text-rose-500 stroke-rose-500';
  const scoreBg = atsScore >= 85 ? 'bg-emerald-500/5 border-emerald-500/10' : atsScore >= 60 ? 'bg-amber-500/5 border-amber-500/10' : 'bg-rose-500/5 border-rose-500/10';

  // SVG Circular Dash offset math
  // Radius = 16, Circumference = 2 * PI * 16 = 100.5
  const circ = 100.5;
  const strokeDashoffset = circ - ((atsScore || 0) / 100) * circ;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-5xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] flex flex-col max-h-[85vh] overflow-hidden transform transition-all duration-300 scale-100 animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <SendIcon size={16} className="text-indigo-600 dark:text-indigo-400" />
              Apply & Optimize Outreach
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Review and tailor your documents before emailing recruiter at <span className="font-semibold text-slate-700 dark:text-slate-200">{job.companyName || 'Unknown Company'}</span>
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
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          
          {/* Left: Cover Letter Editor */}
          <div className="lg:col-span-7 flex flex-col gap-3 min-h-[300px]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                Outreach Cover Letter / Email Body
                {clStatus === 'dirty' && <span className="text-[10px] text-amber-500 font-semibold font-mono">(Unsaved changes)</span>}
                {clStatus === 'saved' && <span className="text-[10px] text-emerald-500 font-semibold font-mono">✓ Saved draft</span>}
              </label>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRegenerateCoverLetter}
                  disabled={regeneratingCL}
                  title="Regenerate Cover Letter using AI"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-750 text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <WandIcon size={12} className={regeneratingCL ? "animate-spin" : ""} />
                  {regeneratingCL ? 'Generating...' : 'Regenerate'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveCoverLetter}
                  disabled={savingCL || regeneratingCL}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-zinc-750 cursor-pointer"
                >
                  {savingCL ? 'Saving...' : 'Save Draft'}
                </button>
              </div>
            </div>

            <div className="flex-1 relative flex flex-col min-h-0">
              {regeneratingCL ? (
                <div className="w-full flex-1 border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-50/50 dark:bg-zinc-950/30 flex flex-col items-center justify-center p-6 text-sm text-slate-400 dark:text-zinc-500 leading-normal min-h-[350px]">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                  Generating personalized cover letter...
                </div>
              ) : (
                <textarea
                  value={coverLetter}
                  onChange={(e) => {
                    setCoverLetter(e.target.value);
                    setClStatus('dirty');
                  }}
                  className="w-full flex-1 p-4 text-xs font-mono border border-slate-250 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-950/40 text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 dark:focus:ring-indigo-500/10 resize-none overflow-y-auto leading-relaxed min-h-[350px]"
                  placeholder="Write or generate your cover letter/email outreach content here..."
                />
              )}
            </div>
          </div>

          {/* Right: Resume tailoring & ATS Score */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Active Resume Card */}
            <div className="bg-slate-50/50 dark:bg-zinc-950/30 p-4 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl">
              <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold uppercase tracking-wider block">
                Active Resume Profile
              </span>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-500/15">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {resumeName}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                    {activeResume?.title || 'Active Resume Document'}
                  </p>
                </div>
              </div>
            </div>

            {/* ATS Match Score */}
            <div className="bg-slate-50/50 dark:bg-zinc-950/30 p-4 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl flex flex-col gap-3">
              <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold uppercase tracking-wider block">
                ATS Compatibility Match
              </span>
              
              <div className="flex items-center gap-4">
                {calculatingAts ? (
                  <div className="flex items-center gap-2 py-2.5 text-xs text-slate-500 font-medium">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    Calculating ATS Score...
                  </div>
                ) : atsScore !== null ? (
                  <div className="flex items-center gap-3.5">
                    
                    {/* SVG Circular indicator */}
                    <div className="relative flex items-center justify-center w-12 h-12">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle cx="24" cy="24" r="16" className="stroke-slate-200 dark:stroke-zinc-800" strokeWidth="3.5" fill="transparent" />
                        <circle 
                          cx="24" 
                          cy="24" 
                          r="16" 
                          className={`transition-all duration-700 ease-out ${scoreColor}`} 
                          strokeWidth="3.5" 
                          fill="transparent"
                          strokeDasharray={circ} 
                          strokeDashoffset={strokeDashoffset} 
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {atsScore}%
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-850 dark:text-slate-200">
                        {atsScore >= 85 ? 'Excellent compatibility' : atsScore >= 60 ? 'Moderate compatibility' : 'Needs improvement'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAnalysis(!showAnalysis)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline mt-1 flex items-center gap-1 cursor-pointer"
                      >
                        {showAnalysis ? 'Hide Keyword Analysis ▲' : 'Show Keyword Analysis ▼'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleCalculateAts}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-all border border-indigo-100 dark:border-indigo-500/25 cursor-pointer"
                  >
                    <RefreshIcon size={12} />
                    Calculate ATS Match Score
                  </button>
                )}
              </div>

              {showAnalysis && atsAnalysis && (
                <div className="mt-1 pt-3 border-t border-slate-200/50 dark:border-zinc-800/80 space-y-3 animate-fade-in">
                  {/* Matching Keywords */}
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block mb-1.5">
                      Matching Keywords ({atsAnalysis.matchingKeywords?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto pr-1">
                      {atsAnalysis.matchingKeywords && atsAnalysis.matchingKeywords.length > 0 ? (
                        atsAnalysis.matchingKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-150/40 dark:border-emerald-500/20"
                          >
                            ✓ {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-zinc-550 italic">No matching keywords found.</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Keywords */}
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block mb-1.5">
                      Missing Keywords ({atsAnalysis.missingKeywords?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto pr-1">
                      {atsAnalysis.missingKeywords && atsAnalysis.missingKeywords.length > 0 ? (
                        atsAnalysis.missingKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-150/40 dark:border-rose-500/20"
                          >
                            ✗ {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-emerald-605 dark:text-emerald-400 font-bold">100% Match! No missing keywords.</span>
                      )}
                    </div>
                  </div>

                  {/* Suggestions */}
                  {atsAnalysis.suggestions && atsAnalysis.suggestions.length > 0 && (
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block mb-1.5">
                        Optimization Suggestions
                      </span>
                      <ul className="list-disc list-inside text-[10px] text-slate-655 dark:text-zinc-400 space-y-1 pl-0.5 font-medium leading-relaxed">
                        {atsAnalysis.suggestions.map((sug, i) => (
                          <li key={i} className="text-slate-600 dark:text-zinc-400">{sug}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Optimize Resume (ATS tailoring) Button */}
              {atsScore !== null && atsScore < 85 && (
                <div className="mt-1.5 pt-3 border-t border-slate-200/50 dark:border-zinc-800/80">
                  <div className="flex gap-2 p-2.5 rounded-lg bg-rose-500/5 dark:bg-rose-500/10 text-rose-600 dark:text-rose-450 text-[10.5px] border border-rose-500/10 mb-3 leading-relaxed">
                    <AlertTriangleIcon size={13} className="shrink-0 mt-0.5" />
                    <span>
                      ATS score is lower than recommended (85%). Tailor keywords and project highlights using AI to maximize recruiters response.
                    </span>
                  </div>
                  <button
                    onClick={handleTailorResume}
                    disabled={tailoring || calculatingAts}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-650 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/15 disabled:opacity-50 transition-all cursor-pointer select-none"
                  >
                    {tailoring ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        AI Optimizing Resume Data...
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

              {atsScore >= 85 && atsScore !== null && (
                <div className="mt-1 flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-405 text-xs border border-emerald-500/10">
                  <CheckCircleIcon size={13} className="shrink-0 mt-0.5" />
                  <span>Resume tailored for this role! PDF is dynamically compiled.</span>
                </div>
              )}
            </div>

            {/* Email Provider Auth */}
            <div className="bg-slate-50/50 dark:bg-zinc-950/30 p-4 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl flex flex-col gap-2.5">
              <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold uppercase tracking-wider block">
                Auth Status & Dispatch Provider
              </span>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-850 border border-slate-200/80 dark:border-zinc-750 flex items-center justify-center shadow-sm shrink-0">
                    {provider === 'microsoft' ? <MicrosoftIcon /> : <GoogleIcon />}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-250 capitalize">
                      {provider === 'microsoft' ? 'Microsoft Outlook' : 'Google Gmail'}
                    </h5>
                    <p className="text-[9.5px] text-slate-400 dark:text-zinc-500 font-medium">
                      Sending from: {user?.email}
                    </p>
                  </div>
                </div>

                {isAuthenticated ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100/85 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20 animate-pulse">
                    Disconnected
                  </span>
                )}
              </div>

              {!isAuthenticated && (
                <div className="mt-1 p-2.5 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/15 rounded-lg flex flex-col gap-2">
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 leading-relaxed font-medium">
                    Credentials required to send applications. Click below to log in.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `${BACKEND}/auth/${provider}`;
                    }}
                    className="w-fit flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors cursor-pointer select-none"
                  >
                    Authenticate Account
                  </button>
                </div>
              )}
            </div>

            {/* Follow-up Note */}
            <div className="bg-slate-50/30 dark:bg-zinc-950/15 p-3.5 border border-slate-200/40 dark:border-zinc-800/50 rounded-xl flex gap-2.5 text-[11px] text-slate-550 dark:text-zinc-400 leading-normal">
              <ClockIcon size={14} className="shrink-0 text-slate-400 dark:text-zinc-550 mt-0.5" />
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                  Automated Follow-up Scheduled
                </span>
                An automated follow-up email will be sent in 7 days if no reply is detected.
              </div>
            </div>

          </div>

        </div>

        {/* Global Error/Success inside modal */}
        {modalError && (
          <div className="mx-6 mb-4 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangleIcon size={14} className="shrink-0 animate-bounce" />
            {modalError}
          </div>
        )}
        {modalSuccess && (
          <div className="mx-6 mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-250 dark:border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircleIcon size={14} className="shrink-0" />
            {modalSuccess}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4.5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 shrink-0">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-805 transition-colors disabled:opacity-50 cursor-pointer select-none"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSend}
            disabled={sending || !isAuthenticated || tailoring || regeneratingCL}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 cursor-pointer select-none"
          >
            {sending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending Application...
              </>
            ) : (
              <>
                <SendIcon size={12} />
                Send Application to Recruiter
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
