import React, { useState } from 'react';
import axios from 'axios';
import { EditIcon, TrashIcon, BriefcaseIcon, ChevronDownIcon, ClockIcon } from './Icons';

const BACKEND = 'http://localhost:3000';

// ─── ATS Score Ring (encapsulated copy) ───────────────────────────────────────
const AtsRing = ({ score }) => {
  if (score == null) return <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">No ATS</span>;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = 12, cx = 15, cy = 15, circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-1">
      <svg width="30" height="30" viewBox="0 0 30 30">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-100 dark:text-zinc-800" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round" transform="rotate(-90 15 15)" />
        <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize="8" fontWeight="800" fill={color}>{score}</text>
      </svg>
    </div>
  );
};

// ─── Status Badge (encapsulated copy) ─────────────────────────────────────────
const StatusBadge = ({ sent, opened, clicked, hasReply }) => {
  if (hasReply) return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/10">Replied</span>;
  if (opened) return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/10 font-medium">Opened</span>;
  if (sent) return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/10">Sent</span>;
  return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/10">Pending</span>;
};

// ─── Main Kanban Board ────────────────────────────────────────────────────────
const KanbanBoard = ({ jobs, setJobs, onRefresh, onEdit, onDelete, onSelectJob, toast }) => {
  const [draggedJobId, setDraggedJobId] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);

  const columns = [
    { id: 'saved', name: 'Saved', color: 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/10' },
    { id: 'applied', name: 'Applied', color: 'border-indigo-100 dark:border-indigo-950 bg-indigo-50/20 dark:bg-indigo-950/5' },
    { id: 'opened', name: 'Opened', color: 'border-blue-100 dark:border-blue-950 bg-blue-50/20 dark:bg-blue-950/5' },
    { id: 'interview', name: 'Interview', color: 'border-purple-100 dark:border-purple-950 bg-purple-50/20 dark:bg-purple-950/5' },
    { id: 'offer', name: 'Offer', color: 'border-emerald-100 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/5' },
    { id: 'rejected', name: 'Rejected', color: 'border-rose-100 dark:border-rose-950 bg-rose-50/20 dark:bg-rose-950/5' },
  ];

  const handleDragStart = (e, jobId, originalStatus) => {
    setDraggedJobId(jobId);
    e.dataTransfer.setData('jobId', jobId);
    e.dataTransfer.setData('originalStatus', originalStatus);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDraggedOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const jobId = e.dataTransfer.getData('jobId') || draggedJobId;
    const originalStatus = e.dataTransfer.getData('originalStatus');

    if (!jobId || originalStatus === targetStatus) return;

    // Optimistic client-side state update
    const originalJobs = [...jobs];
    setJobs(prevJobs => prevJobs.map(j => j._id === jobId ? { ...j, status: targetStatus } : j));

    try {
      await axios.patch(`${BACKEND}/jobs/${jobId}`, { status: targetStatus });
      toast.success(`Moved job to ${targetStatus}`);
      onRefresh(); // Refresh details (like statusHistory)
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to update job status.');
      setJobs(originalJobs); // Revert state on API failures
    } finally {
      setDraggedJobId(null);
    }
  };

  return (
    <div className="overflow-x-auto pb-4 -mx-5 px-5">
      <div className="flex gap-4 min-w-[1100px] h-[calc(100vh-230px)]">
        {columns.map(col => {
          const colJobs = jobs.filter(j => (j.status || 'saved') === col.id);
          const isOver = draggedOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex-1 flex flex-col rounded-xl border p-3 transition-all duration-200 ${col.color} ${
                isOver ? 'ring-2 ring-indigo-500/30 border-indigo-400/50 scale-[1.01]' : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100 dark:border-zinc-800">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    col.id === 'saved' ? 'bg-slate-400' :
                    col.id === 'applied' ? 'bg-indigo-500' :
                    col.id === 'opened' ? 'bg-blue-500' :
                    col.id === 'interview' ? 'bg-purple-500' :
                    col.id === 'offer' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`} />
                  {col.name}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                  {colJobs.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
                {colJobs.length === 0 ? (
                  <div className="h-full min-h-[100px] flex items-center justify-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-lg text-slate-400 dark:text-zinc-600 text-xs text-center p-4">
                    Drag items here
                  </div>
                ) : (
                  colJobs.map(job => (
                    <div
                      key={job._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, job._id, job.status || 'saved')}
                      onClick={() => onSelectJob(job)}
                      className="card p-3.5 hover:shadow-md cursor-grab active:cursor-grabbing border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all group relative overflow-hidden bg-white dark:bg-zinc-900"
                    >
                      {/* Top Row: ATS Score & Status Badge */}
                      <div className="flex items-start justify-between gap-1.5 mb-2.5">
                        <StatusBadge
                          sent={job.isEmailSent}
                          opened={job.isOpened}
                          clicked={job.linkClicksCount > 0}
                          hasReply={job.hasReply}
                        />
                        <AtsRing score={job.atsAnalysis?.score} />
                      </div>

                      {/* Job Title & Company */}
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors pr-4">
                        {job.job}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                        {job.companyName || 'Unknown Company'}
                      </p>

                      {/* Follow-up Badge Indicators */}
                      {job.followUpDate && job.followUpStatus === 'pending' && (
                        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10 w-fit">
                          <ClockIcon size={11} />
                          <span>Follow up: {new Date(job.followUpDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}

                      {/* Hover Actions Menu overlay */}
                      <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-1 py-0.5 rounded-lg shadow-sm border border-slate-150 dark:border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(job, e);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Edit job"
                        >
                          <EditIcon size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(job._id, e);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Delete job"
                        >
                          <TrashIcon size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;
