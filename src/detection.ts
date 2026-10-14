import { SpecObject, SpecSource } from './specData';

/**
 * Cleans noisy WebGL renderer strings.
 * Removes ANGLE, Direct3D, OpenGL wrappers, driver versions, and brackets,
 * leaving only the human-readable GPU name.
 */
export function cleanGpuRendererString(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return 'Unknown';

  let cleaned = raw.trim();

  // Common ANGLE patterns:
  // "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)"
  // "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)"
  // "ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)"
  const angleMatch = cleaned.match(/ANGLE\s*\([^,]+,\s*([^,]+?)(?:\s+Direct3D|\s+vs_|\s+ps_|\s+D3D|\))/i);
  if (angleMatch && angleMatch[1]) {
    cleaned = angleMatch[1].trim();
  } else {
    // Remove ANGLE ( ... ) wrapper if match above didn't catch
    cleaned = cleaned.replace(/^ANGLE\s*\(/i, '').replace(/\)$/, '');
  }

  // Remove Direct3D / D3D markers
  cleaned = cleaned.replace(/Direct3D\d*/gi, '');
  cleaned = cleaned.replace(/D3D\d*/gi, '');

  // Remove shader model flags like vs_5_0 ps_5_0
  cleaned = cleaned.replace(/vs_\d+_\d+/gi, '');
  cleaned = cleaned.replace(/ps_\d+_\d+/gi, '');

  // Remove driver version strings and hex IDs: e.g. (0x00001234)
  cleaned = cleaned.replace(/\(0x[0-9a-fA-F]+\)/g, '');
  cleaned = cleaned.replace(/Driver\s+[\d.]+/gi, '');

  // Remove OpenGL / Vulkan wrapper text
  cleaned = cleaned.replace(/OpenGL\s+Engine/gi, '');
  cleaned = cleaned.replace(/OpenGL\s+Renderer/gi, '');
  cleaned = cleaned.replace(/Mesa\s+DRI/gi, '');

  // Clean registered trademarks and extra spaces
  cleaned = cleaned.replace(/\(R\)|\(TM\)/gi, ' ');
  cleaned = cleaned.replace(/,\s*$/, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // If empty after stripping
  if (!cleaned || cleaned.toLowerCase() === 'generic' || cleaned.toLowerCase() === 'microsoft basic render driver') {
    return 'Basic Display Adapter';
  }

  return cleaned;
}

/**
 * Honest hardware detection via standard web browser APIs.
 * Strictly adheres to browser limits:
 * - Only reads navigator.hardwareConcurrency (logical threads)
 * - Only reads navigator.deviceMemory (rounded, max 8 GB, labeled "at least")
 * - Cleans WebGL renderer for GPU
 * - Reads screen dimensions
 * - Reads OS/Platform from user agent
 * - NEVER guesses the CPU model. Sets CPU source to "unknown".
 */
export function runHonestBrowserDetection(): {
  spec: SpecObject;
  threads: number | null;
  rawGpu: string | null;
  cleanGpu: string;
  ramCappedAt8: boolean;
  needsConfirmationFields: Array<'cpu' | 'ram' | 'storage' | 'deviceType'>;
} {
  const threads = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || null : null;

  // Device memory: Chrome/Edge exposes navigator.deviceMemory (0.25, 0.5, 1, 2, 4, 8)
  const navAny = typeof navigator !== 'undefined' ? (navigator as unknown as { deviceMemory?: number }) : {};
  const rawMemory = navAny.deviceMemory || null;
  const ramCappedAt8 = rawMemory === 8; // Browser standard clamps max report to 8GB for privacy

  // WebGL GPU Extraction
  let rawGpu: string | null = null;
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          rawGpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        } else {
          rawGpu = gl.getParameter(gl.RENDERER);
        }
      }
    } catch {
      rawGpu = null;
    }
  }

  const cleanGpu = cleanGpuRendererString(rawGpu);

  // Screen resolution
  let screenW: number | null = null;
  let screenH: number | null = null;
  if (typeof window !== 'undefined' && window.screen) {
    screenW = window.screen.width || null;
    screenH = window.screen.height || null;
  }

  // OS Detection from UserAgent
  let detectedOs = 'Unknown';
  let deviceType: 'laptop' | 'desktop' | 'unknown' = 'unknown';

  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('windows nt 10.0')) detectedOs = 'Windows 11';
    else if (ua.includes('windows nt 6.3') || ua.includes('windows nt 6.2') || ua.includes('windows nt 6.1')) detectedOs = 'Windows 10';
    else if (ua.includes('macintosh') || ua.includes('mac os x')) detectedOs = 'macOS';
    else if (ua.includes('cros')) detectedOs = 'ChromeOS';
    else if (ua.includes('linux')) detectedOs = 'Linux';
    else if (ua.includes('android')) detectedOs = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) detectedOs = 'iOS';

    // Device form factor heuristic (honest: browsers cannot know 100% without battery/chassis API)
    const isMobile = /mobile|iphone|ipod|android/i.test(ua);
    if (!isMobile) {
      // If has touch and high screen DPI, more likely laptop
      const touch = navigator.maxTouchPoints > 0;
      if (touch) {
        deviceType = 'laptop';
      } else {
        deviceType = 'unknown'; // Needs user confirmation
      }
    }
  }

  // CPU: NEVER guess CPU model!
  const cpuName = threads ? `${threads} Threads (Specific CPU Model Unknown)` : 'Unknown';
  const cpuSource: SpecSource = 'unknown';

  const needsConfirmationFields: Array<'cpu' | 'ram' | 'storage' | 'deviceType'> = ['cpu', 'storage'];
  if (ramCappedAt8) needsConfirmationFields.push('ram');
  if (deviceType === 'unknown') needsConfirmationFields.push('deviceType');

  const spec: SpecObject = {
    deviceType,
    cpu: {
      name: cpuName,
      source: cpuSource,
    },
    gpu: {
      name: cleanGpu !== 'Unknown' ? cleanGpu : 'Unknown',
      source: cleanGpu !== 'Unknown' ? 'detected' : 'unknown',
    },
    ram: {
      gb: rawMemory,
      source: rawMemory ? 'detected' : 'unknown',
    },
    storage: {
      type: 'Unknown',
      freeGb: null,
      source: 'unknown', // Browser cannot read physical storage type
    },
    os: {
      name: detectedOs,
      source: detectedOs !== 'Unknown' ? 'detected' : 'unknown',
    },
    resolution: {
      w: screenW,
      h: screenH,
      source: screenW && screenH ? 'detected' : 'unknown',
    },
  };

  return {
    spec,
    threads,
    rawGpu,
    cleanGpu,
    ramCappedAt8,
    needsConfirmationFields,
  };
}
