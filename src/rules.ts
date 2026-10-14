import { SpecObject } from './specData';
import { matchCpuTier, matchGpuTier } from './data/tierLists';

export type GoalRating = 'Good' | 'Possible with limits' | 'Not recommended';
export type BottleneckComponent = 'CPU' | 'GPU' | 'RAM' | 'storage' | 'None';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface GoalEvaluationResult {
  goalId: string;
  goalName: string;
  rating: GoalRating;
  reason: string;
  bottleneck: BottleneckComponent;
  confidence: ConfidenceLevel;
}

export interface SpecReport {
  timestamp: number;
  overallSummary: string;
  evaluations: GoalEvaluationResult[];
  detectedTiers: {
    cpuTier: number | null;
    cpuLabel: string;
    gpuTier: number | null;
    gpuLabel: string;
  };
}

export interface GoalDefinition {
  id: string;
  name: string;
  minRamGb: number;
  recRamGb: number;
  minCpuTier: number;
  recCpuTier: number;
  minGpuTier: number;
  recGpuTier: number;
  requiresSsd: boolean;
  description: string;
}

export const SUPPORTED_GOALS: GoalDefinition[] = [
  {
    id: 'office',
    name: 'Everyday Web Browsing & Office Productivity',
    minRamGb: 4,
    recRamGb: 8,
    minCpuTier: 2,
    recCpuTier: 4,
    minGpuTier: 1,
    recGpuTier: 2,
    requiresSsd: false,
    description: 'Web browsing with multiple tabs, document editing, spreadsheets, and video conferencing.',
  },
  {
    id: 'esports_gaming',
    name: 'Competitive Esports Gaming (Valorant, CS2, Fortnite)',
    minRamGb: 8,
    recRamGb: 16,
    minCpuTier: 4,
    recCpuTier: 6,
    minGpuTier: 3,
    recGpuTier: 5,
    requiresSsd: false,
    description: 'Fast-paced multiplayer games targeting smooth 60+ FPS at 1080p resolution.',
  },
  {
    id: 'aaa_gaming',
    name: 'Demanding AAA Modern Gaming',
    minRamGb: 16,
    recRamGb: 16,
    minCpuTier: 5,
    recCpuTier: 8,
    minGpuTier: 5,
    recGpuTier: 8,
    requiresSsd: true,
    description: 'Modern heavy single-player titles with high graphical fidelity (e.g. Cyberpunk, Starfield).',
  },
  {
    id: 'video_editing',
    name: 'Video Editing & Content Creation (4K / Multitrack)',
    minRamGb: 16,
    recRamGb: 32,
    minCpuTier: 6,
    recCpuTier: 8,
    minGpuTier: 5,
    recGpuTier: 7,
    requiresSsd: true,
    description: 'Timeline scrubbing, timeline effects, and video rendering in Premiere Pro or DaVinci Resolve.',
  },
  {
    id: 'software_dev',
    name: 'Software Development & Container Workloads',
    minRamGb: 8,
    recRamGb: 16,
    minCpuTier: 5,
    recCpuTier: 7,
    minGpuTier: 1,
    recGpuTier: 2,
    requiresSsd: true,
    description: 'Code compilation, IDEs, Docker containers, and local database environments.',
  },
  {
    id: '3d_modeling',
    name: '3D Modeling & CAD Rendering (Blender, AutoCAD)',
    minRamGb: 16,
    recRamGb: 32,
    minCpuTier: 6,
    recCpuTier: 8,
    minGpuTier: 6,
    recGpuTier: 8,
    requiresSsd: true,
    description: 'Viewport modeling, mesh manipulation, and hardware-accelerated GPU render engines.',
  },
];

/**
 * PURE FUNCTION: (specObject, selectedGoals) -> report
 * Strictly contains NO UI code.
 * Evaluates PC specs against selected goals with plain-English rationales,
 * honest bottleneck attribution, lowered confidence for unknown fields,
 * and calibrated language ("likely", "may").
 */
export function evaluateSpecAgainstGoals(
  spec: SpecObject,
  selectedGoalIds: string[] = ['office', 'esports_gaming', 'aaa_gaming', 'video_editing']
): SpecReport {
  const cpuMatch = matchCpuTier(spec.cpu.name);
  const gpuMatch = matchGpuTier(spec.gpu.name);

  const ramGb = spec.ram.gb;
  const storageType = spec.storage.type ? spec.storage.type.toLowerCase() : 'unknown';
  const isHdd = storageType.includes('hdd') || storageType.includes('mechanical');
  const isSsd = storageType.includes('ssd') || storageType.includes('nvme') || storageType.includes('sata');

  const hasUnknownCpu = !cpuMatch.found || spec.cpu.source === 'unknown';
  const hasUnknownGpu = !gpuMatch.found || spec.gpu.source === 'unknown';
  const hasUnknownRam = ramGb === null || spec.ram.source === 'unknown';
  const hasUnknownStorage = !isSsd && !isHdd;

  const targetGoals = SUPPORTED_GOALS.filter((g) => selectedGoalIds.includes(g.id));
  const evaluations: GoalEvaluationResult[] = [];

  for (const goal of targetGoals) {
    let rating: GoalRating = 'Good';
    let bottleneck: BottleneckComponent = 'None';
    let confidence: ConfidenceLevel = 'high';
    const issues: string[] = [];
    const unknownNotes: string[] = [];

    // Track unknowns
    if (hasUnknownCpu) unknownNotes.push('CPU model is unconfirmed');
    if (hasUnknownGpu) unknownNotes.push('GPU capability is unconfirmed');
    if (hasUnknownRam) unknownNotes.push('RAM amount is unverified');
    if (hasUnknownStorage) unknownNotes.push('Storage drive type is unknown');

    if (unknownNotes.length >= 2) {
      confidence = 'low';
    } else if (unknownNotes.length === 1) {
      confidence = 'medium';
    }

    // 1. RAM Check
    if (ramGb !== null) {
      if (ramGb < goal.minRamGb) {
        rating = 'Not recommended';
        bottleneck = 'RAM';
        issues.push(`Installed RAM (${ramGb} GB) is below the minimum recommended ${goal.minRamGb} GB for this workload.`);
      } else if (ramGb < goal.recRamGb) {
        if (rating === 'Good') rating = 'Possible with limits';
        if (bottleneck === 'None') bottleneck = 'RAM';
        issues.push(`RAM capacity (${ramGb} GB) meets bare minimums but may likely encounter paging limits under heavy load.`);
      }
    }

    // 2. Storage Check
    if (isHdd) {
      if (goal.requiresSsd) {
        if (rating === 'Good') rating = 'Possible with limits';
        if (bottleneck === 'None') bottleneck = 'storage';
        issues.push('Running on a mechanical HDD; modern assets may load slowly and likely induce stutter.');
      } else if (goal.id === 'office' && isHdd) {
        issues.push('Mechanical hard drive detected; system responsiveness may feel sluggish during boot and updates.');
      }
    }

    // 3. GPU Check
    if (gpuMatch.found && gpuMatch.tier !== null) {
      if (gpuMatch.tier < goal.minGpuTier) {
        rating = 'Not recommended';
        bottleneck = 'GPU';
        issues.push(`Graphics hardware (${gpuMatch.canonicalName}) is Tier ${gpuMatch.tier}/10, which is likely insufficient for this workload.`);
      } else if (gpuMatch.tier < goal.recGpuTier) {
        if (rating === 'Good') rating = 'Possible with limits';
        if (bottleneck === 'None') bottleneck = 'GPU';
        issues.push(`Graphics card is Tier ${gpuMatch.tier}/10; graphical settings will likely need to be lowered.`);
      }
    }

    // 4. CPU Check
    if (cpuMatch.found && cpuMatch.tier !== null) {
      if (cpuMatch.tier < goal.minCpuTier) {
        rating = 'Not recommended';
        if (bottleneck === 'None' || bottleneck === 'storage') bottleneck = 'CPU';
        issues.push(`Processor (${cpuMatch.canonicalName}) is Tier ${cpuMatch.tier}/10, likely leading to processing bottlenecks.`);
      } else if (cpuMatch.tier < goal.recCpuTier) {
        if (rating === 'Good') rating = 'Possible with limits';
        if (bottleneck === 'None') bottleneck = 'CPU';
        issues.push(`Processor is Tier ${cpuMatch.tier}/10; compute-heavy operations may take noticeably longer.`);
      }
    }

    // Compose Plain-English Reason with calibrated words ("likely", "may")
    let reasonText = '';
    if (rating === 'Good') {
      reasonText = `Hardware components are well balanced for this workload and should likely deliver a smooth, reliable experience.`;
      if (issues.length > 0) {
        reasonText += ` Note: ${issues.join(' ')}`;
      }
    } else if (rating === 'Possible with limits') {
      reasonText = `This system may be capable of running this task, but with noticeable constraints: ${issues.join(' ')}`;
    } else {
      reasonText = `Not recommended for this use case. ${issues.join(' ')}`;
    }

    // Append unknown context if confidence was lowered
    if (unknownNotes.length > 0) {
      reasonText += ` (Confidence lowered to ${confidence}: ${unknownNotes.join(', ')}).`;
    }

    evaluations.push({
      goalId: goal.id,
      goalName: goal.name,
      rating,
      reason: reasonText,
      bottleneck,
      confidence,
    });
  }

  // Generate overall summary
  const goodCount = evaluations.filter((e) => e.rating === 'Good').length;
  const overallSummary =
    goodCount >= 3
      ? 'This configuration demonstrates strong overall versatility across typical and modern workloads.'
      : goodCount >= 1
      ? 'This configuration is suitable for select lightweight and targeted tasks, but exhibits specific hardware limits.'
      : 'This system is best suited for basic computing tasks or will likely require key hardware upgrades for heavier workloads.';

  return {
    timestamp: Date.now(),
    overallSummary,
    evaluations,
    detectedTiers: {
      cpuTier: cpuMatch.tier,
      cpuLabel: cpuMatch.tierLabel,
      gpuTier: gpuMatch.tier,
      gpuLabel: gpuMatch.tierLabel,
    },
  };
}
