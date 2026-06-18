import React, { useRef, useState } from 'react';
import axios from 'axios';
import { UploadIcon, FileTextIcon, CheckCircleIcon, AlertTriangleIcon, XIcon } from './Icons';

const BACKEND = 'http://localhost:3000';

const STEPS = ['Uploading', 'Extracting text', 'AI structuring', 'Complete'];

const getFileExt = (name = '') => name.split('.').pop()?.toLowerCase() || '';

const FileTypeLabel = ({ name }) => {
  const ext = getFileExt(name);
  const map = { pdf: 'PDF', doc: 'Word', docx: 'Word', jpg: 'Image', jpeg: 'Image', png: 'Image', webp: 'Image' };
  return (
    <span className="badge badge-indigo text-[11px]">{map[ext] || ext.toUpperCase()}</span>
  );
};

const StepBar = ({ currentStep }) => (
  <div className="space-y-3">
    <div className="flex gap-1.5">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            i < currentStep
              ? 'bg-indigo-500'
              : i === currentStep
              ? 'bg-indigo-400 animate-pulse'
              : 'bg-slate-200 dark:bg-zinc-700'
          }`}
        />
      ))}
    </div>
    <p className="text-xs text-slate-500 dark:text-slate-400">
      {currentStep < STEPS.length ? STEPS[currentStep] : 'Complete'}&hellip;
    </p>
  </div>
);

const ResumeUpload = ({ user, resumeName, resumeData, onUploadSuccess, className = 'mb-6' }) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const ACCEPTED = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp'];

  const handleFile = async (file) => {
    if (!file) return;
    const ext = getFileExt(file.name);
    if (!ACCEPTED.includes(ext)) {
      setError('Accepted formats: PDF, DOCX, DOC, JPG, PNG');
      return;
    }
    setError('');
    setUploading(true);
    setCurrentStep(0);

    const t1 = setTimeout(() => setCurrentStep(1), 700);
    const t2 = setTimeout(() => setCurrentStep(2), 1600);

    try {
      const form = new FormData();
      form.append('resume', file);
      form.append('email', user?.email || '');

      const res = await axios.post(`${BACKEND}/upload-resume`, form, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });

      clearTimeout(t1);
      clearTimeout(t2);
      setCurrentStep(3);

      setTimeout(() => {
        setUploading(false);
        setCurrentStep(0);
        onUploadSuccess(res.data.resumeFileName || res.data.filename, res.data.resumeData, res.data.resumes, res.data.activeResumeId);
      }, 1000);
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      setUploading(false);
      setCurrentStep(0);
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    }
  };

  return (
    <div className={`card shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FileTextIcon size={15} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Resume</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500">PDF, DOCX, DOC, JPG, PNG — max 15 MB</p>
          </div>
        </div>
        {resumeData && (
          <span className="badge badge-success text-[11px]">
            <CheckCircleIcon size={11} />
            Parsed
          </span>
        )}
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Current file */}
        {resumeName && !uploading && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircleIcon size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 truncate">{resumeName}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">
                {resumeData ? 'AI parsed and structured' : 'Active resume'}
              </p>
            </div>
            <FileTypeLabel name={resumeName} />
          </div>
        )}

        {/* Step progress */}
        {uploading && (
          <div className="px-4 py-4 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin-slow shrink-0" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Processing your resume</span>
            </div>
            <StepBar currentStep={currentStep} />
          </div>
        )}

        {/* Drop zone */}
        {!uploading && (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
            className={`relative flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-150 ${
              dragging
                ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5'
                : 'border-slate-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-zinc-800/20 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
              id="resume-file-input"
            />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              dragging ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-zinc-700 text-slate-400 dark:text-zinc-500'
            }`}>
              <UploadIcon size={18} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {resumeName ? 'Replace resume' : 'Upload resume'}
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                Drag and drop, or click to browse
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 animate-fade-in">
            <AlertTriangleIcon size={14} className="text-red-500 dark:text-red-400 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600 transition-colors">
              <XIcon size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUpload;
