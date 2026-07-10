import React, { useState } from 'react';
import PublicLayout from './PublicLayout';
import Hero3D from './Hero3D';

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

// ─── Small building blocks ────────────────────────────────────────────────────

const FloatingChip = ({ className, delay, children }) => (
  <div
    className={`absolute z-10 animate-float bg-bg-card/90 backdrop-blur-md border border-border-card rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-2.5 ${className}`}
    style={{ animationDelay: delay }}
  >
    {children}
  </div>
);

const FeatureCard = ({ icon, title, description, badge }) => (
  <div className="group bg-bg-card/80 backdrop-blur-sm border border-border-card rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:border-brand-primary/40 hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-brand-primary/5">
    <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
      {icon}
    </div>
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="font-bold text-text-main text-base">{title}</h3>
        {badge && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-text-muted leading-relaxed">{description}</p>
    </div>
  </div>
);

const marqueeItems = [
  'ATS Score Rings', 'AI Cover Letters', 'Gmail & Outlook Outreach', 'Open & Click Tracking',
  'WYSIWYG Resume Builder', 'Voice Interview Practice', 'Kanban Job Board', 'Chrome Extension Import',
  'AI Suggested Replies', 'Salary Negotiation', 'Referral Rewards', 'PDF & DOCX Export',
];

// ─── Page ────────────────────────────────────────────────────────────────────

const HomePage = ({ isDark, onToggleTheme }) => {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev % 4) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      num: '01',
      title: 'Upload & Parse',
      desc: 'Drop your CV in any format — PDF, DOCX, even a photo. Gemini AI extracts structured experience, skills, and education into a clean editable profile.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Match JD & Score',
      desc: 'Paste or import a job description. Get a color-coded ATS compatibility ring and keyword gap analysis so you know exactly what to optimize before applying.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Send Direct Outreach',
      desc: 'Generate a tailored cover letter with tone and length sliders, then send it from your own Gmail or Outlook — resume attached, opens and clicks tracked live.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
      ),
    },
    {
      num: '04',
      title: 'Prep & Practice',
      desc: 'Get 8 tailored interview questions per job. Answer in writing or out loud — the AI grades pacing, filler words, and substance, then shows a model answer.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      ),
    },
  ];

  return (
    <PublicLayout isDark={isDark} onToggleTheme={onToggleTheme}>
      <div className="relative overflow-x-hidden">

      <main className="max-w-7xl mx-auto px-6 pt-10 pb-24 relative z-10">

        {/* ─── HERO ─── */}
        <section className="grid lg:grid-cols-2 gap-12 items-center mb-20 min-h-[560px]">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-brand-primary/10 text-brand-primary mb-6 border border-brand-primary/20">
              <span className="w-2 h-2 rounded-full bg-brand-accent shrink-0 animate-pulse" />
              <span>AI Outreach Engine v2.0 is Live</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.08] text-text-main">
              Your entire job hunt,{' '}
              <span className="text-gradient">run by AI.</span>
            </h1>

            <p className="text-base md:text-lg text-text-muted mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Upload your resume once. RecoCareer.ai scores you against every job description,
              rebuilds your resume, writes the cover letter, sends outreach from your own inbox —
              and tells you the second a recruiter opens it.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4 mb-10">
              <button
                onClick={() => setLoginModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/25 btn-tactile text-sm"
              >
                Get Started for Free
              </button>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold border border-border-card bg-bg-card/80 backdrop-blur-sm text-text-main hover:bg-bg-card-hover btn-tactile text-sm flex items-center justify-center gap-2"
              >
                See how it works
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-3 text-xs text-text-muted font-medium">
              <div className="flex items-center gap-1.5"><GoogleIcon /> Google</div>
              <span className="text-border-card">·</span>
              <div className="flex items-center gap-1.5"><MicrosoftIcon /> Microsoft</div>
              <span className="text-border-card">·</span>
              <span>One-click sign in, no passwords stored</span>
            </div>
          </div>

          {/* 3D visual with floating stat chips */}
          <div className="relative hidden md:block">
            <Hero3D isDark={isDark} />

            <FloatingChip className="top-[12%] left-[2%]" delay="0s">
              <div className="w-8 h-8 rounded-full border-[3px] border-emerald-500 flex items-center justify-center text-[9px] font-extrabold text-emerald-500">92</div>
              <div>
                <div className="text-[11px] font-bold text-text-main leading-tight">ATS Match Score</div>
                <div className="text-[10px] text-text-muted">vs. Senior React Engineer</div>
              </div>
            </FloatingChip>

            <FloatingChip className="top-[55%] right-[0%]" delay="1.1s">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-text-main leading-tight">Email opened</div>
                <div className="text-[10px] text-text-muted">Recruiter @ Stripe · 2m ago</div>
              </div>
            </FloatingChip>

            <FloatingChip className="bottom-[6%] left-[14%]" delay="2.2s">
              <svg className="w-4 h-4 text-brand-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-[11px] font-bold text-text-main leading-tight">Interview scheduled</div>
                <div className="text-[10px] text-text-muted">AI reply drafted &amp; sent</div>
              </div>
            </FloatingChip>
          </div>
        </section>

        {/* ─── SOCIAL PROOF STATS ─── */}
        <section className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { num: '10k+', label: 'Outreach Emails Sent' },
              { num: '85%', label: 'Response Rate Uplift' },
              { num: '350+', label: 'Pro Members' },
              { num: '4.9/5', label: 'User Satisfaction' },
            ].map(({ num, label }) => (
              <div key={label} className="bg-bg-card/80 backdrop-blur-sm border border-border-card rounded-2xl p-4 text-center shadow-sm">
                <div className="text-2xl font-extrabold text-gradient">{num}</div>
                <div className="text-[11px] font-bold text-text-muted mt-1">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CAPABILITY MARQUEE ─── */}
        <section className="mb-28 -mx-6 overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="flex w-max animate-marquee gap-3">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span
                key={i}
                className="whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-bold border border-border-card bg-bg-card/70 backdrop-blur-sm text-text-muted flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section id="how-it-works" className="mb-28 scroll-mt-24">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 mb-4">The Pipeline</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-text-main mb-3">From resume to interview in 4 steps</h2>
            <p className="text-base text-text-muted max-w-lg mx-auto leading-relaxed">
              One end-to-end pipeline handles everything — parsing, matching, outreach, tracking, and prep.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
            {steps.map(({ num, title, desc, icon }) => {
              const active = activeStep === parseInt(num);
              return (
                <div
                  key={num}
                  onClick={() => setActiveStep(parseInt(num))}
                  className={`relative overflow-hidden bg-bg-card/80 backdrop-blur-sm border rounded-2xl p-6 flex gap-5 items-start cursor-pointer transition-all duration-300 btn-tactile ${
                    active ? 'border-brand-primary ring-2 ring-brand-primary/20 shadow-lg shadow-brand-primary/10' : 'border-border-card opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-colors duration-300 ${
                    active ? 'bg-brand-primary text-white' : 'bg-brand-primary/10 text-brand-primary'
                  }`}>
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-brand-primary">{num}</span>
                      <h3 className="font-bold text-text-main text-base leading-tight">{title}</h3>
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
                  </div>

                  {/* Auto-advance progress bar */}
                  {active && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary/15">
                      <div className="h-full bg-brand-primary origin-left" style={{ animation: 'stepProgress 4s linear forwards' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <style>{`@keyframes stepProgress { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
        </section>

        {/* ─── FEATURES GRID ─── */}
        <section className="mb-28">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-text-main mb-3">Everything the grind used to take, automated</h2>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              Nine tools that used to be nine tabs. RecoCareer.ai packages the whole workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              }
              title="WYSIWYG Resume Builder"
              description="Edit directly on physically-scaled A4 pages with a synchronous page-break engine, debounced auto-save, and three switchable templates. Export pixel-perfect PDF or editable DOCX."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              }
              title="ATS Compatibility Scoring"
              description="A color-coded match ring compares your primary resume against each saved job description, with keyword gap analysis so you optimize before you apply."
              badge="Gemini AI"
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              title="Direct Recruiter Outreach"
              description="Cover letters tuned with tone and length sliders, sent from your own Gmail or Outlook with your resume attached. Automated polite follow-ups if there's no reply."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
              title="Open & Click Tracking"
              description="A tracking pixel and wrapped links tell you the moment a recruiter opens your email or clicks your portfolio — your Kanban board updates in real time."
              badge="Real-time"
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              }
              title="Voice Interview Practice"
              description="Answer 8 JD-tailored questions out loud. Real-time speech analysis grades pacing, filler words, and substance — then shows you the model answer."
              badge="Speech AI"
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              }
              title="Recruiter Inbox + AI Replies"
              description="A thread-style inbox logs every recruiter conversation. AI reads the latest message and drafts the reply — accept an interview slot or negotiate salary in one click."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              }
              title="Chrome Extension Scraper"
              description="One click while browsing LinkedIn or Indeed beams the full job posting — title, company, recruiter contact — straight into your dashboard."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              }
              title="Kanban Board & Analytics"
              description="Drag applications through Pending → Sent → Opened → Replied → Interviewing. A live funnel chart shows exactly where your pipeline leaks."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Referral Rewards"
              description="Every account gets a personal referral link with live click and conversion analytics. Share it and earn as friends upgrade to Pro."
            />
          </div>
        </section>

        {/* ─── UNDER THE HOOD ─── */}
        <section className="mb-28 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold text-brand-accent bg-brand-accent/10 border border-brand-accent/20 mb-4">Under the Hood</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-text-main mb-3">Built like infrastructure, not a toy</h2>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              The engineering that keeps your data safe and your emails landing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: 'OAuth 2.0 Only',
                desc: 'Sign in with Google or Microsoft. No passwords are ever created, stored, or managed. Sessions live in HTTP-only JWT cookies.',
                icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
              },
              {
                title: 'AES-256-GCM Encryption',
                desc: 'Payment gateway credentials are symmetrically encrypted server-side before storage. Raw keys never leave the vault in plain text.',
                icon: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
              },
              {
                title: 'Regional Payment Routing',
                desc: 'Geolocation-aware checkout serves Razorpay for India (INR) and Stripe internationally (USD), with webhook-driven subscription sync.',
                icon: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
              },
              {
                title: 'Headless PDF Engine',
                desc: 'Resume exports render through a headless browser with a deterministic style-matching pipeline — what you see on screen is what prints.',
                icon: <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
              },
            ].map(({ title, desc, icon }) => (
              <div key={title} className="bg-bg-card/80 backdrop-blur-sm border border-border-card rounded-2xl p-6 hover:border-brand-accent/40 transition-colors duration-300">
                <svg className="w-6 h-6 text-brand-accent mb-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  {icon}
                </svg>
                <h3 className="font-bold text-text-main text-sm mb-2">{title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="max-w-4xl mx-auto">
          <div className="gradient-border-card p-8 md:p-12 text-center shadow-xl">
            <h2 className="text-2xl md:text-4xl font-extrabold mb-4 text-text-main">
              Stop applying manually. <br /> Start landing offers.
            </h2>
            <p className="text-sm md:text-base text-text-muted max-w-xl mx-auto mb-8 leading-relaxed">
              Join hundreds of job seekers who streamlined their applications, boosted their
              response rates, and secured more interviews.
            </p>
            <button
              onClick={() => setLoginModalOpen(true)}
              className="px-8 py-4 rounded-xl font-bold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/20 btn-tactile text-sm"
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setLoginModalOpen(false)}
          />

          <div className="relative w-full max-w-md bg-bg-card border border-border-card rounded-2xl p-8 z-10 animate-fade-in shadow-2xl">
            <button
              onClick={() => setLoginModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-bg-card-hover transition-all btn-tactile"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center mb-8">
              <h3 className="text-xl font-bold text-text-main">Let's lock in.</h3>
              <p className="text-xs text-text-muted mt-1 max-w-[260px]">
                Sign in using your Google or Microsoft email to begin parsing resumes &amp; tracking outreaches.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { window.location.href = `${BACKEND}/auth/google`; }}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border border-border-card bg-bg-app text-text-main text-sm font-bold btn-tactile"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <button
                onClick={() => { window.location.href = `${BACKEND}/auth/microsoft`; }}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border border-border-card bg-bg-app text-text-main text-sm font-bold btn-tactile"
              >
                <MicrosoftIcon />
                Continue with Microsoft
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-[10px] leading-relaxed text-text-muted">
                RecoCareer.ai securely requests <span className="font-bold text-text-main">gmail.send</span> / <span className="font-bold text-text-main">Mail.Send</span> to send customized outreach directly from your inbox. We never save your passwords.
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
