import React from 'react';

export default function ConfirmModal({ isOpen, title = "Confirm Action", message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white/75 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[24px] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.25)] border border-slate-200/60 dark:border-zinc-800/60 p-6 max-w-sm w-full space-y-4 animate-scale-in">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-wider">{title}</h3>
          <p className="text-xs text-slate-550 dark:text-zinc-400 mt-2 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 text-xs font-bold text-slate-650 dark:text-zinc-400 bg-slate-100/70 dark:bg-zinc-850/70 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer border-0"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer border-0"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
