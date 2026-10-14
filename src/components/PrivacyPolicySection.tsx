import React from 'react';
import { Shield, Lock, FileText, CheckCircle, ArrowLeft } from 'lucide-react';

interface PrivacyPolicySectionProps {
  onBack: () => void;
}

export const PrivacyPolicySection: React.FC<PrivacyPolicySectionProps> = ({ onBack }) => {
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
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-zinc-100 tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-zinc-400 mt-1">Effective Date: October 2026 · What Can My PC Actually Do?</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Zero Telemetry · Client-First</span>
        </div>
      </div>

      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            1. Overview and Core Philosophy
          </h2>
          <p>
            What Can My PC Actually Do? provides hardware diagnostic evaluations, workload capability assessments, and upgrade advice.
            We hold a strict client-privacy standard: we do not collect personal identifiers, browsing history, files,
            or contact lists. Our diagnostic tools focus exclusively on hardware component identifiers required to
            calculate performance scores and compatibility.
          </p>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            2. Information We Process
          </h2>
          <p>When you utilize our diagnostic scanner or script, the following technical attributes are evaluated:</p>
          <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-2">
            <li><strong>Processor Details:</strong> Model name, core count, logical threads, and architecture.</li>
            <li><strong>Graphics Controller:</strong> GPU chipset model, video memory (VRAM), and driver renderer name.</li>
            <li><strong>System Memory:</strong> Total capacity in gigabytes and detected channel configuration.</li>
            <li><strong>Storage Hardware:</strong> Primary drive capacity, interface type (NVMe SSD, SATA SSD, HDD), and free space.</li>
            <li><strong>Display & OS:</strong> Active screen resolution and operating system edition.</li>
          </ul>
          <p className="text-xs text-zinc-400 mt-2">
            We do NOT collect MAC addresses, IP location registries, user document paths, passwords, or personal credentials.
          </p>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            3. How Information Is Used
          </h2>
          <p>All hardware metrics are used strictly for in-session technical evaluations:</p>
          <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-2">
            <li>Matching system capabilities against official game requirements and software specifications.</li>
            <li>Calculating PassMark CPU and 3D graphics indices based on public benchmarking databases.</li>
            <li>Detecting system bottlenecks and generating tailored, cost-effective upgrade recommendations.</li>
            <li>Optional cloud profile saving when you explicitly choose to persist a configuration.</li>
          </ul>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-zinc-100">4. Local Storage & Cookie Usage</h2>
          <p>
            This application uses your browser's local storage (<code className="text-emerald-400 font-mono text-xs">localStorage</code>)
            to cache your active hardware profile so that refreshing the page does not require re-running the diagnostic tool.
            You can clear this cached data at any time via your browser settings or by clicking "Reset" in the hardware inspector.
          </p>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-zinc-100">5. Third-Party Sharing</h2>
          <p>
            We do not sell, rent, monetize, or disclose your hardware configurations to advertising networks or third-party brokers.
            When checking game requirements, queries are matched against local databases or public developer requirement registries.
          </p>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-zinc-100">6. Security and Retention</h2>
          <p>
            Diagnostic session tokens used to synchronize local scripts with browser tabs expire automatically and are kept in transient memory.
            Saved cloud rigs in the cloud database are stored with anonymous identifiers and can be deleted by you at any time.
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
