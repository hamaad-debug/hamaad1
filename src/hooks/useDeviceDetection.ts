import { useState, useMemo, useEffect } from 'react';
import { DeviceType } from '../types';

export type DetectedOS = 'Windows 11' | 'Windows 10' | 'macOS' | 'Linux' | 'ChromeOS' | 'Android' | 'iOS';

export interface DeviceInferenceResult {
  deviceType: DeviceType;
  os: DetectedOS;
  reasons: string[];
}

export function inferDeviceAndOS(
  uaInput?: string,
  screenWidthInput?: number
): DeviceInferenceResult {
  const ua = uaInput ?? (typeof navigator !== 'undefined' ? navigator.userAgent || '' : '');
  const screenWidth =
    screenWidthInput ??
    (typeof window !== 'undefined'
      ? window.screen?.width || window.innerWidth || 1920
      : 1920);

  const reasons: string[] = [];

  // 1. Infer OS
  let os: DetectedOS = 'Windows 11';
  if (/Android/i.test(ua)) {
    os = 'Android';
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = 'iOS';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/CrOS/i.test(ua)) {
    os = 'ChromeOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  } else if (/Windows NT 10.0/i.test(ua)) {
    // Windows 10 vs 11 heuristic
    os = 'Windows 11';
  } else if (/Windows/i.test(ua)) {
    os = 'Windows 10';
  }

  // 2. Infer Device Type based on navigator.userAgent and screen.width
  const isMobileUa = /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|webOS/i.test(ua);
  const isTabletUa = /iPad|Android(?!.*Mobile)|Tablet/i.test(ua);
  const touchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  let deviceType: DeviceType = 'desktop';

  if (isMobileUa || screenWidth <= 640 || (screenWidth < 768 && touchPoints > 0)) {
    deviceType = 'phone';
    reasons.push(isMobileUa ? 'Mobile User-Agent signature detected' : 'Compact screen width (≤640px) detected');
    reasons.push(`Screen width: ${screenWidth}px`);
  } else if (isTabletUa || (screenWidth <= 1600 && dpr > 1.0) || screenWidth <= 1536 || touchPoints > 0) {
    // Clamshell laptops typically feature 13.3" - 16" displays with viewport width <= 1536px or scaled displays
    deviceType = 'laptop';
    reasons.push(`Notebook/laptop viewport profile: ${screenWidth}px width with ${dpr}x scaling`);
    if (touchPoints > 0) reasons.push('Touch-enabled clamshell / trackpad surface detected');
  } else {
    // Large desktop monitors (1920px+, 2560px, 3840px 1.0x native desktop)
    deviceType = 'desktop';
    reasons.push(`Desktop resolution profile: ${screenWidth}px standard external display`);
    reasons.push('Standard non-mobile desktop operating system');
  }

  return {
    deviceType,
    os,
    reasons,
  };
}

export function useDeviceDetection(initialOverride?: DeviceType) {
  const [override, setOverride] = useState<DeviceType | null>(initialOverride || null);

  const screenWidth = typeof window !== 'undefined' ? window.screen?.width || window.innerWidth || 1920 : 1920;
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';

  const inferred = useMemo(() => {
    return inferDeviceAndOS(userAgent, screenWidth);
  }, [userAgent, screenWidth]);

  const activeDeviceType: DeviceType = override || inferred.deviceType;
  const isOverridden = override !== null && override !== inferred.deviceType;

  // Toggle cycling: desktop -> laptop -> phone -> desktop
  const toggleDeviceType = () => {
    const cycle: Record<DeviceType, DeviceType> = {
      desktop: 'laptop',
      laptop: 'phone',
      phone: 'desktop',
    };
    const next = cycle[activeDeviceType];
    setOverride(next);
  };

  const handleSetOverride = (type: DeviceType) => {
    setOverride(type);
  };

  const resetOverride = () => {
    setOverride(null);
  };

  return {
    deviceType: activeDeviceType,
    autoDetectedType: inferred.deviceType,
    os: inferred.os,
    isOverridden,
    screenWidth,
    userAgent,
    reasons: inferred.reasons,
    setOverride: handleSetOverride,
    toggleDeviceType,
    resetOverride,
  };
}

export default useDeviceDetection;
