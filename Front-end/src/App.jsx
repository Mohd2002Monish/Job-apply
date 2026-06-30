import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import HomePage from './components/HomePage';
import JobsTable, { useToast, ToastContainer } from './components/JobsTable';
import ResumeUpload from './components/ResumeUpload';
import ResumeBuilder from './components/ResumeBuilder';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import InteractiveBackground from './components/InteractiveBackground';
import JobDiscoverer from './components/JobDiscoverer';
import AdminPanel from './components/AdminPanel';
import CoverLetterTab from './components/CoverLetterTab';
import Select from 'react-select';
import { getReactSelectStyles } from './utils/reactSelectStyles';
import { SunIcon, MoonIcon, LogOutIcon, BriefcaseIcon, LayersIcon, FileTextIcon } from './components/Icons';
import { setAuth, setResumeInfo, setResumesInfo, toggleTheme, setActiveTab, logoutUser } from './store/authSlice';
import PricingPage from './pages/PricingPage';
import FAQPage from './pages/FAQPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import ContactPage from './pages/ContactPage';
import PaymentGate from './components/PaymentGate';
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

const MenuIcon = ({ size = 20, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const XIcon = ({ size = 20, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Nav Tab ──────────────────────────────────────────────────────────────────
const NavTab = ({ id, label, Icon, active, badge, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 font-semibold'
        : 'text-text-muted hover:text-text-main hover:bg-bg-card-hover'
    }`}
  >
    <Icon size={18} className={`${active ? 'text-brand-primary' : 'text-text-muted'}`} />
    <span className="flex-1 text-left">{label}</span>
    {badge && (
      <span className="w-2.5 h-2.5 bg-brand-accent rounded-full shrink-0 animate-pulse" />
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
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

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
              tokenUsage: statusRes.data.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
              referralCode: statusRes.data.referralCode || '',
              referralClicks: statusRes.data.referralClicks || 0,
              referralConversions: statusRes.data.referralConversions || 0
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
      const res = await axios.post(`${BACKEND}/payment/razorpay/cancel`, {}, { withCredentials: true });
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
              jobCount: statusRes.data.jobCount,
              role: statusRes.data.role || 'user',
              tokenUsage: statusRes.data.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
              referralCode: statusRes.data.referralCode || '',
              referralClicks: statusRes.data.referralClicks || 0,
              referralConversions: statusRes.data.referralConversions || 0
            },
            resumeName: statusRes.data.resumeName,
            resumeData: statusRes.data.resumeData
          }));
        }
        toast.success('Subscription cancelled successfully.');
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
                tokenUsage: res.data.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                referralCode: res.data.referralCode || '',
                referralClicks: res.data.referralClicks || 0,
                referralConversions: res.data.referralConversions || 0
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

  const handleSelectResume = async (val) => {
    const id = val?.target ? val.target.value : (val?.value || val);
    if (!id) return;
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-bg-app text-text-main transition-colors duration-200">
      {/* Backdrop for Mobile Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px] z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`w-64 fixed inset-y-0 left-0 bg-bg-card border-r border-border-card flex flex-col justify-between z-50 transition-all duration-300 ease-out transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Sidebar Brand Header */}
          <div className="h-16 px-6 border-b border-border-card flex items-center justify-between">
            <div className="flex items-center">
              <img src={isDark ? '/logo_desktop_dark.png' : '/logo_desktop.png'} alt="RecoCareer.ai" className="h-7 w-auto object-contain" />
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-text-muted hover:bg-bg-card-hover hover:text-text-main transition-colors"
            >
              <XIcon size={18} />
            </button>
          </div>

          {/* Navigation Links Stack */}
          <nav className="p-4 space-y-1">
            <NavTab id="jobs" label="Outreach" Icon={BriefcaseIcon} active={activeTab === 'jobs'} onClick={(id) => { dispatch(setActiveTab(id)); setSidebarOpen(false); }} />
            <NavTab id="discover" label="Discover" Icon={SearchIcon} active={activeTab === 'discover'} onClick={(id) => { dispatch(setActiveTab(id)); setSidebarOpen(false); }} />
            <NavTab id="cover-letter" label="Cover Letter" Icon={FileTextIcon} active={activeTab === 'cover-letter'} onClick={(id) => { dispatch(setActiveTab(id)); setSidebarOpen(false); }} />
            <NavTab id="builder" label="Builder" Icon={LayersIcon} active={activeTab === 'builder'} badge={!!resumeData} onClick={(id) => { dispatch(setActiveTab(id)); setSidebarOpen(false); }} />
            <NavTab id="analytics" label="Analytics" Icon={TrendingUpIcon} active={activeTab === 'analytics'} onClick={(id) => { dispatch(setActiveTab(id)); setSidebarOpen(false); }} />
            {user?.role === 'owner' && (
              <NavTab id="admin" label="Admin" Icon={ShieldAlertIcon} active={activeTab === 'admin'} onClick={(id) => { dispatch(setActiveTab(id)); setSidebarOpen(false); }} />
            )}
          </nav>
        </div>

        {/* Sidebar Footer: Unified settings & profile card */}
        <div className="p-4 border-t border-border-card bg-bg-app/20">
          <div className="bg-bg-card-hover/40 border border-border-card/85 rounded-2xl p-4.5 space-y-4 backdrop-blur-md">
            {/* User Info Header */}
            <div className="flex items-center gap-3">
              {user?.picture ? (
                <img
                  src={user.picture.startsWith('http') ? user.picture : `${BACKEND}${user.picture}`}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border border-border-card object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md shadow-brand-primary/10">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-main truncate leading-none mb-1">{user?.name || 'User Account'}</p>
                <p className="text-[10.5px] text-text-muted truncate leading-none">{user?.email}</p>
              </div>
            </div>

            {/* Active Resume Dropdown Selector */}
            {resumes && resumes.length > 0 && (
              <div className="space-y-1.5 pt-2.5 border-t border-border-card">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-bold text-text-muted uppercase tracking-widest">Active Resume</span>
                  <button
                    onClick={() => { setUploadModalOpen(true); setSidebarOpen(false); }}
                    className="text-[10px] font-bold text-brand-primary hover:opacity-80 transition-colors flex items-center gap-0.5"
                    id="sidebar-resume-manage-btn"
                  >
                    Manage
                  </button>
                </div>
                <Select
                  value={resumes.map(r => ({ value: r.id, label: r.title })).find(o => o.value === activeResumeId)}
                  onChange={handleSelectResume}
                  options={resumes.map(r => ({ value: r.id, label: r.title }))}
                  styles={getReactSelectStyles()}
                  id="resume-selector-dropdown"
                />
              </div>
            )}

            {/* Bottom Actions Row */}
            <div className="flex items-center gap-2 pt-2.5 border-t border-border-card">
              {/* Profile Settings Gear Button */}
              <button
                onClick={() => { setProfileModalOpen(true); setSidebarOpen(false); }}
                className="flex-1 py-2 px-2.5 rounded-lg border border-border-card bg-bg-card text-text-muted hover:text-text-main hover:bg-bg-card-hover/80 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                title="Profile Settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                <span className="text-[10px] font-bold">Profile</span>
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={() => dispatch(toggleTheme())}
                className="py-2 px-2.5 rounded-lg border border-border-card bg-bg-card text-text-muted hover:text-text-main hover:bg-bg-card-hover/80 transition-all flex items-center justify-center shadow-sm"
                aria-label="Toggle theme"
                title="Toggle Theme"
              >
                {isDark ? <SunIcon size={14} /> : <MoonIcon size={14} />}
              </button>

              {/* Exit Button */}
              <button
                onClick={handleLogout}
                id="logout-btn"
                className="py-2 px-2.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center shadow-sm"
                aria-label="Sign out"
                title="Sign Out"
              >
                <LogOutIcon size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Layout area */}
      <div className="flex-1 lg:pl-64 min-h-screen flex flex-col">
        {/* Mobile Top Bar */}
        <header className="lg:hidden h-14 border-b border-border-card bg-bg-card/95 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <img src="/logo_mobile.png" alt="RecoCareer.ai" className="h-7 w-auto object-contain" />
            <span className="text-sm font-extrabold tracking-tight text-text-main">
              RecoCareer.ai
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setProfileModalOpen(true)}
              className="rounded-full overflow-hidden shrink-0 border border-border-card"
            >
              {user?.picture ? (
                <img
                  src={user.picture.startsWith('http') ? user.picture : `${BACKEND}${user.picture}`}
                  alt={user.name}
                  className="w-7 h-7 object-cover"
                />
              ) : (
                <div className="w-7 h-7 bg-brand-primary/10 flex items-center justify-center text-[11px] font-bold text-brand-primary">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-text-muted hover:bg-bg-card-hover hover:text-text-main transition-colors"
            >
              <MenuIcon size={20} />
            </button>
          </div>
        </header>

        {/* Page Content area */}
        <main className="flex-1 p-5 lg:p-8 max-w-5xl w-full mx-auto">
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
          {activeTab === 'cover-letter' && <CoverLetterTab user={user} />}
          {activeTab === 'builder' && <ResumeBuilder user={user} initialResumeData={resumeData} />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'admin' && user?.role === 'owner' && <AdminPanel />}
        </main>
      </div>

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
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-fade-in pointer-events-auto"
          onClick={(e) => e.target === e.currentTarget && !savingProfile && setProfileModalOpen(false)}
        >
          {/* Modal content */}
          <div className="relative w-full max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-[28px] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.25)] border border-slate-200/60 dark:border-zinc-800/60 overflow-hidden animate-fade-in pointer-events-auto flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-850 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">Profile Settings</h2>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Manage your details, referrals, and subscription limits.</p>
              </div>
              <button
                type="button"
                disabled={savingProfile}
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100/80 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 border-0 bg-transparent cursor-pointer"
                aria-label="Close dialog"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleProfileSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0 scrollbar-thin">
              {/* Picture Upload */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 dark:border-zinc-700 group-hover:border-indigo-500 group-hover:ring-4 group-hover:ring-indigo-500/10 transition-all duration-300 bg-slate-50 dark:bg-zinc-850 flex items-center justify-center shadow-inner">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : user?.picture ? (
                      <img src={user.picture.startsWith('http') ? user.picture : `${BACKEND}${user.picture}`} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-indigo-500 dark:text-indigo-400">{user?.name?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1px]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors bg-transparent border-0 cursor-pointer"
                >
                  Change Photo
                </button>
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-medium transition-all"
                    placeholder="Your Name"
                    id="profile-name-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-medium transition-all"
                    placeholder="your.email@example.com"
                    id="profile-email-input"
                  />
                </div>
              </div>

              {/* Referral Program */}
              <div className="pt-4 border-t border-slate-150 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider">
                    Referral Program
                  </h3>
                </div>
                <p className="text-[11px] text-slate-450 dark:text-zinc-455 leading-relaxed">
                  Invite friends to RecoCareer.ai! When they sign up using your link, we will track your stats.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${BACKEND}/r/${user?.referralCode || ''}`}
                    className="w-full bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono rounded-xl px-3 py-2 focus:outline-none text-slate-600 dark:text-slate-400 shrink min-w-0"
                    id="referral-url-input"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${BACKEND}/r/${user?.referralCode || ''}`);
                      toast.success('Referral link copied to clipboard!');
                    }}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-150/40 dark:border-indigo-500/20 px-3.5 py-2 rounded-xl hover:bg-indigo-100/70 dark:hover:bg-indigo-500/20 transition-all shrink-0 cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-slate-50/40 dark:bg-zinc-950/20 p-3 rounded-2xl border border-slate-150/40 dark:border-zinc-850/50">
                  <div className="text-center py-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider block mb-0.5">Link Clicks</span>
                    <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{user?.referralClicks || 0}</span>
                  </div>
                  <div className="text-center py-1 border-l border-slate-200/50 dark:border-zinc-800/40">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider block mb-0.5">Pro Converts</span>
                    <span className="text-xl font-extrabold text-indigo-500 dark:text-indigo-400 leading-none">{user?.referralConversions || 0}</span>
                  </div>
                </div>
              </div>

              {/* Billing & Subscriptions */}
              <div className="pt-4 border-t border-slate-150 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Subscription & Usage
                  </h3>
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    user?.subscriptionTier === 'pro'
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                  }`}>
                    {user?.subscriptionTier === 'pro' ? 'Pro Tier' : 'Free Tier'}
                  </span>
                </div>

                {/* Usage Metrics */}
                <div className="space-y-3 bg-slate-50/50 dark:bg-zinc-950/10 p-3.5 rounded-2xl border border-slate-150/40 dark:border-zinc-850/50">
                  {/* Tracked Jobs Limit */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-slate-650 dark:text-zinc-400">Jobs Tracked</span>
                      <span className={`font-bold ${user?.subscriptionTier !== 'pro' && (user?.jobCount || 0) > 5 ? 'text-rose-500' : 'text-slate-800 dark:text-zinc-200'}`}>
                        {user?.jobCount || 0} / {user?.subscriptionTier === 'pro' ? '∞' : '5'}
                        {user?.subscriptionTier !== 'pro' && (user?.jobCount || 0) > 5 && ' (Limit Exceeded)'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/60 dark:bg-zinc-805 h-2 rounded-full overflow-hidden p-[1px]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          user?.subscriptionTier !== 'pro' && (user?.jobCount || 0) > 5
                            ? 'bg-gradient-to-r from-rose-500 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        }`}
                        style={{
                          width: `${user?.subscriptionTier === 'pro' ? 100 : Math.min(((user?.jobCount || 0) / 5) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* AI Features Limit */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-slate-650 dark:text-zinc-400">AI Features Usage</span>
                      <span className={`font-bold ${user?.subscriptionTier !== 'pro' && (user?.aiRequestCount || 0) > 3 ? 'text-rose-500' : 'text-slate-800 dark:text-zinc-200'}`}>
                        {user?.aiRequestCount || 0} / {user?.subscriptionTier === 'pro' ? '∞' : '3'}
                        {user?.subscriptionTier !== 'pro' && (user?.aiRequestCount || 0) > 3 && ' (Over Limit)'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/60 dark:bg-zinc-805 h-2 rounded-full overflow-hidden p-[1px]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          user?.subscriptionTier !== 'pro' && (user?.aiRequestCount || 0) > 3
                            ? 'bg-gradient-to-r from-rose-500 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                            : 'bg-gradient-to-r from-violet-500 to-indigo-500'
                        }`}
                        style={{
                          width: `${user?.subscriptionTier === 'pro' ? 100 : Math.min(((user?.aiRequestCount || 0) / 3) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription Action Trigger Card */}
                <div className="bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-violet-50/50 dark:from-indigo-950/10 dark:via-purple-950/5 dark:to-zinc-950/20 p-3.5 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/10 flex items-center justify-between gap-3 mt-1.5">
                  {user?.subscriptionTier === 'pro' ? (
                    <>
                      <p className="text-[11px] text-slate-450 dark:text-zinc-500 leading-normal max-w-[200px]">
                        You have unlimited access to all features. Need to downgrade?
                      </p>
                      <button
                        type="button"
                        disabled={billingLoading}
                        onClick={handleCancelSubscription}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 disabled:opacity-50 flex items-center gap-1 cursor-pointer bg-transparent border-0"
                      >
                        {billingLoading && <div className="w-3 h-3 border border-rose-500 border-t-transparent rounded-full animate-spin" />}
                        Cancel Pro
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] text-slate-450 dark:text-zinc-455 leading-normal max-w-[210px]">
                        Unlock unlimited jobs, resumes, search imports, and advanced AI matching.
                      </p>
                      <button
                        type="button"
                        disabled={billingLoading}
                        onClick={handleUpgrade}
                        className="text-[11px] font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-98 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0 border-0"
                      >
                        {billingLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        Upgrade to Pro
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Error Box */}
              {profileError && (
                <div className="p-3 text-xs bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 animate-fade-in">
                  {profileError}
                </div>
              )}

              {/* Success Box */}
              {profileSuccess && (
                <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 animate-fade-in">
                  Profile updated successfully!
                </div>
              )}
            </form>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-850/80 flex gap-3 shrink-0">
              <button
                type="button"
                disabled={savingProfile}
                onClick={() => setProfileModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-850 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer border-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                onClick={handleProfileSubmit}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-1.5 border-0"
                id="profile-save-btn"
              >
                {savingProfile ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
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
  const { authenticated, isDark, user } = useSelector(state => state.auth);

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
              tokenUsage: res.data.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
              referralCode: res.data.referralCode || '',
              referralClicks: res.data.referralClicks || 0,
              referralConversions: res.data.referralConversions || 0
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

  const toggleThemeHandler = () => dispatch(toggleTheme());

  const handleUpgradeSuccess = () => {
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
              role: res.data.role || 'user',
              tokenUsage: res.data.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
              referralCode: res.data.referralCode || '',
              referralClicks: res.data.referralClicks || 0,
              referralConversions: res.data.referralConversions || 0
            },
            resumeName: res.data.resumeName || null,
            resumeData: res.data.resumeData || null,
          }));
        }
      });
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  if (!authenticated) {
    return (
      <>
        <InteractiveBackground />
        <Routes>
          <Route path="/" element={<HomePage isDark={isDark} onToggleTheme={toggleThemeHandler} />} />
          <Route path="/pricing" element={<PricingPage isDark={isDark} onToggleTheme={toggleThemeHandler} />} />
          <Route path="/faq" element={<FAQPage isDark={isDark} onToggleTheme={toggleThemeHandler} />} />
          <Route path="/privacy" element={<PrivacyPolicyPage isDark={isDark} onToggleTheme={toggleThemeHandler} />} />
          <Route path="/terms" element={<TermsPage isDark={isDark} onToggleTheme={toggleThemeHandler} />} />
          <Route path="/contact" element={<ContactPage isDark={isDark} onToggleTheme={toggleThemeHandler} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    );
  }

  // Gated: only paid users can access dashboard
  if (user?.subscriptionTier !== 'pro') {
    return (
      <>
        <InteractiveBackground />
        <PaymentGate user={user} onUpgradeSuccess={handleUpgradeSuccess} handleLogout={handleLogout} />
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
