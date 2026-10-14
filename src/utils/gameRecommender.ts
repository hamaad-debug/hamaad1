import { GameGenre, GameItem, GameRecommendationResult, UserSpecs } from '../types';

export interface GameFilterPreferences {
  genres: GameGenre[];
  priority: 'smooth' | 'graphics'; // 60+ FPS focus vs Visuals
  allowLowerSettings: boolean; // Willing to play on low/medium
  freeOnly: boolean;
  resolution: '720p' | '1080p' | '1440p';
}

// Popular games that have official native mobile Android/iOS editions or cross-play
const NATIVE_MOBILE_TITLES = [
  'fortnite',
  'genshin impact',
  'minecraft',
  'pubg',
  'call of duty',
  'roblox',
  'dead cells',
  'asphalt',
  'rocket league',
  'brawlhalla',
  'among us',
  'league of legends',
  'teamfight tactics',
  'apex legends',
  'fall guys',
  'grand theft auto: san andreas',
  'gta',
  'alien: isolation',
  'grid autosport',
  'resident evil',
  'stardew valley',
];

export function recommendGames(
  games: GameItem[],
  specs: UserSpecs,
  prefs: GameFilterPreferences
): GameRecommendationResult[] {
  const isMobile = specs.deviceType === 'phone';

  return games
    .filter((game) => {
      // Free only filter
      if (prefs.freeOnly && !game.isFreeToPlay) return false;
      // Genre filter
      if (prefs.genres.length > 0 && !prefs.genres.includes(game.genre)) return false;
      return true;
    })
    .map((game) => {
      const titleLower = game.title.toLowerCase();
      const hasNativeMobile = NATIVE_MOBILE_TITLES.some((t) => titleLower.includes(t));

      // Mobile device handling
      if (isMobile) {
        if (hasNativeMobile) {
          const isSmooth = specs.gpuScore >= 4000;
          return {
            game,
            status: isSmooth ? 'likely_suitable' : 'possible_with_compromises',
            statusBadge: isSmooth ? 'Native Mobile Playable' : 'Mobile Playable (Med)',
            explanation: `${game.title} has an official optimized mobile edition. Your smartphone SoC runs this title smoothly at 60+ FPS with touch or gamepad support.`,
            cpuStatus: 'pass',
            gpuStatus: isSmooth ? 'pass' : 'warning',
            ramStatus: 'pass',
            vramStatus: 'pass',
            recommendedResolution: specs.displayResolution || '1080p Native Mobile',
            recommendedSettings: isSmooth ? 'High Settings @ 60 FPS' : 'Medium Settings @ 45-60 FPS',
            bottlenecks: [],
          };
        }

        // Heavy PC title on mobile
        return {
          game,
          status: 'possible_with_compromises',
          statusBadge: 'Playable via Cloud / Streaming',
          explanation: `PC desktop title playable on your phone at 60 FPS via Cloud Gaming (GeForce NOW, Xbox Cloud Gaming) or local PC streaming (Moonlight / Steam Link). Android users can also test PC x86 emulation (Winlator).`,
          cpuStatus: 'pass',
          gpuStatus: 'warning',
          ramStatus: 'pass',
          vramStatus: 'warning',
          recommendedResolution: '1080p Cloud Stream',
          recommendedSettings: 'GeForce NOW / Xbox Cloud (Max Settings @ 60 FPS)',
          bottlenecks: ['Direct PC x86 execution on mobile requires Cloud Streaming or Windows emulator (Winlator)'],
        };
      }

      // Desktop / Laptop evaluation with modern FSR / DLSS / dynamic scaling
      // Resolution factor: 1440p requires ~30% more GPU; 720p reduces GPU load ~40%
      const resFactor = prefs.resolution === '1440p' ? 1.25 : prefs.resolution === '720p' ? 0.60 : 1.0;
      const smoothFactor = prefs.priority === 'smooth' ? 1.05 : 0.90;

      const effectiveMinGpu = game.minGpuScore * resFactor * smoothFactor;
      const effectiveRecGpu = game.recGpuScore * resFactor;

      // Component evaluations with modern reality (FSR 2/3 and low settings allow 30-45+ FPS on budget GPUs)
      let cpuStatus: 'pass' | 'warning' | 'fail' = 'pass';
      if (specs.cpuScore < game.minCpuScore * 0.40) {
        cpuStatus = 'fail';
      } else if (specs.cpuScore < game.minCpuScore) {
        cpuStatus = 'warning';
      } else if (specs.cpuScore < game.recCpuScore) {
        cpuStatus = 'pass';
      }

      let gpuStatus: 'pass' | 'warning' | 'fail' = 'pass';
      if (specs.gpuScore < effectiveMinGpu * 0.35) {
        gpuStatus = 'fail';
      } else if (specs.gpuScore < effectiveMinGpu) {
        gpuStatus = 'warning';
      } else if (specs.gpuScore < effectiveRecGpu) {
        gpuStatus = 'pass';
      }

      let ramStatus: 'pass' | 'warning' | 'fail' = 'pass';
      if (specs.ramGb < game.minRamGb * 0.50) {
        ramStatus = 'fail';
      } else if (specs.ramGb < game.minRamGb) {
        ramStatus = 'warning';
      }

      let vramStatus: 'pass' | 'warning' | 'fail' = 'pass';
      if (specs.gpuVramGb < game.minVramGb * 0.50) {
        vramStatus = 'fail';
      } else if (specs.gpuVramGb < game.minVramGb) {
        vramStatus = 'warning';
      }

      const bottlenecks: string[] = [];
      if (cpuStatus === 'fail') bottlenecks.push(`CPU is below entry threshold (${game.minCpuScore.toLocaleString()} score baseline).`);
      if (gpuStatus === 'fail') bottlenecks.push(`GPU is below minimum 3D pipeline requirement for ${prefs.resolution}.`);
      if (ramStatus === 'fail') bottlenecks.push(`System RAM (${specs.ramGb}GB) is critically below ${game.minRamGb}GB minimum.`);
      if (vramStatus === 'fail') bottlenecks.push(`Video RAM (${specs.gpuVramGb}GB) is below texture streaming buffer.`);
      if (game.requiresSsd && specs.primaryStorageType === 'hdd') bottlenecks.push('Title recommends SSD; HDD will experience background streaming asset delays.');

      // Recommendation logic
      let status: 'likely_suitable' | 'possible_with_compromises' | 'not_recommended';
      let statusBadge: string;
      let explanation: string;
      let recommendedResolution = prefs.resolution;
      let recommendedSettings = 'Medium to High settings';

      const meetsRec = cpuStatus === 'pass' && gpuStatus === 'pass' && ramStatus === 'pass' && specs.gpuScore >= effectiveRecGpu * 0.85;

      if (meetsRec && !bottlenecks.length) {
        status = 'likely_suitable';
        statusBadge = 'Likely Suitable';
        explanation = `Hardware meets or exceeds recommended specifications. Expect stable, smooth performance at ${prefs.resolution}.`;
        recommendedSettings = prefs.priority === 'smooth' ? 'High settings with stable 60+ FPS' : 'Ultra settings with high visual fidelity';
      } else if (specs.gpuScore >= effectiveMinGpu * 0.35 && specs.cpuScore >= game.minCpuScore * 0.40) {
        status = 'possible_with_compromises';
        statusBadge = specs.gpuScore >= effectiveMinGpu ? 'Playable with Tweaks' : 'Playable on Low / FSR';
        if (specs.gpuScore < effectiveMinGpu) {
          recommendedSettings = 'Low to Medium settings with FSR/DLSS/XeSS dynamic scaling (35-50 FPS)';
          if (prefs.resolution === '1440p') recommendedResolution = '1080p';
        } else {
          recommendedSettings = 'Medium settings, 45-60 FPS';
        }
        explanation = `Playable with adjusted graphics settings. ${game.compromiseTips || 'Enable dynamic resolution scaling (FSR/DLSS/XeSS) for smooth frame pacing.'}`;
      } else {
        status = 'not_recommended';
        statusBadge = 'Hardware Constrained';
        explanation = `Hardware falls below playable thresholds. Framerates will drop below 25 FPS or suffer heavy memory stutter. Cloud gaming recommended.`;
        recommendedSettings = 'Low / Sub-720p scaling';
      }

      return {
        game,
        status,
        statusBadge,
        explanation,
        cpuStatus,
        gpuStatus,
        ramStatus,
        vramStatus,
        recommendedResolution,
        recommendedSettings,
        bottlenecks,
      };
    });
}
