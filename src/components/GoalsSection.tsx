import React, { useState } from 'react';
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Cpu,
  Monitor,
  CircuitBoard,
  HardDrive,
  Check,
  Plus,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { GoalAssessment, GoalCategory, UserGoal, UserSpecs } from '../types';
import { GOALS_DATABASE } from '../data/goalsDatabase';
import { evaluateGoal } from '../utils/goalEvaluator';

interface GoalsSectionProps {
  specs: UserSpecs;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({ specs }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // Default selected goals: Programming, Office, 1080p Video, Casual Esports
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([
    'programming_basics',
    'office_productivity',
    'video_editing_1080p',
    'casual_esports_gaming',
  ]);

  const toggleGoal = (id: string) => {
    setSelectedGoalIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedGoalIds(GOALS_DATABASE.map((g) => g.id));
  };

  const clearAll = () => {
    setSelectedGoalIds([]);
  };

  const filteredGoals = GOALS_DATABASE.filter((g) => {
    if (selectedCategory === 'all') return true;
    return g.category === selectedCategory;
  });

  // Calculate assessments for all selected goals
  const activeAssessments: GoalAssessment[] = selectedGoalIds
    .map((id) => GOALS_DATABASE.find((g) => g.id === id))
    .filter((g): g is UserGoal => !!g)
    .map((g) => evaluateGoal(g, specs));

  const getStatusDisplay = (status: GoalAssessment['status']) => {
    switch (status) {
      case 'ready':
      case 'playable_with_tweaks':
        return {
          badge: 'bg-zinc-950 text-emerald-400 border-emerald-500/40',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[1.5]" />,
        };
      case 'bottlenecked':
      case 'unsupported':
      default:
        return {
          badge: 'bg-zinc-950 text-zinc-300 border-zinc-700',
          icon: <AlertTriangle className="w-4 h-4 text-emerald-400 stroke-[1.5]" />,
        };
    }
  };

  return (
    <div className="space-y-16">
      {/* Intro Header */}
      <div className="bg-zinc-950 border border-zinc-800 p-8 sm:p-12 shadow-2xl space-y-8">
        <div className="space-y-3 pb-8 border-b border-zinc-800">
          <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-medium">
            Goal-Driven Evaluation
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl text-zinc-100 font-normal tracking-tight">
            Workload Capability Matrix
          </h1>
          <p className="text-sm sm:text-base text-zinc-200 max-w-2xl font-sans">
            Evaluate exact real-world tasks without arbitrary aggregate ratings. Direct silicon verification against real workload thresholds.
          </p>
        </div>

        {/* Goal Category Tabs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-zinc-300 font-medium">
              Filter Workload Domains:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs uppercase font-mono tracking-wider px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-emerald-400 border border-zinc-800 transition-colors cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs uppercase font-mono tracking-wider px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border border-zinc-800 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Tasks' },
              { id: 'work', label: 'Work & Education' },
              { id: 'programming', label: 'Programming & Dev' },
              { id: 'creative', label: 'Creative & Video' },
              { id: 'gaming', label: 'Gaming' },
              { id: 'technical', label: 'Technical & AI' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs uppercase tracking-wider font-medium border transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-zinc-900 border-emerald-500/60 text-emerald-400'
                    : 'bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Goal Selector Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-6 border-t border-zinc-800">
          {filteredGoals.map((goal) => {
            const isSelected = selectedGoalIds.includes(goal.id);
            return (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={`p-3 rounded-lg border text-left flex items-start justify-between gap-2 transition-all ${
                  isSelected
                    ? 'bg-zinc-800/90 border-emerald-500/50 ring-1 ring-emerald-500/30'
                    : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className={`text-xs font-semibold ${isSelected ? 'text-zinc-100' : 'text-zinc-300'}`}>
                    {goal.title}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{goal.description}</div>
                </div>
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? 'bg-emerald-500 text-zinc-950' : 'border border-zinc-700 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Goals Evaluation Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <span>Workload Assessments</span>
            <span className="text-xs font-mono font-normal text-zinc-400">
              ({activeAssessments.length} {activeAssessments.length === 1 ? 'task' : 'tasks'} evaluated)
            </span>
          </h2>
        </div>

        {activeAssessments.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-xl text-zinc-400 text-xs">
            No goals selected. Choose one or more tasks above to evaluate your system's readiness.
          </div>
        ) : (
          <div className="space-y-4">
            {activeAssessments.map((assessment) => {
              const statusUi = getStatusDisplay(assessment.status);
              const goal = assessment.goal;

              return (
                <div
                  key={goal.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="font-bold text-zinc-100 text-base">{goal.title}</h3>
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold border ${statusUi.badge}`}
                        >
                          {statusUi.icon}
                          <span>{assessment.statusLabel}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400">{goal.description}</p>
                    </div>

                    {/* Readiness Score Bar */}
                    <div className="min-w-[140px] bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
                      <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                        <span className="text-zinc-400">Readiness</span>
                        <span className="font-bold text-zinc-200">{assessment.scorePercent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded overflow-hidden">
                        <div
                          className={`h-full rounded transition-all ${
                            assessment.scorePercent >= 80
                              ? 'bg-emerald-500'
                              : assessment.scorePercent >= 55
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${assessment.scorePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Guidance Paragraph */}
                  <div className="mt-4 p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed">
                    {assessment.guidanceText}
                  </div>

                  {/* Component Compatibility Checklist */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 text-xs">
                    {/* CPU */}
                    <div className="p-2.5 rounded bg-zinc-950/40 border border-zinc-800/60">
                      <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                        <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> CPU</span>
                        <span className={assessment.cpuFit === 'meets_rec' ? 'text-emerald-400' : assessment.cpuFit === 'meets_min' ? 'text-amber-400' : 'text-rose-400'}>
                          {assessment.cpuFit === 'meets_rec' ? 'Exceeds' : assessment.cpuFit === 'meets_min' ? 'Meets Min' : 'Below Min'}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-zinc-200 truncate">
                        {specs.cpuScore.toLocaleString()} / {goal.recCpuScore.toLocaleString()}
                      </div>
                    </div>

                    {/* GPU */}
                    <div className="p-2.5 rounded bg-zinc-950/40 border border-zinc-800/60">
                      <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                        <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> GPU</span>
                        <span className={assessment.gpuFit === 'meets_rec' ? 'text-emerald-400' : assessment.gpuFit === 'meets_min' ? 'text-amber-400' : 'text-rose-400'}>
                          {assessment.gpuFit === 'meets_rec' ? 'Exceeds' : assessment.gpuFit === 'meets_min' ? 'Meets Min' : 'Below Min'}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-zinc-200 truncate">
                        {specs.gpuScore.toLocaleString()} / {goal.recGpuScore.toLocaleString()}
                      </div>
                    </div>

                    {/* RAM */}
                    <div className="p-2.5 rounded bg-zinc-950/40 border border-zinc-800/60">
                      <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                        <span className="flex items-center gap-1"><CircuitBoard className="w-3 h-3" /> RAM</span>
                        <span className={assessment.ramFit === 'meets_rec' ? 'text-emerald-400' : assessment.ramFit === 'meets_min' ? 'text-amber-400' : 'text-rose-400'}>
                          {assessment.ramFit === 'meets_rec' ? 'Optimal' : assessment.ramFit === 'meets_min' ? 'Adequate' : 'Shortage'}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-zinc-200 truncate">
                        {specs.ramGb} GB (rec. {goal.recRamGb}GB)
                      </div>
                    </div>

                    {/* Storage */}
                    <div className="p-2.5 rounded bg-zinc-950/40 border border-zinc-800/60">
                      <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                        <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> Disk</span>
                        <span className={assessment.storageFit ? 'text-emerald-400' : 'text-amber-400'}>
                          {assessment.storageFit ? 'SSD Ready' : 'HDD Alert'}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-zinc-200 truncate">
                        {specs.primaryStorageType.toUpperCase().replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  {/* Bottleneck Callout if present */}
                  {assessment.primaryBottleneck && (
                    <div className="mt-3.5 flex items-start gap-2 text-xs text-amber-300 bg-amber-950/20 border border-amber-900/40 p-2.5 rounded">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{assessment.primaryBottleneck}</span>
                    </div>
                  )}

                  {/* Tips */}
                  {assessment.configurationTips.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-400">
                      {assessment.configurationTips.map((tip, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
