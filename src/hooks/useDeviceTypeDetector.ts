import { useState, useEffect, useMemo } from 'react';
import { DeviceType } from '../types';

export function detectDeviceTypeFromBrowser(): {
  deviceType: DeviceType;
  reasons: string[];
} {
  if (typeof window === 'undefined') {
    return { deviceType: 'desktop', reasons: ['Server environment'] };
  }

  const ua = navigator.userAgent || '';
  const screenW = window.screen?.width || window.innerWidth || 1920;
  const screenH = window.screen?.height || window.innerHeight || 1080;
  const dpr = window.devicePixelRatio || 1;
  const touchPoints = navigator.maxTouchPoints || 0;
  const hasTouch = touchPoints > 0;
  const isPortrait = screenH > screenW || (window.innerWidth < 640 && screenW < 768);

  const reasons: string[] = [];

  // Mobile User Agent Regex
  const isMobileUa = /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|webOS/i.test(ua);
  const isTabletUa = /iPad|Android(?!.*Mobile)|Tablet/i.test(ua);

  // 1. Phone Detection
  if (isMobileUa || (hasTouch && screenW <= 640) || (hasTouch && isPortrait && screenW < 768)) {
    reasons.push(isMobileUa ? 'Mobile browser User-Agent detected' : 'Handheld screen width and touch profile detected');
    reasons.push(`Screen dimensions: ${screenW}×${screenH} with ${touchPoints} touch points`);
    return { deviceType: 'phone', reasons };
  }

  // 2. Laptop vs Desktop
  // Laptops usually have:
  // - High DPI scaling on smaller physical resolutions (e.g. 1366x768 to 1920x1080 with DPR > 1.25)
  // - Or Macintosh without external desktop monitor flags
  // - Or touch screen capabilities on a clamshell
  // Desktops usually have:
  // - Large external monitors (1920x1080 or 2560x1440 with 1.0 DPR native)
  // - Zero touch points
  // - Dedicated desktop OS
  const isDesktopDisplay = screenW >= 1920 && dpr === 1.0 && !hasTouch;
  const isLaptopDisplay = screenW <= 1600 || dpr > 1.0 || hasTouch;

  if (isDesktopDisplay && !/Macintosh/i.test(ua)) {
    reasons.push('Standard non-scaled 1.0x desktop display profile');
    reasons.push(`High resolution monitor: ${screenW}×${screenH}`);
    reasons.push('Physical mouse/keyboard input with zero touch sensors');
    return { deviceType: 'desktop', reasons };
  } else if (isLaptopDisplay) {
    reasons.push(`Portable screen resolution: ${screenW}×${screenH} with ${dpr}x display scaling`);
    reasons.push(hasTouch ? 'Trackpad or clamshell touch support' : 'Clamshell notebook display proportions');
    return { deviceType: 'laptop', reasons };
  }

  // Fallback default
  reasons.push(`Platform UA: ${navigator.platform || 'Desktop'}`);
  return { deviceType: 'desktop', reasons };
}

export function useDeviceTypeDetector(initialOverride?: DeviceType) {
  const [override, setOverrideState] = useState<DeviceType | null>(initialOverride || null);

  const autoDetected = useMemo(() => {
    return detectDeviceTypeFromBrowser();
  }, []);

  const currentType: DeviceType = override || autoDetected.deviceType;
  const isOverridden = override !== null && override !== autoDetected.deviceType;

  const setOverride = (type: DeviceType) => {
    setOverrideState(type);
  };

  const clearOverride = () => {
    setOverrideState(null);
  };

  return {
    detectedType: autoDetected.deviceType,
    currentType,
    isOverridden,
    reasons: autoDetected.reasons,
    setOverride,
    clearOverride,
  };
}
