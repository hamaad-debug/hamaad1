import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  Share2,
  Check,
  Target,
  Wrench,
  Gamepad2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CapabilityItem, CapabilityRating, UserSpecs } from '../types';
import { evaluateCapabilities } from '../utils/capabilityEvaluator';

interface CapabilityReportSectionProps {
  specs: UserSpecs;
  onNavigateTab: (tab: 'goals' | 'upgrade' | 'games') => void;
}

export const CapabilityReportSection: React.FC<CapabilityReportSectionProps> = ({
  specs,
  onNavigateTab,
}) => {
  const capabilities = evaluateCapabilities(specs);
  const [copied, setCopied] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getRatingBadge = (rating: CapabilityRating) => {
    switch (rating) {
      case 'excellent':
      case 'capable':
        return {
          color: 'text-emerald-400 bg-zinc-950 border-emerald-500/40',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'compromise':
      case 'limited':
        return {
          color: 'text-zinc-300 bg-zinc-950 border-zinc-700',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'unsupported':
      default:
        return {
          color: 'text-zinc-400 bg-zinc-950 border-zinc-800',
          icon: <XCircle className="w-3.5 h-3.5 text-zinc-500" />,
        };
    }
  };

  const handleCopyReport = () => {
    const text = `Hardware Capability Report for ${specs.cpuName} / ${specs.gpuName} / ${specs.ramGb}GB RAM:\n` +
      capabilities.map((c) => `- ${c.title}: ${c.ratingLabel} (${c.summary})`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-16">
      {/* Top Hero / Verdict */}
      <div className="bg-zinc-950 border border-zinc-800 p-8 sm:p-12 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-zinc-800">
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-medium">
              Objective Workload Intelligence
            </div>
            <h1 className="font-serif text-4xl sm:text-6xl text-zinc-100 font-normal tracking-tight">
              Hardware Capability Report
            </h1>
            <p className="text-sm sm:text-base text-zinc-200 max-w-2xl font-sans">
              Rule-based evaluation of real-world computing thresholds. Transparent verdicts without marketing exaggeration.
            </p>
          </div>

          {/* Exactly one primary button for this section */}
          <div>
            <button
              onClick={handleCopyReport}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
            >
              {copied ? <Check className="w-4 h-4 stroke-[2]" /> : <Share2 className="w-4 h-4 stroke-[1.5]" />}
              <span>{copied ? 'Summary Copied' : 'Export Executive Summary'}</span>
            </button>
          </div>
        </div>

        {/* System Summary Bar */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex flex-wrap items-center gap-6 text-xs text-zinc-300 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Class:</span>
            <span className="font-semibold text-emerald-400 uppercase">{specs.deviceType || specs.formFactor}</span>
          </div>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">CPU:</span>
            <span className="font-semibold text-zinc-100">{specs.cpuName}</span>
          </div>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">GPU:</span>
            <span className="font-semibold text-zinc-100">{specs.gpuName}</span>
          </div>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">RAM:</span>
            <span className="font-semibold text-zinc-100">{specs.ramGb}GB {specs.ramType}</span>
          </div>
        </div>
      </div>

      {/* Capability Cards Grid (2-column strict grid, high whitespace) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {capabilities.map((item) => {
          const badge = getRatingBadge(item.rating);

          return (
            <div
              key={item.id}
              className="bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-serif text-2xl text-zinc-100 font-normal tracking-tight">
                    {item.title}
                  </h3>
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-mono uppercase tracking-wider border ${badge.color}`}
                  >
                    {badge.icon}
                    <span>{item.ratingLabel}</span>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-sm text-zinc-200 leading-relaxed font-sans">{item.summary}</p>

                {/* Bottleneck Warning */}
                {item.keyBottleneck && (
                  <div className="p-4 bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-zinc-100 font-medium">Silicon Ceiling: </strong>
                      {item.keyBottleneck}
                    </div>
                  </div>
                )}

                {/* Real-world bullet points */}
                <div className="space-y-2 text-xs text-zinc-300 font-sans pt-2">
                  {item.realWorldDetails.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-mono">/</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Tip */}
              <div className="pt-4 border-t border-zinc-800 text-xs text-zinc-300 font-mono">
                {item.recommendedSettings ? (
                  <span>Guideline: <span className="text-zinc-100">{item.recommendedSettings}</span></span>
                ) : (
                  <span>Operating within rated thermal specification</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Section Footer: Exactly One Primary Button */}
      <div className="bg-zinc-950 border border-zinc-800 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-serif text-xl sm:text-2xl text-zinc-100 font-normal">
            Ready to upgrade key components?
          </h4>
          <p className="text-xs text-zinc-300 font-sans">
            Inspect verified hardware upgrade pathways with calculated performance deltas.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('upgrade')}
          className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
        >
          <span>Open Smart Upgrade Advisor</span>
          <ArrowRight className="w-4 h-4 stroke-[1.5]" />
        </button>
      </div>
    </div>
  );
};
