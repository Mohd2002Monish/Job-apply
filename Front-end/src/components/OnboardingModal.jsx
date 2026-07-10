import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setAuth } from '../store/authSlice';

const BACKEND = 'http://localhost:3000';

const EXPERIENCE_LEVELS = [
  { id: 'fresher', title: 'Fresher', desc: 'Starting my career (0 years)' },
  { id: 'junior', title: 'Junior', desc: 'Early career (1-3 years)' },
  { id: 'mid', title: 'Mid-Level', desc: 'Experienced (3-5 years)' },
  { id: 'senior', title: 'Senior', desc: 'Expert/Lead (5+ years)' }
];

const WORK_STYLES = [
  { id: 'remote', name: 'Remote' },
  { id: 'hybrid', name: 'Hybrid' },
  { id: 'onsite', name: 'On-site' }
];

export default function OnboardingModal({ user, toast }) {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  
  const [step, setStep] = useState(1); // 1: Info/Preferences, 2: Resume Upload
  const [loading, setLoading] = useState(false);
  const [parsingStatus, setParsingStatus] = useState(''); // '', 'uploading', 'parsing', 'success', 'error'
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1 State
  const [name, setName] = useState(user?.name || '');
  const [experienceLevel, setExperienceLevel] = useState('fresher');
  const [targetRole, setTargetRole] = useState('');
  const [workStyle, setWorkStyle] = useState('remote');
  const [targetLocation, setTargetLocation] = useState('');

  // Step 2 State (Resume File)
  const [resumeFile, setResumeFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!targetRole.trim()) {
      setErrorMsg('Please specify your target job role.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      setErrorMsg('Only PDF, Word, or Image files are allowed.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File size must be under 15MB.');
      return;
    }
    setErrorMsg('');
    setResumeFile(file);
  };

  const submitOnboarding = async (shouldUploadResume = true) => {
    setLoading(true);
    setErrorMsg('');
    setParsingStatus(shouldUploadResume ? 'uploading' : '');

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('experienceLevel', experienceLevel);
    formData.append('targetRole', targetRole.trim());
    formData.append('workStyle', workStyle);
    formData.append('targetLocation', targetLocation.trim());

    if (shouldUploadResume && resumeFile) {
      formData.append('resume', resumeFile);
    }

    try {
      // If we are parsing, update state to show AI is working
      if (shouldUploadResume && resumeFile) {
        setTimeout(() => {
          setParsingStatus('parsing');
        }, 1200);
      }

      const res = await axios.post(`${BACKEND}/auth/onboard`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      if (res.data.success) {
        setParsingStatus('success');
        setTimeout(() => {
          dispatch(setAuth({
            authenticated: true,
            user: res.data.user
          }));
          toast.success('Onboarding completed! Welcome to RecoCareer.ai.');
        }, 800);
      }
    } catch (err) {
      console.error(err);
      setParsingStatus('error');
      setErrorMsg(err.response?.data?.error || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/75 backdrop-blur-[4px] z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white/75 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[32px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200/60 dark:border-zinc-800/60 overflow-hidden animate-fade-in flex flex-col max-h-[95vh] md:max-h-[90vh]">
        
        {/* Progress Bar Header */}
        <div className="w-full bg-slate-100/70 dark:bg-zinc-850/70 h-1.5 flex shrink-0">
          <div className={`h-full bg-indigo-600 transition-all duration-500 ${step === 1 ? 'w-1/2' : 'w-full'}`} />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 min-h-0 scrollbar-thin">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50">Welcome to RecoCareer.ai</h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Let's set up your profile to customize your AI applications experience.</p>
              </div>

              {errorMsg && (
                <div className="p-3 text-xs bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 animate-fade-in font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleNextStep} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50/50 dark:bg-zinc-800/25 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-semibold transition-all"
                    placeholder="Your Full Name"
                  />
                </div>

                {/* Experience Level Cards */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider block">Experience Level</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {EXPERIENCE_LEVELS.map(level => {
                      const isSelected = experienceLevel === level.id;
                      return (
                        <div
                          key={level.id}
                          onClick={() => setExperienceLevel(level.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none text-left flex flex-col justify-center ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-500/5 shadow-md shadow-indigo-500/5'
                              : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 hover:border-slate-350 dark:hover:border-zinc-700'
                          }`}
                        >
                          <span className={`text-xs font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {level.title}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 leading-normal">
                            {level.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Target Role */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider">Target Job Title</label>
                    <input
                      type="text"
                      required
                      value={targetRole}
                      onChange={e => setTargetRole(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs bg-slate-50/50 dark:bg-zinc-800/25 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-semibold transition-all"
                      placeholder="e.g. Software Engineer, React Developer"
                    />
                  </div>

                  {/* Target Location */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider">Preferred Location</label>
                    <input
                      type="text"
                      value={targetLocation}
                      onChange={e => setTargetLocation(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs bg-slate-50/50 dark:bg-zinc-800/25 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-semibold transition-all"
                      placeholder="e.g. New York, Bangalore, Remote"
                    />
                  </div>
                </div>

                {/* Work Style Options */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider block">Preferred Work Setting</label>
                  <div className="flex gap-2">
                    {WORK_STYLES.map(style => {
                      const isSelected = workStyle === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setWorkStyle(style.id)}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/15'
                              : 'bg-slate-50/50 dark:bg-zinc-800/25 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {style.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-zinc-850">
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all border-0 cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50">Upload Your Resume</h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Our AI will extract contact details, experience, skills, and projects instantly.</p>
              </div>

              {errorMsg && (
                <div className="p-3 text-xs bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 animate-fade-in font-medium">
                  {errorMsg}
                </div>
              )}

              {parsingStatus === '' ? (
                /* DRAG AND DROP ZONE */
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-500/5'
                      : 'border-slate-300 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-950/10 hover:border-indigo-400'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  {resumeFile ? (
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{resumeFile.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{(resumeFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setResumeFile(null);
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 mt-2 bg-transparent border-0 cursor-pointer"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag & drop your resume file here</p>
                      <p className="text-[10px] text-slate-450 dark:text-zinc-500">Supports PDF, Word, or Image up to 15MB</p>
                      <span className="inline-block text-[10.5px] text-indigo-600 dark:text-indigo-400 font-bold mt-1 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg">
                        or browse files
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* PARSING PROCESSING STATES */
                <div className="bg-slate-50/50 dark:bg-zinc-950/15 p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-4 text-center">
                  {parsingStatus === 'uploading' && (
                    <>
                      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-250">Uploading Resume</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Transferring file to secure servers...</p>
                      </div>
                    </>
                  )}
                  
                  {parsingStatus === 'parsing' && (
                    <>
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-950 rounded-full" />
                        <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.904-4.473L21 9l-3.473-3.473L9.813 15.904z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 21l3-3m-3 3l-3-3" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-250">AI Analyzing Profile</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Extracting timeline achievements, education, and credentials...</p>
                      </div>
                    </>
                  )}

                  {parsingStatus === 'success' && (
                    <>
                      <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Parsing Completed!</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Profile structured. Entering RecoCareer...</p>
                      </div>
                    </>
                  )}

                  {parsingStatus === 'error' && (
                    <>
                      <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-450">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-rose-600">Structuring Failed</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">You can skip resume upload and fill details later.</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-850">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-250 transition-colors bg-transparent border-0 cursor-pointer disabled:opacity-50"
                >
                  Back
                </button>
                
                <div className="flex gap-2">
                  {/* Skip Option */}
                  {parsingStatus !== 'success' && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => submitOnboarding(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-550 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all cursor-pointer"
                    >
                      Skip Resume Upload
                    </button>
                  )}

                  {/* Parse Action */}
                  {resumeFile && parsingStatus === '' && (
                    <button
                      type="button"
                      onClick={() => submitOnboarding(true)}
                      className="px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all border-0 cursor-pointer"
                    >
                      Analyze & Finish
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
