import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import LoginPage from './components/LoginPage';
import JobsTable, { useToast, ToastContainer } from './components/JobsTable';
import ResumeUpload from './components/ResumeUpload';
import ResumeBuilder from './components/ResumeBuilder';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import InteractiveBackground from './components/InteractiveBackground';
import JobDiscoverer from './components/JobDiscoverer';
import AdminPanel from './components/AdminPanel';
import { SunIcon, MoonIcon, LogOutIcon, BriefcaseIcon, LayersIcon } from './components/Icons';
import { setAuth, setResumeInfo, setResumesInfo, toggleTheme, setActiveTab, logoutUser } from './store/authSlice';
import './index.css';

const ShieldAlertIcon = ({ size = 15 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const BACKEND = 'http://localhost:3000';
axios.defaults.withCredentials = true;

const TrendingUpIcon = ({ size = 15 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const SearchIcon = ({ size = 15 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// ─── Nav Tab ──────────────────────────────────────────────────────────────────
const NavTab = ({ id, label, Icon, active, badge, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
      active
        ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-zinc-700'
        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
    }`}
  >
    <Icon size={15} />
    {label}
    {badge && (
      <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full" />
    )}
  </button>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const dispatch = useDispatch();
  const { user, resumeName, resumeData, resumes, activeResumeId, isDark, activeTab } = useSelector(state => state.auth);
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [profileModalOpen, setProfileModalOpen] = React.useState(false);
  const [profileName, setProfileName] = React.useState(user?.name || '');
  const [billingLoading, setBillingLoading] = React.useState(false);

  const { toasts, success, error, info } = useToast();
  const toast = { success, error, info };

  // Intercept 1-click import from email digests & Stripe upgrades
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const importScrapedJobId = params.get('importScrapedJobId');
    if (importScrapedJobId) {
      console.log(`Email digest redirect detected: importing job ID ${importScrapedJobId}`);
      axios.post(`${BACKEND}/scraped-jobs/import/${importScrapedJobId}`)
        .then(res => {
          if (res.data.success) {
            toast.success(res.data.message || 'Job successfully tracked!');
            dispatch(setActiveTab('jobs'));
          }
          window.history.replaceState({}, '', '/');
        })
        .catch(err => {
          console.error('Email digest import error:', err);
          toast.error(err.response?.data?.error || 'Failed to import job.');
          window.history.replaceState({}, '', '/');
        });
    }

    const upgradeResult = params.get('upgrade');
    if (upgradeResult === 'success') {
      toast.success('Congratulations! You upgraded to Pro tier successfully.');
      window.history.replaceState({}, '', '/');
      axios.get(`${BACKEND}/auth/status`).then(statusRes => {
        if (statusRes.data.authenticated) {
          dispatch(setAuth({
            authenticated: true,
            user: {
              email: statusRes.data.email,
              name: statusRes.data.name,
              picture: statusRes.data.picture,
              provider: statusRes.data.provider || 'google',
              hasGoogleTokens: statusRes.data.hasGoogleTokens,
              hasMicrosoftTokens: statusRes.data.hasMicrosoftTokens,
              subscriptionTier: statusRes.data.subscriptionTier,
              stripeSubscriptionId: statusRes.data.stripeSubscriptionId,
              aiRequestCount: statusRes.data.aiRequestCount,
              jobCount: statusRes.data.jobCount,
              role: statusRes.data.role || 'user',
              tokenUsage: statusRes.data.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
            },
            resumeName: statusRes.data.resumeName,
            resumeData: statusRes.data.resumeData
          }));
        }
      });
    } else if (upgradeResult === 'cancel') {
      toast.info('Checkout cancelled.');
      window.history.replaceState({}, '', '/');
    }
  }, [user, dispatch]);

  const [profileEmail, setProfileEmail] = React.useState(user?.email || '');
  const [profilePicFile, setProfilePicFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState('');
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [profileError, setProfileError] = React.useState('');
  const [profileSuccess, setProfileSuccess] = React.useState(false);

  const handleUpgrade = async () => {
    setBillingLoading(true);
    setProfileError('');
    try {
      const res = await axios.post(`${BACKEND}/stripe/checkout`, {}, { withCredentials: true });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Failed to redirect to billing portal.');
      setBillingLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setBillingLoading(true);
    setProfileError('');
    try {
      const res = await axios.post(`${BACKEND}/stripe/cancel-subscription`, {}, { withCredentials: true });
      if (res.data.success) {
        const statusRes = await axios.get(`${BACKEND}/auth/status`);
        if (statusRes.data.authenticated) {
          dispatch(setAuth({
            authenticated: true,
            user: {
              email: statusRes.data.email,
              name: statusRes.data.name,
              picture: statusRes.data.picture,
              provider: statusRes.data.provider || 'google',
              hasGoogleTokens: statusRes.data.hasGoogleTokens,
              hasMicrosoftTokens: statusRes.data.hasMicrosoftTokens,
              subscriptionTier: statusRes.data.subscriptionTier,
              stripeSubscriptionId: statusRes.data.stripeSubscriptionId,
              aiRequestCount: statusRes.data.aiRequestCount,
              jobCount: statusRes.data.jobCount
            },
            resumeName: statusRes.data.resumeName,
            resumeData: statusRes.data.resumeData
          }));
        }
        toast.success('Subscription cancelled. Reverted to Free tier.');
      }
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Failed to cancel subscription.');
    } finally {
      setBillingLoading(false);
    }
  };

  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  React.useEffect(() => {
    if (profileModalOpen) {
      axios.get(`${BACKEND}/auth/status`)
        .then(res => {
          if (res.data.authenticated) {
            dispatch(setAuth({
              authenticated: true,
              user: {
                email: res.data.email,
                name: res.data.name,
                picture: res.data.picture,
                provider: res.data.provider || 'google',
                hasGoogleTokens: res.data.hasGoogleTokens,
                hasMicrosoftTokens: res.data.hasMicrosoftTokens,
                subscriptionTier: res.data.subscriptionTier || 'free',
                stripeSubscriptionId: res.data.stripeSubscriptionId || '',
                aiRequestCount: res.data.aiRequestCount || 0,
                jobCount: res.data.jobCount || 0,
                role: res.data.role || 'user',
                tokenUsage: res.data.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
              },
              resumeName: res.data.resumeName || null,
              resumeData: res.data.resumeData || null,
            }));
          }
        })
        .catch(() => {});
    }
  }, [profileModalOpen, dispatch]);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess(false);

    try {
      const formData = new FormData();
      formData.append('name', profileName);
      formData.append('email', profileEmail);
      if (profilePicFile) {
        formData.append('picture', profilePicFile);
      }

      const res = await axios.post(`${BACKEND}/auth/profile/update`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      if (res.data.success) {
        setProfileSuccess(true);
        setProfilePicFile(null);
        setPreviewUrl('');
        
        // Sync Redux
        dispatch(setAuth({
          authenticated: true,
          user: res.data.user,
          resumeName,
          resumeData
        }));

        setTimeout(() => {
          setProfileModalOpen(false);
          setProfileSuccess(false);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      let errorMsg = 'Failed to update profile.';
      if (err.response?.data?.details) {
        errorMsg = Object.entries(err.response.data.details)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      setProfileError(errorMsg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUploadSuccess = (filename, parsedData, updatedResumes, activeId) => {
    dispatch(setResumeInfo({ resumeName: filename, resumeData: parsedData }));
    if (updatedResumes && activeId) {
      dispatch(setResumesInfo({ resumes: updatedResumes, activeResumeId: activeId }));
    } else {
      axios.get(`${BACKEND}/resume/list`)
        .then(r => {
          dispatch(setResumesInfo({ resumes: r.data.resumes, activeResumeId: r.data.activeResumeId }));
        });
    }
    if (parsedData) {
      setTimeout(() => dispatch(setActiveTab('builder')), 900);
    }
  };

  const handleSelectResume = async (e) => {
    const id = e.target.value;
    try {
      const res = await axios.post(`${BACKEND}/resume/select`, { id });
      dispatch(setAuth({
        authenticated: true,
        user,
        resumeName: res.data.resumeFileName,
        resumeData: res.data.resumeData
      }));
      dispatch(setResumesInfo({ resumes, activeResumeId: id }));
    } catch (err) {
      console.error('Failed to switch resume:', err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${BACKEND}/auth/logout`);
    } catch (_) {}
    dispatch(logoutUser());
  };

  return (
    <div className="min-h-screen transition-colors duration-200">
      {/* Topbar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-600/30">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              RecoCareer.ai
            </span>
          </div>

          {/* Center: Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/60 rounded-xl p-1">
            <NavTab id="jobs" label="Outreach" Icon={BriefcaseIcon} active={activeTab === 'jobs'} onClick={(id) => dispatch(setActiveTab(id))} />
            <NavTab id="discover" label="Discover" Icon={SearchIcon} active={activeTab === 'discover'} onClick={(id) => dispatch(setActiveTab(id))} />
            <NavTab id="builder" label="Builder" Icon={LayersIcon} active={activeTab === 'builder'} badge={!!resumeData} onClick={(id) => dispatch(setActiveTab(id))} />
            <NavTab id="analytics" label="Analytics" Icon={TrendingUpIcon} active={activeTab === 'analytics'} onClick={(id) => dispatch(setActiveTab(id))} />
            {user?.role === 'owner' && (
              <NavTab id="admin" label="Admin" Icon={ShieldAlertIcon} active={activeTab === 'admin'} onClick={(id) => dispatch(setActiveTab(id))} />
            )}
          </nav>

          {/* Right: User + Controls */}
          <div className="flex items-center gap-2">
            {resumes && resumes.length > 0 && (
              <div className="relative mr-1.5 flex items-center gap-1.5">
                <select
                  value={activeResumeId}
                  onChange={handleSelectResume}
                  className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-semibold px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                  id="resume-selector-dropdown"
                >
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 text-[11px] font-semibold px-2 py-1.5 rounded-lg text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 flex items-center gap-1 transition-all"
                  title="Upload or manage resumes"
                  id="header-resume-manage-btn"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Manage
                </button>
              </div>
            )}

            <button
              onClick={() => setProfileModalOpen(true)}
              className="relative rounded-full hover:ring-2 hover:ring-indigo-500 focus:outline-none transition-all cursor-pointer shrink-0"
              title="Profile settings"
              id="header-profile-btn"
            >
              {user?.picture ? (
                <img
                  src={user.picture.startsWith('http') ? user.picture : `${BACKEND}${user.picture}`}
                  alt={user.name}
                  className="w-7 h-7 rounded-full border border-slate-200 dark:border-zinc-700 shrink-0 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-xs font-semibold text-indigo-700 dark:text-indigo-400 shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </button>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">{user?.name}</p>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                  {user?.provider || 'google'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-none mt-1">{user?.email}</p>
            </div>

            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => dispatch(toggleTheme())}
                className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <SunIcon size={15} /> : <MoonIcon size={15} />}
              </button>
              <button
                onClick={handleLogout}
                id="logout-btn"
                className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                aria-label="Sign out"
              >
                <LogOutIcon size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-5 py-6">
        {!resumeName && activeTab !== 'admin' && (
          <ResumeUpload
            user={user}
            resumeName={resumeName}
            resumeData={resumeData}
            onUploadSuccess={handleUploadSuccess}
          />
        )}

        {activeTab === 'jobs' && <JobsTable user={user} resumeName={resumeName} />}
        {activeTab === 'discover' && <JobDiscoverer toast={toast} />}
        {activeTab === 'builder' && <ResumeBuilder user={user} initialResumeData={resumeData} />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'admin' && user?.role === 'owner' && <AdminPanel />}
      </main>

      {/* Resume Upload Modal */}
      {uploadModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setUploadModalOpen(false)}
        >
          {/* Modal content */}
          <div className="relative w-full max-w-lg animate-fade-in">
            <button
              onClick={() => setUploadModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors shadow-sm"
              aria-label="Close dialog"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <ResumeUpload
              user={user}
              resumeName={resumeName}
              resumeData={resumeData}
              className="mb-0"
              onUploadSuccess={(filename, parsedData, updatedResumes, activeId) => {
                handleUploadSuccess(filename, parsedData, updatedResumes, activeId);
                setUploadModalOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {profileModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-fade-in animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && !savingProfile && setProfileModalOpen(false)}
        >
          {/* Modal content */}
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden animate-fade-in pointer-events-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Profile Settings</h2>
              <button
                type="button"
                disabled={savingProfile}
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                aria-label="Close dialog"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
              {/* Picture Upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 dark:border-zinc-700 group-hover:border-indigo-500 transition-colors bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : user?.picture ? (
                      <img src={user.picture.startsWith('http') ? user.picture : `${BACKEND}${user.picture}`} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-slate-400">{user?.name?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleProfilePicChange}
                    id="profile-pic-input"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                >
                  Change Photo
                </button>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="input"
                  placeholder="Your Name"
                  id="profile-name-input"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="input"
                  placeholder="your.email@example.com"
                  id="profile-email-input"
                />
              </div>

              {/* Billing & Subscriptions */}
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
                    Subscription & Usage
                  </h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    user?.subscriptionTier === 'pro'
                      ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/30'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                  }`}>
                    {user?.subscriptionTier === 'pro' ? 'Pro Tier' : 'Free Tier'}
                  </span>
                </div>

                {/* Usage Metrics */}
                <div className="space-y-2.5 bg-slate-50 dark:bg-zinc-800/30 p-3 rounded-xl border border-slate-100 dark:border-zinc-800/50">
                  {/* Tracked Jobs Limit */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-zinc-400">Jobs Tracked</span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                        {user?.jobCount || 0} / {user?.subscriptionTier === 'pro' ? '∞' : '5'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${user?.subscriptionTier === 'pro' ? 100 : Math.min(((user?.jobCount || 0) / 5) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* AI Features Limit */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-zinc-400">AI Features Usage</span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                        {user?.aiRequestCount || 0} / {user?.subscriptionTier === 'pro' ? '∞' : '3'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-violet-600 dark:bg-violet-500 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${user?.subscriptionTier === 'pro' ? 100 : Math.min(((user?.aiRequestCount || 0) / 3) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription Action Trigger */}
                <div className="pt-1 flex items-center justify-between">
                  {user?.subscriptionTier === 'pro' ? (
                    <>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-[200px]">
                        You have unlimited access to all features. Need to downgrade?
                      </p>
                      <button
                        type="button"
                        disabled={billingLoading}
                        onClick={handleCancelSubscription}
                        className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {billingLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : null}
                        Cancel Pro
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-[200px]">
                        Get unlimited jobs, resumes, search imports, and AI tailoring.
                      </p>
                      <button
                        type="button"
                        disabled={billingLoading}
                        onClick={handleUpgrade}
                        className="text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3.5 py-1.5 rounded-lg shadow-sm shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {billingLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : null}
                        Upgrade to Pro
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Error Box */}
              {profileError && (
                <div className="p-3 text-xs bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 animate-fade-in">
                  {profileError}
                </div>
              )}

              {/* Success Box */}
              {profileSuccess && (
                <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 animate-fade-in">
                  Profile updated successfully!
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={() => setProfileModalOpen(false)}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  id="profile-save-btn"
                >
                  {savingProfile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} />
    </div>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  const dispatch = useDispatch();
  const { authenticated, isDark } = useSelector(state => state.auth);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authResult = params.get('auth');

    if (authResult === 'success') {
      const user = {
        email: params.get('email') || '',
        name: params.get('name') || '',
        picture: params.get('picture') || '',
        provider: params.get('provider') || 'google',
      };
      if (user.email) {
        dispatch(setAuth({ authenticated: true, user, resumeName: null, resumeData: null }));
        window.history.replaceState({}, '', '/');
      }
    } else if (authResult === 'error') {
      const reason = params.get('reason') || 'unknown';
      window.history.replaceState({}, '', '/');
      setTimeout(() => alert(`Sign-in failed: ${reason}`), 100);
    }

    axios
      .get(`${BACKEND}/auth/status`, { timeout: 4000 })
      .then(res => {
        if (!res.data.authenticated) {
          dispatch(setAuth({ authenticated: false, user: null, resumeName: null, resumeData: null }));
        } else {
          const stored = localStorage.getItem('jaa_user');
          let name = res.data.name || '';
          let email = res.data.email || '';
          let picture = res.data.picture || '';
          
          if (stored) {
            try {
              const u = JSON.parse(stored);
              name = name || u.name || '';
              email = email || u.email || '';
              picture = picture || u.picture || '';
            } catch (_) {}
          }

          dispatch(setAuth({
            authenticated: true,
            user: { 
              email, 
              name, 
              picture, 
              provider: res.data.provider || 'google',
              hasGoogleTokens: res.data.hasGoogleTokens,
              hasMicrosoftTokens: res.data.hasMicrosoftTokens,
              subscriptionTier: res.data.subscriptionTier || 'free',
              stripeSubscriptionId: res.data.stripeSubscriptionId || '',
              aiRequestCount: res.data.aiRequestCount || 0,
              role: res.data.role || 'user',
              tokenUsage: res.data.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
            },
            resumeName: res.data.resumeName || null,
            resumeData: res.data.resumeData || null,
          }));

          // Fetch user's multi-resumes
          axios.get(`${BACKEND}/resume/list`)
            .then(resList => {
              dispatch(setResumesInfo({ resumes: resList.data.resumes, activeResumeId: resList.data.activeResumeId }));
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        const stored = localStorage.getItem('jaa_user');
        if (stored) {
          try {
            const user = JSON.parse(stored);
            if (user?.email) {
              axios.get(`${BACKEND}/resume-data?email=${encodeURIComponent(user.email)}`, { timeout: 4000 })
                .then(r => {
                  if (r.data.hasData) {
                    dispatch(setResumeInfo({ resumeName: r.data.resumeFileName || null, resumeData: r.data.resumeData }));
                  }
                })
                .catch(() => {});
            }
          } catch (e) {}
        }
      });
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  if (!authenticated) {
    return (
      <>
        <InteractiveBackground />
        <LoginPage isDark={isDark} onToggleTheme={() => dispatch(toggleTheme())} />
      </>
    );
  }

  return (
    <>
      <InteractiveBackground />
      <Dashboard />
    </>
  );
}

export default App;
