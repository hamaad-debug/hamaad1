import { GoalAssessment, UserGoal, UserSpecs } from '../types';

export function evaluateGoal(goal: UserGoal, specs: UserSpecs): GoalAssessment {
  // Check CPU fit
  let cpuFit: 'below_min' | 'meets_min' | 'meets_rec' = 'below_min';
  if (specs.cpuScore >= goal.recCpuScore) {
    cpuFit = 'meets_rec';
  } else if (specs.cpuScore >= goal.minCpuScore) {
    cpuFit = 'meets_min';
  }

  // Check GPU fit
  let gpuFit: 'below_min' | 'meets_min' | 'meets_rec' = 'below_min';
  if (specs.gpuScore >= goal.recGpuScore) {
    gpuFit = 'meets_rec';
  } else if (specs.gpuScore >= goal.minGpuScore) {
    gpuFit = 'meets_min';
  }

  // Check RAM fit
  let ramFit: 'below_min' | 'meets_min' | 'meets_rec' = 'below_min';
  if (specs.ramGb >= goal.recRamGb) {
    ramFit = 'meets_rec';
  } else if (specs.ramGb >= goal.minRamGb) {
    ramFit = 'meets_min';
  }

  // Check Storage fit
  const isHdd = specs.primaryStorageType === 'hdd';
  const storageFit = !goal.requiresSsd || !isHdd;

  // Calculate score percent (0 - 100)
  const cpuFactor = Math.min(1.2, specs.cpuScore / goal.recCpuScore) / 1.2;
  const gpuFactor = Math.min(1.2, specs.gpuScore / goal.recGpuScore) / 1.2;
  const ramFactor = Math.min(1.2, specs.ramGb / goal.recRamGb) / 1.2;
  const storageFactor = isHdd && goal.requiresSsd ? 0.6 : 1.0;

  // Weighted score depends on category
  let rawScore = 0;
  if (goal.category === 'creative' && goal.id.includes('3d')) {
    rawScore = gpuFactor * 0.45 + cpuFactor * 0.25 + ramFactor * 0.2 + storageFactor * 0.1;
  } else if (goal.category === 'gaming') {
    rawScore = gpuFactor * 0.5 + cpuFactor * 0.25 + ramFactor * 0.15 + storageFactor * 0.1;
  } else if (goal.category === 'technical' && goal.id.includes('ai')) {
    rawScore = gpuFactor * 0.5 + ramFactor * 0.25 + cpuFactor * 0.15 + storageFactor * 0.1;
  } else {
    rawScore = cpuFactor * 0.4 + ramFactor * 0.35 + storageFactor * 0.15 + gpuFactor * 0.1;
  }

  const scorePercent = Math.min(100, Math.round(rawScore * 100));

  // Determine overall status
  let status: 'ready' | 'playable_with_tweaks' | 'bottlenecked' | 'unsupported' = 'ready';
  let statusLabel = 'Fully Ready';
  let primaryBottleneck: string | null = null;
  const configurationTips: string[] = [];

  const fails = [cpuFit === 'below_min', gpuFit === 'below_min', ramFit === 'below_min', !storageFit].filter(Boolean).length;

  if (fails >= 2 || (gpuFit === 'below_min' && goal.category === 'gaming')) {
    status = 'unsupported';
    statusLabel = 'Severe Hardware Gap';
    if (gpuFit === 'below_min') {
      primaryBottleneck = `GPU performance (${specs.gpuName}) is significantly below minimum requirements.`;
    } else if (ramFit === 'below_min') {
      primaryBottleneck = `Installed RAM (${specs.ramGb}GB) is below the minimum ${goal.minRamGb}GB requirement.`;
    } else {
      primaryBottleneck = `CPU processing speed is insufficient for this workload.`;
    }
  } else if (fails === 1) {
    status = 'bottlenecked';
    statusLabel = 'Noticeable Bottleneck';
    if (!storageFit) {
      primaryBottleneck = 'Traditional mechanical HDD causes sluggish loading and disk freeze.';
      configurationTips.push('Upgrading to even an affordable 256GB SSD will completely resolve this bottleneck.');
    } else if (ramFit === 'below_min') {
      primaryBottleneck = `Only ${specs.ramGb}GB RAM available; task requires at least ${goal.minRamGb}GB.`;
      configurationTips.push(`Close all web browsers and background utilities before launching.`);
    } else if (gpuFit === 'below_min') {
      primaryBottleneck = `Graphics processor lacks required rendering throughput or VRAM.`;
      configurationTips.push('Lower rendering preview quality and disable real-time viewport shading.');
    } else {
      primaryBottleneck = 'Processor speed limits how fast jobs will finish.';
    }
  } else if (cpuFit === 'meets_min' || gpuFit === 'meets_min' || ramFit === 'meets_min') {
    status = 'playable_with_tweaks';
    statusLabel = 'Capable with Optimization';
    if (ramFit === 'meets_min') {
      configurationTips.push(`RAM meets baseline (${specs.ramGb}GB). Avoid heavy background applications while running.`);
    }
    if (gpuFit === 'meets_min') {
      configurationTips.push('Use medium graphics settings or hardware proxy caches.');
    }
  } else {
    status = 'ready';
    statusLabel = 'Excellent Performance';
    configurationTips.push('All hardware requirements exceeded. Smooth workflow expected.');
  }

  // Build customized guidance text
  let guidanceText = '';
  if (status === 'ready') {
    guidanceText = `Your system comfortably exceeds the requirements for ${goal.title}. You will experience responsive, fluid workflows without hardware hesitation.`;
  } else if (status === 'playable_with_tweaks') {
    guidanceText = `Your computer can handle ${goal.title}, but you may need modest adjustments during peak workloads to maintain optimal fluidity.`;
  } else if (status === 'bottlenecked') {
    guidanceText = `You can run basic components of ${goal.title}, but ${primaryBottleneck || 'a hardware bottleneck'} will cause noticeable friction or waiting periods.`;
  } else {
    guidanceText = `Your system is not currently equipped for ${goal.title}. A key component falls too far below the required computational baseline.`;
  }

  return {
    goal,
    status,
    statusLabel,
    scorePercent,
    cpuFit,
    gpuFit,
    ramFit,
    storageFit,
    primaryBottleneck,
    guidanceText,
    configurationTips,
  };
}
