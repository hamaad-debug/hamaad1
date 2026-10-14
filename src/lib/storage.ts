import { UserSpecs } from '../types';

export interface SavedRigRecord {
  id: string;
  name: string;
  deviceType: string;
  specs: UserSpecs;
  savedAt: number;
}

export interface SavedScanRecord {
  id: string;
  platform: string;
  specs: UserSpecs;
  scannedAt: number;
}

const RIGS_STORAGE_KEY = 'rigcompass_saved_rigs_v1';
const SCANS_STORAGE_KEY = 'rigcompass_recent_scans_v1';

// Initial sample rigs so the user has immediate data
const DEFAULT_SAVED_RIGS: SavedRigRecord[] = [
  {
    id: 'rig_default_snapdragon',
    name: 'Snapdragon 8 Gen 3 Flagship',
    deviceType: 'phone',
    specs: {
      cpuId: 'snapdragon_8_gen_3',
      cpuName: 'Qualcomm Snapdragon 8 Gen 3 (8-Core)',
      cpuCores: 8,
      cpuThreads: 8,
      cpuScore: 16100,
      cpuSingleScore: 2320,
      cpuGeneration: 'Kryo Cortex-X4',
      cpuBrand: 'Other',
      gpuId: 'adreno_750',
      gpuName: 'Qualcomm Adreno 750 (Hardware Ray Tracing)',
      isIntegratedGpu: true,
      gpuVramGb: 4,
      gpuScore: 5900,
      gpuTier: 1,
      gpuBrand: 'Other',
      ramGb: 12,
      ramType: 'LPDDR5',
      ramChannels: 'quad',
      primaryStorageType: 'nvme_ssd',
      storageCapacityGb: 256,
      storageFreeGb: 160,
      os: 'Android',
      displayResolution: '1440x3120',
      formFactor: 'phone',
      deviceType: 'phone',
    },
    savedAt: Date.now() - 3600000 * 24,
  },
  {
    id: 'rig_default_workstation',
    name: 'Studio Workstation PC',
    deviceType: 'desktop',
    specs: {
      cpuId: 'amd_ryzen_7_7800x3d',
      cpuName: 'AMD Ryzen 7 7800X3D (8C/16T, 3D V-Cache)',
      cpuCores: 8,
      cpuThreads: 16,
      cpuScore: 34500,
      cpuSingleScore: 3850,
      cpuGeneration: 'Zen 4',
      cpuBrand: 'AMD',
      gpuId: 'nvidia_rtx_4070_super',
      gpuName: 'NVIDIA GeForce RTX 4070 Super (12GB GDDR6X)',
      isIntegratedGpu: false,
      gpuVramGb: 12,
      gpuScore: 30100,
      gpuTier: 4,
      gpuBrand: 'Nvidia',
      ramGb: 32,
      ramType: 'DDR5',
      ramChannels: 'dual',
      primaryStorageType: 'nvme_ssd',
      storageCapacityGb: 2000,
      storageFreeGb: 1100,
      os: 'Windows 11',
      displayResolution: '2560x1440',
      formFactor: 'desktop',
      deviceType: 'desktop',
    },
    savedAt: Date.now() - 3600000 * 48,
  },
];

export function getSavedRigs(): SavedRigRecord[] {
  if (typeof window === 'undefined') return DEFAULT_SAVED_RIGS;
  try {
    const raw = localStorage.getItem(RIGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(RIGS_STORAGE_KEY, JSON.stringify(DEFAULT_SAVED_RIGS));
      return DEFAULT_SAVED_RIGS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SAVED_RIGS;
  }
}

export function saveRig(name: string, specs: UserSpecs): SavedRigRecord {
  const current = getSavedRigs();
  const newRig: SavedRigRecord = {
    id: `rig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim() || `${specs.deviceType.toUpperCase()} Configuration`,
    deviceType: specs.deviceType,
    specs,
    savedAt: Date.now(),
  };
  const updated = [newRig, ...current];
  try {
    localStorage.setItem(RIGS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return newRig;
}

export function deleteSavedRig(id: string): void {
  const current = getSavedRigs();
  const updated = current.filter((r) => r.id !== id);
  try {
    localStorage.setItem(RIGS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getRecentScans(): SavedScanRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SCANS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logScanLocally(specs: UserSpecs): void {
  if (typeof window === 'undefined') return;
  const current = getRecentScans();
  const newScan: SavedScanRecord = {
    id: `scan_${Date.now()}`,
    platform: specs.os,
    specs,
    scannedAt: Date.now(),
  };
  const updated = [newScan, ...current.slice(0, 9)];
  try {
    localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}
