// Local lightweight storage bridge replacing external Firebase dependencies
import { UserSpecs } from '../types';
import {
  getSavedRigs,
  saveRig,
  deleteSavedRig,
  getRecentScans,
  logScanLocally,
  SavedRigRecord,
  SavedScanRecord,
} from './storage';

export type CloudRigRecord = SavedRigRecord;
export type CloudScanRecord = SavedScanRecord;

export async function saveRigToFirestore(name: string, specs: UserSpecs): Promise<string> {
  const record = saveRig(name, specs);
  return record.id;
}

export async function loadRigsFromFirestore(): Promise<CloudRigRecord[]> {
  return getSavedRigs();
}

export async function deleteRigFromFirestore(id: string): Promise<void> {
  deleteSavedRig(id);
}

export async function logScanToFirestore(scanPayload: any): Promise<string> {
  if (typeof window !== 'undefined') {
    try {
      const scans = getRecentScans();
      const newScan: SavedScanRecord = {
        id: `scan_${Date.now()}`,
        platform: scanPayload?.detectedCategory || scanPayload?.os || 'System',
        specs: scanPayload?.specs || scanPayload,
        scannedAt: Date.now(),
      };
      localStorage.setItem('rigcompass_recent_scans_v1', JSON.stringify([newScan, ...scans.slice(0, 9)]));
    } catch {}
  }
  return 'local_scan_ok';
}

export async function loadRecentScansFromFirestore(): Promise<CloudScanRecord[]> {
  return getRecentScans();
}
