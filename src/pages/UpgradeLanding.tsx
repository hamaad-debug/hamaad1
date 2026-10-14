import React from 'react';
import { Wrench, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';
import { UserSpecs } from '../types';
import { UpgradeAdvisorSection } from '../components/UpgradeAdvisorSection';
import { AppPage } from '../components/Navigation';

interface UpgradeLandingProps {
  specs: UserSpecs;
  onNavigate: (page: AppPage) => void;
}

export const UpgradeLanding: React.FC<UpgradeLandingProps> = ({
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
              <Wrench className="w-4 h-4" />
              Upgrade Economics Landing
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
              Zero Sponsor Bias
            </span>
          </div>
          <h1 className="font-playfair italic text-4xl sm:text-6xl text-white font-normal tracking-tight">
            Objective Hardware Upgrade Advisor
          </h1>
          <p className="text-base text-zinc-300 leading-relaxed font-sans">
            Calculate exact return on investment for RAM, SSD, or GPU upgrades. Identifies whether adding memory will actually fix your bottleneck or if CPU architecture ceilings require a whole-system replacement.
          </p>
        </div>

        <button
          onClick={() => onNavigate('game-testing')}
          className="bg-[#e8702a] hover:bg-[#d2611f] text-white text-xs font-semibold px-6 py-3 rounded-full transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#e8702a]/20 shrink-0"
        >
          <span>Verify Game Frame Rates</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Upgrade Section */}
      <UpgradeAdvisorSection specs={specs} />
    </div>
  );
};
