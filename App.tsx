
import React, { useState, useCallback } from 'react';
import { AppState, RotationDirection, OracleResult } from './types';
import NameInput from './components/NameInput';
import OracleSpinner from './components/OracleSpinner';
import { fetchCreativeCriteria } from './services/geminiService';
import { Sparkles, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<OracleResult | null>(null);

  const resetOracle = useCallback(() => {
    setState(AppState.IDLE);
    setResult(null);
  }, []);

  const initiateRitual = async () => {
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
        {state === AppState.IDLE ? (
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
        </div>
      </footer>
    </div>
  );
};

export default App;
