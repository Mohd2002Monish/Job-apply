import React from 'react';
import { ClockIcon } from './Icons';

const JobTimeline = ({ statusHistory }) => {
  if (!statusHistory || statusHistory.length === 0) {
    return <p className="text-xs text-slate-400 dark:text-zinc-500">No status updates logged yet.</p>;
  }

  const formatDuration = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours < 1) return 'less than an hour';
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  return (
    <div className="relative border-l-2 border-slate-100 dark:border-zinc-800 ml-3 space-y-6 py-2">
      {statusHistory.map((step, idx) => {
        const nextStep = statusHistory[idx + 1];
        const nextTime = nextStep ? new Date(nextStep.changedAt) : new Date();
        const durationMs = nextTime - new Date(step.changedAt);
        const durationText = formatDuration(durationMs);

        const statusColors = {
          saved: 'bg-slate-450 dark:bg-zinc-650',
          applied: 'bg-indigo-500',
          opened: 'bg-blue-500',
          interview: 'bg-purple-500',
          offer: 'bg-emerald-500',
          rejected: 'bg-rose-500',
        };

        const bgClass = statusColors[step.status] || 'bg-slate-400';

        return (
          <div key={idx} className="relative pl-6 group">
            {/* Timeline Circle Node */}
            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm flex items-center justify-center ${bgClass}`}>
              <div className="w-1 h-1 rounded-full bg-white" />
            </div>

            {/* Content Details */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-350 border border-slate-200/50 dark:border-zinc-700/50">
                  {step.status}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">
                  {new Date(step.changedAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                <ClockIcon size={11} className="text-slate-400 dark:text-zinc-500" />
                <span>
                  {nextStep ? `Stayed here for ${durationText}` : `Currently here for ${durationText}`}
                </span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default JobTimeline;
