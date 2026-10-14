import React from 'react';
import { Gamepad2, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { UserSpecs } from '../types';
import { GamesSection } from '../components/GamesSection';
import { AppPage } from '../components/Navigation';

interface GamesLandingProps {
  specs: UserSpecs;
  onNavigate: (page: AppPage) => void;
}

export const GamesLanding: React.FC<GamesLandingProps> = ({
  specs,
  onNavigate,
}) => {
  return (
    <div className="pt-28 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-mono tracking-widest text-[#e8702a] font-semibold flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4" />
              Game Compatibility Landing
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
              GPU Tier: {specs.gpuTier} · {specs.gpuName.split('(')[0].trim()}
            </span>
          </div>
          <h1 className="font-playfair italic text-4xl sm:text-6xl text-white font-normal tracking-tight">
            Deterministic Game Playability Suite
          </h1>
          <p className="text-base text-zinc-300 leading-relaxed font-sans">
            Validate modern and esports PC titles against real shader throughput, VRAM allocations, and single-core frametime pacing. Live web search supports checking any unlisted title instantly.
          </p>
        </div>

        <button
          onClick={() => onNavigate('upgrade-advisor')}
          className="bg-[#e8702a] hover:bg-[#d2611f] text-white text-xs font-semibold px-6 py-3 rounded-full transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#e8702a]/20 shrink-0"
        >
          <span>Upgrade Advisor</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Games Section */}
      <GamesSection specs={specs} />
    </div>
  );
};
