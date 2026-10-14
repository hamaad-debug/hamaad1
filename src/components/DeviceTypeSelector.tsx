import React from 'react';
import { Smartphone, Laptop, Monitor, CheckCircle2, RotateCcw, Shuffle, Check } from 'lucide-react';
import { DeviceType } from '../types';

interface DeviceTypeSelectorProps {
  deviceType: DeviceType;
  detectedType: DeviceType;
  detectedOS?: string;
  isOverridden: boolean;
  reasons: string[];
  onChange: (type: DeviceType) => void;
  onToggle?: () => void;
  onReset: () => void;
  allowedTypes?: DeviceType[];
}

export const DeviceTypeSelector: React.FC<DeviceTypeSelectorProps> = ({
  deviceType,
  detectedType,
  detectedOS,
  isOverridden,
  reasons,
  onChange,
  onToggle,
  onReset,
  allowedTypes = ['desktop', 'laptop', 'phone'],
}) => {
  return (
    <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-100">Device Category & Form Factor</span>
            {isOverridden ? (
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50">
                User Overridden
              </span>
            ) : (
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                Auto-Detected via UA & Screen Width
              </span>
            )}
            {detectedOS && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                OS: {detectedOS}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Inferred from <code className="text-zinc-300 font-mono">navigator.userAgent</code> and screen width ({typeof window !== 'undefined' ? `${window.screen?.width || 1920}px` : '1920px'}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors shadow-sm"
              title="Click to toggle / cycle between Desktop, Laptop, and Phone"
            >
              <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Toggle Device ({deviceType.toUpperCase()})</span>
            </button>
          )}

          {isOverridden && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
            >
              <RotateCcw className="w-3 h-3" />
              Reset ({detectedType})
            </button>
          )}
        </div>
      </div>

      {/* Segmented Controls for Desktop / Laptop / Phone */}
      <div className={`grid gap-2.5 mt-4 ${allowedTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {allowedTypes.includes('desktop') && (
          <button
            type="button"
            onClick={() => onChange('desktop')}
            className={`p-3 rounded-lg border text-left transition-all ${
              deviceType === 'desktop'
                ? 'bg-zinc-800 border-emerald-500 text-zinc-100 ring-1 ring-emerald-500/30'
                : 'bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold">Desktop PC</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Stationary Tower / Rig</div>
          </button>
        )}

        {allowedTypes.includes('laptop') && (
          <button
            type="button"
            onClick={() => onChange('laptop')}
            className={`p-3 rounded-lg border text-left transition-all ${
              deviceType === 'laptop'
                ? 'bg-zinc-800 border-emerald-500 text-zinc-100 ring-1 ring-emerald-500/30'
                : 'bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold">Laptop</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Portable Notebook</div>
          </button>
        )}

        {allowedTypes.includes('phone') && (
          <button
            type="button"
            onClick={() => onChange('phone')}
            className={`p-3 rounded-lg border text-left transition-all ${
              deviceType === 'phone'
                ? 'bg-zinc-800 border-emerald-500 text-zinc-100 ring-1 ring-emerald-500/30'
                : 'bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">Smartphone</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Mobile Handheld</div>
          </button>
        )}
      </div>

      {/* Detection Evidence snippet */}
      <div className="mt-3 text-[11px] text-zinc-500 flex flex-wrap items-center gap-2">
        <span className="font-semibold text-zinc-400">Detection cues:</span>
        {reasons.map((r, i) => (
          <span key={i} className="flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>{r}</span>
            {i < reasons.length - 1 && <span className="text-zinc-700">·</span>}
          </span>
        ))}
      </div>
    </div>
  );
};
