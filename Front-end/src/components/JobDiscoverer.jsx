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
  const [activeTab, setActiveTab] = useState('digest'); // 'digest' or 'search'
  
  // Profile / Auto settings states
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
  
  // Terminal log animation state during manual crawls
  const [crawlLogs, setCrawlLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const esRef = React.useRef(null);

  // Live Portal Search states
  const [searchRole, setSearchRole] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Fetch initial profile configurations & already scraped jobs
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
      // Get profile info from user object
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

      // Get scraped jobs list
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

  // Run the crawler using Server-Sent Events background queue
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

  // Import matched card to primary board
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

  // Live real-time search portal queries
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
          toast.info('No listings found. The source portals might be rate-limiting.');
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

  // Import directly from external search result
  const handleImportExternalJob = async (jobItem) => {
    try {
      const res = await axios.post(`${BACKEND}/scraped-jobs/import-external`, jobItem);
      if (res.data.success) {
        toast.success(`Tracking "${jobItem.jobTitle}" at ${jobItem.companyName}!`);
        // Update imported state in search results local list
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
    <div className="space-y-6">
      
      {/* Navigation Tab bar */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800/80 mb-6 gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('digest')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 cursor-pointer border-0 bg-transparent outline-none ${
            activeTab === 'digest'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          📡 Digest Cron & Settings
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 cursor-pointer border-0 bg-transparent outline-none ${
            activeTab === 'search'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
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
            <div className="md:col-span-1 bg-white dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250">Target Role Profile</h3>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Customize crawling keywords & digest filters.</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Target Role *</label>
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
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Target Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote, San Francisco, Bangalore"
                    value={profile.targetLocation}
                    onChange={e => setProfile({ ...profile, targetLocation: e.target.value })}
                    className="input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Salary Expectation (Min/yr)</label>
                  <input
                    type="number"
                    placeholder="e.g. 90000 or 1500000"
                    value={profile.salaryExpectation}
                    onChange={e => setProfile({ ...profile, salaryExpectation: e.target.value })}
                    className="input text-xs"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">Daily Email Digest</p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-550 mt-0.5">Receive matched jobs in your inbox.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={profile.digestEnabled}
                        onChange={e => setProfile({ ...profile, digestEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4 after:width-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {profile.digestEnabled && (
                    <div className="space-y-1 animate-fade-in">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Frequency</label>
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
                  className="btn-primary w-full py-2 text-xs font-bold gap-1.5 cursor-pointer justify-center select-none"
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
                  className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 border-0 cursor-pointer shrink-0 ${
                    scraping 
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/35 cursor-not-allowed animate-pulse' 
                      : 'bg-indigo-650 hover:bg-indigo-600 text-white'
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
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-500 ease-out shadow-[0_0_12px_#6366f1]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
     
              <div className="flex-1 p-4 text-[11px] leading-relaxed overflow-y-auto space-y-1.5">
                {scraping ? (
                  <>
                    <div className="absolute inset-0 bg-slate-950/20 pointer-events-none select-none flex items-center justify-center">
                      <div className="w-28 h-28 border border-indigo-500/30 rounded-full animate-ping flex items-center justify-center">
                        <div className="w-16 h-16 border border-indigo-500/50 rounded-full animate-pulse" />
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
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Latest Crawler Matches</h3>
                <p className="text-[11px] text-slate-400 dark:text-zinc-550">Curated listings fetched for your target profile.</p>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-mono">
                {scrapedJobs.length} matches
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Spinner size={32} className="border-indigo-500 border-t-transparent" />
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2 font-mono">Fetching database listings...</p>
              </div>
            ) : scrapedJobs.length === 0 ? (
              <div className="bg-slate-50/50 dark:bg-zinc-900/10 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-12 text-center select-none">
                <span className="text-3xl">📡</span>
                <p className="text-xs font-bold text-slate-500 mt-2">No crawled job results yet</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-600 mt-0.5">Update your target profile and trigger a scrape search above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scrapedJobs.map((job) => (
                  <div 
                    key={job._id}
                    className={`p-4 border rounded-2xl bg-white dark:bg-zinc-800/40 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                      job.imported 
                        ? 'border-emerald-250 dark:border-emerald-900/35 bg-emerald-50/5 dark:bg-emerald-950/5' 
                        : 'border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-150 leading-snug line-clamp-1">
                            {job.jobTitle}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold mt-0.5">
                            {job.companyName}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider uppercase border ${
                            job.source === 'Naukri'
                              ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/25'
                              : job.source === 'Indeed'
                              ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/25'
                              : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/25'
                          }`}>
                            {job.source}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                        <span className="flex items-center gap-1">
                          <span>📍</span> {job.location || 'Remote'}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-555 font-bold">
                          <span>💰</span> {job.salary || 'Competitive'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-2.5 line-clamp-3 leading-relaxed">
                        {job.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
                      >
                        <span>External Link</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                        </svg>
                      </a>

                      <div className="ml-auto">
                        {job.imported ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1 animate-fade-in bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg">
                            <span>✓</span>
                            <span>Tracking in Board</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleImportJob(job._id, job.jobTitle, job.companyName)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer border-0"
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
          
          {/* Live Search Inputs Bar */}
          <div className="bg-white dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
            <form onSubmit={handleLiveSearch} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-1 w-full">
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Job Title / Keywords *</label>
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
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Location</label>
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
                className="btn-primary py-2 px-6 text-xs font-bold gap-1.5 cursor-pointer select-none shrink-0 w-full md:w-auto justify-center flex items-center"
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

          {/* Search Results Board */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Active Live Search Results</h3>
                <p className="text-[11px] text-slate-400 dark:text-zinc-550">Dynamic real-time search fetches from job aggregators.</p>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-mono">
                {searchResults.length} listings
              </span>
            </div>

            {searching ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Spinner size={32} className="border-indigo-500 border-t-transparent mb-4" />
                <span className="font-bold text-slate-350 text-xs uppercase tracking-wider mb-1 animate-pulse">
                  Querying Portals Live
                </span>
                <p className="text-[11px] text-slate-500 max-w-sm text-center">
                  Launching temporary Puppeteer scrapers to query Indeed and Naukri listings in real-time...
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="bg-slate-50/50 dark:bg-zinc-900/10 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-12 text-center select-none">
                <SearchIcon size={28} className="text-slate-350 dark:text-zinc-600 mx-auto" />
                <p className="text-xs font-bold text-slate-500 mt-2">Start your search</p>
                <p className="text-[11px] text-slate-450 dark:text-zinc-650 mt-0.5">Type keyword parameters above to scan active job listings in real-time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((job, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 border rounded-2xl bg-white dark:bg-zinc-800/40 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                      job.imported 
                        ? 'border-emerald-250 dark:border-emerald-900/35 bg-emerald-50/5 dark:bg-emerald-950/5' 
                        : 'border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-150 leading-snug line-clamp-1">
                            {job.jobTitle}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold mt-0.5">
                            {job.companyName}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider uppercase border ${
                            job.source === 'Naukri'
                              ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/25'
                              : job.source === 'Indeed'
                              ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/25'
                              : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/25'
                          }`}>
                            {job.source}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                        <span className="flex items-center gap-1">
                          <span>📍</span> {job.location || 'Remote'}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-555 font-bold">
                          <span>💰</span> {job.salary || 'Competitive'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-2.5 line-clamp-3 leading-relaxed">
                        {job.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
                      >
                        <span>External Link</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                        </svg>
                      </a>

                      <div className="ml-auto">
                        {job.imported ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1 animate-fade-in bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg">
                            <span>✓</span>
                            <span>Tracking in Board</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleImportExternalJob(job)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer border-0"
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
