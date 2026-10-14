import React, { useState } from 'react';
import { Gauge, SlidersHorizontal, Sparkles, Wrench, Gamepad2, Database, Menu, X } from 'lucide-react';
import { PRESET_RIGS } from '../data/hardwareDatabase';
import { UserSpecs } from '../types';

interface NavbarProps {
  activeTab: 'specs' | 'capabilities' | 'goals' | 'upgrade' | 'games' | 'database' | 'privacy' | 'terms';
  setActiveTab: (tab: 'specs' | 'capabilities' | 'goals' | 'upgrade' | 'games' | 'database' | 'privacy' | 'terms') => void;
  currentSpecs: UserSpecs;
  onSelectPreset: (presetId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentSpecs,
  onSelectPreset,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Exactly five primary navigation links
  const navLinks: Array<{ id: 'specs' | 'capabilities' | 'upgrade' | 'games' | 'database'; label: string; icon: React.ElementType }> = [
    { id: 'specs', label: 'Hardware Specs', icon: SlidersHorizontal },
    { id: 'capabilities', label: 'Capabilities', icon: Sparkles },
    { id: 'upgrade', label: 'Upgrade Advisor', icon: Wrench },
    { id: 'games', label: 'Game Testing', icon: Gamepad2 },
    { id: 'database', label: 'Saved Rigs', icon: Database },
  ];

  const handleNavClick = (id: 'specs' | 'capabilities' | 'upgrade' | 'games' | 'database') => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-emerald-500/40 bg-zinc-900 flex items-center justify-center text-emerald-400 shrink-0">
              <Gauge className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="font-serif text-2xl font-medium tracking-tight text-zinc-100">
                  What Can My PC Actually Do?
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 border border-emerald-500/30 px-2 py-0.5 bg-zinc-900">
                  Precision
                </span>
              </div>
              <p className="text-xs text-zinc-300 hidden sm:block tracking-wide mt-0.5 font-sans">
                Deterministic Hardware Intelligence
              </p>
            </div>
          </div>

          {/* Quick Preset Selector */}
          <div className="hidden lg:flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-zinc-300 font-medium">Reference Rig:</span>
            <select
              aria-label="Load PC preset configuration"
              value={PRESET_RIGS.find((p) => p.specs.cpuId === currentSpecs.cpuId && p.specs.ramGb === currentSpecs.ramGb)?.id || ''}
              onChange={(e) => {
                if (e.target.value) onSelectPreset(e.target.value);
              }}
              className="text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 px-3 py-2 rounded-none focus:outline-none focus:border-emerald-500 cursor-pointer uppercase tracking-wide"
            >
              <option value="" disabled>
                Select System Preset
              </option>
              {PRESET_RIGS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-zinc-200 hover:text-white border border-zinc-800 bg-zinc-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 stroke-[1.5]" /> : <Menu className="w-5 h-5 stroke-[1.5]" />}
            </button>
          </div>
        </div>

        {/* Desktop 5-Link Navigation */}
        <div className="hidden md:flex items-center gap-2 py-2 border-t border-zinc-800/80">
          {navLinks.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id || (tab.id === 'capabilities' && activeTab === 'goals');
            return (
              <button
                key={tab.id}
                onClick={() => handleNavClick(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-xs uppercase tracking-wider font-medium transition-colors cursor-pointer border ${
                  isActive
                    ? 'bg-zinc-900 text-emerald-400 border-emerald-500/50'
                    : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900/60 border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[1.5]" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Dropdown 5-Link Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-zinc-800 space-y-1">
            {navLinks.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id || (tab.id === 'capabilities' && activeTab === 'goals');
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNavClick(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-wider font-medium transition-colors border ${
                    isActive
                      ? 'bg-zinc-900 text-emerald-400 border-emerald-500/50'
                      : 'text-zinc-300 hover:text-zinc-100 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[1.5]" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};

