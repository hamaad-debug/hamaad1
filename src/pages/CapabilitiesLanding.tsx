import React from 'react';
import { Sparkles, ArrowRight, Target, Wrench, Gamepad2 } from 'lucide-react';
import { UserSpecs } from '../types';
import { CapabilityReportSection } from '../components/CapabilityReportSection';
import { GoalsSection } from '../components/GoalsSection';
import { AppPage } from '../components/Navigation';

interface CapabilitiesLandingProps {
  specs: UserSpecs;
  onNavigate: (page: AppPage) => void;
}

export const CapabilitiesLanding: React.FC<CapabilitiesLandingProps> = ({
  specs,
  onNavigate,
}) => {
  return (
    <div className="pt-28 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-mono tracking-widest text-[#e8702a] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Workload Capability Landing
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
              Evaluating: {specs.cpuName.split('(')[0].trim()}
            </span>
          </div>
          <h1 className="font-playfair italic text-4xl sm:text-6xl text-white font-normal tracking-tight">
            Real-World Workload Capabilities
          </h1>
          <p className="text-base text-zinc-300 leading-relaxed font-sans">
            Deterministic evaluations of what this system can truly sustain—from 4K multi-stream video editing and machine learning compilation to Docker containers and AAA gaming.
          </p>
        </div>

        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => onNavigate('upgrade-advisor')}
            className="bg-[#e8702a] hover:bg-[#d2611f] text-white text-xs font-semibold px-6 py-3 rounded-full transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#e8702a]/20"
          >
            <span>Check Upgrade Advice</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Capability Report Component */}
      <CapabilityReportSection
        specs={specs}
        onNavigateTab={(tab) => {
          if (tab === 'upgrade') onNavigate('upgrade-advisor');
          else if (tab === 'games') onNavigate('game-testing');
          else if (tab === 'goals') onNavigate('capability-evaluator');
        }}
      />

      {/* Goal Requirements Evaluator */}
      <div className="border-t border-zinc-800 pt-16 space-y-6">
        <div>
          <div className="text-xs uppercase font-mono tracking-widest text-[#e8702a] font-medium">
            Workflow Target Matrix
          </div>
          <h2 className="font-playfair italic text-3xl sm:text-4xl text-white font-normal mt-1">
            Target Goals &amp; Productivity Benchmarks
          </h2>
        </div>
        <GoalsSection specs={specs} />
      </div>
    </div>
  );
};
