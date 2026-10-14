export type SpecSource = 'detected' | 'user' | 'guess' | 'unknown';
export type SpecDeviceType = 'laptop' | 'desktop' | 'unknown';

export interface SpecObject {
  deviceType: SpecDeviceType;
  cpu: {
    name: string;
    source: SpecSource;
  };
  gpu: {
    name: string;
    source: SpecSource;
  };
  ram: {
    gb: number | null;
    source: SpecSource;
  };
  storage: {
    type: string;
    freeGb: number | null;
    source: SpecSource;
  };
  os: {
    name: string;
    source: SpecSource;
  };
  resolution: {
    w: number | null;
    h: number | null;
    source: SpecSource;
  };
}

/**
 * Creates a clean default spec object with 'unknown' sources.
 */
export function createDefaultSpecObject(deviceType: SpecDeviceType = 'laptop'): SpecObject {
  return {
    deviceType,
    cpu: {
      name: 'Unknown',
      source: 'unknown',
    },
    gpu: {
      name: 'Unknown',
      source: 'unknown',
    },
    ram: {
      gb: null,
      source: 'unknown',
    },
    storage: {
      type: 'Unknown',
      freeGb: null,
      source: 'unknown',
    },
    os: {
      name: 'Unknown',
      source: 'unknown',
    },
    resolution: {
      w: null,
      h: null,
      source: 'unknown',
    },
  };
}

/**
 * Updates the spec object from "Scan My PC" (browser detection findings).
 * Fields that could not be detected are marked 'unknown'.
 */
export function updateSpecFromScan(
  current: SpecObject,
  scan: {
    deviceType?: 'laptop' | 'desktop' | 'unknown';
    cpuName?: string | null;
    cpuThreads?: number | null;
    gpuName?: string | null;
    ramGb?: number | null;
    storageType?: string | null;
    storageFreeGb?: number | null;
    os?: string | null;
    screenWidth?: number | null;
    screenHeight?: number | null;
  }
): SpecObject {
  const next: SpecObject = { ...current };

  if (scan.deviceType) {
    next.deviceType = scan.deviceType;
  }

  // CPU: Browser detection cannot read the real CPU model name directly
  if (scan.cpuName && scan.cpuName !== 'Unknown') {
    next.cpu = {
      name: scan.cpuName,
      source: 'guess',
    };
  } else if (scan.cpuThreads) {
    next.cpu = {
      name: `${scan.cpuThreads} Threads (Model unknown)`,
      source: 'unknown',
    };
  } else {
    next.cpu = {
      name: 'Unknown',
      source: 'unknown',
    };
  }

  // GPU
  if (scan.gpuName && scan.gpuName.trim().length > 0 && scan.gpuName !== 'Unknown') {
    next.gpu = {
      name: scan.gpuName,
      source: 'detected',
    };
  } else {
    next.gpu = {
      name: 'Unknown',
      source: 'unknown',
    };
  }

  // RAM
  if (typeof scan.ramGb === 'number' && scan.ramGb > 0) {
    next.ram = {
      gb: scan.ramGb,
      source: 'detected',
    };
  } else {
    next.ram = {
      gb: null,
      source: 'unknown',
    };
  }

  // Storage: Browsers cannot reliably read local disk type or physical free space
  if (scan.storageType && scan.storageType !== 'Unknown') {
    next.storage = {
      type: scan.storageType,
      freeGb: scan.storageFreeGb ?? null,
      source: 'guess',
    };
  } else {
    next.storage = {
      type: 'Unknown',
      freeGb: scan.storageFreeGb ?? null,
      source: 'unknown',
    };
  }

  // OS
  if (scan.os && scan.os !== 'Unknown') {
    next.os = {
      name: scan.os,
      source: 'detected',
    };
  } else {
    next.os = {
      name: 'Unknown',
      source: 'unknown',
    };
  }

  // Resolution
  if (scan.screenWidth && scan.screenHeight) {
    next.resolution = {
      w: scan.screenWidth,
      h: scan.screenHeight,
      source: 'detected',
    };
  } else {
    next.resolution = {
      w: null,
      h: null,
      source: 'unknown',
    };
  }

  return next;
}

/**
 * Updates the spec object from "Enter My Specs" (manual user configuration).
 * Any field supplied or modified by the user is tagged with source = 'user'.
 */
export function updateSpecFromUserInput(
  current: SpecObject,
  userUpdate: {
    deviceType?: SpecDeviceType;
    cpuName?: string;
    gpuName?: string;
    ramGb?: number | null;
    storageType?: string;
    storageFreeGb?: number | null;
    os?: string;
    resolution?: { w: number | null; h: number | null };
  }
): SpecObject {
  const next: SpecObject = { ...current };

  if (userUpdate.deviceType !== undefined) {
    next.deviceType = userUpdate.deviceType;
  }

  if (userUpdate.cpuName !== undefined) {
    next.cpu = {
      name: userUpdate.cpuName,
      source: 'user',
    };
  }

  if (userUpdate.gpuName !== undefined) {
    next.gpu = {
      name: userUpdate.gpuName,
      source: 'user',
    };
  }

  if (userUpdate.ramGb !== undefined) {
    next.ram = {
      gb: userUpdate.ramGb,
      source: 'user',
    };
  }

  if (userUpdate.storageType !== undefined || userUpdate.storageFreeGb !== undefined) {
    next.storage = {
      type: userUpdate.storageType !== undefined ? userUpdate.storageType : current.storage.type,
      freeGb: userUpdate.storageFreeGb !== undefined ? userUpdate.storageFreeGb : current.storage.freeGb,
      source: 'user',
    };
  }

  if (userUpdate.os !== undefined) {
    next.os = {
      name: userUpdate.os,
      source: 'user',
    };
  }

  if (userUpdate.resolution !== undefined) {
    next.resolution = {
      w: userUpdate.resolution.w,
      h: userUpdate.resolution.h,
      source: 'user',
    };
  }

  return next;
}

/**
 * Converts a legacy UserSpecs object to the unified SpecObject format.
 */
export function userSpecsToSpecObject(legacy: any): SpecObject {
  if (legacy?.specObject) {
    return legacy.specObject;
  }

  const deviceType: SpecDeviceType =
    legacy?.deviceType === 'laptop'
      ? 'laptop'
      : legacy?.deviceType === 'desktop'
      ? 'desktop'
      : 'unknown';

  let resW: number | null = null;
  let resH: number | null = null;
  if (typeof legacy?.displayResolution === 'string') {
    const parts = legacy.displayResolution.split('x');
    if (parts.length === 2) {
      resW = parseInt(parts[0], 10) || null;
      resH = parseInt(parts[1], 10) || null;
    }
  }

  return {
    deviceType,
    cpu: {
      name: legacy?.cpuName || 'Unknown',
      source: legacy?.cpuName ? 'user' : 'unknown',
    },
    gpu: {
      name: legacy?.gpuName || 'Unknown',
      source: legacy?.gpuName ? 'user' : 'unknown',
    },
    ram: {
      gb: typeof legacy?.ramGb === 'number' ? legacy.ramGb : null,
      source: typeof legacy?.ramGb === 'number' ? 'user' : 'unknown',
    },
    storage: {
      type: legacy?.primaryStorageType || 'Unknown',
      freeGb: typeof legacy?.storageFreeGb === 'number' ? legacy.storageFreeGb : null,
      source: legacy?.primaryStorageType ? 'user' : 'unknown',
    },
    os: {
      name: legacy?.os || 'Unknown',
      source: legacy?.os ? 'user' : 'unknown',
    },
    resolution: {
      w: resW,
      h: resH,
      source: resW && resH ? 'user' : 'unknown',
    },
  };
}
