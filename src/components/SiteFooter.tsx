import React from 'react';
import { AppPage } from './Navigation';

interface SiteFooterProps {
  onNavigate: (page: AppPage) => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5"
              viewBox="0 0 256 256"
              fill="#ffffff"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
            </svg>
            <span className="font-semibold text-base text-white">What Can My PC Actually Do?</span>
          </div>

          {/* Quick Page Links */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-zinc-300">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('specs-inspector')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              PC &amp; Laptop Detection
            </button>
            <button
              onClick={() => onNavigate('phone-detector')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Phone Detection
            </button>
          </div>

          {/* Legal */}
          <div className="flex flex-col md:flex-row items-center gap-3 text-xs text-zinc-500 font-mono">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('privacy')}
                className="hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>/</span>
              <button
                onClick={() => onNavigate('terms')}
                className="hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Terms &amp; Conditions
              </button>
              <span>/</span>
              <span>&copy; {new Date().getFullYear()} What Can My PC Actually Do?</span>
            </div>
            <span className="hidden md:inline text-zinc-700">|</span>
            <div className="text-[11px] text-zinc-400">
              Smartphone hardware data from{' '}
              <a
                href="https://github.com/GetTechAPI/TechAPI"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-[#e8702a] underline underline-offset-2"
              >
                TechAPI
              </a>{' '}
              (licensed under{' '}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-[#e8702a] underline underline-offset-2"
              >
                CC BY-SA 4.0
              </a>
              )
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
