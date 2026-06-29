import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { BriefcaseIcon, ClockIcon, MailIcon, CheckCircleIcon, RefreshIcon } from './Icons';
import { setAnalytics } from '../store/jobsSlice';

const BACKEND = 'http://localhost:3000';

const MetricCard = ({ title, value, subtext, Icon, colorClass }) => (
  <div className="card p-5 shadow-sm flex items-center justify-between">
    <div className="space-y-1">
      <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      {subtext && <p className="text-[11px] text-slate-400 dark:text-zinc-600">{subtext}</p>}
    </div>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
      <Icon size={20} />
    </div>
  </div>
);

const AnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const { analytics } = useSelector(state => state.jobs);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${BACKEND}/jobs/analytics`);
      dispatch(setAnalytics(res.data));
    } catch (err) {
      console.error('Failed to fetch analytics:', err.message);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Outreach Analytics</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">Real-time metrics for your job application and response rates.</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="btn-ghost p-2 rounded-lg text-text-muted hover:text-brand-primary transition-colors"
          aria-label="Refresh analytics"
        >
          <RefreshIcon size={16} />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Contacts"
          value={analytics.total}
          subtext="Added to database"
          Icon={BriefcaseIcon}
          colorClass="bg-brand-primary/10 text-brand-primary"
        />
        <MetricCard
          title="Applied"
          value={analytics.applied}
          subtext={`${analytics.pending} contacts pending`}
          Icon={CheckCircleIcon}
          colorClass="bg-brand-accent/10 text-brand-accent"
        />
        <MetricCard
          title="HR Replies"
          value={analytics.replied}
          subtext="Direct thread replies"
          Icon={MailIcon}
          colorClass="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          title="Response Time"
          value={analytics.avgReplyTimeHours ? `${analytics.avgReplyTimeHours}h` : '—'}
          subtext="Avg time to get reply"
          Icon={ClockIcon}
          colorClass="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Details Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Response Rate Gauge */}
        <div className="card p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4 md:col-span-1">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Outreach Conversion Rate</p>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG circle meter */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-bg-app dark:stroke-zinc-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-brand-primary transition-all duration-1000 ease-out"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * (analytics.responseRate || 0)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-text-main">{analytics.responseRate}%</span>
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Replies</span>
            </div>
          </div>
          <p className="text-xs text-text-muted leading-relaxed px-4">
            Percentage of applications sent that have received a direct reply from a recruiter.
          </p>
        </div>

        {/* Funnel Pipeline */}
        <div className="card p-6 shadow-sm md:col-span-2 space-y-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Application Funnel Pipeline</p>

          <div className="space-y-4 pt-2">
            {/* Stage 1: Added */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-text-muted mb-1">
                <span>1. Added Contacts</span>
                <span>{analytics.total} ({analytics.total > 0 ? '100' : '0'}%)</span>
              </div>
              <div className="h-4 w-full bg-bg-app rounded-lg overflow-hidden border border-border-card/30">
                <div className="h-full bg-brand-primary rounded-lg animate-pulse" style={{ width: analytics.total > 0 ? '100%' : '0%' }} />
              </div>
            </div>

            {/* Stage 2: Applied */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-text-muted mb-1">
                <span>2. Applied Emails Dispatched</span>
                <span>{analytics.applied} ({analytics.total > 0 ? Math.round((analytics.applied / analytics.total) * 100) : 0}%)</span>
              </div>
              <div className="h-4 w-full bg-bg-app rounded-lg overflow-hidden border border-border-card/30">
                <div
                  className="h-full bg-brand-accent rounded-lg transition-all duration-500"
                  style={{ width: analytics.total > 0 ? `${(analytics.applied / analytics.total) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* Stage 3: Replied */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-text-muted mb-1">
                <span>3. Direct Replies Received</span>
                <span>{analytics.replied} ({analytics.applied > 0 ? Math.round((analytics.replied / analytics.applied) * 100) : 0}% of applied)</span>
              </div>
              <div className="h-4 w-full bg-bg-app rounded-lg overflow-hidden border border-border-card/30">
                <div
                  className="h-full bg-emerald-500 rounded-lg transition-all duration-500"
                  style={{ width: analytics.applied > 0 ? `${(analytics.replied / analytics.applied) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
          <div className="pt-2 text-xs text-text-muted flex justify-between leading-relaxed">
            <span>Keep adding contacts and applying to push more leads down the conversion funnel!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
