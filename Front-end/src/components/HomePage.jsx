import React, { useState } from 'react';
import { SunIcon, MoonIcon } from './Icons';
import { Link } from 'react-router-dom';
import PublicLayout from './PublicLayout';

const BACKEND = 'http://localhost:3000';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 23 23" aria-hidden="true" className="shrink-0">
    <rect x="0" y="0" width="10.5" height="10.5" fill="#f25022" />
    <rect x="11.5" y="0" width="10.5" height="10.5" fill="#7fba00" />
    <rect x="0" y="11.5" width="10.5" height="10.5" fill="#00a4ef" />
    <rect x="11.5" y="11.5" width="10.5" height="10.5" fill="#ffb900" />
  </svg>
);

const FeatureCard = ({ icon, title, description, badge }) => (
  <div className="group neo-card p-6 flex flex-col gap-4 cursor-default">
    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">{title}</h3>
        {badge && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold neo-card-inset text-indigo-600 dark:text-indigo-400">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  </div>
);

const StepBubble = ({ number, title, desc, active }) => (
  <div className={`flex flex-col items-center text-center p-5 rounded-2xl transition-all duration-300 ${active ? 'neo-card scale-105' : 'neo-card-inset opacity-70 hover:opacity-100'}`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-3 ${active ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
      {number}
    </div>
    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">{title}</h4>
    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[160px]">{desc}</p>
  </div>
);

const HomePage = ({ isDark, onToggleTheme }) => {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // Auto cycling how-it-works tabs for demonstration micro-animation
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev % 4) + 1);
    }, 4005);
    return () => clearInterval(interval);
  }, []);

  return (
    <PublicLayout isDark={isDark} onToggleTheme={onToggleTheme}>
      <div className="relative overflow-x-hidden">

      {/* Decorative Blob Elements */}
      <div className="absolute top-[-5%] left-[5%] w-[35rem] h-[35rem] rounded-full bg-indigo-500/10 dark:bg-indigo-500/8 blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-purple-500/8 dark:bg-purple-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[5%] left-[-10%] w-[35rem] h-[35rem] rounded-full bg-cyan-500/6 dark:bg-cyan-500/8 blur-[130px] pointer-events-none" />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-6 pt-14 pb-24 relative z-10">
        
        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto mb-24">
          {/* Version Capsule Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 mb-6 border border-indigo-500/20 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0" />
            <span>AI Outreach Engine v2.0 is Live</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Hack your job applications. <br className="hidden md:block"/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              No cap, just interviews.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base md:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload your resume once. Let AI match requirements, build optimized resumes, write custom cover letters, and send direct outreach from your own inbox.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button 
              onClick={() => setLoginModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-xl shadow-indigo-500/25 hover:scale-103 active:scale-97 transition-all duration-200"
            >
              Get Started for Free
            </button>
            <a
              href="https://github.com/Mohd2002Monish/Job-apply"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-103 active:scale-97 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
              </svg>
              Star on GitHub
            </a>
          </div>

          {/* Social Proof/Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { num: '10k+', label: 'Outreach Emails Sent', from: 'from-indigo-500', to: 'to-purple-500' },
              { num: '85%', label: 'Response Rate Uplift', from: 'from-purple-500', to: 'to-pink-500' },
              { num: '350+', label: 'Pro Members', from: 'from-pink-500', to: 'to-cyan-500' },
              { num: '4.9/5', label: 'User Satisfaction', from: 'from-cyan-500', to: 'to-indigo-500' },
            ].map(({ num, label, from, to }) => (
              <div key={label} className="neo-card p-4 text-center">
                <div className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${from} ${to}`}>{num}</div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mb-28">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold text-indigo-600 dark:text-indigo-400 neo-card-inset mb-4">Step-by-step</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-50 mb-3">How it works</h2>
            <p className="text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              Our end-to-end pipeline handles everything from tracking to landing your dream interview.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                num: '01',
                title: 'Upload & Parse',
                desc: 'Drag and drop your CV. Our AI instantly extracts structured work experience, skills, and education into a clean profile.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                ),
                gradient: 'from-indigo-500 to-blue-500',
                active: activeStep === 1,
              },
              {
                num: '02',
                title: 'Match JD & Score',
                desc: 'Paste a job description. Get a color-coded ATS compatibility score and keyword gap analysis so you know exactly what to optimize.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                ),
                gradient: 'from-violet-500 to-purple-500',
                active: activeStep === 2,
              },
              {
                num: '03',
                title: 'Send Direct Outreach',
                desc: 'Generate a tailored cover letter and outreach email in seconds. Send directly from your own Gmail or Outlook with one click.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.09h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69A16 16 0 0 0 16 16.73l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 23.73 18z"/>
                  </svg>
                ),
                gradient: 'from-pink-500 to-rose-500',
                active: activeStep === 3,
              },
              {
                num: '04',
                title: 'Prep & Practice',
                desc: 'Get 8 tailored interview questions based on the job description. Practice writing or speaking your answers and receive AI-graded feedback.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                ),
                gradient: 'from-cyan-500 to-teal-500',
                active: activeStep === 4,
              },
            ].map(({ num, title, desc, icon, gradient, active }) => (
              <div
                key={num}
                onClick={() => setActiveStep(parseInt(num))}
                className={`neo-card p-6 flex gap-5 items-start cursor-pointer transition-all duration-300 ${active ? 'ring-2 ring-indigo-400/40 dark:ring-indigo-500/30' : 'opacity-75 hover:opacity-100'}`}
              >
                {/* Icon circle */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
                  {icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${gradient}`}>{num}</span>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">{title}</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>

                  {active && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 animate-fade-in">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      Active step
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {[1, 2, 3, 4].map(i => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`rounded-full transition-all duration-300 ${
                  activeStep === i
                    ? 'w-6 h-2.5 bg-gradient-to-r from-indigo-500 to-purple-500'
                    : 'w-2.5 h-2.5 neo-card-inset hover:opacity-80'
                }`}
                aria-label={`Step ${i}`}
              />
            ))}
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section className="mb-28">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Core Features Built for Speed</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Skip the manual application grind. RecoCareer.ai packages everything you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard 
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              }
              title="WYSIWYG Resume Editor"
              description="Physically scaled A4 layouts with real-time auto-saving and page-break optimization. Choose from 3 premium style structures."
            />
            
            <FeatureCard 
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              }
              title="ATS Compatibility Matching"
              description="Get a color-coded match percentage ring comparing your resume directly against the job requirements. Optimize before applying."
              badge="Gemini AI"
            />
            
            <FeatureCard 
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              title="Direct Recruiter Outreach"
              description="Generate custom cover letters tailored with tone and length sliders. Dispatch emails directly with your primary resume attached."
            />

            <FeatureCard 
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
              title="Open & Click Tracking"
              description="A invisible tracking pixel tells you exactly when the recruiter opens your application or clicks on your portfolio link."
              badge="Real-time"
            />

            <FeatureCard 
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              }
              title="Interview Simulator Prep"
              description="Receive 8 tailored situational questions based on the active JD. Write your answers and get grades plus model feedback."
            />

            <FeatureCard 
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              }
              title="Chrome Extension Scraper"
              description="Import job postings directly while browsing LinkedIn or Indeed with a single click. Keep your dashboard synced."
            />
          </div>
        </section>

        {/* BOTTOM FINAL CTA CARD */}
        <section className="max-w-4xl mx-auto">
          <div className="neo-card p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-4xl font-extrabold mb-4 text-slate-900 dark:text-slate-50">
              Stop applying manually. <br /> Start landing offers.
            </h2>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
              Join hundreds of job seekers who streamlined their applications, boosted their response rates, and secured more interviews.
            </p>
            <button 
              onClick={() => setLoginModalOpen(true)}
              className="px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-xl shadow-indigo-500/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              Sign Up For Free Now
            </button>
          </div>
        </section>
      </main>

      {/* ─── LOGIN MODAL ─── */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-[6px] transition-opacity duration-300"
            onClick={() => setLoginModalOpen(false)}
          />
          
          <div className="relative w-full max-w-md neo-card p-8 z-10 animate-fade-in">
            <button 
              onClick={() => setLoginModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center mb-8">
              <img 
                src={isDark ? '/logo_desktop_dark.png' : '/logo_desktop.png'} 
                alt="RecoCareer.ai" 
                className="h-9 w-auto object-contain mb-4" 
              />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Let's lock in.</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[260px]">
                Sign in using your Google or Microsoft email to begin parsing resumes &amp; tracking outreaches.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { window.location.href = `${BACKEND}/auth/google`; }}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl neo-btn text-slate-800 dark:text-slate-100 text-sm font-semibold cursor-pointer"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <button
                onClick={() => { window.location.href = `${BACKEND}/auth/microsoft`; }}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl neo-btn text-slate-800 dark:text-slate-100 text-sm font-semibold cursor-pointer"
              >
                <MicrosoftIcon />
                Continue with Microsoft
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                RecoCareer.ai securely requests <span className="font-semibold text-slate-500 dark:text-slate-450">gmail.send</span> / <span className="font-semibold text-slate-500 dark:text-slate-450">Mail.Send</span> to send customized outreach directly from your inbox. We never save your passwords.
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </PublicLayout>
  );
};

export default HomePage;
