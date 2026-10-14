import React, { useState } from 'react';
import {
  Home,
  Menu,
  X,
  Laptop,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { UserSpecs } from '../types';

export type AppPage =
  | 'home'
  | 'specs-inspector'
  | 'phone-detector'
  | 'privacy'
  | 'terms'
  | 'capability-evaluator'
  | 'upgrade-advisor'
  | 'game-testing';

interface NavigationProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  specs: UserSpecs;
  onApplySpecs: (specs: UserSpecs) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ONLY visible when inspecting hardware or in subpages. When at home, it disappears completely!
  if (currentPage === 'home') {
    return null;
  }

  const handleNavClick = (page: AppPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isPcActive = currentPage === 'specs-inspector';
  const isPhoneActive = currentPage === 'phone-detector';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 sm:px-8 py-3.5 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300">
        {/* Left: Home Return Brand Button */}
        <div className="pointer-events-auto">
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-950/80 backdrop-blur-xl border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:border-[#e8702a]/50 transition-all cursor-pointer shadow-lg group"
            title="Return to Home"
          >
            <div className="w-5 h-5 rounded-full bg-[#e8702a]/20 border border-[#e8702a]/50 flex items-center justify-center text-[#e8702a] group-hover:scale-105 transition-transform">
              <Home className="w-3 h-3" />
            </div>
            <span className="font-playfair italic tracking-tight text-sm text-white">RigCompass</span>
            <span className="hidden sm:inline text-[10px] font-mono text-zinc-400 border-l border-zinc-800 pl-2">Home</span>
          </button>
        </div>

        {/* Center: Device Detection Selector (PC & Laptop vs Phone) matching homepage ember palette */}
        <div className="pointer-events-auto flex items-center bg-zinc-950/90 backdrop-blur-xl border border-white/15 rounded-full p-1 shadow-2xl">
          <button
            onClick={() => handleNavClick('specs-inspector')}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              isPcActive
                ? 'bg-[#e8702a] text-white shadow-md shadow-[#e8702a]/30 scale-[1.02]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Laptop className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isPcActive ? 'text-white' : 'text-zinc-400'}`} />
            <span>PC &amp; Laptop Detection</span>
          </button>

          <button
            onClick={() => handleNavClick('phone-detector')}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              isPhoneActive
                ? 'bg-[#e8702a] text-white shadow-md shadow-[#e8702a]/30 scale-[1.02]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isPhoneActive ? 'text-white' : 'text-zinc-400'}`} />
            <span>Phone Detection</span>
          </button>
        </div>

        {/* Right: Quick action / Mobile hamburger */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => handleNavClick('home')}
            className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-full bg-zinc-950/60 border border-white/5 cursor-pointer"
          >
            <span>Exit to Home</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-white bg-zinc-950/90 backdrop-blur-md rounded-full border border-white/20 cursor-pointer shadow-lg"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-[95] bg-black/95 backdrop-blur-2xl flex flex-col pt-24 px-6 pb-8 space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleNavClick('home')}
              className="w-full text-left px-5 py-3.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-3 text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              <Home className="w-4 h-4 text-[#e8702a]" />
              <span>Home (3D Hero)</span>
            </button>

            <button
              onClick={() => handleNavClick('specs-inspector')}
              className={`w-full text-left px-5 py-3.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-3 ${
                isPcActive
                  ? 'bg-[#e8702a] text-white shadow-md'
                  : 'text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>PC &amp; Laptop Detection</span>
            </button>

            <button
              onClick={() => handleNavClick('phone-detector')}
              className={`w-full text-left px-5 py-3.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-3 ${
                isPhoneActive
                  ? 'bg-[#e8702a] text-white shadow-md'
                  : 'text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Phone Detection</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
