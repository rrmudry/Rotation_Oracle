
import React, { useEffect, useState, useRef } from 'react';
import { AppState, RotationDirection, OracleResult } from '../types';
import { Loader2, RotateCw, RotateCcw, Sparkles, ArrowRightCircle, Volume2, AudioLines, Key, AlertCircle } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

interface OracleSpinnerProps {
  state: AppState;
  names: string[];
  result: OracleResult | null;
  onFinishStep: () => void;
  onRestart: () => void;
  onQuotaError?: () => void;
}

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const OracleSpinner: React.FC<OracleSpinnerProps> = ({ state, result, onFinishStep, onRestart, onQuotaError }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [cachedBuffer, setCachedBuffer] = useState<AudioBuffer | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [revealedChars, setRevealedChars] = useState(0);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const [prefetechAttemptedFor, setPrefetechAttemptedFor] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Pre-fetch audio as soon as result is available
  useEffect(() => {
    const prefetch = async () => {
      if (!result || cachedBuffer || isLoadingAudio || prefetechAttemptedFor === result.criteria.title) return;

      setPrefetechAttemptedFor(result.criteria.title);
      setIsLoadingAudio(true);
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `${result.criteria.title}. ${result.criteria.description}`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const buffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
          setCachedBuffer(buffer);
        }
      } catch (error: any) {
        console.error("Pre-fetch TTS failed:", error);
      } finally {
        setIsLoadingAudio(false);
      }
    };

    prefetch();
  }, [result, cachedBuffer, isLoadingAudio]);

  // Auto-play when ready
  useEffect(() => {
    if (state === AppState.DECREE && cachedBuffer && !hasAutoPlayed && !isSpeaking) {
      setHasAutoPlayed(true);
      speakDecree();
    }
  }, [state, cachedBuffer, hasAutoPlayed, isSpeaking]);

  // Text reveal animation logic
  useEffect(() => {
    if (isSpeaking && result) {
      const fullText = result.criteria.description;
      const duration = cachedBuffer ? cachedBuffer.duration * 1000 : 3000;
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
      // If not speaking, show all text (e.g. after it finishes or if it hasn't started)
      if (hasAutoPlayed) setRevealedChars(result.criteria.description.length);
    }
  }, [isSpeaking, result, cachedBuffer, hasAutoPlayed]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (state === AppState.THINKING) {
      timeout = setTimeout(onFinishStep, 1500);
    }
    return () => clearTimeout(timeout);
  }, [state, onFinishStep]);

  const speakWithWebSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

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

  const speakDecree = async () => {
    if (!result || isSpeaking) return;

    // Resume context if suspended (browser policy)
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (cachedBuffer) {
      playBuffer(cachedBuffer);
      return;
    }

    // Fallback if not cached yet
    setIsSpeaking(true);
    setTtsError(null);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `${result.criteria.title}. ${result.criteria.description}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
        setCachedBuffer(audioBuffer);
        playBuffer(audioBuffer);
      } else {
        // No audio data in response, try web speech
        speakWithWebSpeech(`${result.criteria.title}. ${result.criteria.description}`);
      }
    } catch (error: any) {
      console.error("TTS failed, using fallback:", error);
      // Fallback to browser TTS
      speakWithWebSpeech(`${result.criteria.title}. ${result.criteria.description}`);

      if (error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("400")) {
        setTtsError(error?.message?.includes("400") ? "API Key Invalid" : "API Quota exceeded");
        if (onQuotaError) onQuotaError();
      }
    }
  };

  const playBuffer = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    setIsSpeaking(true);
    source.onended = () => setIsSpeaking(false);
    source.start();
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // After selecting, the environment variable is updated. We restart.
      onRestart();
    }
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
                {/* Loading state indicator */}
                {isLoadingAudio && !cachedBuffer && !isSpeaking && (
                  <div className="absolute inset-0 bg-violet-500/10 animate-pulse" />
                )}

                {isSpeaking ? (
                  <AudioLines size={14} className="text-violet-400 animate-pulse" />
                ) : isLoadingAudio && !cachedBuffer ? (
                  <Loader2 size={14} className="text-slate-500 animate-spin" />
                ) : (
                  <Volume2 size={14} className="text-slate-400 group-hover:text-white transition-colors" />
                )}

                <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-300 group-hover:text-white transition-colors">
                  {isSpeaking
                    ? 'PROCLAIMING'
                    : isLoadingAudio && !cachedBuffer
                      ? 'PREPARING VOICE...'
                      : 'REPLAY DECREE'}
                </span>
              </button>

              {ttsError && (
                <div className="flex flex-col items-center gap-2 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 text-rose-400 text-[0.6rem] font-bold uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                    <AlertCircle size={10} /> {ttsError}
                  </div>
                  <button
                    onClick={handleOpenKeySelector}
                    className="flex items-center gap-2 text-[0.55rem] font-black text-violet-400 hover:text-violet-300 uppercase tracking-[0.2em] underline decoration-violet-500/30"
                  >
                    <Key size={10} /> Use Personal API Key
                  </button>
                </div>
              )}
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
          <div className="relative h-24 w-24">
            <Loader2 className="w-full h-full text-violet-500 animate-spin" strokeWidth={1} />
            <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full"></div>
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
