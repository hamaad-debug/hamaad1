import React from 'react';
import {
  Smartphone,
  SlidersHorizontal,
  Sparkles,
  Wrench,
  Gamepad2,
  Database,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { RevealLayer } from '../components/RevealLayer';
import { AppPage } from '../components/Navigation';

interface HomeLandingProps {
  cursorPos: { x: number; y: number };
  hasInteracted: boolean;
  onNavigate: (page: AppPage) => void;
  bgImage1: string;
  bgImage2: string;
}

export const HomeLanding: React.FC<HomeLandingProps> = ({
  cursorPos,
  hasInteracted,
  onNavigate,
  bgImage1,
  bgImage2,
}) => {
  const landingCards = [
    {
      page: 'specs-inspector' as AppPage,
      icon: SlidersHorizontal,
      title: 'PC & Laptop Detection',
      tag: 'Section 1 · Desktops & Laptops',
      desc: 'Inspect desktop towers and laptop notebooks. Complete hardware diagnostics, PC game compatibility testing, and component upgrade advisor for your PC.',
    },
    {
      page: 'phone-detector' as AppPage,
      icon: Smartphone,
      title: 'Phone Detection',
      tag: 'Section 2 · Dedicated Mobile',
      desc: 'Look up any smartphone online or probe mobile silicon in-browser. Get easy-to-understand specs, phone capabilities, and mobile game testing with zero PC mixing.',
    },
  ];

  return (
    <div className="space-y-24">
      {/* =========================================================================
          FULL-SCREEN DARK HERO WITH SPOTLIGHT MASK (EXACT LITHOS MECHANIC)
          ========================================================================= */}
      <section
        className="relative w-full overflow-hidden h-screen bg-black"
        style={{ height: '100dvh' }}
      >
        {/* Layer 1: Base image (z-10) with subtle Ken Burns zoom */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom"
          style={{ backgroundImage: `url(${bgImage1})` }}
        />

        {/* Layer 2: Reveal layer (z-30) reveals BG_IMAGE_2 through soft circular spotlight */}
        <RevealLayer
          image={bgImage2}
          cursorX={cursorPos.x}
          cursorY={cursorPos.y}
        />

        {/* Layer 3: Heading (z-50) */}
        <div className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50">
          <h1 className="text-white leading-[0.95]">
            <span
              className="block font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal"
              style={{ letterSpacing: '-0.05em', animationDelay: '0.25s' }}
            >
              What can your
            </span>
            <span
              className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal"
              style={{ letterSpacing: '-0.08em', animationDelay: '0.42s' }}
            >
              PC actually do?
            </span>
          </h1>

          <div
            className="mt-4 sm:mt-5 px-3.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[11px] sm:text-xs font-mono tracking-widest text-[#e8702a] uppercase hero-anim hero-fade pointer-events-auto"
            style={{ animationDelay: '0.55s' }}
          >
            Hardware Intelligence & Workload Diagnostic Suite
          </div>
        </div>

        {/* Interaction Hint */}
        {!hasInteracted && (
          <div className="absolute top-[44%] left-1/2 -translate-x-1/2 z-40 pointer-events-none text-center">
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-[11px] font-mono text-white/80 animate-pulse">
              Move cursor or drag touch to inspect internal hardware & silicon
            </span>
          </div>
        )}

        {/* Layer 4: Bottom-left paragraph (z-50) */}
        <div
          className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[280px] z-50 hero-anim hero-fade pointer-events-auto"
          style={{ animationDelay: '0.7s' }}
        >
          <p className="text-sm text-white/80 leading-relaxed font-sans">
            Synthetic scores don&apos;t tell the full story. We analyze raw silicon microarchitecture, memory throughput, and thermal ceilings to measure your computer&apos;s true operational limits.
          </p>
        </div>

        {/* Layer 5: Bottom-right block (z-50) */}
        <div
          className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[280px] flex flex-col items-start gap-4 sm:gap-5 z-50 hero-anim hero-fade"
          style={{ animationDelay: '0.85s' }}
        >
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
            Our diagnostic engine profiles CPU instructions, GPU compute tiers, and RAM capacity to evaluate real-world gaming, AI models, 4K rendering, and multitasking.
          </p>
          <button
            onClick={() => onNavigate('specs-inspector')}
            className="w-full sm:w-auto bg-[#e8702a] hover:bg-[#d2611f] text-white text-sm font-medium px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#e8702a]/30 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Inspect Your Hardware</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Legal bar */}
        <div className="hidden sm:flex absolute bottom-3 left-10 md:left-14 z-50 items-center gap-4 text-[11px] text-white/40 font-mono">
          <button
            onClick={() => onNavigate('privacy')}
            className="hover:text-white/80 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>/</span>
          <button
            onClick={() => onNavigate('terms')}
            className="hover:text-white/80 transition-colors cursor-pointer"
          >
            Terms and Conditions
          </button>
          <span>/</span>
          <span>Hardware Diagnostic Engine</span>
        </div>
      </section>

      {/* =========================================================================
          MULTI-LANDING HUB: DEDICATED SECTIONS
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase font-mono tracking-widest text-[#e8702a] font-medium">
            Dedicated Diagnostic Suites
          </span>
          <h2 className="font-playfair italic text-3xl sm:text-5xl text-white font-normal">
            Independent Landing Portals
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Each section operates as a dedicated landing page designed around real hardware analysis, phone processor evaluation, and transparent engineering.
          </p>
        </div>

        {/* Grid of Dedicated Landing Pages (2 Core Sub-Pages) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {landingCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.page}
                className="group p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-[#e8702a]/50 transition-all flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#e8702a]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      {card.tag}
                    </span>
                  </div>

                  <h3 className="font-playfair text-2xl text-white font-medium group-hover:text-[#e8702a] transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                    {card.desc}
                  </p>
                </div>

                <button
                  onClick={() => {
                    onNavigate(card.page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full py-3 rounded-full text-xs font-semibold bg-white/10 group-hover:bg-[#e8702a] text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Explore Landing Page</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
