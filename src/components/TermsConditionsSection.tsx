import React from 'react';
import { FileCheck, ShieldAlert, Scale, HelpCircle, ArrowLeft } from 'lucide-react';

interface TermsConditionsSectionProps {
  onBack: () => void;
}

export const TermsConditionsSection: React.FC<TermsConditionsSectionProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs uppercase font-mono tracking-wider text-zinc-300 hover:text-emerald-400 transition-colors mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[1.5]" />
            Back to Hardware Inspector
          </button>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-zinc-100 tracking-tight">Terms and Conditions</h1>
          <p className="text-xs text-zinc-400 mt-1">Effective Date: October 2026 · What Can My PC Actually Do?</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs">
          <Scale className="w-4 h-4 text-emerald-400" />
          <span>Objective Diagnostic Guidelines</span>
        </div>
      </div>

      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using What Can My PC Actually Do?, including the in-browser scanner, desktop detection helper, capability
            evaluation tools, and upgrade recommendations, you agree to comply with and be bound by these Terms and Conditions.
            If you do not agree, please discontinue using the service.
          </p>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            2. Diagnostic Tools & Hardware Recommendations Disclaimer
          </h2>
          <p>
            This application provides diagnostic estimations, capability scores, and upgrade advice for informational and educational
            purposes based on empirical hardware benchmarks and manufacturer baseline metrics.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-2">
            <li><strong>No Warranty on Hardware Purchases:</strong> Upgrade suggestions (such as SSD replacements or RAM expansions) are algorithmic estimations. You are solely responsible for verifying physical compatibility (motherboard socket, PCIe slot dimensions, power supply wattage, chassis clearance) prior to purchasing hardware.</li>
            <li><strong>Non-Destructive Operations:</strong> The detection script and binary execute read-only WMI, CIM, and system queries. They do not alter BIOS configurations, edit registry entries, overclock components, or flash firmware.</li>
            <li><strong>Safety First:</strong> Never disassemble laptop or desktop components without proper electrostatic discharge (ESD) precautions and manufacturer manual review.</li>
          </ul>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            3. Intellectual Property & Game Trademarks
          </h2>
          <p>
            All game titles, publisher names, system requirement specifications, and logos mentioned within this application are
            the registered trademarks of their respective owners (e.g., Valve Corporation, Electronic Arts, CD PROJEKT RED,
            Microsoft Corporation, NVIDIA Corporation, AMD Inc., Intel Corporation).
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Reference to third-party hardware or software titles does not constitute affiliation, sponsorship, or endorsement.
          </p>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-zinc-100">4. User Conduct & Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-2">
            <li>Attempt to reverse-engineer, decompile, or tamper with the verification tokens or backend endpoints.</li>
            <li>Use automated scrapers or bots to overload diagnostic synchronization servers.</li>
            <li>Submit malicious, forged, or denial-of-service payloads to the API endpoints.</li>
          </ul>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-zinc-100">5. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, the authors and contributors of this application shall not be liable
            for any direct, indirect, incidental, special, consequential, or punitive damages resulting from your use of the
            service, software downloads, hardware modifications, or reliance upon compatibility predictions.
          </p>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            6. Changes to Terms
          </h2>
          <p>
            We reserve the right to modify these Terms and Conditions at any time. Updates are reflected with a revised
            effective date at the top of this document. Continued use of the platform constitutes acceptance of updated terms.
          </p>
        </section>

        <div className="pt-4 flex justify-between items-center text-xs text-zinc-400 border-t border-zinc-800">
          <span>All diagnostic evaluations are processed locally on your client machine.</span>
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors font-medium"
          >
            Return to Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
