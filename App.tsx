
import React, { useState, useCallback, useEffect } from 'react';
import { AppState, RotationDirection, OracleResult } from './types';
import NameInput from './components/NameInput';
import OracleSpinner from './components/OracleSpinner';
import { fetchCreativeCriteria, ApiQuotaError } from './services/geminiService';
import { Sparkles, Key, AlertCircle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<OracleResult | null>(null);
  const [quotaError, setQuotaError] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const resetOracle = useCallback(() => {
    setState(AppState.IDLE);
    setResult(null);
    setQuotaError(false);
  }, []);

  const openKeySelector = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
      setQuotaError(false);
      initiateRitual(); // Retry automatically
    }
  };

  const initiateRitual = async () => {
    setQuotaError(false);
    setState(AppState.THINKING);
    
    try {
      const criteria = await fetchCreativeCriteria(true);
      const chosenDirection = Math.random() > 0.5 ? RotationDirection.CLOCKWISE : RotationDirection.COUNTER_CLOCKWISE;
      
      setResult({
        direction: chosenDirection,
        criteria
      });
    } catch (error) {
      console.error("Ritual failed", error);
      if (error instanceof ApiQuotaError) {
        setQuotaError(true);
      }
      setState(AppState.IDLE);
    }
  };

  const handleNextStep = useCallback(() => {
    setState(prev => {
      if (prev === AppState.THINKING) return AppState.DECREE;
      return prev;
    });
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden selection:bg-violet-500/30">
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/5 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/5 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-white/20 rounded-full blur-[1px]"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.4,
              animation: `float ${Math.random() * 10 + 10}s infinite ease-in-out`
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-40px) translateX(20px); }
        }
      `}</style>

      <main className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        {quotaError ? (
          <div className="glass p-12 rounded-[3rem] border border-rose-500/20 text-center space-y-8 animate-in zoom-in-95 duration-500 max-w-xl">
            <div className="bg-rose-500/10 p-6 rounded-full w-fit mx-auto border border-rose-500/30">
              <AlertCircle size={48} className="text-rose-400" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">API Quota Exceeded</h2>
              <p className="text-slate-400 leading-relaxed">
                The global oracle service is currently overloaded. To continue the ritual, please provide your own Gemini API key.
              </p>
              <div className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest bg-white/5 p-4 rounded-2xl border border-white/5">
                Ensure billing is enabled at <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-violet-400 hover:text-violet-300 transition-colors">ai.google.dev/billing</a>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={openKeySelector}
                className="flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-500 text-white font-black uppercase tracking-[0.2em] py-5 px-10 rounded-full shadow-[0_0_30px_-5px_rgba(139,92,246,0.6)] transition-all active:scale-95"
              >
                <Key size={20} /> Use My Personal Key
              </button>
              <button
                onClick={resetOracle}
                className="text-slate-500 hover:text-white text-xs font-black uppercase tracking-[0.3em] transition-colors"
              >
                Back to Start
              </button>
            </div>
          </div>
        ) : state === AppState.IDLE ? (
          <NameInput 
            onStart={initiateRitual} 
          />
        ) : (
          <OracleSpinner 
            state={state} 
            names={[]} 
            result={result} 
            onFinishStep={handleNextStep} 
            onRestart={resetOracle}
            onQuotaError={() => setQuotaError(true)}
          />
        )}
      </main>

      <footer className="fixed bottom-10 left-0 right-0 text-center pointer-events-none opacity-30 select-none">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-3 text-[0.6rem] uppercase tracking-[0.5em] font-black">
            <Sparkles size={12} className="text-violet-400" />
            <span>Oracle of Order &bull; Cosmic Rotation Guide</span>
            <Sparkles size={12} className="text-violet-400" />
          </div>
          {hasKey && (
            <div className="flex items-center gap-2 text-[0.5rem] font-bold text-emerald-400/60 uppercase tracking-widest">
              <Key size={8} /> Using Personal Key
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default App;
