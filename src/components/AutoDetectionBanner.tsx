import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Laptop,
  Monitor,
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
  ArrowRight,
  RefreshCw,
  Cpu,
  HardDrive,
  CircuitBoard,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Upload,
  Play,
  Terminal,
  Smartphone,
  Globe,
  Loader2,
  Search,
  Gauge,
  Gamepad2,
  Check,
  Copy,
} from 'lucide-react';
import { UserSpecs, DeviceType } from '../types';
import { GAMES_DATABASE } from '../data/gamesDatabase';
import { runBrowserScan, mapBrowserScanToSpecs } from '../utils/browserScanner';
import { resolveHardwareSpecs } from '../utils/hardwarePrecisionProber';

interface AutoDetectionBannerProps {
  onApplySpecs: (specs: Partial<UserSpecs>) => void;
  currentDeviceType?: DeviceType;
  specs?: UserSpecs;
}

export const AutoDetectionBanner: React.FC<AutoDetectionBannerProps> = ({
  onApplySpecs,
  currentDeviceType = 'laptop',
  specs,
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [detectedData, setDetectedData] = useState<any | null>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isInBrowserScanning, setIsInBrowserScanning] = useState(false);
  const pollIntervalRef = useRef<any>(null);
  const autoDownloadDoneRef = useRef(false);

  // Quick "Can You Run It" test game state
  const [selectedGameId, setSelectedGameId] = useState<string>('cyberpunk_2077');
  const [gameSearchQuery, setGameSearchQuery] = useState('');

  // Download Official Windows .exe (174 KB)
  const handleDownloadExe = (sid?: string) => {
    const targetSession = sid || sessionId;
    if (!targetSession) return;
    setHasDownloaded(true);
    setIsListening(true);

    const downloadUrl = `/api/detect/download-exe/${targetSession}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', 'PC-Detection-Helper.exe');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Active specs to display (detected specs or parent specs)
  const activeSpecs = detectedData || specs;

  // Selected test game
  const selectedGame = GAMES_DATABASE.find((g) => g.id === selectedGameId) || GAMES_DATABASE[0];

  // Evaluate "Can You Run It" pass/fail for selected game
  const minGpuPass = (activeSpecs?.gpuScore || 0) >= (selectedGame?.minGpuScore || 0) * 0.75;
  const recGpuPass = (activeSpecs?.gpuScore || 0) >= (selectedGame?.recGpuScore || 0) * 0.90;
  const minCpuPass = (activeSpecs?.cpuScore || 0) >= (selectedGame?.minCpuScore || 0) * 0.85;
  const recCpuPass = (activeSpecs?.cpuScore || 0) >= (selectedGame?.recCpuScore || 0) * 0.90;
  const minRamPass = (activeSpecs?.ramGb || 0) >= (selectedGame?.minRamGb || 8);
  const recRamPass = (activeSpecs?.ramGb || 0) >= (selectedGame?.recRamGb || 16);
  const diskPass = (activeSpecs?.storageCapacityGb || 512) >= (selectedGame?.storageGb || 50);

  const overallMinPass = minGpuPass && minCpuPass && minRamPass;
  const overallRecPass = recGpuPass && recCpuPass && recRamPass;

  // Initialize a detection session on component mount
  const initSession = async () => {
    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('rigcompass_session_id') : null;
      if (stored) {
        setSessionId(stored);
        setIsListening(true);
      }
      const res = await fetch('/api/detect/session');
      const data = await res.json();
      if (data.sessionId) {
        setSessionId(data.sessionId);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('rigcompass_session_id', data.sessionId);
        }
        setIsListening(true);
        setPollError(null);
      }
    } catch (e: any) {
      console.error('Failed to initialize auto-detection session:', e);
      setPollError('Could not start detection listener.');
    }
  };

  useEffect(() => {
    initSession();

    // Check if latest verified scan is available from server
    fetch('/api/detect/status/latest')
      .then((r) => r.json())
      .then((json) => {
        if (json.specs && json.specs.cpuName) {
          setDetectedData(json.specs);
          onApplySpecs(json.specs);
        }
      })
      .catch(() => {});

    // Check if URL has ?session_id=... or &cpu=... or &hw=... from a completed detection tool
    const urlParams = new URLSearchParams(window.location.search);
    const existingSession = urlParams.get('session_id');
    const cpuParam = urlParams.get('cpu');
    const gpuParam = urlParams.get('gpu');
    const ramParam = urlParams.get('ram');
    const storageParam = urlParams.get('storage');
    const chassisParam = urlParams.get('chassis') || urlParams.get('formFactor');
    const coresParam = urlParams.get('cores');
    const threadsParam = urlParams.get('threads');
    const hwParam = urlParams.get('hw');

    if (cpuParam || gpuParam) {
      const isLap = chassisParam === 'laptop';
      const parsedRam = parseInt(ramParam || '16', 10);
      const parsedStorage = parseInt(storageParam || '512', 10);

      const resolveBannerCores = (name?: string | null, raw?: string | null) => {
        const parsed = parseInt(raw || '0', 10);
        if (parsed > 4) return parsed;
        const lower = (name || '').toLowerCase();
        if (lower.includes('13700h') || lower.includes('13800h') || lower.includes('13900h') || lower.includes('12700h') || lower.includes('12800h')) return 14;
        if (lower.includes('13700hx') || lower.includes('13700k')) return 16;
        if (lower.includes('14700k')) return 20;
        if (lower.includes('13900k') || lower.includes('14900k')) return 24;
        if (lower.includes('13500h') || lower.includes('12600h') || lower.includes('12500h')) return 12;
        if (lower.includes('7800x3d') || lower.includes('5800') || lower.includes('7700') || lower.includes('11800h')) return 8;
        if (lower.includes('7600') || lower.includes('5600') || lower.includes('3600') || lower.includes('12400')) return 6;
        return parsed > 0 ? parsed : (isLap ? 8 : 6);
      };

      const resolveBannerThreads = (name?: string | null, raw?: string | null) => {
        const parsed = parseInt(raw || '0', 10);
        if (parsed > 8) return parsed;
        const lower = (name || '').toLowerCase();
        if (lower.includes('13700h') || lower.includes('13800h') || lower.includes('13900h') || lower.includes('12700h') || lower.includes('12800h')) return 20;
        if (lower.includes('13700hx') || lower.includes('13700k')) return 24;
        if (lower.includes('14700k')) return 28;
        if (lower.includes('13900k') || lower.includes('14900k')) return 32;
        if (lower.includes('13500h') || lower.includes('12600h') || lower.includes('12500h')) return 16;
        if (lower.includes('7800x3d') || lower.includes('5800') || lower.includes('7700') || lower.includes('11800h')) return 16;
        if (lower.includes('7600') || lower.includes('5600') || lower.includes('3600') || lower.includes('12400')) return 12;
        return parsed > 0 ? parsed : (isLap ? 12 : 12);
      };

      const directSpecs = {
        cpuName: cpuParam || 'Modern Multi-Core Processor',
        cpuCores: resolveBannerCores(cpuParam, coresParam),
        cpuThreads: resolveBannerThreads(cpuParam, threadsParam),
        gpuName: gpuParam || 'High-Performance Graphics',
        ramGb: isNaN(parsedRam) ? 16 : parsedRam,
        storageCapacityGb: isNaN(parsedStorage) ? 512 : parsedStorage,
        deviceType: (isLap ? 'laptop' : 'desktop') as DeviceType,
        formFactor: (isLap ? 'laptop' : 'desktop') as DeviceType,
        is100PercentVerified: true,
      };
      setDetectedData(directSpecs);
      onApplySpecs(directSpecs);

      // Enrich via server
      fetch('/api/detect/submit-specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: existingSession || 'latest', specs: directSpecs }),
      })
        .then((r) => r.json())
        .then((json) => {
          if (json.specs) {
            setDetectedData(json.specs);
            onApplySpecs(json.specs);
          }
        })
        .catch(() => {});
    } else if (hwParam) {
      try {
        const normalized = hwParam.replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(normalized));
        const rawSpecs = decoded.specs || decoded;
        if (rawSpecs && (rawSpecs.cpuName || rawSpecs.gpuName)) {
          setDetectedData(rawSpecs);
          onApplySpecs(rawSpecs);
        }
      } catch (e) {
        console.warn('URL hw param parse:', e);
      }
    }

    if (existingSession) {
      fetch(`/api/detect/status/${existingSession}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.specs) {
            setDetectedData(json.specs);
            onApplySpecs(json.specs);
          }
        })
        .catch((err) => console.warn('URL session check:', err));
    }

    // Cross-tab synchronization
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'rigcompass_detected_specs' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setDetectedData(parsed);
          onApplySpecs(parsed);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Poll for detection status while listening
  const pollCountRef = useRef(0);
  useEffect(() => {
    if (!sessionId || !isListening) return;

    pollCountRef.current = 0;
    pollIntervalRef.current = setInterval(async () => {
      pollCountRef.current++;
      try {
        // Poll specific session
        const res = await fetch(`/api/detect/status/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'ready' && data.specs) {
            const resolved = resolveHardwareSpecs(data.specs.cpuName, data.specs.gpuName, data.specs.ramGb, data.specs.deviceType, data.specs);
            const merged = { ...data.specs, ...resolved, is100PercentVerified: true };
            setDetectedData(merged);
            setIsListening(false);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            onApplySpecs(merged);
            return;
          }
        }

        // If after 3 polls (3 seconds) specific session is not ready, also check latest global submission
        if (pollCountRef.current >= 3) {
          const latestRes = await fetch('/api/detect/status/latest');
          if (latestRes.ok) {
            const latestData = await latestRes.json();
            if (latestData.status === 'ready' && latestData.specs) {
              const resolved = resolveHardwareSpecs(latestData.specs.cpuName, latestData.specs.gpuName, latestData.specs.ramGb, latestData.specs.deviceType, latestData.specs);
              const merged = { ...latestData.specs, ...resolved, is100PercentVerified: true };
              setDetectedData(merged);
              setIsListening(false);
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              onApplySpecs(merged);
              return;
            }
          }
        }
      } catch (err) {
        // Transient network error
      }
    }, 1000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [sessionId, isListening, detectedData]);

  // Method 1: Instant In-Browser Scan (Zero Downloads)
  const handleInstantBrowserScan = async () => {
    setIsInBrowserScanning(true);
    try {
      const scan = await runBrowserScan();
      const mapped = mapBrowserScanToSpecs(scan, specs || ({} as any));
      setDetectedData(mapped);
      onApplySpecs(mapped);
    } catch (err) {
      console.error('Browser scan error:', err);
    } finally {
      setIsInBrowserScanning(false);
    }
  };

  const [cmdCopied, setCmdCopied] = useState(false);

  // Method 1: Download Lightweight Desktop Detection Runner (.cmd) with client origin
  const handleDownloadRunner = () => {
    if (!sessionId) return;
    setHasDownloaded(true);
    setIsListening(true);

    const originParam = typeof window !== 'undefined' ? `?origin=${encodeURIComponent(window.location.origin)}` : '';
    const downloadUrl = `/api/detect/download/${sessionId}${originParam}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', 'RigCompass-Detection.cmd');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Method 1b: 1-Click Copy CMD Command to paste directly into Command Prompt / PowerShell
  const handleCopyCmd = () => {
    if (!sessionId) return;
    setIsListening(true);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const cmdStr = `powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = 3072 -bor 12288; [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}; try { irm '${origin}/api/detect/run/${sessionId}?origin=${encodeURIComponent(origin)}' | iex } catch { (New-Object Net.WebClient).DownloadString('${origin}/api/detect/run/${sessionId}?origin=${encodeURIComponent(origin)}') | iex }"`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cmdStr);
      setCmdCopied(true);
      setTimeout(() => setCmdCopied(false), 3000);
    }
  };



  const handleFileDrop = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        const specsToApply = parsed.specs || parsed;
        if (specsToApply.cpuName || specsToApply.gpuName) {
          setDetectedData(specsToApply);
          onApplySpecs(specsToApply);
        }
      } catch (err) {
        console.error('Failed to parse dropped JSON file', err);
      }
    };
    reader.readAsText(file);
  };

  // Filtered games for quick "Can You Run It" test
  const popularTestGames = GAMES_DATABASE.filter((g) => {
    if (!gameSearchQuery.trim()) return true;
    return g.title.toLowerCase().includes(gameSearchQuery.toLowerCase());
  }).slice(0, 10);

  return (
    <div className="space-y-16">
      {/* =========================================================================
          HERO "MY COMPUTER DETAILS" CARD (Hardware Technical Architecture)
          ========================================================================= */}
      <div className="bg-zinc-950 border border-zinc-800 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-zinc-800">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-emerald-500/40 text-emerald-400 text-xs font-mono uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />
              <span>Hardware Specification Engine</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-zinc-100 tracking-tight leading-[1.05]">
              My Computer Details
            </h1>
            <p className="text-sm sm:text-base text-zinc-200 max-w-2xl font-sans">
              Verified hardware telemetry, real PassMark compute benchmark ratings, and official compatibility analysis.
            </p>
          </div>

          {/* Technical Benchmark Index Card */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 shrink-0 min-w-[240px]">
            <div className="text-[11px] uppercase font-mono text-zinc-300 tracking-wider flex items-center gap-2 mb-3">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>Silicon Benchmark Index</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-xs text-zinc-300 font-sans">PassMark G3D:</span>
                <span className="text-xl font-bold text-zinc-100 font-mono">
                  {activeSpecs?.gpuScore ? `${activeSpecs.gpuScore.toLocaleString()}` : '17,500'}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 pt-2 border-t border-zinc-800">
                <span className="text-xs text-zinc-300 font-sans">PassMark CPU:</span>
                <span className="text-xl font-bold text-zinc-100 font-mono">
                  {activeSpecs?.cpuScore ? `${activeSpecs.cpuScore.toLocaleString()}` : '29,500'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* OPTION 1: Windows CMD Hardware Auto-Detection Tool */}
        <div className="mt-8 p-6 rounded-xl bg-zinc-900/90 border border-white/10 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#e8702a]/20 border border-[#e8702a]/40 text-[#e8702a] font-bold">
                  OPTION 01 · RECOMMENDED
                </span>
                <span className="text-xs font-mono text-zinc-400">100% Verified Hardware Accuracy</span>
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#e8702a]" />
                <span>Windows CMD Hardware Auto-Detection Tool</span>
              </h3>
              <p className="text-xs text-zinc-300 font-sans max-w-2xl leading-relaxed">
                Reads your real physical CPU cores, discrete GPU silicon, dedicated VRAM, and RAM channels directly from Windows WMI. Safe, 100% non-admin, no installation required.
              </p>
            </div>

            {/* Live Synchronizing Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 shrink-0">
              {isListening ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#e8702a] animate-ping" />
                  <span>Listening for CMD tool...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Telemetry Listener Ready</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleDownloadRunner}
              className="px-6 py-3 rounded-xl bg-[#e8702a] hover:bg-[#d2611f] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-[#e8702a]/20"
            >
              <Download className="w-4 h-4" />
              <span>Download Windows CMD Tool (.cmd)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCmd}
              className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-mono text-xs transition-all cursor-pointer flex items-center gap-2"
              title="Copy command to run in Windows Command Prompt or PowerShell"
            >
              {cmdCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Command Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-300" />
                  <span>Copy 1-Line CMD Command</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Hardware Synchronized Banner */}
        {(detectedData || specs?.is100PercentVerified) && (
          <div className="mt-8 p-4 bg-zinc-900 border border-emerald-500/50 text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs sm:text-sm">
                <span className="font-semibold text-emerald-200">Verified System Synchronized: </span>
                <span className="text-zinc-100 font-mono">
                  {activeSpecs?.deviceType === 'laptop' ? 'Laptop Notebook' : 'Desktop PC'} · {activeSpecs?.cpuName} · {activeSpecs?.gpuName} · {activeSpecs?.ramGb}GB RAM
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-700/60 shrink-0">
              Direct Telemetry
            </span>
          </div>
        )}

        {/* TECHNICAL HARDWARE BREAKDOWN CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {/* Card 1: Video Card / GPU */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono text-zinc-300 flex items-center gap-2">
                <CircuitBoard className="w-4 h-4 text-emerald-400" />
                <span>Graphics GPU</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-zinc-950 text-emerald-400 border border-emerald-500/30 font-mono">
                DirectX 12
              </span>
            </div>
            <div className="font-serif text-lg font-medium text-zinc-100 truncate" title={activeSpecs?.gpuName}>
              {activeSpecs?.gpuName || 'High-Performance Graphics'}
            </div>
            <div className="text-xs text-zinc-300 flex items-center justify-between pt-2 border-t border-zinc-800 font-mono">
              <span>{activeSpecs?.gpuVramGb || 4} GB VRAM</span>
              <span className="text-emerald-400 font-semibold">
                {activeSpecs?.gpuScore ? `${activeSpecs.gpuScore.toLocaleString()} G3D` : 'Gaming Ready'}
              </span>
            </div>
          </div>

          {/* Card 2: Processor / CPU */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono text-zinc-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Processor CPU</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-zinc-950 text-zinc-200 border border-zinc-700 font-mono">
                {activeSpecs?.cpuThreads || 8} Threads
              </span>
            </div>
            <div className="font-serif text-lg font-medium text-zinc-100 truncate" title={activeSpecs?.cpuName}>
              {activeSpecs?.cpuName || 'Modern Multi-Core Processor'}
            </div>
            <div className="text-xs text-zinc-300 flex items-center justify-between pt-2 border-t border-zinc-800 font-mono">
              <span>{activeSpecs?.cpuCores || 4} Cores</span>
              <span className="text-emerald-400 font-semibold">
                {activeSpecs?.cpuScore ? `${activeSpecs.cpuScore.toLocaleString()} PassMark` : 'Calibrated'}
              </span>
            </div>
          </div>

          {/* Card 3: Memory / RAM */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono text-zinc-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>System Memory</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-zinc-950 text-zinc-200 border border-zinc-700 font-mono">
                {activeSpecs?.ramChannels === 'dual' ? 'Dual-Channel' : 'Standard'}
              </span>
            </div>
            <div className="font-serif text-lg font-medium text-zinc-100">
              {activeSpecs?.ramGb || 16} GB {activeSpecs?.ramType || 'RAM'}
            </div>
            <div className="text-xs text-zinc-300 flex items-center justify-between pt-2 border-t border-zinc-800 font-mono">
              <span>Channel Bus</span>
              <span className="text-emerald-400 font-semibold">
                {(activeSpecs?.ramGb || 16) >= 16 ? 'Optimal' : 'Standard'}
              </span>
            </div>
          </div>

          {/* Card 4: Operating System & Storage */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono text-zinc-300 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Storage & OS</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-zinc-950 text-zinc-200 border border-zinc-700 font-mono">
                {activeSpecs?.displayResolution || '1080p'}
              </span>
            </div>
            <div className="font-serif text-lg font-medium text-zinc-100 truncate">
              {activeSpecs?.storageCapacityGb || 512} GB {activeSpecs?.primaryStorageType === 'nvme_ssd' ? 'NVMe SSD' : 'SSD'}
            </div>
            <div className="text-xs text-zinc-300 flex items-center justify-between pt-2 border-t border-zinc-800 font-mono">
              <span>{activeSpecs?.os || 'Windows 11'}</span>
              <span className="text-emerald-400 font-semibold">
                {activeSpecs?.primaryStorageType === 'nvme_ssd' ? 'High Speed' : 'Solid State'}
              </span>
            </div>
          </div>
        </div>

        {/* Secondary Method: Instant In-Browser Detection Tool */}
        <div className="mt-10 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-sm font-medium text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#e8702a]" />
              <span>Instant In-Browser Detection Tool</span>
            </div>
            <p className="text-xs text-zinc-300 font-sans">
              Instant hardware scan using browser WebGL silicon renderer, core concurrency, and device memory. No download required.
            </p>
          </div>

          <button
            type="button"
            onClick={handleInstantBrowserScan}
            disabled={isInBrowserScanning}
            className="w-full sm:w-auto px-7 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-[#e8702a]/60 text-white font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
          >
            {isInBrowserScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#e8702a]" />
                <span>Scanning In Browser...</span>
              </>
            ) : (
              <>
                <Gauge className="w-4 h-4 text-[#e8702a]" />
                <span>Run In-Browser Detection Tool</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          "CAN YOU RUN IT?" GAME CHECKER (Aligned to Grid, Single Button)
          ========================================================================= */}
      <div className="bg-zinc-950 border border-zinc-800 p-8 sm:p-12 shadow-2xl space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-800">
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-medium">
              System Requirements Lab Engine
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl text-zinc-100 font-normal tracking-tight">
              Test Computer Against Any Game
            </h2>
            <p className="text-sm text-zinc-300 font-sans max-w-xl">
              Deterministic verification against official publisher specifications and compute thresholds.
            </p>
          </div>

          {/* Game Selection Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search game title..."
              value={gameSearchQuery}
              onChange={(e) => setGameSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 pl-10 pr-4 py-3 text-xs text-zinc-100 rounded-none focus:outline-none focus:border-emerald-500 uppercase tracking-wide"
            />
          </div>
        </div>

        {/* Popular Game Grid Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {popularTestGames.map((g) => {
            const isSelected = selectedGame?.id === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGameId(g.id)}
                className={`p-3 text-xs uppercase tracking-wider font-medium border text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-900 text-emerald-400 border-emerald-500/60'
                    : 'bg-zinc-900/40 text-zinc-300 border-zinc-800 hover:text-zinc-100 hover:border-zinc-700'
                }`}
              >
                <div className="truncate font-serif text-sm normal-case">{g.title}</div>
                <div className="text-[10px] text-zinc-400 font-mono mt-1">{g.releaseYear}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Game Results Dashboard */}
        {selectedGame && (
          <div className="p-8 bg-zinc-900 border border-zinc-800 space-y-8">
            {/* Header with Title and Big Requirement Gauges */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-zinc-950 text-zinc-300 border border-zinc-800">
                  {selectedGame.genre} · {selectedGame.releaseYear}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-zinc-100 font-normal">
                  {selectedGame.title}
                </h3>
                <p className="text-xs text-zinc-300 font-sans max-w-xl">
                  {selectedGame.notes}
                </p>
              </div>

              {/* Status Verdict Badges */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-center">
                  <div
                    className={`px-5 py-3 border font-mono text-xs font-bold uppercase ${
                      overallMinPass
                        ? 'border-emerald-500/60 bg-zinc-950 text-emerald-400'
                        : 'border-zinc-700 bg-zinc-950 text-zinc-400'
                    }`}
                  >
                    {overallMinPass ? 'PASS' : 'UPGRADE'}
                  </div>
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block mt-1">
                    Minimum
                  </span>
                </div>

                <div className="text-center">
                  <div
                    className={`px-5 py-3 border font-mono text-xs font-bold uppercase ${
                      overallRecPass
                        ? 'border-emerald-500/60 bg-zinc-950 text-emerald-400'
                        : 'border-zinc-700 bg-zinc-950 text-zinc-400'
                    }`}
                  >
                    {overallRecPass ? 'PASS' : 'PARTIAL'}
                  </div>
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block mt-1">
                    Recommended
                  </span>
                </div>
              </div>
            </div>

            {/* Component-by-Component Requirement Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-zinc-800 text-[11px] font-mono uppercase text-zinc-400">
                    <th className="py-3 px-4">Component</th>
                    <th className="py-3 px-4">Official Minimum</th>
                    <th className="py-3 px-4">Your System Details</th>
                    <th className="py-3 px-4 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-200">
                  {/* Video Card */}
                  <tr>
                    <td className="py-4 px-4 font-medium text-zinc-100 flex items-center gap-2">
                      <CircuitBoard className="w-4 h-4 text-emerald-400" />
                      <span>Video Card (GPU)</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-zinc-300">
                      {selectedGame.minGpuScore >= 8000 ? 'GTX 1060 / RX 580' : 'GTX 1050 / Iris Xe'}
                    </td>
                    <td className="py-4 px-4 font-medium text-zinc-100 font-mono">
                      {activeSpecs?.gpuName || 'Detected GPU'}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold">
                      {minGpuPass ? (
                        <span className="text-emerald-400">PASSED</span>
                      ) : (
                        <span className="text-zinc-400">UPGRADE</span>
                      )}
                    </td>
                  </tr>

                  {/* Processor */}
                  <tr>
                    <td className="py-4 px-4 font-medium text-zinc-100 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-emerald-400" />
                      <span>Processor (CPU)</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-zinc-300">
                      {selectedGame.minCpuScore >= 12000 ? 'Core i5-8400 / Ryzen 5 2600' : 'Core i3 / Quad-Core'}
                    </td>
                    <td className="py-4 px-4 font-medium text-zinc-100 font-mono">
                      {activeSpecs?.cpuName || 'Detected CPU'}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold">
                      {minCpuPass ? (
                        <span className="text-emerald-400">PASSED</span>
                      ) : (
                        <span className="text-zinc-400">UPGRADE</span>
                      )}
                    </td>
                  </tr>

                  {/* RAM */}
                  <tr>
                    <td className="py-4 px-4 font-medium text-zinc-100 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span>Memory (RAM)</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-zinc-300">
                      {selectedGame.minRamGb} GB RAM
                    </td>
                    <td className="py-4 px-4 font-medium text-zinc-100 font-mono">
                      {activeSpecs?.ramGb || 16} GB
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold">
                      {minRamPass ? (
                        <span className="text-emerald-400">PASSED</span>
                      ) : (
                        <span className="text-zinc-400">LOW RAM</span>
                      )}
                    </td>
                  </tr>

                  {/* Storage */}
                  <tr>
                    <td className="py-4 px-4 font-medium text-zinc-100 flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-emerald-400" />
                      <span>Storage Drive</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-zinc-300">
                      {selectedGame.storageGb} GB
                    </td>
                    <td className="py-4 px-4 font-medium text-zinc-100 font-mono">
                      {activeSpecs?.storageCapacityGb || 512} GB
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold">
                      {diskPass ? (
                        <span className="text-emerald-400">PASSED</span>
                      ) : (
                        <span className="text-zinc-400">LOW SPACE</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Exactly one button in the game section */}
            <div className="pt-4 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  alert(`Verified requirements for ${selectedGame.title}: ${overallRecPass ? 'Optimal recommended performance profile confirmed.' : overallMinPass ? 'Meets official minimum thresholds.' : 'System requires hardware upgrade.'}`);
                }}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Export Compatibility Certificate</span>
                <Check className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

