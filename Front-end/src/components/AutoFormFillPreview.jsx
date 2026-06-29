import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

const BACKEND = 'http://localhost:3000';

const CloseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const CpuIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="15" x2="23" y2="15" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="15" x2="4" y2="15" />
  </svg>
);

const ExternalLinkIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const ShieldCheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 11 11 13 15 9" />
  </svg>
);

const AutoFormFillPreview = ({ job, user, isOpen, onClose, onRefresh, toast }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState([]);
  const [urlUsed, setUrlUsed] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0); // 0: Review fields, 1: Screenshot & complete
  const [loadingMessage, setLoadingMessage] = useState('Initializing scanning agent...');

  // Step messages sequence for autofilling
  const fillProgressMessages = [
    'Launching secure sandboxed browser...',
    'Spoofing user agent and viewport details...',
    'Navigating to application link...',
    'Locating matching inputs (including iframe elements)...',
    'Uploading candidate resume files...',
    'Typing profile details and selections...',
    'Generating confirmation screenshot...',
    'Wrapping up application state...'
  ];

  useEffect(() => {
    if (isOpen && job) {
      if (job.autofillScreenshot && job.autofillStatus === 'completed') {
        setScreenshotUrl(job.autofillScreenshot);
        setUrlUsed(job.sourceUrl || '');
        setActiveStep(1);
      } else {
        loadFormFields();
      }
    } else {
      // Reset state on close
      setFields([]);
      setUrlUsed('');
      setScreenshotUrl('');
      setError('');
      setActiveStep(0);
    }
  }, [isOpen, job]);

  // Handle ESC close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !submitting && !loading) onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, submitting, loading]);

  const loadFormFields = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${BACKEND}/jobs/${job._id}/form-fields`, {
        withCredentials: true
      });
      setFields(res.data.fields || []);
      setUrlUsed(res.data.urlUsed || job.sourceUrl || '');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to scan the job application page form fields.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (id, val) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, mappedValue: val } : f));
  };

  const handleAutofillSubmit = async () => {
    setSubmitting(true);
    setError('');
    
    // Cycle loading messages for visuals
    let msgIndex = 0;
    setLoadingMessage(fillProgressMessages[0]);
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % fillProgressMessages.length;
      setLoadingMessage(fillProgressMessages[msgIndex]);
    }, 2200);

    try {
      const res = await axios.post(`${BACKEND}/jobs/${job._id}/form-fill`, {
        mappings: fields
      }, {
        withCredentials: true,
        timeout: 90000 // Extended timeout for Puppeteer + file uploads
      });

      if (res.data.success) {
        setScreenshotUrl(res.data.screenshotUrl);
        setActiveStep(1);
        if (toast) toast('Application pre-filled and captured successfully!', 'success');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Form filling failed. The site might have blocked requests or contains unresolvable captchas.');
    } finally {
      clearInterval(interval);
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const renderConfidenceBadge = (confidence) => {
    if (confidence >= 80) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          High ({confidence}%)
        </span>
      );
    } else if (confidence >= 50) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          Medium ({confidence}%)
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
          Low ({confidence}%)
        </span>
      );
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <CpuIcon size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                AI Application Autofill Wizard
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {job.companyName} — {job.job}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            disabled={loading || submitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer border-0 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex items-center justify-center border-b border-slate-800/40 bg-slate-900/30 px-6 py-3">
          <div className="flex items-center gap-8 text-xs font-bold font-mono">
            <div className={`flex items-center gap-2 ${activeStep === 0 ? 'text-indigo-400' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${activeStep === 0 ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-700 bg-slate-800'}`}>1</span>
              <span>Review AI Mappings</span>
            </div>
            <div className="w-12 h-px bg-slate-800" />
            <div className={`flex items-center gap-2 ${activeStep === 1 ? 'text-indigo-400' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${activeStep === 1 ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-700 bg-slate-800'}`}>2</span>
              <span>Verification Screenshot</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {error && (
            <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold leading-relaxed flex items-start gap-2.5">
              <span className="text-sm">⚠️</span>
              <div className="flex-1">
                <span className="font-bold block mb-0.5">Autofill Process Issue</span>
                {error}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-pulse">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <span className="font-bold text-slate-350 text-xs uppercase tracking-wider mb-1">
                Scanning Career Portal
              </span>
              <p className="text-[11px] text-slate-450 max-w-sm text-center">
                Puppeteer is launching a browser context, locating dynamic selectors, and mapping details to your active resume...
              </p>
            </div>
          ) : submitting ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
              <span className="font-bold text-slate-350 text-xs uppercase tracking-wider mb-2 animate-pulse">
                Pre-Filling Application Forms
              </span>
              <div className="px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-800 text-[11px] text-indigo-400 font-semibold font-mono tracking-wide">
                {loadingMessage}
              </div>
              <p className="text-[10px] text-slate-500 max-w-xs text-center mt-3">
                This takes up to 45 seconds for script rendering and screenshot captures.
              </p>
            </div>
          ) : activeStep === 0 ? (
            <div className="space-y-6">
              
              {/* Sandbox URL Indicator */}
              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800/80 flex items-center justify-between gap-4 text-xs font-semibold">
                <div className="flex items-center gap-2 text-slate-450 min-w-0">
                  <span className="flex-shrink-0">🌐</span>
                  <span className="text-[11px] font-mono truncate">{urlUsed}</span>
                </div>
                {urlUsed.includes('mock-application-form.html') && (
                  <span className="flex-shrink-0 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                    Sandbox Mode
                  </span>
                )}
              </div>

              {/* Mapped Fields List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                    Form Mappings ({fields.length} Scraped Elements)
                  </h4>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Values can be edited before submitting
                  </span>
                </div>

                <div className="divide-y divide-slate-800/50 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/20">
                  {fields.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No input fields detected on page form. Try verifying the URL.
                    </div>
                  ) : (
                    fields.map((field) => (
                      <div key={field.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4 transition-colors hover:bg-slate-800/10">
                        {/* Label & Details */}
                        <div className="md:w-1/3 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-200">
                              {field.label || field.name || 'Unnamed Field'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-mono font-bold uppercase">
                              {field.type}
                            </span>
                          </div>
                          {field.reason && (
                            <p className="text-[10px] text-slate-500 font-medium">
                              {field.reason}
                            </p>
                          )}
                        </div>

                        {/* Input Value Editor */}
                        <div className="flex-1 min-w-0">
                          {field.type === 'select' ? (
                            <select
                              value={field.mappedValue}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200 font-semibold font-mono"
                            >
                              <option value="">Select...</option>
                              {field.options?.map((opt, oIdx) => (
                                <option key={oIdx} value={opt.value}>
                                  {opt.text || opt.value}
                                </option>
                              ))}
                            </select>
                          ) : field.type === 'textarea' ? (
                            <textarea
                              rows={2}
                              value={field.mappedValue}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200 font-semibold"
                            />
                          ) : field.type === 'file' ? (
                            <div className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-350">
                                📄 {field.mappedValue === '[RESUME_FILE]' ? `${user?.resumeFileName || 'Primary_Resume.pdf'}` : 'Cover_Letter.pdf'}
                              </span>
                              <span className="text-[10px] text-indigo-400 font-mono uppercase">
                                File Auto-Upload
                              </span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={field.mappedValue}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200 font-semibold"
                            />
                          )}
                        </div>

                        {/* Confidence Badge */}
                        <div className="flex-shrink-0 md:w-28 flex items-center md:justify-end">
                          {renderConfidenceBadge(field.confidence)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Success Alert */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold leading-relaxed flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/20">
                  <ShieldCheckIcon size={16} />
                </div>
                <div>
                  <span className="font-bold block text-sm">Autofill Completed Successfully!</span>
                  Puppeteer successfully pre-populated form inputs and captured the form state below.
                </div>
              </div>

              {/* Simulated Browser Frame for Screenshot */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                    Verification Screenshot (Live State)
                  </h4>
                  <a
                    href={`${BACKEND}${screenshotUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-350 transition-colors"
                  >
                    Open Image in New Tab <ExternalLinkIcon size={10} />
                  </a>
                </div>

                <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-lg bg-slate-950/40">
                  {/* Browser top-bar */}
                  <div className="flex items-center px-4 py-2.5 bg-slate-800 border-b border-slate-800/80 gap-3">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                    </div>
                    <div className="flex-1 max-w-md mx-auto py-1 px-3 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-450 truncate text-center">
                      {urlUsed}
                    </div>
                  </div>

                  {/* Image Display */}
                  <div className="bg-slate-900 flex justify-center p-2 max-h-[480px] overflow-y-auto">
                    <img
                      src={`${BACKEND}${screenshotUrl}`}
                      alt="Form Fill Snapshot"
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
          <div className="text-[10px] text-slate-500 font-semibold font-mono uppercase">
            {activeStep === 0 ? 'Verification Phase' : 'Verification Complete'}
          </div>

          <div className="flex items-center gap-3">
            {activeStep === 0 ? (
              <>
                <button
                  onClick={onClose}
                  disabled={loading || submitting}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-350 hover:bg-slate-800/60 font-bold text-xs transition-colors cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAutofillSubmit}
                  disabled={loading || submitting || fields.length === 0}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-650/15 hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed border-0 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Submit & Autofill Form</span>
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-650/15 hover:shadow-lg transition-all border-0 cursor-pointer"
              >
                Close & Return
              </button>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default AutoFormFillPreview;
