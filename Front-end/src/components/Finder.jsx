import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND = 'http://localhost:3000';

const Spinner = ({ size = 16, className = '' }) => (
  <div 
    className={`border-2 border-slate-350 border-t-transparent rounded-full animate-spin ${className}`} 
    style={{ width: size, height: size }}
  />
);

const SearchIcon = ({ size = 14, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const MailIcon = ({ size = 14, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const CopyIcon = ({ size = 14, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ImportIcon = ({ size = 14, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CheckIcon = ({ size = 14, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function Finder({ toast }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [importingId, setImportingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchSharedJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND}/jobs/finder?search=${encodeURIComponent(search)}`, { withCredentials: true });
      if (res.data.success) {
        setJobs(res.data.jobs || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load shared jobs directory.');
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchSharedJobs();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, fetchSharedJobs]);

  const handleCopyEmail = (email, id) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    toast.success('Recruiter email copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleImportJob = async (id) => {
    setImportingId(id);
    try {
      const res = await axios.post(`${BACKEND}/jobs/finder/import/${id}`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success('Job details and contact imported to your board successfully.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to import job.');
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-text-main w-full">
      {/* Title */}
      <div className="border-b border-border-card pb-5">
        <h1 className="text-xl font-bold text-text-main tracking-tight">HR Email Finder</h1>
        <p className="text-xs text-text-muted mt-1">
          Browse and search through job details and HR contact emails shared by the community. You can copy contact details or import them to your outreach board directly.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
          <SearchIcon size={16} />
        </div>
        <input
          type="text"
          placeholder="Search by job title, company name, or description keywords..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-border-card bg-bg-card rounded-xl text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner size={24} className="border-brand-primary" />
          <p className="text-xs font-semibold text-text-muted">Searching shared directory...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border-card rounded-2xl bg-bg-card p-6">
          <p className="text-sm font-semibold text-text-muted">No shared jobs found matching your search.</p>
          <p className="text-xs text-text-muted mt-1">Enable "Share on Finder" when adding jobs to contribute to this directory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map(job => (
            <div key={job._id} className="card p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-text-main">{job.job}</h3>
                    <p className="text-xs font-semibold text-brand-primary mt-0.5">{job.companyName}</p>
                  </div>
                  <span className="text-[10px] font-bold text-text-muted bg-slate-100 dark:bg-zinc-800 border border-border-card px-2 py-0.5 rounded-full shrink-0">
                    Shared {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-text-muted line-clamp-3 mt-3 mb-4 leading-normal">
                  {job.description}
                </p>

                <div className="space-y-2 border-t border-border-card pt-3 mb-4">
                  {job.hrName && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">HR Name</span>
                      <span className="font-semibold text-text-main">{job.hrName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <MailIcon size={12} className="opacity-70" />
                      HR Email
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-text-main bg-bg-app px-2 py-0.5 rounded border border-border-card text-[11px] select-all truncate max-w-[200px]">
                        {job.email}
                      </span>
                      <button
                        onClick={() => handleCopyEmail(job.email, job._id)}
                        className="p-1 hover:bg-bg-card-hover rounded border border-border-card text-text-muted hover:text-text-main transition-colors"
                        title="Copy Email"
                      >
                        {copiedId === job._id ? <CheckIcon className="text-emerald-500" /> : <CopyIcon />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleImportJob(job._id)}
                disabled={importingId === job._id}
                className="btn-ghost w-full py-2 flex items-center justify-center gap-2 text-xs font-bold"
              >
                {importingId === job._id ? (
                  <Spinner size={12} />
                ) : (
                  <>
                    <ImportIcon size={12} />
                    Import to My Board
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
