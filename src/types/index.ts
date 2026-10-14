export type StorageType = 'nvme_ssd' | 'sata_ssd' | 'hdd' | 'emmc';

export type DeviceType = 'desktop' | 'laptop' | 'phone';

export type FormFactor = 'desktop' | 'laptop' | 'phone' | 'tablet' | 'mini_pc';

export type DetectedCategory = 'phone' | 'laptop' | 'desktop' | 'tablet';

export interface DeviceDetectionResult {
  category: DetectedCategory;
  categoryLabel: string;
  confidence: 'high' | 'medium' | 'estimated';
  hasBattery: boolean | null;
  batteryLevelPercent?: number | null;
  isCharging?: boolean | null;
  isTouchDevice: boolean;
  isMobileUserAgent: boolean;
  screenSummary: string;
  reasons: string[];
}

export interface UserSpecs {
  // CPU
  cpuId: string;
  cpuName: string;
  cpuCores: number;
  cpuThreads: number;
  cpuScore: number; // Normalized PassMark / CPU-Mark multi-thread score (0 - 45000+)
  cpuSingleScore: number; // Single-thread score (0 - 4500+)
  cpuGeneration: string;
  cpuBrand: 'Intel' | 'AMD' | 'Apple' | 'Other';

  // GPU
  gpuId: string;
  gpuName: string;
  isIntegratedGpu: boolean;
  gpuVramGb: number;
  gpuScore: number; // Normalized 3DMark / PassMark G3D Mark score (0 - 35000+)
  gpuTier: number; // 0 (basic display) to 5 (enthusiast 4K)
  gpuBrand: 'Nvidia' | 'AMD' | 'Intel' | 'Apple' | 'Other';

  // Memory
  ramGb: number;
  ramType: 'DDR3' | 'DDR4' | 'DDR5' | 'LPDDR4x' | 'LPDDR5' | 'Unified';
  ramChannels: 'single' | 'dual' | 'quad';

  // Storage
  primaryStorageType: StorageType;
  storageCapacityGb: number;
  storageFreeGb: number;

  // OS & Display
  os: 'Windows 11' | 'Windows 10' | 'macOS' | 'Linux' | 'ChromeOS' | 'Android' | 'iOS';
  displayResolution: string; // e.g. "1920x1080"
  formFactor: FormFactor;
  deviceType: DeviceType;
  modelName?: string;
  is100PercentVerified?: boolean;
  verificationMethod?: string;
  specObject?: import('../specData').SpecObject;
  techApiData?: {
    slug?: string;
    brand?: string;
    socSlug?: string;
    batteryMah?: number;
    chargingWiredW?: number;
    chargingWirelessW?: number;
    display?: {
      size_inch?: number;
      resolution?: string;
      refresh_hz?: number;
      type?: string;
      brightness_nits?: number;
    };
    cameras?: Array<{
      type?: string;
      mp?: number;
      aperture?: number;
      ois?: boolean;
      sensor?: string;
    }>;
    dimensions?: {
      height_mm?: number;
      width_mm?: number;
      depth_mm?: number;
    };
    weightG?: number;
    score?: {
      overall?: number;
      performance?: number;
      camera?: number;
      battery?: number;
      display?: number;
      perf?: {
        index?: number;
        tier?: string;
        source?: string;
      };
    };
    sourceUrls?: string[];
    attribution?: string;
    license?: string;
  };
}

export * from '../specData';

export interface BrowserScanData {
  logicalCores: number | null;
  deviceMemoryGb: number | null; // Capped at 8GB in Chrome
  webGlRenderer: string | null;
  webGlVendor: string | null;
  estimatedStorageQuotaGb: number | null;
  estimatedStorageUsageGb: number | null;
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  pixelRatio: number;
  platform: string;
  userAgent: string;
  connectionType?: string;
  touchSupport: boolean;
  scanTimestamp: number;
  deviceDetection: DeviceDetectionResult;
  refreshRateHz?: number;
  precisionScore?: number;
}

export type CapabilityRating = 'excellent' | 'capable' | 'compromise' | 'limited' | 'unsupported';

export interface CapabilityItem {
  id: string;
  title: string;
  rating: CapabilityRating;
  ratingLabel: string;
  summary: string;
  keyBottleneck?: string;
  realWorldDetails: string[];
  recommendedSettings?: string;
}

export type GoalCategory = 'work' | 'programming' | 'creative' | 'gaming' | 'technical';

export interface UserGoal {
  id: string;
  title: string;
  category: GoalCategory;
  description: string;
  minCpuScore: number;
  recCpuScore: number;
  minGpuScore: number;
  recGpuScore: number;
  minRamGb: number;
  recRamGb: number;
  requiresSsd: boolean;
  details: string;
}

export interface GoalAssessment {
  goal: UserGoal;
  status: 'ready' | 'playable_with_tweaks' | 'bottlenecked' | 'unsupported';
  statusLabel: string;
  scorePercent: number; // 0 - 100
  cpuFit: 'below_min' | 'meets_min' | 'meets_rec';
  gpuFit: 'below_min' | 'meets_min' | 'meets_rec';
  ramFit: 'below_min' | 'meets_min' | 'meets_rec';
  storageFit: boolean;
  primaryBottleneck: string | null;
  guidanceText: string;
  configurationTips: string[];
}

export interface UpgradeSymptomInput {
  slowdownType: 'boot_apps' | 'multitasking_tabs' | 'gaming_low_fps' | 'rendering_export' | 'general_lag';
  timing: 'always' | 'many_apps_open' | 'heavy_3d_only' | 'after_20_minutes';
  budget: 'free' | 'under_50' | '50_to_150' | '150_to_400' | 'over_400';
}

export interface UpgradeAction {
  priority: 'critical' | 'high' | 'medium' | 'low' | 'no_cost';
  component: string;
  title: string;
  expectedBenefit: string;
  estimatedCost: string;
  compatibilityNote: string;
  worthItVerdict: string;
  roiRating: 'exceptional' | 'good' | 'marginal' | 'not_recommended';
}

export interface UpgradeReport {
  primaryVerdict: string;
  freeMaintenanceFixes: string[];
  recommendedUpgrades: UpgradeAction[];
  shouldUpgradeNewPc: boolean;
  newPcReason?: string;
}

export type GameGenre = 'Shooting' | 'Open-world' | 'Racing' | 'Strategy' | 'Simulation' | 'Casual' | 'Action RPG';

export interface GameItem {
  id: string;
  title: string;
  genre: GameGenre;
  releaseYear: number;
  isFreeToPlay: boolean;
  minCpuScore: number;
  recCpuScore: number;
  minGpuScore: number;
  recGpuScore: number;
  minVramGb: number;
  recVramGb: number;
  minRamGb: number;
  recRamGb: number;
  storageGb: number;
  requiresSsd: boolean;
  notes: string;
  compromiseTips: string;
}

export interface GameRecommendationResult {
  game: GameItem;
  status: 'likely_suitable' | 'possible_with_compromises' | 'not_recommended';
  statusBadge: string;
  explanation: string;
  cpuStatus: 'pass' | 'warning' | 'fail';
  gpuStatus: 'pass' | 'warning' | 'fail';
  ramStatus: 'pass' | 'warning' | 'fail';
  vramStatus: 'pass' | 'warning' | 'fail';
  recommendedResolution: string;
  recommendedSettings: string;
  bottlenecks: string[];
}
