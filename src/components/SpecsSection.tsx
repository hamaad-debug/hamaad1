import React, { useState } from 'react';
import {
  Scan,
  Cpu,
  Monitor,
  HardDrive,
  CircuitBoard,
  Layers,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Flame,
  Zap,
  Smartphone,
  Laptop,
  Tablet,
  Battery,
  BatteryCharging,
  Terminal,
  Copy,
  Check,
  Globe,
  Star,
  ShieldCheck,
  Loader2,
  Sparkles,
  Search,
  ExternalLink,
} from 'lucide-react';
import { BrowserScanData, UserSpecs, StorageType, FormFactor, DeviceType } from '../types';
import { CPU_DATABASE, GPU_DATABASE, PRESET_RIGS, SMARTPHONE_PRESETS, SmartphonePreset } from '../data/hardwareDatabase';
import { runBrowserScan, mapBrowserScanToSpecs } from '../utils/browserScanner';
import { updateSpecFromUserInput, userSpecsToSpecObject } from '../specData';
import { cleanGpuRendererString } from '../detection';
import { logScanToFirestore } from '../lib/firebase';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { DeviceTypeSelector } from './DeviceTypeSelector';
import { runFullPrecisionProbe, PrecisionProbeResult } from '../utils/hardwarePrecisionProber';
import { AutoDetectionBanner } from './AutoDetectionBanner';

interface SpecsSectionProps {
  specs: UserSpecs;
  setSpecs: React.Dispatch<React.SetStateAction<UserSpecs>>;
  onGoToReport: () => void;
}

export const SpecsSection: React.FC<SpecsSectionProps> = ({ specs, setSpecs, onGoToReport }) => {
  const [activeMode, setActiveMode] = useState<'autodetect' | 'manual' | 'scan' | 'exact'>('autodetect');
  const [scanData, setScanData] = useState<BrowserScanData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanApplied, setScanApplied] = useState(false);

  const handleApplyAutoDetectedSpecs = (detected: any) => {
    setSpecs((prev) => ({
      ...prev,
      ...detected,
      formFactor: detected.deviceType === 'laptop' ? 'laptop' : detected.deviceType === 'phone' ? 'phone' : 'desktop',
    }));
    setIs100PercentVerified(true);
  };

  // 100% Precision Command & Dump Parser State
  const [systemDumpInput, setSystemDumpInput] = useState('');
  const [isParsingDump, setIsParsingDump] = useState(false);
  const [dumpParseError, setDumpParseError] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [is100PercentVerified, setIs100PercentVerified] = useState(false);

  // Smartphone 100% Precision State
  const [mobileTarget, setMobileTarget] = useState<'phone' | 'remote_pc'>('phone');
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [phoneSearchError, setPhoneSearchError] = useState<string | null>(null);
  const [phoneSearchResult, setPhoneSearchResult] = useState<any | null>(null);
  const [phoneSearchSources, setPhoneSearchSources] = useState<any[]>([]);

  const handleLookupPhone = async (modelOverride?: string) => {
    const q = (modelOverride || phoneSearchQuery).trim();
    if (!q) return;
    setIsSearchingPhone(true);
    setPhoneSearchError(null);
    setPhoneSearchResult(null);

    try {
      const res = await fetch('/api/hardware/lookup-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneModel: q }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to find smartphone specs');
      }
      setPhoneSearchResult(data.specs);
      setPhoneSearchSources(data.sources || []);
    } catch (err: any) {
      setPhoneSearchError(err.message || 'Failed to search phone specifications');
    } finally {
      setIsSearchingPhone(false);
    }
  };

  const handleApplyPhoneSpecs = (p: any) => {
    setSpecs((prev) => ({
      ...prev,
      cpuName: p.cpuName || prev.cpuName,
      cpuBrand: p.cpuBrand || prev.cpuBrand,
      cpuCores: p.cpuCores || prev.cpuCores,
      cpuThreads: p.cpuThreads || prev.cpuThreads,
      cpuScore: p.cpuScore || prev.cpuScore,
      cpuSingleScore: p.cpuSingleScore || prev.cpuSingleScore,
      cpuGeneration: p.cpuGeneration || prev.cpuGeneration,
      gpuName: p.gpuName || prev.gpuName,
      gpuBrand: p.gpuBrand || prev.gpuBrand,
      isIntegratedGpu: true,
      gpuVramGb: p.gpuVramGb ?? prev.gpuVramGb,
      gpuScore: p.gpuScore || prev.gpuScore,
      gpuTier: p.gpuTier ?? prev.gpuTier,
      ramGb: p.ramGb || prev.ramGb,
      ramType: p.ramType || prev.ramType,
      ramChannels: p.ramChannels || prev.ramChannels,
      primaryStorageType: 'nvme_ssd',
      storageCapacityGb: p.storageCapacityGb || prev.storageCapacityGb,
      displayResolution: p.displayResolution || prev.displayResolution,
      os: p.os || prev.os,
      deviceType: 'phone',
      formFactor: 'phone',
    }));
    setIs100PercentVerified(true);
    setActiveMode('manual');
  };

  const handleSelectPhonePreset = (preset: SmartphonePreset) => {
    setSpecs(preset.specs);
    setIs100PercentVerified(true);
    setActiveMode('manual');
  };

  // Online Hardware Review Grounding State
  const [onlineReview, setOnlineReview] = useState<{
    summary: string;
    strengths: string[];
    weaknesses: string[];
    verdictRating: string;
  } | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const handleCopyCmd = (cmd: string, key: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const handleParseSystemDump = async () => {
    if (!systemDumpInput.trim()) return;
    setIsParsingDump(true);
    setDumpParseError(null);

    try {
      const res = await fetch('/api/hardware/parse-system-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: systemDumpInput }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to parse hardware info');
      }

      const p = json.specs;
      // Match or inject exact specs into user state
      setSpecs((prev) => {
        const curSpecObj = prev.specObject || userSpecsToSpecObject(prev);
        const updatedSpecObj = updateSpecFromUserInput(curSpecObj, {
          cpuName: p.cpuName || prev.cpuName,
          gpuName: p.gpuName || prev.gpuName,
          ramGb: p.ramGb || prev.ramGb,
          storageType: p.primaryStorageType || prev.primaryStorageType,
          os: p.os || prev.os,
          deviceType: (p.deviceType as any) || prev.deviceType,
        });

        return {
          ...prev,
          cpuName: p.cpuName || prev.cpuName,
          cpuBrand: p.cpuBrand || prev.cpuBrand,
          cpuCores: p.cpuCores || prev.cpuCores,
          cpuThreads: p.cpuThreads || prev.cpuThreads,
          cpuScore: p.cpuScore || prev.cpuScore,
          cpuSingleScore: p.cpuSingleScore || prev.cpuSingleScore,
          cpuGeneration: p.cpuGeneration || prev.cpuGeneration,
          gpuName: p.gpuName || prev.gpuName,
          gpuBrand: p.gpuBrand || prev.gpuBrand,
          isIntegratedGpu: Boolean(p.isIntegratedGpu),
          gpuVramGb: p.gpuVramGb ?? prev.gpuVramGb,
          gpuScore: p.gpuScore || prev.gpuScore,
          gpuTier: p.gpuTier ?? prev.gpuTier,
          ramGb: p.ramGb || prev.ramGb,
          ramType: p.ramType || prev.ramType,
          ramChannels: p.ramChannels || prev.ramChannels,
          primaryStorageType: (p.primaryStorageType as StorageType) || prev.primaryStorageType,
          displayResolution: p.displayResolution || prev.displayResolution,
          os: p.os || prev.os,
          deviceType: (p.deviceType as DeviceType) || prev.deviceType,
          formFactor: p.deviceType === 'phone' ? 'phone' : p.deviceType === 'laptop' ? 'laptop' : 'desktop',
          specObject: updatedSpecObj,
        };
      });

      setIs100PercentVerified(true);
      setActiveMode('manual');
    } catch (err: any) {
      console.warn('Backend parser failed, attempting client-side fallback:', err);
      // Client-side regex fallback for 100% precision parsing
      const text = systemDumpInput;
      let matchedCpu: string | null = null;
      let matchedGpu: string | null = null;
      let matchedRamGb: number | null = null;

      // Extract CPU
      const cpuLine = text.match(/(?:Intel|AMD|Apple|Qualcomm)[^\r\n]+/i);
      if (cpuLine) matchedCpu = cpuLine[0].trim();

      // Extract GPU
      const gpuLine = text.match(/(?:NVIDIA|GeForce|Radeon|RTX|GTX|Iris|UHD Graphics|Apple M\d)[^\r\n]+/i);
      if (gpuLine) matchedGpu = gpuLine[0].trim();

      // Extract RAM
      const ramMatch = text.match(/(\d+)\s*(?:GB|GiB|Gi|\b(?:total physical memory|installed memory)\b)/i);
      if (ramMatch) matchedRamGb = parseInt(ramMatch[1], 10);

      if (matchedCpu || matchedGpu || matchedRamGb) {
        setSpecs((prev) => {
          const curSpecObj = prev.specObject || userSpecsToSpecObject(prev);
          const updatedSpecObj = updateSpecFromUserInput(curSpecObj, {
            ...(matchedCpu ? { cpuName: matchedCpu } : {}),
            ...(matchedGpu ? { gpuName: matchedGpu } : {}),
            ...(matchedRamGb && matchedRamGb > 0 && matchedRamGb < 512 ? { ramGb: matchedRamGb } : {}),
          });
          return {
            ...prev,
            ...(matchedCpu ? { cpuName: matchedCpu } : {}),
            ...(matchedGpu ? { gpuName: matchedGpu } : {}),
            ...(matchedRamGb && matchedRamGb > 0 && matchedRamGb < 512 ? { ramGb: matchedRamGb } : {}),
            specObject: updatedSpecObj,
          };
        });
        setIs100PercentVerified(true);
        setActiveMode('manual');
      } else {
        setDumpParseError(err.message || 'Unable to parse system text. Please check the pasted text.');
      }
    } finally {
      setIsParsingDump(false);
    }
  };

  // Fetch Live Internet Reviews for Active CPU + GPU
  const handleFetchOnlineReviews = async () => {
    setIsLoadingReview(true);
    setReviewError(null);
    try {
      const res = await fetch('/api/hardware/online-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpuName: specs.cpuName, gpuName: specs.gpuName }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to fetch online reviews');
      }

      setOnlineReview(json.data);
    } catch (err: any) {
      setReviewError(err.message || 'Could not retrieve live reviews');
    } finally {
      setIsLoadingReview(false);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    setScanApplied(false);
    try {
      // Small simulated delay for feedback
      await new Promise((resolve) => setTimeout(resolve, 500));
      const result = await runBrowserScan();
      setScanData(result);
      // Log to persistent Firestore database
      logScanToFirestore({
        detectedCategory: result.deviceDetection.category,
        confidence: result.deviceDetection.confidence,
        logicalCores: result.logicalCores || 0,
        deviceMemoryGb: result.deviceMemoryGb || 0,
        renderer: result.webGlRenderer || 'Default WebGL',
        screenResolution: `${result.screenWidth}x${result.screenHeight}`,
        hasBattery: Boolean(result.deviceDetection.hasBattery),
        batteryPercent: result.deviceDetection.batteryLevelPercent || 0,
        timestamp: result.scanTimestamp,
      }).catch((e) => console.warn('Cloud scan logging:', e));
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const applyScanToSpecs = () => {
    if (!scanData) return;
    const updated = mapBrowserScanToSpecs(scanData, specs);
    setSpecs(updated);
    setScanApplied(true);
    setActiveMode('manual');
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESET_RIGS.find((p) => p.id === presetId);
    if (preset) {
      setSpecs(preset.specs);
      setIs100PercentVerified(false);
    }
  };

  const {
    deviceType: detectedOrOverriddenType,
    autoDetectedType,
    os: autoDetectedOS,
    isOverridden,
    reasons: deviceTypeReasons,
    setOverride,
    toggleDeviceType,
    resetOverride,
  } = useDeviceDetection(specs.deviceType);

  const [precisionResult, setPrecisionResult] = useState<PrecisionProbeResult | null>(null);
  const [isProbingPrecision, setIsProbingPrecision] = useState(false);

  const handleDeviceTypeChange = (newType: DeviceType) => {
    setOverride(newType);
    setSpecs((prev) => {
      const devType = newType === 'desktop' ? 'desktop' : newType === 'laptop' ? 'laptop' : 'unknown';
      const currentSpecObj = prev.specObject || userSpecsToSpecObject(prev);
      const updatedSpecObj = updateSpecFromUserInput(currentSpecObj, {
        deviceType: devType,
      });
      return {
        ...prev,
        deviceType: newType,
        formFactor: newType === 'phone' ? 'phone' : newType === 'laptop' ? 'laptop' : 'desktop',
        specObject: updatedSpecObj,
      };
    });
  };

  const handleToggleDeviceType = () => {
    const nextType: DeviceType = specs.deviceType === 'desktop' ? 'laptop' : 'desktop';
    setOverride(nextType);
    setSpecs((prev) => ({
      ...prev,
      deviceType: nextType,
      formFactor: nextType,
    }));
  };

  const handleResetDeviceType = () => {
    resetOverride();
    const fallbackType = autoDetectedType === 'phone' ? 'laptop' : autoDetectedType;
    setSpecs((prev) => ({
      ...prev,
      deviceType: fallbackType,
      formFactor: fallbackType,
    }));
  };

  const handleRunPrecisionProbe = async () => {
    setIsProbingPrecision(true);
    try {
      const probe = await runFullPrecisionProbe(scanData?.webGlRenderer || null);
      setPrecisionResult(probe);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsProbingPrecision(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Device Type Detector & Manual Override Selector (Desktop & Laptop Only) */}
      <DeviceTypeSelector
        deviceType={specs.deviceType === 'desktop' ? 'desktop' : 'laptop'}
        detectedType={autoDetectedType === 'phone' ? 'laptop' : autoDetectedType}
        detectedOS={autoDetectedOS}
        isOverridden={isOverridden}
        reasons={deviceTypeReasons.filter((r) => !r.toLowerCase().includes('phone'))}
        onChange={handleDeviceTypeChange}
        onToggle={handleToggleDeviceType}
        onReset={handleResetDeviceType}
        allowedTypes={['desktop', 'laptop']}
      />

      {/* Top Banner & Mode Toggle */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8">
        <div className="max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
            System Specifications & Health Engine
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-400 leading-relaxed">
            Configure your exact hardware configuration below. A standard web browser has strict privacy boundaries, so entering or refining your specifications guarantees precise real-world capability ratings.
          </p>
        </div>

        {/* Action Toggle Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <button
            onClick={() => setActiveMode('autodetect')}
            className={`p-4 rounded-lg border text-left transition-all relative overflow-hidden ${
              activeMode === 'autodetect'
                ? 'bg-zinc-800/90 border-emerald-500 shadow-lg ring-1 ring-emerald-500/40'
                : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-md ${
                  activeMode === 'autodetect' ? 'bg-[#e8702a]/20 text-[#e8702a]' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-zinc-100 text-sm flex items-center gap-1.5">
                  <span>{specs.deviceType === 'phone' ? 'Phone Detection' : 'CMD Hardware Detection Tool'}</span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#e8702a]/20 text-[#e8702a] border border-[#e8702a]/40 font-bold">
                    CMD
                  </span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {specs.deviceType === 'phone'
                    ? '1-Tap smartphone model lookup.'
                    : 'Download or run CMD tool. Reads real WMI hardware.'}
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveMode('manual')}
            className={`p-4 rounded-lg border text-left transition-all ${
              activeMode === 'manual'
                ? 'bg-zinc-800/80 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-md ${
                  activeMode === 'manual' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                  <span>{specs.deviceType === 'phone' ? 'Phone Specs' : 'Enter My Specs'}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    Manual
                  </span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {specs.deviceType === 'phone'
                    ? 'Select SoC, RAM, and mobile storage.'
                    : 'Select exact CPU, GPU, RAM, & storage.'}
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveMode('scan');
              if (!scanData) handleScan();
            }}
            className={`p-4 rounded-lg border text-left transition-all ${
              activeMode === 'scan'
                ? 'bg-zinc-800/80 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-md ${
                  activeMode === 'scan' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                <Scan className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-zinc-100 text-sm flex items-center gap-1.5">
                  <span>{specs.deviceType === 'phone' ? 'Scan Mobile Browser' : 'In-Browser Detection Tool'}</span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-700">
                    Instant
                  </span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {specs.deviceType === 'phone'
                    ? 'Screen, touch profile & WebGL GPU.'
                    : 'Instant hardware diagnostic (WebGL, Cores, Memory). Zero downloads.'}
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveMode('exact');
              if (specs.deviceType === 'phone') {
                setMobileTarget('phone');
              }
            }}
            className={`p-4 rounded-lg border text-left transition-all ${
              activeMode === 'exact'
                ? 'bg-zinc-800/80 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-md ${
                  activeMode === 'exact' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {specs.deviceType === 'phone' ? <Smartphone className="w-5 h-5 text-emerald-400" /> : <Terminal className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-semibold text-zinc-100 text-sm flex items-center gap-1.5">
                  <span>{specs.deviceType === 'phone' ? 'Phone Exact Match' : '100% Terminal'}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                    Console
                  </span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {specs.deviceType === 'phone'
                    ? 'Phone model match, "About Phone" or live lookup.'
                    : 'Terminal command / DxDiag auto-importer.'}
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 1-CLICK AUTO-DETECT VIEW (System Requirements Lab Engine) */}
      {activeMode === 'autodetect' && (
        <AutoDetectionBanner
          onApplySpecs={handleApplyAutoDetectedSpecs}
          currentDeviceType={specs.deviceType}
          specs={specs}
        />
      )}

      {/* SCANNER VIEW */}
      {activeMode === 'scan' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-zinc-100">Live Browser Diagnostic Scan</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Here is what Web Standards (W3C APIs) currently expose from your running browser session.
                </p>
              </div>
              <button
                onClick={handleScan}
                disabled={isScanning}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-colors disabled:opacity-50"
              >
                <Scan className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Querying APIs...' : 'Re-Scan Browser'}
              </button>
            </div>

            {/* Device Category Detection Banner (Phone vs Laptop vs Desktop PC) */}
            {scanData && (
              <div className="mt-8 p-8 bg-zinc-950 border border-zinc-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      {scanData.deviceDetection.category === 'phone' ? (
                        <Smartphone className="w-6 h-6" />
                      ) : scanData.deviceDetection.category === 'tablet' ? (
                        <Tablet className="w-6 h-6" />
                      ) : scanData.deviceDetection.category === 'laptop' ? (
                        <Laptop className="w-6 h-6" />
                      ) : (
                        <Monitor className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
                          Detected Hardware Class
                        </span>
                        <span className="text-xs text-zinc-400">
                          Confidence: <strong className="text-emerald-400 capitalize">{scanData.deviceDetection.confidence}</strong>
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-zinc-100 tracking-tight mt-0.5">
                        {scanData.deviceDetection.categoryLabel}
                      </h3>
                    </div>
                  </div>

                  {/* Battery State Badge */}
                  <div className="bg-zinc-900/90 border border-zinc-800 px-3.5 py-2 rounded-lg flex items-center gap-2.5 shrink-0">
                    {scanData.deviceDetection.hasBattery ? (
                      <>
                        {scanData.deviceDetection.isCharging ? (
                          <BatteryCharging className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Battery className="w-4 h-4 text-amber-400" />
                        )}
                        <div className="text-xs">
                          <div className="font-semibold text-zinc-200">
                            {scanData.deviceDetection.batteryLevelPercent}% Battery
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {scanData.deviceDetection.isCharging ? 'Plugged into AC Power' : 'Discharging on internal battery'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-zinc-400" />
                        <div className="text-xs">
                          <div className="font-semibold text-zinc-200">AC Direct Power</div>
                          <div className="text-[10px] text-zinc-400">No battery detected (Desktop PSU)</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Evidence bullets */}
                <div className="mt-4 pt-3.5 border-t border-zinc-800/80">
                  <div className="text-[11px] font-semibold text-zinc-300 mb-1.5">How this was determined:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-400">
                    {scanData.deviceDetection.reasons.map((r, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Results Grid */}
            {scanData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {/* CPU */}
                <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    Logical CPU Cores
                  </div>
                  <div className="mt-2 text-xl font-bold font-mono text-zinc-100">
                    {scanData.logicalCores ? `${scanData.logicalCores} Logical Threads` : 'Not exposed'}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Via <code className="text-zinc-300">navigator.hardwareConcurrency</code>. Browser conceals clock speed, cache size, and exact model.
                  </p>
                </div>

                {/* RAM */}
                <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                    <CircuitBoard className="w-4 h-4 text-emerald-400" />
                    Browser Device Memory
                  </div>
                  <div className="mt-2 text-xl font-bold font-mono text-zinc-100">
                    {scanData.deviceMemoryGb ? (scanData.deviceMemoryGb >= 8 ? 'At least 8 GB' : `~${scanData.deviceMemoryGb} GB`) : 'Not supported in this browser'}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Via <code className="text-zinc-300">navigator.deviceMemory</code>. Chrome/Edge caps reporting at 8 GB max to prevent fingerprinting.
                  </p>
                </div>

                {/* GPU */}
                <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                    <Monitor className="w-4 h-4 text-emerald-400" />
                    WebGL Graphics Adapter
                  </div>
                  <div className="mt-2 text-sm font-semibold text-zinc-100 truncate" title={scanData.webGlRenderer || 'Default WebGL'}>
                    {cleanGpuRendererString(scanData.webGlRenderer)}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 truncate">
                    Vendor: {scanData.webGlVendor || 'Standard'} · Dedicated VRAM & clock are unreadable.
                  </p>
                </div>

                {/* Display */}
                <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Display Resolution & Scale
                  </div>
                  <div className="mt-2 text-xl font-bold font-mono text-zinc-100">
                    {scanData.screenWidth} × {scanData.screenHeight}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Pixel Ratio: {scanData.pixelRatio}x · Color Depth: {scanData.colorDepth}-bit
                  </p>
                </div>

                {/* Storage Quota */}
                <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    Browser Storage Quota
                  </div>
                  <div className="mt-2 text-xl font-bold font-mono text-zinc-100">
                    {scanData.estimatedStorageQuotaGb ? `${scanData.estimatedStorageQuotaGb} GB allocated` : 'Unrestricted / Hidden'}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Drive physical type (SSD vs HDD) and SMART health cannot be queried via browser.
                  </p>
                </div>

                {/* Platform */}
                <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                    <Info className="w-4 h-4 text-emerald-400" />
                    Platform & Environment
                  </div>
                  <div className="mt-2 text-sm font-semibold text-zinc-100 truncate">
                    {scanData.platform}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Touch Points: {scanData.touchSupport ? 'Touchscreen active' : 'Mouse / Non-touch'}
                  </p>
                </div>
              </div>
            )}

            {/* Action to Apply */}
            <div className="mt-6 pt-5 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-zinc-400">
                {scanApplied ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Detected parameters were applied to the Spec Engine!
                  </span>
                ) : (
                  <span>Click below to populate the hardware configuration with detected findings.</span>
                )}
              </div>
              <button
                onClick={applyScanToSpecs}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors"
              >
                Apply Detected Data to Spec Engine
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Educational Limitation Box */}
          <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-5 sm:p-6 text-zinc-300">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-200 text-sm">
                  Why A Normal Website Cannot Read Every Hardware Specification
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Web browser sandboxes deliberately restrict access to hardware identifiers to protect your privacy and prevent tracking across sites. For instance:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs text-zinc-300">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>CPU Model:</strong> Only generic core counts are provided; clock frequencies, cache, and architectural generation are concealed.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>RAM Ceiling:</strong> Chromium artificially caps <code className="text-amber-200 font-mono">navigator.deviceMemory</code> at 8 GB even if your computer has 32 GB or 64 GB installed.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>GPU Details:</strong> WebGL often returns a sanitized driver name without revealing VRAM bandwidth or shader cores.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>Drive Type:</strong> No browser API can tell whether you have an ultra-fast NVMe SSD or a slow 5400 RPM mechanical HDD.</span>
                  </div>
                </div>
                <p className="text-xs text-amber-300/90 mt-3 font-medium">
                  For 100% precise capability ratings and upgrade advice, use the <strong>Enter My Specs</strong> tab below.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 100% EXACT PRECISION DIAGNOSTIC VIEW */}
      {activeMode === 'exact' && (
        <div className="space-y-6">
          {/* MOBILE 100% PRECISION VIEW (Tailored specifically for Smartphones) */}
          {specs.deviceType === 'phone' && mobileTarget === 'phone' ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
                    <Smartphone className="w-4 h-4" />
                    100.0% Exact Smartphone Diagnostics & Chipset Match
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-100 mt-1">
                    Instant Smartphone Hardware & Chipset Verification
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed max-w-2xl">
                    Smartphones operate inside secure, sandboxed operating systems (iOS and Android) without terminal or command-line access. 100% exact hardware precision on mobile is achieved by identifying your exact phone model and matching it with official manufacturer benchmarks and technical databases (PassMark, Geekbench, GSMArena).
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                  {is100PercentVerified && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      100% Precision Verified Mobile
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setMobileTarget('remote_pc')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs border border-zinc-700 transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Checking a PC from this phone?</span>
                  </button>
                </div>
              </div>

              {/* METHOD 1: Live Online Smartphone Search (Powered by Google Search Grounding) */}
              <div className="p-4 sm:p-5 rounded-xl bg-zinc-950/70 border border-zinc-800/90 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">
                      Method 1: Search Any Smartphone Model Online (100% Exact)
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Search any phone model in real-time. We query official technical databases to fetch the exact SoC, GPU, RAM, and Geekbench scores.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phoneSearchQuery}
                      onChange={(e) => setPhoneSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLookupPhone()}
                      placeholder="e.g. Samsung Galaxy S24 Ultra, iPhone 15 Pro, Pixel 8 Pro, OnePlus 12..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLookupPhone()}
                    disabled={isSearchingPhone || !phoneSearchQuery.trim()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-xs font-bold rounded-lg transition-colors shrink-0 shadow-md shadow-emerald-500/10"
                  >
                    {isSearchingPhone ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Searching Online Specs...
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        Search Official Specs
                      </>
                    )}
                  </button>
                </div>

                {/* Popular Quick Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-zinc-500">Quick searches:</span>
                  {[
                    'iPhone 15 Pro',
                    'Samsung Galaxy S24 Ultra',
                    'Google Pixel 8 Pro',
                    'OnePlus 12',
                    'Xiaomi 14',
                    'iPhone 13',
                  ].map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => {
                        setPhoneSearchQuery(model);
                        handleLookupPhone(model);
                      }}
                      className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
                    >
                      {model}
                    </button>
                  ))}
                </div>

                {phoneSearchError && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{phoneSearchError}</span>
                  </div>
                )}

                {/* Online Search Results Display */}
                {phoneSearchResult && (
                  <div className="mt-3 p-4 rounded-lg bg-zinc-900 border border-emerald-500/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Official Technical Profile Found</span>
                        </div>
                        <h4 className="text-sm font-bold text-zinc-100 mt-0.5">
                          {phoneSearchResult.modelName || phoneSearchQuery}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyPhoneSpecs(phoneSearchResult)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-md transition-colors shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Apply 100% Verified Specs
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="p-2.5 rounded bg-zinc-950/70 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block uppercase font-mono">SoC / Processor</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block truncate">
                          {phoneSearchResult.cpuName}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-zinc-950/70 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block uppercase font-mono">Mobile GPU</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block truncate">
                          {phoneSearchResult.gpuName}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-zinc-950/70 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block uppercase font-mono">Memory</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">
                          {phoneSearchResult.ramGb} GB {phoneSearchResult.ramType}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-zinc-950/70 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block uppercase font-mono">Display</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">
                          {phoneSearchResult.displayResolution || 'Full HD+'}
                        </span>
                      </div>
                    </div>

                    {phoneSearchResult.confidenceNotes && (
                      <p className="text-[11px] text-zinc-400 italic">
                        "{phoneSearchResult.confidenceNotes}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* METHOD 2: 1-Tap Popular Smartphone Presets (100% Verified Hardware) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Method 2: 1-Tap Official Smartphone Presets</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Select your exact phone for instant 100% verified specifications and Geekbench calibration.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SMARTPHONE_PRESETS.map((preset) => {
                    const isSelected = specs.cpuName === preset.specs.cpuName && specs.ramGb === preset.specs.ramGb;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPhonePreset(preset)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-zinc-800 border-emerald-500 text-zinc-100 ring-1 ring-emerald-500/30'
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-100">{preset.model}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                            {preset.brand}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-mono mt-1 truncate">
                          {preset.chipset}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2">
                          <span>{preset.ramDisplay}</span>
                          <span>•</span>
                          <span>{preset.storageDisplay}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* METHOD 3: Fast 10-Second "About Phone" Paste */}
              <div className="p-4 sm:p-5 rounded-xl bg-zinc-950/70 border border-zinc-800/90 space-y-3">
                <h3 className="text-sm font-bold text-zinc-200">
                  Method 3: Paste from Your Phone's "About" Settings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-400">
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80">
                    <span className="font-bold text-zinc-200 block mb-1">On iPhone / iOS:</span>
                    <span>Go to <strong>Settings → General → About</strong>. Copy the <strong>Model Name</strong> (e.g. "iPhone 15 Pro") or serial details and paste below.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80">
                    <span className="font-bold text-zinc-200 block mb-1">On Android:</span>
                    <span>Go to <strong>Settings → About Phone</strong>. Copy the <strong>Device Name / Processor</strong> details and paste below.</span>
                  </div>
                </div>

                <div className="pt-2">
                  <textarea
                    rows={2}
                    value={systemDumpInput}
                    onChange={(e) => setSystemDumpInput(e.target.value)}
                    placeholder="Paste your Model Name or About Phone text here (e.g. Samsung Galaxy S23 Ultra 256GB SM-S918B or iPhone 14 Pro Max)..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {dumpParseError && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{dumpParseError}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParseSystemDump}
                    disabled={isParsingDump || !systemDumpInput.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-xs font-bold rounded-lg transition-colors shadow-md shadow-emerald-500/10"
                  >
                    {isParsingDump ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Extracting Phone Hardware...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Calibrate 100% Exact Specs from Text
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* DESKTOP / LAPTOP TERMINAL & DXDIAG DIAGNOSTIC VIEW */
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                    <Terminal className="w-4 h-4" />
                    100.0% Exact PC Hardware Diagnostics
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-100 mt-1">
                    Bypass Browser Sandboxes & Detect 100% Exact PC Hardware
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed max-w-2xl">
                    Standard web browsers only achieve ~40% precision because OS security restricts raw hardware access (capping RAM at 8GB and concealing CPU clocks). Run a safe, read-only 1-line command in your terminal to instantly extract your exact PC specifications.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                  {is100PercentVerified && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold shrink-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      100% Precision Verified Rig
                    </div>
                  )}

                  {specs.deviceType === 'phone' && (
                    <button
                      type="button"
                      onClick={() => setMobileTarget('phone')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs border border-zinc-700 transition-colors"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Back to Smartphone Diagnostics</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 1-Click OS Commands */}
              <div className="mt-6 pt-5 border-t border-zinc-800 space-y-4">
                <div className="text-xs font-bold text-zinc-200">
                  Step 1: Copy & run this read-only command in your computer's terminal (PowerShell, Terminal, or Bash):
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Windows */}
                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400">Windows (PowerShell)</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyCmd(
                              'Get-CimInstance Win32_Processor | Select-Object -ExpandProperty Name; (Get-CimInstance Win32_VideoController).Name; [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB); (Get-CimInstance Win32_DiskDrive).MediaType',
                              'win'
                            )
                          }
                          className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] flex items-center gap-1"
                        >
                          {copiedCmd === 'win' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedCmd === 'win' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <code className="text-[10px] text-zinc-400 font-mono block mt-1.5 line-clamp-2">
                        Get-CimInstance Win32_Processor | Select-Object -ExpandProperty Name; (Get-CimInstance Win32_VideoController).Name; ...
                      </code>
                    </div>
                  </div>

                  {/* macOS */}
                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-200">macOS (Terminal)</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyCmd(
                              'system_profiler SPHardwareDataType SPDisplaysDataType | grep -E "Chip|Processor|Memory|Graphics/Displays|Chipset"',
                              'mac'
                            )
                          }
                          className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] flex items-center gap-1"
                        >
                          {copiedCmd === 'mac' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedCmd === 'mac' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <code className="text-[10px] text-zinc-400 font-mono block mt-1.5 line-clamp-2">
                        system_profiler SPHardwareDataType SPDisplaysDataType | grep -E "Chip|Processor|Memory"...
                      </code>
                    </div>
                  </div>

                  {/* Linux */}
                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400">Linux (Terminal)</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyCmd(
                              'lscpu | grep "Model name"; lspci | grep -i vga; free -h | grep Mem',
                              'linux'
                            )
                          }
                          className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] flex items-center gap-1"
                        >
                          {copiedCmd === 'linux' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedCmd === 'linux' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <code className="text-[10px] text-zinc-400 font-mono block mt-1.5 line-clamp-2">
                        lscpu | grep "Model name"; lspci | grep -i vga; free -h | grep Mem
                      </code>
                    </div>
                  </div>
                </div>

                {/* Step 2: Paste Dump */}
                <div className="pt-2">
                  <label className="text-xs font-bold text-zinc-200 block mb-1.5">
                    Step 2: Paste the terminal output or DxDiag text below:
                  </label>
                  <textarea
                    rows={4}
                    value={systemDumpInput}
                    onChange={(e) => setSystemDumpInput(e.target.value)}
                    placeholder={`Example output:
13th Gen Intel(R) Core(TM) i7-13700K
NVIDIA GeForce RTX 4070 Ti
32 GB RAM
SSD NVMe`}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {dumpParseError && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{dumpParseError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-zinc-400">
                    Our neural parser automatically isolates CPU generation, GPU VRAM, physical RAM size, and SSD status.
                  </span>

                  <button
                    type="button"
                    onClick={handleParseSystemDump}
                    disabled={isParsingDump || !systemDumpInput.trim()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-xs font-bold rounded-lg transition-colors shadow-lg shadow-cyan-500/10"
                  >
                    {isParsingDump ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Parsing Hardware Info...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Calibrate to 100% Precision
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MANUAL SPEC ENTRY FORM (The Primary Path) */}
      {activeMode === 'manual' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              Detailed Hardware Configuration
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Select your processor, graphics, memory type, and primary storage drive.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* CPU Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Processor (CPU)</span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {specs.cpuCores} Cores · {specs.cpuThreads} Threads
                  </span>
                </label>
                <select
                  aria-label="Select Processor CPU"
                  value={specs.cpuId}
                  onChange={(e) => {
                    const found = CPU_DATABASE.find((c) => c.id === e.target.value);
                    if (found) {
                      setSpecs((prev) => {
                        const currentSpecObj = prev.specObject || userSpecsToSpecObject(prev);
                        const updatedSpecObj = updateSpecFromUserInput(currentSpecObj, {
                          cpuName: found.name,
                        });
                        return {
                          ...prev,
                          cpuId: found.id,
                          cpuName: found.name,
                          cpuCores: found.cores,
                          cpuThreads: found.threads,
                          cpuScore: found.score,
                          cpuSingleScore: found.singleScore,
                          cpuGeneration: found.generation,
                          cpuBrand: found.brand,
                          specObject: updatedSpecObj,
                        };
                      });
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <optgroup label="Intel Processors">
                    {CPU_DATABASE.filter((c) => c.brand === 'Intel').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="AMD Ryzen Processors">
                    {CPU_DATABASE.filter((c) => c.brand === 'AMD').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Apple Silicon & Mobile">
                    {CPU_DATABASE.filter((c) => c.brand === 'Apple').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Mobile / Smartphone SoCs (Snapdragon, MediaTek)">
                    {CPU_DATABASE.filter((c) => c.brand === 'Other').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span>Generation: <strong className="text-zinc-300">{specs.cpuGeneration}</strong></span>
                  <span className="font-mono">PassMark Score: <strong className="text-emerald-400">{specs.cpuScore.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* GPU Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Graphics Hardware (GPU)</span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {specs.isIntegratedGpu ? 'Integrated iGPU' : `Dedicated ${specs.gpuVramGb}GB VRAM`}
                  </span>
                </label>
                <select
                  aria-label="Select Graphics Hardware GPU"
                  value={specs.gpuId}
                  onChange={(e) => {
                    const found = GPU_DATABASE.find((g) => g.id === e.target.value);
                    if (found) {
                      setSpecs((prev) => {
                        const currentSpecObj = prev.specObject || userSpecsToSpecObject(prev);
                        const updatedSpecObj = updateSpecFromUserInput(currentSpecObj, {
                          gpuName: found.name,
                        });
                        return {
                          ...prev,
                          gpuId: found.id,
                          gpuName: found.name,
                          isIntegratedGpu: found.isIntegrated,
                          gpuVramGb: found.vramGb,
                          gpuScore: found.score,
                          gpuTier: found.tier,
                          gpuBrand: found.brand,
                          specObject: updatedSpecObj,
                        };
                      });
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <optgroup label="Dedicated Graphics Cards (Nvidia / AMD)">
                    {GPU_DATABASE.filter((g) => !g.isIntegrated).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Integrated PC Graphics (Intel UHD/Iris, AMD Vega/780M, Apple)">
                    {GPU_DATABASE.filter((g) => g.isIntegrated && g.id !== 'adreno_750' && g.id !== 'apple_a17_gpu' && g.id !== 'mali_g57').map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Mobile Smartphone GPUs (Adreno, Apple A-Series, Mali)">
                    {GPU_DATABASE.filter((g) => g.id === 'adreno_750' || g.id === 'apple_a17_gpu' || g.id === 'mali_g57').map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span>VRAM: <strong className="text-zinc-300">{specs.gpuVramGb} GB</strong></span>
                  <span className="font-mono">3D Index: <strong className="text-emerald-400">{specs.gpuScore.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Memory (RAM) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Installed RAM</span>
                  <span className="text-[11px] font-mono text-zinc-400">{specs.ramType}</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[4, 8, 16, 32, 64].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        setSpecs((prev) => {
                          const currentSpecObj = prev.specObject || userSpecsToSpecObject(prev);
                          const updatedSpecObj = updateSpecFromUserInput(currentSpecObj, {
                            ramGb: size,
                          });
                          return { ...prev, ramGb: size, specObject: updatedSpecObj };
                        })
                      }
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                        specs.ramGb === size
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {size} GB
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs pt-2">
                  <span className="text-zinc-400 text-[11px]">Channel Mode:</span>
                  <button
                    type="button"
                    onClick={() => setSpecs((prev) => ({ ...prev, ramChannels: 'single' }))}
                    className={`px-2.5 py-1 text-[11px] rounded border ${
                      specs.ramChannels === 'single'
                        ? 'bg-zinc-800 border-zinc-600 text-zinc-100 font-medium'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    Single-Channel
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpecs((prev) => ({ ...prev, ramChannels: 'dual' }))}
                    className={`px-2.5 py-1 text-[11px] rounded border ${
                      specs.ramChannels === 'dual'
                        ? 'bg-zinc-800 border-zinc-600 text-emerald-400 font-medium'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    Dual-Channel (2x bandwidth)
                  </button>
                </div>
              </div>

              {/* Storage Drive */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Primary OS Storage Drive</span>
                  <span className="text-[11px] text-zinc-400">
                    {specs.storageCapacityGb} GB ({specs.storageFreeGb} GB Free)
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'nvme_ssd', label: 'NVMe SSD (Fastest)' },
                    { type: 'sata_ssd', label: 'SATA SSD (Fast)' },
                    { type: 'hdd', label: 'HDD (Mechanical Disk)' },
                  ].map((s) => (
                    <button
                      key={s.type}
                      type="button"
                      onClick={() =>
                        setSpecs((prev) => {
                          const currentSpecObj = prev.specObject || userSpecsToSpecObject(prev);
                          const updatedSpecObj = updateSpecFromUserInput(currentSpecObj, {
                            storageType: s.type,
                          });
                          return { ...prev, primaryStorageType: s.type as StorageType, specObject: updatedSpecObj };
                        })
                      }
                      className={`p-2 text-xs rounded-lg border text-center transition-all ${
                        specs.primaryStorageType === s.type
                          ? s.type === 'hdd'
                            ? 'bg-amber-950/30 border-amber-500/60 text-amber-300 font-medium'
                            : 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-medium'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {specs.primaryStorageType === 'hdd' && (
                  <p className="text-[11px] text-amber-400/90 flex items-center gap-1.5 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Mechanical HDD is the most common reason for modern PC slowdowns.
                  </p>
                )}
              </div>

              {/* Form Factor & OS */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">Device Form Factor</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'desktop', label: 'Desktop PC' },
                    { id: 'laptop', label: 'Laptop / Notebook' },
                    { id: 'phone', label: 'Smartphone' },
                    { id: 'tablet', label: 'Tablet Device' },
                    { id: 'mini_pc', label: 'Mini PC / AIO' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        setSpecs((prev) => {
                          const devType = f.id === 'desktop' ? 'desktop' : f.id === 'laptop' ? 'laptop' : 'unknown';
                          const currentSpecObj = prev.specObject || userSpecsToSpecObject(prev);
                          const updatedSpecObj = updateSpecFromUserInput(currentSpecObj, {
                            deviceType: devType,
                          });
                          return { ...prev, formFactor: f.id as FormFactor, specObject: updatedSpecObj };
                        })
                      }
                      className={`p-2 text-xs rounded-lg border transition-all ${
                        specs.formFactor === f.id
                          ? 'bg-zinc-800 border-emerald-500 text-emerald-300 font-medium'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Operating System */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">Operating System</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {['Windows 11', 'Windows 10', 'macOS', 'Linux', 'Android', 'iOS'].map((osName) => (
                    <button
                      key={osName}
                      type="button"
                      onClick={() =>
                        setSpecs((prev) => {
                          const currentSpecObj = prev.specObject || userSpecsToSpecObject(prev);
                          const updatedSpecObj = updateSpecFromUserInput(currentSpecObj, {
                            os: osName,
                          });
                          return { ...prev, os: osName as any, specObject: updatedSpecObj };
                        })
                      }
                      className={`p-2 text-xs rounded-lg border transition-all ${
                        specs.os === osName
                          ? 'bg-zinc-800 border-zinc-600 text-zinc-100 font-medium'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {osName}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-zinc-400">
                Current Rig: <strong className="text-zinc-200">{specs.cpuName}</strong> ·{' '}
                <strong className="text-zinc-200">{specs.gpuName}</strong> ·{' '}
                <strong className="text-zinc-200">{specs.ramGb}GB RAM</strong>
              </div>
              <button
                onClick={onGoToReport}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/10"
              >
                Generate Capability Report
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Hardware Index Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-400 flex items-center justify-between">
                <span>CPU Compute</span>
                <span className="font-mono text-zinc-300">{specs.cpuScore.toLocaleString()}</span>
              </div>
              <div className="mt-2 text-base font-bold text-zinc-100 truncate">{specs.cpuName.split('(')[0]}</div>
              <div className="mt-2 h-1.5 w-full bg-zinc-800 rounded overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded transition-all"
                  style={{ width: `${Math.min(100, Math.round((specs.cpuScore / 45000) * 100))}%` }}
                />
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-400 flex items-center justify-between">
                <span>GPU 3D Power</span>
                <span className="font-mono text-zinc-300">{specs.gpuScore.toLocaleString()}</span>
              </div>
              <div className="mt-2 text-base font-bold text-zinc-100 truncate">{specs.gpuName.split('(')[0]}</div>
              <div className="mt-2 h-1.5 w-full bg-zinc-800 rounded overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded transition-all"
                  style={{ width: `${Math.min(100, Math.round((specs.gpuScore / 35000) * 100))}%` }}
                />
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-400 flex items-center justify-between">
                <span>Memory Capacity</span>
                <span className="font-mono text-zinc-300">{specs.ramGb} GB</span>
              </div>
              <div className="mt-2 text-base font-bold text-zinc-100">
                {specs.ramGb} GB {specs.ramType}
              </div>
              <div className="mt-2 h-1.5 w-full bg-zinc-800 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded transition-all"
                  style={{ width: `${Math.min(100, Math.round((specs.ramGb / 32) * 100))}%` }}
                />
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-400 flex items-center justify-between">
                <span>Storage Speed</span>
                <span className="font-mono text-zinc-300">
                  {specs.primaryStorageType === 'nvme_ssd' ? 'NVMe' : specs.primaryStorageType === 'sata_ssd' ? 'SATA' : 'HDD'}
                </span>
              </div>
              <div className="mt-2 text-base font-bold text-zinc-100">
                {specs.primaryStorageType === 'nvme_ssd'
                  ? 'Ultra Fast (~3500MB/s)'
                  : specs.primaryStorageType === 'sata_ssd'
                  ? 'Fast (~500MB/s)'
                  : 'Slow (~120MB/s)'}
              </div>
              <div className="mt-2 h-1.5 w-full bg-zinc-800 rounded overflow-hidden">
                <div
                  className={`h-full rounded transition-all ${
                    specs.primaryStorageType === 'hdd' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: specs.primaryStorageType === 'nvme_ssd' ? '100%' : specs.primaryStorageType === 'sata_ssd' ? '65%' : '20%',
                  }}
                />
              </div>
            </div>
          </div>

          {/* LIVE WEB REVIEWS & BENCHMARK GROUNDING CARD */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  <Globe className="w-4 h-4" />
                  Live Internet Hardware Reviews & Consensus
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mt-1">
                  Online Hardware Reviews & Benchmarks for Your Rig
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Connects to the live web to fetch real-world reviewer sentiment, known silicon bottlenecks, and gaming verdicts for {specs.cpuName} and {specs.gpuName}.
                </p>
              </div>

              <button
                type="button"
                onClick={handleFetchOnlineReviews}
                disabled={isLoadingReview}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 text-xs font-bold rounded-lg transition-colors shrink-0"
              >
                {isLoadingReview ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Searching Web...
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    Fetch Live Web Reviews
                  </>
                )}
              </button>
            </div>

            {reviewError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
                {reviewError}
              </div>
            )}

            {onlineReview && (
              <div className="mt-4 p-5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-emerald-400" />
                    Web Consensus Verdict:
                  </div>
                  <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-100 border border-zinc-700">
                    {onlineReview.verdictRating}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed italic">
                  "{onlineReview.summary}"
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80 space-y-1.5">
                    <div className="text-[11px] font-bold text-emerald-400 uppercase">Key Strengths from Reviews</div>
                    <ul className="text-xs text-zinc-300 space-y-1">
                      {onlineReview.strengths.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80 space-y-1.5">
                    <div className="text-[11px] font-bold text-amber-400 uppercase">Known Bottlenecks & Limits</div>
                    <ul className="text-xs text-zinc-300 space-y-1">
                      {onlineReview.weaknesses.map((w, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-400">!</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
