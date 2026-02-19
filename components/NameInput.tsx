
import React from 'react';
import { Zap } from 'lucide-react';

interface NameInputProps {
  onStart: () => void;
}

const NameInput: React.FC<NameInputProps> = ({ onStart }) => {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter neon-text italic uppercase leading-none">
            Oracle of Order
          </h1>
          <div className="flex items-center justify-center gap-4">
             <div className="h-px w-12 bg-gradient-to-r from-transparent to-violet-500"></div>
             <span className="text-violet-400 uppercase tracking-[1em] text-[0.6rem] font-black">Divine Rotation</span>
             <div className="h-px w-12 bg-gradient-to-l from-transparent to-violet-500"></div>
          </div>
        </div>
        <p className="text-slate-400 text-xl font-light tracking-wide max-w-lg mx-auto leading-relaxed">
          The mystical guide for student groups to determine their sharing ritual through the reading of cosmic signs.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center pt-8">
        <button
          onClick={onStart}
          className="group relative w-full max-w-md bg-white/5 hover:bg-violet-600/10 border border-white/10 py-10 rounded-[3rem] font-black text-3xl flex flex-col items-center justify-center gap-4 transition-all duration-500 overflow-hidden shadow-[0_0_50px_-12px_rgba(139,92,246,0.3)] hover:shadow-violet-500/40 hover:-translate-y-1 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative bg-violet-600/20 p-5 rounded-full mb-2 group-hover:scale-110 transition-transform duration-500">
            <Zap size={48} className="text-yellow-400 fill-yellow-400 animate-pulse" />
          </div>
          
          <span className="relative tracking-tighter italic uppercase text-white group-hover:text-violet-200 transition-colors">
            Quick Decree
          </span>
          
          <span className="relative text-xs uppercase tracking-[0.4em] text-slate-500 font-bold group-hover:text-slate-400 transition-colors">
            Initiate the Ritual
          </span>
        </button>
        
        <p className="mt-12 text-center text-xs text-slate-600 font-black tracking-[0.5em] uppercase animate-pulse">
          Awaiting your command...
        </p>
      </div>
    </div>
  );
};

export default NameInput;
