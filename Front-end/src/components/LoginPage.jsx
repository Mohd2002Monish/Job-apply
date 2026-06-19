import React from 'react';
import { SunIcon, MoonIcon } from './Icons';

const BACKEND = 'http://localhost:3000';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden="true">
    <rect x="0" y="0" width="11" height="11" fill="#f25022" />
    <rect x="12" y="0" width="11" height="11" fill="#7fba00" />
    <rect x="0" y="12" width="11" height="11" fill="#00a4ef" />
    <rect x="12" y="12" width="11" height="11" fill="#ffb900" />
  </svg>
);

const FeatureRow = ({ icon, label }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-zinc-800 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
      {icon}
    </div>
    <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
  </div>
);

const LoginPage = ({ isDark, onToggleTheme }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-200">

      {/* Top-right theme toggle */}
      <div className="fixed top-4 right-4">
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors shadow-sm"
          aria-label="Toggle theme"
        >
          {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </button>
      </div>

      {/* Subtle background gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/25">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
            </svg>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-2">
            Job Apply AI
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Upload your resume, let AI craft personalised<br/>
            application emails sent from your own Gmail.
          </p>
        </div>

        {/* Card */}
        <div className="card p-6 shadow-sm">
          {/* Features */}
          <div className="mb-6">
            <FeatureRow
              label="Upload resume — PDF, DOCX, or image"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              }
            />
            <FeatureRow
              label="AI structures your data and writes emails"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              }
            />
            <FeatureRow
              label="Build resumes from 3 premium templates"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              }
            />
            <FeatureRow
              label="Download as PDF, DOCX, or JPG"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              }
            />
          </div>

          {/* Google sign in */}
          <button
            onClick={() => { window.location.href = `${BACKEND}/auth/google`; }}
            id="google-signin-btn"
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Microsoft sign in */}
          <button
            onClick={() => { window.location.href = `${BACKEND}/auth/microsoft`; }}
            id="microsoft-signin-btn"
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors shadow-sm mt-3"
          >
            <MicrosoftIcon />
            Continue with Microsoft
          </button>

          <p className="mt-4 text-xs text-slate-400 dark:text-zinc-600 text-center leading-relaxed">
            Requires <span className="font-medium text-slate-500 dark:text-zinc-500">gmail.send</span> / <span className="font-medium text-slate-500 dark:text-zinc-500">gmail.readonly</span> (Google) or <span className="font-medium text-slate-500 dark:text-zinc-500">Mail.ReadWrite</span> / <span className="font-medium text-slate-500 dark:text-zinc-500">Mail.Send</span> (Microsoft) permissions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
