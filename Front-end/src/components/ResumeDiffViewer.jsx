import React, { useState } from 'react';
import { ChevronDownIcon } from './Icons';

import { computeArrayDiff } from '../utils/diffHelper';

// Collapsible section wrapper
const DiffSection = ({ title, hasChanges, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!hasChanges) return null; // Don't render sections with no changes

  return (
    <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{title}</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            Changes applied
          </span>
        </div>
        <span className="text-slate-400 transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ChevronDownIcon />
        </span>
      </button>
      {isOpen && (
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800">
          {children}
        </div>
      )}
    </div>
  );
};

export default function ResumeDiffViewer({ originalResume, tailoredResume }) {
  if (!originalResume || !tailoredResume) return null;

  // 1. Diff Summary
  const summaryChanged = originalResume.summary !== tailoredResume.summary;

  // 2. Diff Skills
  const oldSkills = [
    ...(originalResume.skills?.technical || []),
    ...(originalResume.skills?.soft || []),
    ...(originalResume.skills?.tools || []),
    ...(originalResume.skills?.languages || [])
  ];
  const newSkills = [
    ...(tailoredResume.skills?.technical || []),
    ...(tailoredResume.skills?.soft || []),
    ...(tailoredResume.skills?.tools || []),
    ...(tailoredResume.skills?.languages || [])
  ];
  const skillsDiff = computeArrayDiff(oldSkills, newSkills);

  // 3. Diff Experience
  const expDiffs = [];
  const newExpList = tailoredResume.experience || [];
  const oldExpList = originalResume.experience || [];

  newExpList.forEach(newExp => {
    // Try to find matching role
    const oldExp = oldExpList.find(e => e.role === newExp.role && e.company === newExp.company) || 
                   oldExpList.find(e => e.company === newExp.company);
    
    if (oldExp) {
      const achDiff = computeArrayDiff(oldExp.achievements || [], newExp.achievements || []);
      if (achDiff.hasChanges) {
        expDiffs.push({
          role: newExp.role,
          company: newExp.company,
          diff: achDiff
        });
      }
    } else {
      // Completely new experience?
      expDiffs.push({
        role: newExp.role,
        company: newExp.company,
        diff: { added: newExp.achievements || [], removed: [], unchanged: [], hasChanges: true }
      });
    }
  });

  // Check if anything changed overall
  const hasAnyChanges = summaryChanged || skillsDiff.hasChanges || expDiffs.length > 0;

  if (!hasAnyChanges) {
    return (
      <div className="text-xs text-slate-500 dark:text-zinc-400 italic p-4 text-center">
        No significant structural changes detected between original and tailored resume.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full animate-fade-in">
      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
        Review AI Edits
      </h3>
      
      <DiffSection title="Professional Summary" hasChanges={summaryChanged} defaultOpen={true}>
        <div className="flex flex-col gap-3 text-[11px] leading-relaxed">
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-slate-600 dark:text-slate-400 relative">
            <span className="absolute -top-2 left-3 bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 px-1.5 rounded text-[8px] font-bold uppercase tracking-wider">Before</span>
            {originalResume.summary}
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-slate-800 dark:text-slate-200 relative shadow-sm">
            <span className="absolute -top-2 left-3 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-1.5 rounded text-[8px] font-bold uppercase tracking-wider">After</span>
            {tailoredResume.summary}
          </div>
        </div>
      </DiffSection>

      <DiffSection title="Skills Matrix" hasChanges={skillsDiff.hasChanges} defaultOpen={true}>
        <div className="flex flex-col gap-3">
          {skillsDiff.added.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1.5">Added Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {skillsDiff.added.map((s, i) => (
                  <span key={`add-${i}`} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                    + {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {skillsDiff.removed.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1.5">Removed Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {skillsDiff.removed.map((s, i) => (
                  <span key={`rem-${i}`} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 line-through decoration-rose-300 dark:decoration-rose-500/50">
                    - {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DiffSection>

      <DiffSection title="Experience Achievements" hasChanges={expDiffs.length > 0} defaultOpen={true}>
        <div className="flex flex-col gap-5">
          {expDiffs.map((exp, i) => (
            <div key={i} className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {exp.role} <span className="text-slate-400 font-normal">at {exp.company}</span>
              </h4>
              <ul className="space-y-1.5 pl-2">
                {exp.diff.added.map((ach, j) => (
                  <li key={`add-${j}`} className="text-[11px] leading-relaxed flex gap-2 p-2 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                    <span className="text-emerald-500 font-bold shrink-0">+</span>
                    <span>{ach}</span>
                  </li>
                ))}
                {exp.diff.removed.map((ach, j) => (
                  <li key={`rem-${j}`} className="text-[11px] leading-relaxed flex gap-2 p-2 rounded bg-rose-50 dark:bg-rose-500/5 border border-rose-50 dark:border-rose-500/10 text-rose-500 dark:text-rose-400 line-through decoration-rose-300 dark:decoration-rose-500/40 opacity-75">
                    <span className="text-rose-400 font-bold shrink-0">-</span>
                    <span>{ach}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DiffSection>

    </div>
  );
}
