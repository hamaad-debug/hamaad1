import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { UserSpecs } from './types';
import { userSpecsToSpecObject } from './specData';
import { PRESET_RIGS } from './data/hardwareDatabase';
import { resolveHardwareSpecs } from './utils/hardwarePrecisionProber';
import { Navigation, AppPage } from './components/Navigation';
import { SiteFooter } from './components/SiteFooter';
import { HomeLanding } from './pages/HomeLanding';
import { PhoneDetectorLanding } from './pages/PhoneDetectorLanding';
import { SpecsLanding } from './pages/SpecsLanding';
import { PrivacyPolicySection } from './components/PrivacyPolicySection';
import { TermsConditionsSection } from './components/TermsConditionsSection';

// Exact signature spotlight imagery for 3D home hero
const BG_IMAGE_1 =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_195923_b0ba8ace-1d1d-4f2c-9a28-1ab84b330680.png&w=1280&q=85';
const BG_IMAGE_2 =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_201152_bba90a12-bf12-459f-91f0-51f237dbaf3b.png&w=1280&q=85';

export default function App() {
  // Cursor position state for 3D spotlight effect
  const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });
  const [hasInteracted, setHasInteracted] = useState(false);

  // Mouse & touch handlers for interactive 3D spotlight
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    setHasInteracted(true);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches && e.touches[0]) {
      setCursorPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setHasInteracted(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchstart', handleTouchMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleMouseMove, handleTouchMove]);

  // Current active landing page: Home by default, or specific detection page when requested
  const [currentPage, setCurrentPage] = useState<AppPage>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (
        urlParams.get('session_id') ||
        urlParams.get('auto_detected') ||
        urlParams.get('hw') ||
        urlParams.get('cpu')
      ) {
        return 'specs-inspector';
      }
      const path = window.location.pathname.replace(/^\//, '');
      if (path === 'phone-detector') {
        return 'phone-detector';
      }
      if (path === 'specs-inspector') {
        return 'specs-inspector';
      }
      if (path === 'privacy' || path === 'terms') {
        return path as AppPage;
      }
    }
    return 'home';
  });

  // Active specs state: prioritized from URL params (CMD runner), localStorage, or default laptop profile
  const [specs, setSpecs] = useState<UserSpecs>(() => {
    const defaultRig = PRESET_RIGS[0]?.specs;
    const initial: UserSpecs = defaultRig || {
      cpuId: 'intel_i5_13450hx',
      cpuName: '13th Gen Intel(R) Core(TM) i5-13450HX',
      cpuCores: 10,
      cpuThreads: 16,
      cpuScore: 25400,
      cpuSingleScore: 3700,
      cpuGeneration: '13th Gen Raptor Lake-HX',
      cpuBrand: 'Intel',
      gpuId: 'nvidia_rtx_3050_6g_laptop',
      gpuName: 'NVIDIA GeForce RTX 3050 6GB Laptop GPU',
      isIntegratedGpu: false,
      gpuVramGb: 6,
      gpuScore: 13200,
      gpuTier: 3,
      gpuBrand: 'Nvidia',
      ramGb: 16,
      ramType: 'DDR4',
      ramChannels: 'dual',
      primaryStorageType: 'nvme_ssd',
      storageCapacityGb: 256,
      storageFreeGb: 45,
      os: 'Windows 11',
      displayResolution: '1920x1080',
      formFactor: 'laptop',
      deviceType: 'laptop',
    };

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const cpuParam = urlParams.get('cpu');
      const gpuParam = urlParams.get('gpu');
      const ramParam = urlParams.get('ram');
      const chassisParam = urlParams.get('chassis') || urlParams.get('dev');

      // 1. Direct URL parameters from CMD runner
      if (cpuParam || gpuParam) {
        const isLap = chassisParam !== 'desktop';
        const parsedRam = parseInt(ramParam || '16', 10);
        const resolved = resolveHardwareSpecs(
          cpuParam,
          gpuParam,
          isNaN(parsedRam) ? 16 : parsedRam,
          isLap ? 'laptop' : 'desktop',
          initial
        );

        const direct: UserSpecs = {
          ...initial,
          ...resolved,
          cpuName: cpuParam || resolved.cpuName || initial.cpuName,
          gpuName: gpuParam || resolved.gpuName || initial.gpuName,
          ramGb: isNaN(parsedRam) ? (resolved.ramGb || 16) : parsedRam,
          deviceType: (isLap ? 'laptop' : 'desktop') as 'laptop' | 'desktop',
          formFactor: (isLap ? 'laptop' : 'desktop') as 'laptop' | 'desktop',
          is100PercentVerified: true,
        };
        try {
          localStorage.setItem('rigcompass_detected_specs', JSON.stringify(direct));
        } catch (e) {}
        return {
          ...direct,
          specObject: userSpecsToSpecObject(direct),
        };
      }

      // 2. Base64 hw param from CMD runner
      const hwParam = urlParams.get('hw');
      if (hwParam) {
        try {
          const normalized = hwParam.replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(decodeURIComponent(escape(atob(normalized))));
          const raw = decoded.specs || decoded;
          if (raw && (raw.cpuName || raw.gpuName)) {
            const resolved = resolveHardwareSpecs(
              raw.cpuName,
              raw.gpuName,
              raw.ramGb,
              raw.deviceType || 'laptop',
              initial
            );
            const merged: UserSpecs = { ...initial, ...raw, ...resolved, is100PercentVerified: true };
            try {
              localStorage.setItem('rigcompass_detected_specs', JSON.stringify(merged));
            } catch (e) {}
            return {
              ...merged,
              specObject: userSpecsToSpecObject(merged),
            };
          }
        } catch (e) {
          try {
            const rawDecoded = JSON.parse(atob(hwParam.replace(/ /g, '+')));
            const raw = rawDecoded.specs || rawDecoded;
            if (raw && (raw.cpuName || raw.gpuName)) {
              const resolved = resolveHardwareSpecs(raw.cpuName, raw.gpuName, raw.ramGb, raw.deviceType || 'laptop', initial);
              const merged: UserSpecs = { ...initial, ...raw, ...resolved, is100PercentVerified: true };
              try {
                localStorage.setItem('rigcompass_detected_specs', JSON.stringify(merged));
              } catch (e2) {}
              return { ...merged, specObject: userSpecsToSpecObject(merged) };
            }
          } catch (e2) {}
        }
      }

      // 3. LocalStorage from previous scan or concurrent tab
      try {
        const cached = localStorage.getItem('rigcompass_detected_specs');
        if (cached) {
          const parsedCached = JSON.parse(cached);
          if (parsedCached && (parsedCached.cpuName || parsedCached.gpuName)) {
            const resolved = resolveHardwareSpecs(
              parsedCached.cpuName,
              parsedCached.gpuName,
              parsedCached.ramGb,
              parsedCached.deviceType || 'laptop',
              { ...initial, ...parsedCached }
            );
            const merged = { ...initial, ...parsedCached, ...resolved, is100PercentVerified: true };
            return {
              ...merged,
              specObject: userSpecsToSpecObject(merged),
            };
          }
        }
      } catch (err) {}
    }

    return {
      ...initial,
      specObject: initial.specObject || userSpecsToSpecObject(initial),
    };
  });

  // Check and synchronize detected hardware from CMD runner session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get('session_id');
    const autoDetected = urlParams.get('auto_detected');

    if (sid || autoDetected) {
      setCurrentPage('specs-inspector');
      const fetchUrl = sid ? `/api/detect/status/${sid}` : '/api/detect/status/latest';

      const pollStatus = (retryCount = 0) => {
        fetch(fetchUrl)
          .then((r) => r.json())
          .then((data) => {
            if (data && data.specs && (data.specs.cpuName || data.specs.gpuName)) {
              setSpecs((prev) => {
                const updated = {
                  ...prev,
                  ...data.specs,
                  is100PercentVerified: true,
                  specObject: userSpecsToSpecObject({ ...prev, ...data.specs }),
                };
                try {
                  localStorage.setItem('rigcompass_detected_specs', JSON.stringify(data.specs));
                } catch (e) {}
                return updated;
              });
              setCurrentPage('specs-inspector');
            } else if (retryCount < 8) {
              setTimeout(() => pollStatus(retryCount + 1), 1000);
            }
          })
          .catch(() => {
            if (retryCount < 5) {
              setTimeout(() => pollStatus(retryCount + 1), 1200);
            }
          });
      };

      pollStatus();
    }

    // Cross-tab storage listener
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'rigcompass_detected_specs' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && (parsed.cpuName || parsed.gpuName)) {
            setSpecs((prev) => ({
              ...prev,
              ...parsed,
              is100PercentVerified: true,
              specObject: userSpecsToSpecObject({ ...prev, ...parsed }),
            }));
            setCurrentPage('specs-inspector');
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  // Sync browser URL history without page reload
  const navigateTo = (page: AppPage) => {
    let targetPage = page;
    if ((page as string) === 'upgrade-advisor' || (page as string) === 'game-testing') {
      targetPage = 'specs-inspector';
    }

    if (targetPage === currentPage) return;
    setCurrentPage(targetPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const newPath = targetPage === 'home' ? '/' : `/${targetPage}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath);
      }
    } catch {
      // Graceful fallback
    }
  };

  // Listen to popstate (back/forward browser buttons)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '');
      if (path === 'phone-detector') {
        setCurrentPage('phone-detector');
      } else if (path === 'specs-inspector') {
        setCurrentPage('specs-inspector');
      } else if (path === 'privacy' || path === 'terms') {
        setCurrentPage(path as AppPage);
      } else {
        setCurrentPage('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div
      className="min-h-screen bg-black text-zinc-100 tracking-[-0.02em] selection:bg-[#e8702a]/30 selection:text-white flex flex-col justify-between"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Universal Fixed Navigation: Home, PC & Laptop Detection, and Phone Detection */}
      <Navigation
        currentPage={currentPage}
        onNavigate={navigateTo}
        specs={specs}
        onApplySpecs={(newSpecs) => setSpecs(newSpecs)}
      />

      {/* Main Multi-Page Route Render With Animated Transitions */}
      <main className="min-h-screen flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full"
            >
              <HomeLanding
                cursorPos={cursorPos}
                hasInteracted={hasInteracted}
                onNavigate={navigateTo}
                bgImage1={BG_IMAGE_1}
                bgImage2={BG_IMAGE_2}
              />
            </motion.div>
          )}

          {currentPage === 'specs-inspector' && (
            <motion.div
              key="specs-inspector"
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full"
            >
              <SpecsLanding
                specs={specs}
                setSpecs={setSpecs}
                onNavigate={navigateTo}
              />
            </motion.div>
          )}

          {currentPage === 'phone-detector' && (
            <motion.div
              key="phone-detector"
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full"
            >
              <PhoneDetectorLanding
                specs={specs}
                setSpecs={setSpecs}
                onNavigate={navigateTo}
              />
            </motion.div>
          )}

          {currentPage === 'privacy' && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="pt-28 pb-16 max-w-4xl mx-auto px-4"
            >
              <PrivacyPolicySection onBack={() => navigateTo('home')} />
            </motion.div>
          )}

          {currentPage === 'terms' && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="pt-28 pb-16 max-w-4xl mx-auto px-4"
            >
              <TermsConditionsSection onBack={() => navigateTo('home')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Universal Footer */}
      <SiteFooter onNavigate={navigateTo} />
    </div>
  );
}
