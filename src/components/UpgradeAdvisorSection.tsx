import React, { useState } from 'react';
import {
  Wrench,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Flame,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { UpgradeAction, UpgradeReport, UpgradeSymptomInput, UserSpecs } from '../types';
import { analyzeUpgrades } from '../utils/upgradeAdvisor';

interface UpgradeAdvisorSectionProps {
  specs: UserSpecs;
}

export const UpgradeAdvisorSection: React.FC<UpgradeAdvisorSectionProps> = ({ specs }) => {
  const [symptoms, setSymptoms] = useState<UpgradeSymptomInput>({
    slowdownType: specs.primaryStorageType === 'hdd' ? 'boot_apps' : specs.ramGb <= 8 ? 'multitasking_tabs' : 'general_lag',
    timing: specs.primaryStorageType === 'hdd' ? 'always' : 'many_apps_open',
    budget: '50_to_150',
  });

  const report: UpgradeReport = analyzeUpgrades(specs, symptoms);

  const getPriorityStyle = (priority: UpgradeAction['priority']) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'bg-zinc-950 text-emerald-400 border-emerald-500/50';
      case 'medium':
      case 'low':
      default:
        return 'bg-zinc-950 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-16">
      {/* Questionnaire Header */}
      <div className="bg-zinc-950 border border-zinc-800 p-8 sm:p-12 shadow-2xl">
        <div className="space-y-3 pb-8 border-b border-zinc-800">
          <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-medium">
            Component Upgrade Intelligence
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl text-zinc-100 font-normal tracking-tight">
            Targeted Upgrade Advisor
          </h1>
          <p className="text-sm sm:text-base text-zinc-200 max-w-2xl font-sans">
            Most slow machines don't need replacement. A targeted $40 upgrade often resolves the critical bottleneck.
          </p>
        </div>

        {/* Symptoms Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {/* Question 1 */}
          <div className="space-y-3">
            <label className="text-xs uppercase font-mono tracking-wider text-zinc-300 font-medium">
              1. Observed Bottleneck
            </label>
            <div className="space-y-2">
              {[
                { id: 'boot_apps', label: 'Boot & App Launch', hint: 'Mechanical drive delay' },
                { id: 'multitasking_tabs', label: 'Multitasking & Tabs', hint: 'RAM allocation limits' },
                { id: 'gaming_low_fps', label: 'Choppy Framerate', hint: 'GPU compute ceiling' },
                { id: 'rendering_export', label: 'Long Render Times', hint: 'Multi-threaded CPU' },
                { id: 'general_lag', label: 'Persistent Sluggishness', hint: 'Thermal throttling' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSymptoms((prev) => ({ ...prev, slowdownType: opt.id as any }))}
                  className={`w-full p-3.5 border text-left transition-colors cursor-pointer ${
                    symptoms.slowdownType === opt.id
                      ? 'bg-zinc-900 border-emerald-500/60 text-zinc-100'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs font-medium font-serif">{opt.label}</div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Question 2 */}
          <div className="space-y-3">
            <label className="text-xs uppercase font-mono tracking-wider text-zinc-300 font-medium">
              2. Occurrence Trigger
            </label>
            <div className="space-y-2">
              {[
                { id: 'always', label: 'Continuous From Boot', hint: 'Baseline I/O limit' },
                { id: 'many_apps_open', label: 'Under Multitasking', hint: 'Pagefile thrashing' },
                { id: 'heavy_3d_only', label: 'Under 3D Real-Time Load', hint: 'VRAM capacity cap' },
                { id: 'after_20_minutes', label: 'After 20+ Mins Sustained', hint: 'Thermal throttling' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSymptoms((prev) => ({ ...prev, timing: opt.id as any }))}
                  className={`w-full p-3.5 border text-left transition-colors cursor-pointer ${
                    symptoms.timing === opt.id
                      ? 'bg-zinc-900 border-emerald-500/60 text-zinc-100'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs font-medium font-serif">{opt.label}</div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Question 3 */}
          <div className="space-y-3">
            <label className="text-xs uppercase font-mono tracking-wider text-zinc-300 font-medium">
              3. Upgrade Budget
            </label>
            <div className="space-y-2">
              {[
                { id: 'free', label: '$0: Zero Cost', hint: 'Software optimization' },
                { id: 'under_50', label: 'Under $50', hint: 'Targeted RAM or SATA SSD' },
                { id: '50_to_150', label: '$50 to $150', hint: '1TB NVMe + 32GB RAM' },
                { id: '150_to_400', label: '$150 to $400', hint: 'Discrete GPU refresh' },
                { id: 'over_400', label: '$400+ Flexible', hint: 'Complete core overhaul' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSymptoms((prev) => ({ ...prev, budget: opt.id as any }))}
                  className={`w-full p-3.5 border text-left transition-colors cursor-pointer ${
                    symptoms.budget === opt.id
                      ? 'bg-zinc-900 border-emerald-500/60 text-zinc-100'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs font-medium font-serif">{opt.label}</div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Diagnosis Verdict */}
      <div className="bg-zinc-900 border border-zinc-800 p-8 flex items-start gap-4">
        <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
        <div className="space-y-2">
          <h2 className="font-serif text-2xl text-zinc-100 font-normal">Diagnostic Verdict</h2>
          <p className="text-sm text-zinc-200 leading-relaxed font-sans max-w-3xl">
            {report.primaryVerdict}
          </p>
        </div>
      </div>

      {/* Recommended Hardware Upgrades (Grid of Prioritized Cards) */}
      {report.recommendedUpgrades.length > 0 && (
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="font-serif text-3xl sm:text-4xl text-zinc-100 font-normal tracking-tight">
              Recommended Hardware Upgrades
            </h2>
            <p className="text-xs text-zinc-400 font-mono uppercase tracking-wider">
              Prioritized by cost-to-performance ratio for {specs.formFactor} chassis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {report.recommendedUpgrades.map((upgrade, idx) => (
              <div
                key={idx}
                className="bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`text-[10px] uppercase font-mono tracking-widest px-2.5 py-1 border ${getPriorityStyle(
                        upgrade.priority
                      )}`}
                    >
                      Priority 0{idx + 1}
                    </span>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      {upgrade.estimatedCost}
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl text-zinc-100 font-normal">{upgrade.title}</h3>
                  <div className="text-xs text-zinc-400 font-mono">Component: {upgrade.component}</div>

                  <div className="space-y-3 pt-3 border-t border-zinc-800 text-xs">
                    <div>
                      <div className="font-mono text-zinc-400 uppercase tracking-wider mb-1">Expected Gain:</div>
                      <p className="text-zinc-200 font-sans">{upgrade.expectedBenefit}</p>
                    </div>
                    <div>
                      <div className="font-mono text-zinc-400 uppercase tracking-wider mb-1">Installation:</div>
                      <p className="text-zinc-300 font-sans">{upgrade.compatibilityNote}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 text-xs font-mono text-zinc-300">
                  Verdict: <span className="text-zinc-100">{upgrade.worthItVerdict}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Free Maintenance Fixes ("Don't upgrade yet!") */}
      <div className="bg-zinc-950 border border-zinc-800 p-8 sm:p-10 space-y-6">
        <div className="space-y-2">
          <h3 className="font-serif text-2xl sm:text-3xl text-zinc-100 font-normal">
            Zero-Cost Optimization Steps
          </h3>
          <p className="text-xs text-zinc-300 font-sans">
            Perform these high-impact maintenance routines before purchasing replacement silicon:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {report.freeMaintenanceFixes.map((fix, idx) => {
            const [title, desc] = fix.split(': ');
            return (
              <div key={idx} className="p-6 bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="font-serif text-lg text-zinc-100 flex items-center gap-2">
                  <span className="text-emerald-400 font-mono text-xs">0{idx + 1}.</span>
                  <span>{title}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">{desc}</p>
              </div>
            );
          })}
        </div>

        {/* Exactly one primary button for the upgrade section */}
        <div className="pt-4 border-t border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={() => {
              alert(`Diagnostic Action Plan copied. Verify physical chassis clearance before purchasing components.`);
            }}
            className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <span>Save Component Roadmap</span>
            <CheckCircle2 className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
