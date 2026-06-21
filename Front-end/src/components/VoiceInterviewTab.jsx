import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { SparkleIcon, RefreshIcon, TrashIcon } from './Icons';

const BACKEND = 'http://localhost:3000';

const FILLER_WORDS = ['uh', 'um', 'like', 'so', 'actually', 'basically', 'literally'];

const Spinner = ({ size = 16, className = '' }) => (
  <div 
    className={`border-2 border-slate-350 border-t-transparent rounded-full animate-spin ${className}`} 
    style={{ width: size, height: size }}
  />
);

const AudioWaveform = ({ isRecording, stream }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    if (!isRecording || !stream) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      cleanupAudio();
      drawSilence();
      return;
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      const draw = () => {
        if (!analyserRef.current) return;
        animationRef.current = requestAnimationFrame(draw);

        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#0f172a'; // Slate 900
        if (document.documentElement.classList.contains('dark')) {
          ctx.fillStyle = '#18181b'; // Zinc 900
        }
        ctx.fillRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const percent = dataArray[i] / 255;
          const barHeight = Math.max(4, percent * height * 0.85);

          // Custom emerald/teal gradient
          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#10b981'); // Emerald 500
          gradient.addColorStop(0.5, '#14b8a6'); // Teal 500
          gradient.addColorStop(1, '#6366f1'); // Indigo 500

          ctx.fillStyle = gradient;
          
          // Draw symmetric bars from the center vertically
          const yPos = (height - barHeight) / 2;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, yPos, barWidth - 2, barHeight, 3);
          } else {
            ctx.rect(x, yPos, barWidth - 2, barHeight);
          }
          ctx.fill();

          x += barWidth;
        }
      };

      draw();
    } catch (e) {
      console.error('Audio visualizer init error:', e);
      drawSilence();
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      cleanupAudio();
    };
  }, [isRecording, stream]);

  const cleanupAudio = () => {
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch (_) {}
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch (_) {}
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const drawSilence = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#0f172a';
    if (document.documentElement.classList.contains('dark')) {
      ctx.fillStyle = '#18181b';
    }
    ctx.fillRect(0, 0, width, height);

    // Draw straight line for silence
    ctx.strokeStyle = '#334155'; // Slate 700
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };

  useEffect(() => {
    drawSilence();
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      width="380" 
      height="64" 
      className="w-full h-16 rounded-xl bg-slate-900 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-inner"
    />
  );
};

const VoiceInterviewTab = ({ job, question, onSaved, toast }) => {
  const [isSupported, setIsSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0); // in seconds
  const [pacingWpm, setPacingWpm] = useState(0);
  const [fillers, setFillers] = useState({
    uh: 0, um: 0, like: 0, so: 0, actually: 0, basically: 0, literally: 0
  });

  // API response feedback states
  const [grading, setGrading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');

  // Refs for tracking recognition and timers
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const secondsRef = useRef(0);

  // Check browser speech support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Clean timers and audio stream on unmount
  useEffect(() => {
    return () => {
      stopAllTracks();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopAllTracks = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Live fillers and WPM calculations based on text changes
  const analyzeTextMetrics = (text) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Compute live fillers count
    const newFillers = { uh: 0, um: 0, like: 0, so: 0, actually: 0, basically: 0, literally: 0 };
    words.forEach(w => {
      const cleaned = w.toLowerCase().replace(/[^a-z]/g, '');
      if (FILLER_WORDS.includes(cleaned)) {
        newFillers[cleaned] = (newFillers[cleaned] || 0) + 1;
      }
    });
    setFillers(newFillers);

    // Compute WPM pacing
    const seconds = secondsRef.current || 1;
    const computedWpm = Math.round((wordCount / seconds) * 60);
    setPacingWpm(computedWpm);
  };

  const handleStartRecording = async () => {
    setError('');
    setFeedback(null);
    setTranscript('');
    setDuration(0);
    setPacingWpm(0);
    secondsRef.current = 0;
    setFillers({ uh: 0, um: 0, like: 0, so: 0, actually: 0, basically: 0, literally: 0 });

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (e) => {
        let finalText = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalText += e.results[i][0].transcript + ' ';
          }
        }
        if (finalText) {
          setTranscript(prev => {
            const next = (prev + ' ' + finalText).trim().replace(/\s+/g, ' ');
            analyzeTextMetrics(next);
            return next;
          });
        }
      };

      recognition.onerror = (err) => {
        console.error('Speech recognition error:', err.error);
        if (err.error === 'not-allowed') {
          setError('Microphone access permission blocked. Please check browser permission settings.');
        } else {
          setError(`Speech capture issue: ${err.error}`);
        }
        handleStopRecording();
      };

      recognition.onend = () => {
        // Safe check in case of unintentional mic disconnects
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);

      // Start duration timer
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setDuration(secondsRef.current);
      }, 1000);

    } catch (err) {
      console.error(err);
      setError('Unable to access microphone. Ensure your recording device is plugged in and allowed.');
    }
  };

  const handleStopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    stopAllTracks();
    setIsRecording(false);
  };

  const handleReset = () => {
    handleStopRecording();
    setTranscript('');
    setDuration(0);
    setPacingWpm(0);
    secondsRef.current = 0;
    setFillers({ uh: 0, um: 0, like: 0, so: 0, actually: 0, basically: 0, literally: 0 });
    setFeedback(null);
    setError('');
  };

  const handleSubmitMock = async () => {
    if (!transcript.trim()) {
      setError('No speech transcribed. Please record a response before submitting.');
      return;
    }
    setError('');
    setGrading(true);

    try {
      const res = await axios.post(`${BACKEND}/jobs/${job._id}/grade-voice-answer`, {
        questionId: question._id,
        transcript,
        durationSeconds: duration,
        pacingWpm,
        fillerCount: fillers
      });

      if (res.data.success) {
        setFeedback(res.data);
        toast.success('Spoken mock response analyzed!');
        if (onSaved) onSaved(question._id, res.data.score, res.data.aiFeedback, transcript);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to submit voice answers for AI review.');
    } finally {
      setGrading(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  const getPacingColor = (wpm) => {
    if (wpm === 0) return 'text-slate-500';
    if (wpm < 110) return 'text-amber-500';
    if (wpm > 165) return 'text-red-500';
    return 'text-emerald-500';
  };

  const getPacingLabel = (wpm) => {
    if (wpm === 0) return 'Analyzing...';
    if (wpm < 110) return 'Slightly slow (aim: 110-160)';
    if (wpm > 165) return 'Slightly fast (aim: 110-160)';
    return 'Optimal pacing! Good flow';
  };

  const totalFillers = Object.values(fillers).reduce((a, b) => a + b, 0);

  if (!isSupported) {
    return (
      <div className="p-4 rounded-xl border border-rose-250 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/10 text-xs text-rose-600 dark:text-rose-455 space-y-2">
        <p className="font-bold flex items-center gap-1.5">
          <span>⚠️</span> Voice Feature Unsupported
        </p>
        <p className="leading-relaxed">
          The Web Speech API is not supported in your current browser. We highly recommend running Google Chrome, Apple Safari, or Microsoft Edge for a full real-time speech analytics experience.
        </p>
        <p className="leading-relaxed font-mono">
          You can still type notes and use the standard written answer grading feature on the notes tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visualizer Waveform */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-450 uppercase tracking-widest block">
          Speech Capture visualizer
        </label>
        <AudioWaveform isRecording={isRecording} stream={stream} />
      </div>

      {/* Rec / Control Bar */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 p-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow border-0 ${
              isRecording 
                ? 'bg-rose-550 hover:bg-rose-600 animate-pulse text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isRecording ? (
              <div className="w-3.5 h-3.5 bg-white rounded-sm" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-0.5">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
              </svg>
            )}
          </button>

          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isRecording ? 'Listening...' : 'Ready for Spoken Mock'}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
              Duration: {formatTime(duration)}
            </p>
          </div>
        </div>

        {(transcript.trim() || isRecording) && (
          <button
            onClick={handleReset}
            className="p-2 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer select-none"
            title="Reset practice"
          >
            <TrashIcon size={14} />
          </button>
        )}
      </div>

      {/* Live Metrics Row */}
      {duration > 0 && (
        <div className="grid grid-cols-2 gap-3.5 animate-fade-in">
          {/* Pacing WPM */}
          <div className="p-3 border border-slate-100 dark:border-zinc-800 rounded-xl bg-slate-50/20 dark:bg-zinc-900/10">
            <span className="text-[10px] text-slate-450 dark:text-zinc-550 uppercase font-bold tracking-wider">
              Speech Pacing (WPM)
            </span>
            <div className={`text-base font-extrabold font-mono mt-1 ${getPacingColor(pacingWpm)}`}>
              {pacingWpm} <span className="text-[9px] font-normal font-sans ml-0.5">wpm</span>
            </div>
            <div className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1">
              {getPacingLabel(pacingWpm)}
            </div>
          </div>

          {/* Filler Counters */}
          <div className="p-3 border border-slate-100 dark:border-zinc-800 rounded-xl bg-slate-50/20 dark:bg-zinc-900/10">
            <span className="text-[10px] text-slate-450 dark:text-zinc-550 uppercase font-bold tracking-wider">
              Filler Words
            </span>
            <div className={`text-base font-extrabold font-mono mt-1 ${totalFillers > 4 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {totalFillers} <span className="text-[9px] font-normal font-sans ml-0.5">detected</span>
            </div>
            <div className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1 truncate">
              uh: {fillers.uh} | um: {fillers.um} | like: {fillers.like} | so: {fillers.so}
            </div>
          </div>
        </div>
      )}

      {/* Live Transcript block */}
      {transcript.trim() && (
        <div className="space-y-1.5 animate-fade-in">
          <label className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-widest block">
            Real-Time Transcript Draft
          </label>
          <div className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-mono whitespace-pre-line max-h-40 overflow-y-auto">
            {transcript}
          </div>
        </div>
      )}

      {/* Action Button */}
      {transcript.trim() && !isRecording && !feedback && (
        <div className="pt-1">
          <button
            onClick={handleSubmitMock}
            disabled={grading}
            className="btn-primary w-full py-2.5 text-xs font-bold gap-1.5 flex items-center justify-center cursor-pointer select-none"
          >
            {grading ? (
              <>
                <Spinner size={12} />
                <span>AI Delivery Scoring...</span>
              </>
            ) : (
              <>
                <SparkleIcon />
                <span>Submit Spoken mock & Grade</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error feedback */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs font-semibold text-red-700 dark:text-red-400 animate-fade-in flex items-center gap-1.5">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Mock Scoring Analytics display */}
      {feedback && (
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/25 bg-indigo-50/20 dark:bg-indigo-500/5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-indigo-100/50 dark:border-indigo-500/10 pb-2">
            <div>
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">AI Speech Grading</p>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5">Comprehensive Delivery Audit</p>
            </div>
            
            {/* Score Ring */}
            <div className="flex items-center gap-1">
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                {feedback.score}
              </span>
              <span className="text-[10px] text-slate-400">/10</span>
            </div>
          </div>

          {/* Breakdown grids */}
          {feedback.breakdown && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-800 p-2.5 rounded-lg text-center">
                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase block">Content</span>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 font-mono mt-0.5 block">{feedback.breakdown.content}/10</span>
              </div>
              <div className="bg-white dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-800 p-2.5 rounded-lg text-center">
                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase block">Structure</span>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 font-mono mt-0.5 block">{feedback.breakdown.structure}/10</span>
              </div>
              <div className="bg-white dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-800 p-2.5 rounded-lg text-center">
                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase block">Delivery</span>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 font-mono mt-0.5 block">{feedback.breakdown.delivery}/10</span>
              </div>
            </div>
          )}

          {/* Critiques */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-455 uppercase tracking-wider block">Critique</span>
            <p className="text-xs text-slate-655 dark:text-zinc-300 leading-relaxed">{feedback.aiFeedback}</p>
          </div>

          {/* Filler analysis */}
          {feedback.fillerAnalysis && (
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-455 uppercase tracking-wider block">Speech Delivery Analysis</span>
              <p className="text-xs text-slate-655 dark:text-zinc-300 leading-relaxed">{feedback.fillerAnalysis}</p>
            </div>
          )}

          {/* Re-write draft */}
          {feedback.improvedVersion && (
            <div className="space-y-1 bg-white/50 dark:bg-zinc-950/20 border border-indigo-100/30 dark:border-indigo-500/10 p-3 rounded-lg">
              <span className="text-[9px] font-bold text-emerald-650 dark:text-emerald-450 uppercase tracking-wider block">Polished Mock Delivery Response</span>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed italic whitespace-pre-line mt-1">{feedback.improvedVersion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceInterviewTab;
