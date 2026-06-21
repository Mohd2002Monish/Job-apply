import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { XIcon, WandIcon, GlobeIcon, LinkIcon } from './Icons';

const BACKEND = 'http://localhost:3000';

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'CAD', symbol: 'C$', label: 'CAD (C$)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' }
];

const CopyIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const SalaryNegotiationModal = ({ job, user, isOpen, onClose, onRefresh, toast }) => {
  // Inputs
  const [offeredSalary, setOfferedSalary] = useState('');
  const [targetSalary, setTargetSalary] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [location, setLocation] = useState('');

  // Results & UI states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [negotiationData, setNegotiationData] = useState(null);

  // Initialize values
  useEffect(() => {
    if (job) {
      const neg = job.salaryNegotiation || {};
      setOfferedSalary(neg.offeredSalary || '');
      setTargetSalary(neg.targetSalary || '');
      setCurrency(neg.currency || 'USD');
      setLocation(neg.location || job.location || user?.resumeData?.personalInfo?.location || '');
      setNegotiationData(job.salaryNegotiation?.generatedAt ? job.salaryNegotiation : null);
    }
  }, [job, user]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
    }
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Run AI & search-grounding benchmarks
  const handleGenerate = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.post(
        `${BACKEND}/jobs/${job._id}/salary-negotiation`,
        {
          offeredSalary: offeredSalary ? Number(offeredSalary) : null,
          targetSalary: targetSalary ? Number(targetSalary) : null,
          currency,
          location
        },
        { withCredentials: true, timeout: 90000 }
      );

      if (res.data.success) {
        setNegotiationData(res.data.salaryNegotiation);
        setSuccess('Market analysis and counter-offer email generated successfully!');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to conduct market salary research.');
    } finally {
      setLoading(false);
    }
  };

  // Save manual modifications (email draft edits, slider values)
  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const updatedNegotiation = {
        ...job.salaryNegotiation,
        offeredSalary: offeredSalary ? Number(offeredSalary) : null,
        targetSalary: targetSalary ? Number(targetSalary) : null,
        currency,
        location,
        emailDraft: negotiationData?.emailDraft || ''
      };

      await axios.patch(
        `${BACKEND}/jobs/${job._id}`,
        { salaryNegotiation: updatedNegotiation },
        { withCredentials: true }
      );

      setSuccess('Negotiation details saved to job profile.');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setError('Failed to save salary negotiation changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (negotiationData?.emailDraft) {
      navigator.clipboard.writeText(negotiationData.emailDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (toast) toast('Email draft copied to clipboard!');
    }
  };

  // Visual Salary Range Calculations
  const renderVisualScale = () => {
    if (!negotiationData?.benchmarks) return null;

    const parseSalary = (val) => {
      if (val === undefined || val === null) return 0;
      const cleaned = String(val).replace(/[^0-9.]/g, '');
      const num = Number(cleaned);
      return isNaN(num) ? 0 : num;
    };

    const offer = parseSalary(offeredSalary);
    const target = parseSalary(targetSalary);

    let low = parseSalary(negotiationData.benchmarks.low);
    let average = parseSalary(negotiationData.benchmarks.average);
    let high = parseSalary(negotiationData.benchmarks.high);

    // Dynamic fallbacks if parsing results in 0
    if (low === 0) low = offer ? Math.round(offer * 0.85) : 80000;
    if (average === 0) average = offer ? offer : (target ? target : 100000);
    if (high === 0) high = target ? Math.round(target * 1.2) : Math.round(average * 1.25);

    const minScale = Math.min(low, offer || low, target || low) * 0.85;
    const maxScale = Math.max(high, offer || high, target || high) * 1.15;
    const range = maxScale - minScale;

    const getPct = (val) => {
      if (range <= 0) return 50;
      return Math.min(95, Math.max(5, ((val - minScale) / range) * 100));
    };

    const formatVal = (val) => {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0
      }).format(val);
    };

    return (
      <div className="bg-slate-50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-5 my-3 shadow-sm">
        <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-8">
          Visual Market Benchmark Comparison
        </h4>
        
        <div className="relative h-2 bg-slate-200 dark:bg-zinc-700 rounded-full my-12">
          {/* Market Range Fill */}
          <div 
            className="absolute h-2 bg-emerald-100 dark:bg-emerald-950/30 rounded-full"
            style={{ left: `${getPct(low)}%`, right: `${100 - getPct(high)}%` }}
          />

          {/* Low Marker */}
          <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center -translate-x-1/2" style={{ left: `${getPct(low)}%` }}>
            <div className="w-2 h-3.5 bg-slate-400 dark:bg-zinc-500 rounded-full border border-white dark:border-zinc-800" />
            <span className="text-[10px] text-slate-500 dark:text-zinc-450 font-bold mt-1">Low</span>
            <span className="text-[9px] font-mono text-slate-600 dark:text-zinc-350">{formatVal(low)}</span>
          </div>

          {/* Average Marker */}
          <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center -translate-x-1/2" style={{ left: `${getPct(average)}%` }}>
            <div className="w-3 h-5 bg-indigo-500 rounded-full border border-white dark:border-zinc-800 shadow-sm" />
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold mt-1">Market Avg</span>
            <span className="text-[9px] font-mono text-indigo-700 dark:text-indigo-300 font-bold">{formatVal(average)}</span>
          </div>

          {/* High Marker */}
          <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center -translate-x-1/2" style={{ left: `${getPct(high)}%` }}>
            <div className="w-2 h-3.5 bg-slate-400 dark:bg-zinc-500 rounded-full border border-white dark:border-zinc-800" />
            <span className="text-[10px] text-slate-500 dark:text-zinc-450 font-bold mt-1">High</span>
            <span className="text-[9px] font-mono text-slate-600 dark:text-zinc-350">{formatVal(high)}</span>
          </div>

          {/* Offer Pin (Emerald) */}
          {offer > 0 && (
            <div className="absolute -top-7 flex flex-col items-center -translate-x-1/2 z-10" style={{ left: `${getPct(offer)}%` }}>
              <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                🎁 Offered: {formatVal(offer)}
              </span>
              <div className="w-2 h-2 bg-emerald-500 rotate-45 mt-0.5" />
            </div>
          )}

          {/* Target Pin (Indigo) */}
          {target > 0 && (
            <div className="absolute -bottom-11 flex flex-col items-center -translate-x-1/2 z-10" style={{ left: `${getPct(target)}%` }}>
              <div className="w-2 h-2 bg-indigo-500 rotate-45 mb-0.5" />
              <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                🎯 Target: {formatVal(target)}
              </span>
            </div>
          )}
        </div>
        
        {negotiationData.benchmarks.marketInsights && (
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-6 leading-relaxed italic">
            💡 {negotiationData.benchmarks.marketInsights}
          </p>
        )}
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-5xl bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md border border-slate-205 dark:border-zinc-800 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col max-h-[85vh] overflow-hidden transform transition-all duration-300 scale-100 animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0 bg-gradient-to-r from-emerald-50/40 via-slate-50/50 to-emerald-50/40 dark:from-emerald-950/10 dark:via-zinc-900/10 dark:to-emerald-950/10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-100/50 dark:border-emerald-500/20">
              Salary Negotiation Agent
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1.5 flex items-center gap-2">
              Salary Research & Counter-Offer Generator
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Position: <span className="font-semibold text-slate-800 dark:text-slate-205">{job.job}</span> • Company: <span className="font-semibold text-slate-800 dark:text-slate-205">{job.companyName || '—'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 min-h-0">
          {/* Left Panel: Negotiation Details / Inputs */}
          <div className="lg:col-span-4 flex flex-col min-h-0 gap-4 overflow-y-auto pr-1">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Offer Parameters
              </h4>

              {/* Currency */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 text-slate-800 dark:text-slate-200 font-semibold"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Offered Salary */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                  Offered Base Salary
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-slate-400 dark:text-zinc-550 text-xs font-bold font-mono">
                      {CURRENCIES.find(c => c.code === currency)?.symbol || '$'}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={offeredSalary}
                    onChange={(e) => setOfferedSalary(e.target.value)}
                    placeholder="e.g. 95000"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 text-slate-800 dark:text-slate-200 font-semibold font-mono"
                  />
                </div>
              </div>

              {/* Target Salary */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                  Target Salary Goal
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-slate-400 dark:text-zinc-550 text-xs font-bold font-mono">
                      {CURRENCIES.find(c => c.code === currency)?.symbol || '$'}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={targetSalary}
                    onChange={(e) => setTargetSalary(e.target.value)}
                    placeholder="e.g. 115000"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 text-slate-800 dark:text-slate-200 font-semibold font-mono"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                  Location (for salary lookup)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. New York City, NY or Remote"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 text-slate-800 dark:text-slate-200 font-semibold"
                />
                <p className="text-[10px] text-slate-400 dark:text-zinc-550 mt-1">
                  Leave blank to auto-detect location context from job application details.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/15 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer border-0"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Researching Salary Market...</span>
                    </>
                  ) : (
                    <>
                      <WandIcon size={13} />
                      <span>Conduct AI Research & Draft</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Benchmarks & AI Insights */}
          <div className="lg:col-span-8 flex flex-col min-h-0 gap-4 overflow-y-auto">
            {loading ? (
              <div className="flex-1 border border-slate-100 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20 flex flex-col items-center justify-center p-6 text-sm text-slate-400 dark:text-zinc-500 leading-normal min-h-[380px] animate-pulse">
                <div className="w-8 h-8 border-3 border-emerald-650 border-t-transparent rounded-full animate-spin mb-4" />
                <span className="font-bold text-slate-600 dark:text-zinc-400 mb-1">Retrieving Live Grounded Data</span>
                <span className="text-xs text-slate-400 dark:text-zinc-500 max-w-md text-center">
                  AI is searching LinkedIn, Indeed, Glassdoor, and other salary indexers for {job.job} salaries in {location || 'target location'}...
                </span>
              </div>
            ) : negotiationData ? (
              <div className="space-y-6">
                {/* Visual Scale */}
                {renderVisualScale()}

                {/* Grounding Sources */}
                {negotiationData.sources?.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest flex items-center gap-1.5">
                      <GlobeIcon size={12} className="text-slate-400" />
                      Verified Search Grounding Sources
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {negotiationData.sources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-150 dark:border-zinc-750 text-slate-700 dark:text-zinc-300 transition-colors shadow-sm"
                        >
                          <LinkIcon size={9} />
                          {src.title.length > 25 ? src.title.slice(0, 22) + '…' : src.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Talking Points */}
                {negotiationData.talkingPoints?.length > 0 && (
                  <div className="space-y-2.5">
                    <h5 className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-widest">
                      AI Negotiation Value Props
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-650 dark:text-zinc-400">
                      {negotiationData.talkingPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-slate-50/50 dark:bg-zinc-950/10 p-2 border border-slate-100 dark:border-zinc-800/40 rounded-xl leading-relaxed">
                          <span className="text-emerald-500 font-bold text-sm leading-none mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Counter Offer Email Editor */}
                {negotiationData.emailDraft && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-widest">
                        Custom Counter-Offer Email
                      </h5>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-zinc-750 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                      >
                        {copied ? '✅ Copied!' : <><CopyIcon size={12} /> Copy Draft</>}
                      </button>
                    </div>

                    <textarea
                      value={negotiationData.emailDraft}
                      onChange={(e) => setNegotiationData({ ...negotiationData, emailDraft: e.target.value })}
                      className="w-full p-4 text-xs font-mono border border-slate-250 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-950/40 text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 resize-none overflow-y-auto leading-relaxed h-72"
                      placeholder="Draft email will appear here..."
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-6 text-sm text-slate-400 dark:text-zinc-550 leading-normal min-h-[380px]">
                <div className="text-4xl mb-3">📈</div>
                <span className="font-bold text-slate-600 dark:text-zinc-400 mb-1">Negotiation Agent Standby</span>
                <span className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm text-center">
                  Fill in your base offer and target salary goals on the left, then click research to pull market indexes and draft your strategy.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Global Feedback Banner */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs font-semibold text-red-700 dark:text-red-400 animate-fade-in flex items-center gap-2">
            <span className="text-red-500 text-sm">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-6 mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 animate-fade-in flex items-center gap-2">
            <span className="text-emerald-500 text-sm">✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4.5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 shrink-0">
          {saving && (
            <div className="mr-auto text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <div className="w-3.5 h-3.5 border border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span>Saving draft updates...</span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-205 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-400 hover:bg-slate-105 dark:hover:bg-zinc-800 transition-colors cursor-pointer select-none"
          >
            Close
          </button>
          {negotiationData && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer select-none border-0"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-sm font-bold">✓</span>
              )}
              {saving ? 'Saving...' : 'Save Strategy'}
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};

export default SalaryNegotiationModal;
