import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { getReactSelectStyles } from '../utils/reactSelectStyles';

const BACKEND = 'http://localhost:3000';

const Spinner = ({ size = 16, className = '' }) => (
  <div 
    className={`border-2 border-slate-300 border-t-transparent rounded-full animate-spin ${className}`} 
    style={{ width: size, height: size }}
  />
);

const SearchIcon = ({ size = 14, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const JobDiscoverer = ({ toast, onImported }) => {
  const [activeTab, setActiveTab] = useState('digest');
  
  const [profile, setProfile] = useState({
    targetRole: '',
    targetLocation: '',
    salaryExpectation: '',
    digestEnabled: false,
    digestFrequency: 'daily'
  });
  const [scrapedJobs, setScrapedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [scraping, setScraping] = useState(false);
  
  const [crawlLogs, setCrawlLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const esRef = React.useRef(null);

  const [searchRole, setSearchRole] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchProfileAndJobs();
    return () => {
      if (esRef.current) {
        esRef.current.close();
      }
    };
  }, []);

  const fetchProfileAndJobs = async () => {
    setLoading(true);
    try {
      const authRes = await axios.get(`${BACKEND}/auth/profile`);
      if (authRes.data.success && authRes.data.user) {
        const p = authRes.data.user.targetProfile || {};
        setProfile({
          targetRole: p.targetRole || '',
          targetLocation: p.targetLocation || '',
          salaryExpectation: p.salaryExpectation || '',
          digestEnabled: p.digestEnabled || false,
          digestFrequency: p.digestFrequency || 'daily'
        });
        setSearchRole(p.targetRole || '');
        setSearchLocation(p.targetLocation || '');
      }

      const jobsRes = await axios.get(`${BACKEND}/scraped-jobs`);
      if (jobsRes.data.success) {
        setScrapedJobs(jobsRes.data.scrapedJobs || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load scraper configurations.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = {
        ...profile,
        salaryExpectation: profile.salaryExpectation ? Number(profile.salaryExpectation) : 0
      };
      const res = await axios.patch(`${BACKEND}/scraped-jobs/profile`, payload);
      if (res.data.success) {
        toast.success('Search preferences saved!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTriggerScrape = async () => {
    if (!profile.targetRole.trim()) {
      toast.error('Please enter a Target Job Role first.');
      return;
    }

    setScraping(true);
    setCrawlLogs([]);
    setProgress(0);

    try {
      const res = await axios.post(`${BACKEND}/scraped-jobs/trigger`);
      if (res.data.success) {
        toast.info('Search and crawl initiated in the background.');
      }

      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('jaa_session_token='))
        ?.split('=')[1];

      const url = new URL(`${BACKEND}/scraped-jobs/stream`);
      if (token) url.searchParams.append('token', token);

      if (esRef.current) esRef.current.close();
      
      const es = new EventSource(url.toString(), { withCredentials: true });
      esRef.current = es;

      es.addEventListener('scrape-progress', (e) => {
        const data = JSON.parse(e.data);
        if (data.progress !== undefined) {
          setProgress(data.progress);
        }
        if (data.log) {
          setCrawlLogs(prev => [...prev, data.log]);
        }
        if (data.status === 'complete' || data.progress === 100) {
          es.close();
          setScraping(false);
          fetchProfileAndJobs();
        } else if (data.status === 'failed') {
          es.close();
          setScraping(false);
          toast.error(data.log || 'Scraping failed.');
        }
      });

      es.onerror = (err) => {
        console.error('SSE connection error:', err);
        es.close();
        setScraping(false);
        toast.error('Connection to scraper progress stream lost.');
      };

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to trigger scraping.');
      setScraping(false);
    }
  };

  const handleImportJob = async (scrapedJobId, title, company) => {
    try {
      const res = await axios.post(`${BACKEND}/scraped-jobs/import/${scrapedJobId}`);
      if (res.data.success) {
        toast.success(`Tracking "${title}" at ${company}!`);
        setScrapedJobs(prev => 
          prev.map(j => j._id === scrapedJobId ? { ...j, imported: true } : j)
        );
        if (onImported) onImported();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Import failed.');
    }
  };

  const handleLiveSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchRole.trim()) {
      toast.error('Job Role/Keyword is required.');
      return;
    }

    setSearching(true);
    setSearchResults([]);

    try {
      const res = await axios.get(`${BACKEND}/scraped-jobs/search`, {
        params: {
          role: searchRole,
          location: searchLocation
        }
      });
      if (res.data.success) {
        setSearchResults(res.data.results || []);
        if (res.data.results.length === 0) {
          toast.info('No listings found.');
        } else {
          toast.success(`Found ${res.data.results.length} active listings!`);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Live portal search failed.');
    } finally {
      setSearching(false);
    }
  };

  const handleImportExternalJob = async (jobItem) => {
    try {
      const res = await axios.post(`${BACKEND}/scraped-jobs/import-external`, jobItem);
      if (res.data.success) {
        toast.success(`Tracking "${jobItem.jobTitle}" at ${jobItem.companyName}!`);
        setSearchResults(prev =>
          prev.map(j => (j.url === jobItem.url || (j.jobTitle === jobItem.jobTitle && j.companyName === jobItem.companyName)) ? { ...j, imported: true } : j)
        );
        if (onImported) onImported();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Import failed.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-text-main">
      
      {/* Navigation Tab bar */}
      <div className="flex border-b border-border-card mb-6 gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 cursor-pointer btn-tactile ${
            activeTab === 'settings'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          Digest Cron & Settings
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 cursor-pointer btn-tactile ${
            activeTab === 'search'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <SearchIcon size={13} />
            In-App Job Search Portal
          </span>
        </button>
      </div>

      {activeTab === 'digest' ? (
        <>
          {/* Target Settings Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Profile configuration Form */}
            <div className="md:col-span-1 bg-bg-card border border-border-card p-5 rounded-2xl shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-text-main">Target Role Profile</h3>
                <p className="text-[11px] text-text-muted mt-0.5">Customize crawling keywords & digest filters.</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Target Role *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer, React Developer"
                    value={profile.targetRole}
                    onChange={e => setProfile({ ...profile, targetRole: e.target.value })}
                    className="input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Target Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote, San Francisco, Bangalore"
                    value={profile.targetLocation}
                    onChange={e => setProfile({ ...profile, targetLocation: e.target.value })}
                    className="input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Salary Expectation (Min/yr)</label>
                  <input
                    type="number"
                    placeholder="e.g. 90000 or 1500000"
                    value={profile.salaryExpectation}
                    onChange={e => setProfile({ ...profile, salaryExpectation: e.target.value })}
                    className="input text-xs"
                  />
                </div>

                <div className="pt-2 border-t border-border-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-text-main">Daily Email Digest</p>
                      <p className="text-[10px] text-text-muted mt-0.5">Receive matched jobs in your inbox.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={profile.digestEnabled}
                        onChange={e => setProfile({ ...profile, digestEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-bg-card-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-card after:border after:rounded-full after:height-4 after:width-4 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>

                  {profile.digestEnabled && (
                    <div className="space-y-1 animate-fade-in">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Frequency</label>
                      <Select
                        value={[
                          { value: 'daily', label: 'Daily digest (9:10 AM)' },
                          { value: 'weekly', label: 'Weekly digest (Mondays)' }
                        ].find(o => o.value === profile.digestFrequency)}
                        onChange={(opt) => setProfile({ ...profile, digestFrequency: opt ? opt.value : 'daily' })}
                        options={[
                          { value: 'daily', label: 'Daily digest (9:10 AM)' },
                          { value: 'weekly', label: 'Weekly digest (Mondays)' }
                        ]}
                        styles={getReactSelectStyles()}
                        id="discoverer-frequency-select"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="btn-primary w-full py-2 text-xs font-bold gap-1.5 cursor-pointer justify-center select-none btn-tactile"
                >
                  {savingSettings ? <><Spinner size={12} /> Saving...</> : 'Save Settings'}
                </button>
              </form>
            </div>

            {/* Live Crawler Trigger console panel */}
            <div className="md:col-span-2 bg-slate-950 text-slate-200 border border-slate-900 rounded-2xl shadow-xl flex flex-col min-h-[340px] overflow-hidden font-mono relative">
              <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-400 ml-2 truncate">recocareer_crawler_daemon {scraping && `(${progress}%)`}</span>
                </div>
                
                <button
                  onClick={handleTriggerScrape}
                  disabled={scraping || loading}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 border-0 cursor-pointer shrink-0 btn-tactile ${
                    scraping 
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/35 cursor-not-allowed animate-pulse' 
                      : 'bg-brand-primary hover:bg-brand-primary-hover text-white'
                  }`}
                >
                  {scraping ? (
                    <>
                      <Spinner size={10} className="border-t-transparent border-rose-400" />
                      <span>Scanning ({progress}%)</span>
                    </>
                  ) : (
                    <>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="mr-0.5">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <span>Search & Crawl</span>
                    </>
                  )}
                </button>
              </div>

              {/* Glowing Progress Bar */}
              {scraping && (
                <div className="w-full bg-slate-900 h-1 overflow-hidden relative border-b border-slate-950">
                  <div 
                    className="bg-brand-primary h-full transition-all duration-500 ease-out shadow-[0_0_12px_var(--brand-primary)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
     
              <div className="flex-1 p-4 text-[11px] leading-relaxed overflow-y-auto space-y-1.5">
                {scraping ? (
                  <>
                    <div className="absolute inset-0 bg-slate-950/20 pointer-events-none select-none flex items-center justify-center">
                      <div className="w-28 h-28 border border-brand-primary/30 rounded-full animate-ping flex items-center justify-center">
                        <div className="w-16 h-16 border border-brand-primary/50 rounded-full animate-pulse" />
                      </div>
                    </div>
     
                    <div className="space-y-1 select-none">
                      {crawlLogs.map((log, i) => (
                        <div key={i} className="animate-fade-in text-emerald-400 font-mono">
                          {log}
                        </div>
                      ))}
                      {progress < 100 && (
                        <div className="text-slate-500 animate-pulse ml-4 font-mono">&#x258C; Crawling portals...</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-10 select-none font-sans">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-700 mb-2">
                      <rect x="2" y="2" width="20" height="20" rx="4" />
                      <path d="m8 10 3 3 5-5" />
                    </svg>
                    <p className="text-xs font-semibold text-slate-400">Daemon Standby</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">Click "Search & Crawl" to launch active Puppeteer job searches.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scraped Results Block */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border-card pb-2">
              <div>
                <h3 className="text-sm font-bold text-text-main">Latest Crawler Matches</h3>
                <p className="text-[11px] text-text-muted">Curated listings fetched for your target profile.</p>
              </div>
              <span className="text-[10px] font-bold text-text-muted bg-bg-card-hover border border-border-card px-2.5 py-0.5 rounded-full font-mono">
                {scrapedJobs.length} matches
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Spinner size={32} className="border-brand-primary border-t-transparent" />
                <p className="text-xs text-text-muted mt-2 font-mono">Fetching database listings...</p>
              </div>
            ) : scrapedJobs.length === 0 ? (
              <div className="bg-bg-card border border-dashed border-border-card rounded-2xl p-12 text-center select-none">
                <span className="text-3xl">📡</span>
                <p className="text-xs font-bold text-text-main mt-2">No crawled job results yet</p>
                <p className="text-[11px] text-text-muted mt-0.5">Update your target profile and trigger a scrape search above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scrapedJobs.map((job) => (
                  <div 
                    key={job._id}
                    className={`p-4 border rounded-2xl bg-bg-card shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                      job.imported 
                        ? 'border-emerald-500/30 bg-emerald-500/5' 
                        : 'border-border-card'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-text-main leading-snug line-clamp-1">
                            {job.jobTitle}
                          </h4>
                          <p className="text-[11px] text-text-muted font-bold mt-0.5">
                            {job.companyName}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border bg-brand-primary/10 text-brand-primary border-brand-primary/20">
                            {job.source}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[10px] text-text-muted font-mono">
                        <span className="flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-text-muted shrink-0">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span>{job.location || 'Remote'}</span>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-500 font-bold">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500 shrink-0">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                          <span>{job.salary || 'Competitive'}</span>
                        </span>
                      </div>

                      <p className="text-[11px] text-text-muted mt-2.5 line-clamp-3 leading-relaxed">
                        {job.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-3 mt-3 border-t border-border-card">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-text-muted hover:text-text-main transition-colors flex items-center gap-1"
                      >
                        <span>External Link</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                        </svg>
                      </a>

                      <div className="ml-auto">
                        {job.imported ? (
                          <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 animate-fade-in bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500 shrink-0">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Tracking in Board</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleImportJob(job._id, job.jobTitle, job.companyName)}
                            className="px-3 py-1 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer border-0 btn-tactile"
                          >
                            <span>+ Track Job</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* In-App Live Job Search Portal Tab Content */
        <div className="space-y-6 animate-fade-in">
          
          <div className="bg-bg-card border border-border-card p-5 rounded-2xl shadow-sm">
            <form onSubmit={handleLiveSearch} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-1 w-full">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Job Title / Keywords *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Node Developer, Product Designer"
                  value={searchRole}
                  onChange={e => setSearchRole(e.target.value)}
                  className="input text-xs w-full"
                />
              </div>

              <div className="flex-1 space-y-1 w-full">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Remote, Chicago, London"
                  value={searchLocation}
                  onChange={e => setSearchLocation(e.target.value)}
                  className="input text-xs w-full"
                />
              </div>

              <button
                type="submit"
                disabled={searching}
                className="btn-primary py-2.5 px-6 text-xs font-bold gap-1.5 cursor-pointer select-none shrink-0 w-full md:w-auto justify-center flex items-center btn-tactile"
              >
                {searching ? (
                  <>
                    <Spinner size={12} className="border-t-transparent border-white" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <span>Search Portal</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border-card pb-2">
              <div>
                <h3 className="text-sm font-bold text-text-main">Active Live Search Results</h3>
                <p className="text-[11px] text-text-muted">Dynamic real-time search fetches from job aggregators.</p>
              </div>
              <span className="text-[10px] font-bold text-text-muted bg-bg-card-hover border border-border-card px-2.5 py-0.5 rounded-full font-mono">
                {searchResults.length} listings
              </span>
            </div>

            {searching ? (
              <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                <Spinner size={32} className="border-brand-primary border-t-transparent mb-4" />
                <span className="font-bold text-text-main text-xs uppercase tracking-wider mb-1 animate-pulse">
                  Querying Portals Live
                </span>
                <p className="text-[11px] text-text-muted max-w-sm text-center">
                  Launching temporary scrapers to query Indeed and Naukri listings in real-time...
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="bg-bg-card border border-dashed border-border-card rounded-2xl p-12 text-center select-none">
                <SearchIcon size={28} className="text-text-muted mx-auto" />
                <p className="text-xs font-bold text-text-main mt-2">Start your search</p>
                <p className="text-[11px] text-text-muted mt-0.5">Type keyword parameters above to scan active job listings in real-time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((job, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 border rounded-2xl bg-bg-card shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                      job.imported 
                        ? 'border-emerald-500/30 bg-emerald-500/5' 
                        : 'border-border-card'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-text-main leading-snug line-clamp-1">
                            {job.jobTitle}
                          </h4>
                          <p className="text-[11px] text-text-muted font-bold mt-0.5">
                            {job.companyName}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border bg-brand-primary/10 text-brand-primary border-brand-primary/20">
                            {job.source}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[10px] text-text-muted font-mono">
                        <span className="flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-text-muted shrink-0">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span>{job.location || 'Remote'}</span>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-500 font-bold">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500 shrink-0">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                          <span>{job.salary || 'Competitive'}</span>
                        </span>
                      </div>

                      <p className="text-[11px] text-text-muted mt-2.5 line-clamp-3 leading-relaxed">
                        {job.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-3 mt-3 border-t border-border-card">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-text-muted hover:text-text-main transition-colors flex items-center gap-1"
                      >
                        <span>External Link</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                        </svg>
                      </a>

                      <div className="ml-auto">
                        {job.imported ? (
                          <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 animate-fade-in bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500 shrink-0">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Tracking in Board</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleImportExternalJob(job)}
                            className="px-3 py-1 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer border-0 btn-tactile"
                          >
                            <span>+ Track Job</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDiscoverer;
