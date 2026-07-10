import { useState } from 'react';

// ─── Toast system ─────────────────────────────────────────────────────────────
let _toastId = 0;
export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const show = (msg, type = 'success') => {
    const id = ++_toastId;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };
  return { toasts, success: msg => show(msg, 'success'), error: msg => show(msg, 'error'), info: msg => show(msg, 'info') };
};

export const ToastContainer = ({ toasts }) => (
  <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`px-4 py-3 rounded-xl text-sm font-medium shadow-lg border backdrop-blur animate-fade-in pointer-events-auto ${
        t.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' :
        t.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20' :
        'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
      }`}>
        {t.msg}
      </div>
    ))}
  </div>
);
