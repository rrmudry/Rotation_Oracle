
import React, { useEffect, useState, useRef } from 'react';
import { AppState, RotationDirection, OracleResult } from '../types';
import { RotateCw, RotateCcw, ArrowRightCircle, Volume2, AudioLines, Key, AlertCircle } from 'lucide-react';

interface OracleSpinnerProps {
  state: AppState;
  names: string[];
  result: OracleResult | null;
  onFinishStep: () => void;
  onRestart: () => void;
}

const OracleSpinner: React.FC<OracleSpinnerProps> = ({ state, result, onFinishStep, onRestart }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [revealedChars, setRevealedChars] = useState(0);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  // Auto-play when ready
  useEffect(() => {
    if (state === AppState.DECREE && result && !hasAutoPlayed && !isSpeaking) {
      setHasAutoPlayed(true);
      speakDecree();
    }
  }, [state, result, hasAutoPlayed, isSpeaking]);

  // Text reveal animation logic
  useEffect(() => {
    if (isSpeaking && result) {
      const fullText = result.criteria.description;
      const duration = 3000; // Expected duration for fallback TTS
      const charInterval = duration / fullText.length;

      setRevealedChars(0);
      const interval = setInterval(() => {
        setRevealedChars(prev => {
          if (prev >= fullText.length) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, charInterval);

      return () => clearInterval(interval);
    } else if (!isSpeaking && result) {
      if (hasAutoPlayed) setRevealedChars(result.criteria.description.length);
    }
  }, [isSpeaking, result, hasAutoPlayed]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (state === AppState.THINKING) {
      timeout = setTimeout(onFinishStep, 1500);
    }
    return () => clearTimeout(timeout);
  }, [state, onFinishStep]);

  const speakDecree = () => {
    if (!result || isSpeaking) return;

    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const text = `${result.criteria.title}. ${result.criteria.description}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.8;

    // Try to find a nice deep mystical voice
    const voices = window.speechSynthesis.getVoices();
    const mysticalVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Male')) || voices[0];
    if (mysticalVoice) utterance.voice = mysticalVoice;

    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  if (state === AppState.DECREE && result) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-[95vw] lg:max-w-7xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-700 py-4">
        <div className="w-full space-y-3">
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-[0.65rem] uppercase tracking-[1em] text-violet-400/60 font-black">THE ORACLE SPEAKS</h2>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={speakDecree}
                disabled={isSpeaking}
                className={`flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 transition-all duration-300 group relative overflow-hidden ${isSpeaking
                    ? 'bg-violet-500/20 border-violet-400/50 scale-105'
                    : 'bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95 shadow-lg'
                  }`}
              >
                {isSpeaking ? (
                  <AudioLines size={14} className="text-violet-400 animate-pulse" />
                ) : (
                  <Volume2 size={14} className="text-slate-400 group-hover:text-white transition-colors" />
                )}

                <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-300 group-hover:text-white transition-colors">
                  {isSpeaking
                    ? 'PROCLAIMING'
                    : 'REPLAY DECREE'}
                </span>
              </button>
            </div>
          </div>

          <h1 className="text-2xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-none w-full max-w-5xl mx-auto italic drop-shadow-2xl">
            {result.criteria.title}
          </h1>
        </div>

        <div className="glass p-8 md:p-14 rounded-[3rem] w-full border border-white/10 shadow-[0_0_80px_-20px_rgba(139,92,246,0.2)] flex flex-col items-center gap-10 min-h-[200px] justify-center">
          <p className="text-3xl md:text-5xl lg:text-7xl font-bold text-white leading-tight tracking-tight w-full max-w-[95%] text-balance">
            <span className="opacity-100">
              "{result.criteria.description.substring(0, revealedChars)}"
            </span>
            <span className="opacity-0">
              {result.criteria.description.substring(revealedChars)}"
            </span>
          </p>

          <div className={`w-full flex items-center justify-center gap-12 border-t border-white/5 pt-10 transition-all duration-1000 ${revealedChars >= result.criteria.description.length ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex flex-col items-center gap-4">
              <span className="text-slate-500 uppercase tracking-[0.6em] text-[0.7rem] font-black opacity-60">ROTATION DIRECTION</span>
              <div className="flex items-center gap-8 bg-white/5 px-10 py-4 rounded-full border border-white/10 shadow-inner">
                {result.direction === RotationDirection.CLOCKWISE ? (
                  <RotateCw className="text-emerald-400 w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
                ) : (
                  <RotateCcw className="text-indigo-400 w-8 h-8 animate-spin-reverse" style={{ animationDuration: '6s' }} />
                )}
                <span className="text-xl md:text-4xl font-black uppercase italic text-white tracking-[0.2em]">
                  {result.direction}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="group flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-[0.7rem] font-black uppercase tracking-[0.4em] opacity-40 hover:opacity-100 hover:scale-105 active:scale-95"
        >
          SEEK ANOTHER RULE <ArrowRightCircle size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full">
      {state === AppState.THINKING && (
        <div className="space-y-8 animate-pulse flex flex-col items-center">
          <div className="relative h-24 w-24 flex items-center justify-center">
            <AudioLines className="w-16 h-16 text-violet-500 animate-pulse" strokeWidth={1} />
            <div className="absolute inset-0 bg-violet-500/10 blur-xl rounded-full"></div>
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-light tracking-[0.5em] text-slate-400 uppercase italic">Reading the Signs</h2>
            <p className="text-[0.6rem] font-black tracking-[0.8em] text-violet-500/60 uppercase">Consulting the Ancients</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OracleSpinner;
