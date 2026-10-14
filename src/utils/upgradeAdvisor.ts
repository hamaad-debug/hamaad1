import { UpgradeAction, UpgradeReport, UpgradeSymptomInput, UserSpecs } from '../types';

export function analyzeUpgrades(specs: UserSpecs, symptoms: UpgradeSymptomInput): UpgradeReport {
  const isHdd = specs.primaryStorageType === 'hdd';
  const isSataSsd = specs.primaryStorageType === 'sata_ssd';
  const hasLowRam = specs.ramGb <= 4;
  const has8GbRam = specs.ramGb === 8;
  const isSingleChannel = specs.ramChannels === 'single';
  const isIntegratedGpu = specs.isIntegratedGpu;
  const isAncientCpu = specs.cpuScore < 4500;
  const isDesktop = specs.deviceType === 'desktop' || specs.formFactor === 'desktop';
  const isLaptop = specs.deviceType === 'laptop' || specs.formFactor === 'laptop';
  const isMobile = specs.deviceType === 'phone' || specs.formFactor === 'phone' || specs.formFactor === 'tablet';

  const freeFixes: string[] = isMobile
    ? [
        'Clear App Storage & Caches: Settings > Storage > Clear cache on WhatsApp, TikTok, Chrome, and social apps that accumulate tens of gigabytes.',
        'Battery Health & Background Refresh: Check Battery Health in settings. Disable background app refresh for non-essential applications.',
        'Maintain 15-20% Free Internal Storage: Flash NAND storage slows down significantly when completely full, causing app freezes.',
        'Restart Device Weekly: A fresh restart clears leaked memory states from cached mobile background tasks.',
      ]
    : [
        'Audit Startup Applications: Open Task Manager (Ctrl+Shift+Esc) > Startup apps, and disable Spotify, Discord, OneDrive, and launcher updaters that run on boot.',
        'Clear Temp Files & Check Disk Space: Ensure your system drive has at least 15-20% free space so Windows/macOS virtual memory paging and TRIM functions properly.',
        'Check Browser Hardware Acceleration: In Chrome/Edge/Firefox Settings > System, ensure "Use hardware acceleration when available" is toggled on.',
        'Dust & Thermal Inspection: If the computer slows down after 15-20 minutes, fans may be choked with dust, causing CPU thermal throttling down to 800MHz.',
      ];

  const upgrades: UpgradeAction[] = [];
  let shouldUpgradeNewPc = false;
  let newPcReason: string | undefined;

  // Case for Phone / Tablet
  if (isMobile) {
    upgrades.push({
      priority: 'high',
      component: 'Battery Health Replacement',
      title: 'Authorized Battery Replacement Service',
      expectedBenefit: 'Restores peak CPU performance throttled by degraded lithium battery, eliminating unexpected shutdowns and slowdowns.',
      estimatedCost: '$45 - $80',
      compatibilityNote: 'Must be installed by an authorized repair technician.',
      worthItVerdict: 'High ROI (8/10) if the phone is 2-4 years old with battery health under 80%.',
      roiRating: 'good',
    });
    upgrades.push({
      priority: 'medium',
      component: 'Internal Hardware Upgrades',
      title: 'Mobile SoCs, RAM, and Storage are permanently soldered',
      expectedBenefit: 'Smartphones cannot be upgraded with new RAM or graphics chips.',
      estimatedCost: 'N/A',
      compatibilityNote: 'Hardware is integrated into a unified mobile logic board.',
      worthItVerdict: 'To increase memory or gaming performance, trade in toward a newer model.',
      roiRating: 'not_recommended',
    });
  }

  // Case 1: Traditional HDD detected -> #1 Transformative upgrade regardless of budget
  if (isHdd && !isMobile) {
    upgrades.push({
      priority: 'critical',
      component: 'Storage (Solid-State Drive)',
      title: 'Replace Mechanical HDD with an SSD (SATA or NVMe)',
      expectedBenefit: 'Boot times plunge from 60-120 seconds down to 10-15 seconds. Apps, browsers, and Windows search open instantaneously. Complete elimination of 100% disk usage lockups.',
      estimatedCost: '$25 - $45 for 500GB / $55 - $75 for 1TB',
      compatibilityNote: isLaptop
        ? 'Standard 2.5-inch 7mm SATA SSD fits any laptop with an HDD bay. If laptop has an M.2 NVMe slot, an NVMe SSD is even faster.'
        : 'Connects directly via standard SATA III data cable and power cable on any desktop motherboard.',
      worthItVerdict: 'Exceptional ROI (10/10). The single most cost-effective performance upgrade in computing history.',
      roiRating: 'exceptional',
    });
  }

  // Case 2: Low RAM (<=4GB or 8GB experiencing multitasking slowdowns)
  if (hasLowRam || (has8GbRam && (symptoms.slowdownType === 'multitasking_tabs' || symptoms.timing === 'many_apps_open'))) {
    const targetRam = hasLowRam ? '8GB or 16GB' : '16GB (Dual-Channel)';
    upgrades.push({
      priority: hasLowRam ? 'critical' : 'high',
      component: 'Memory (RAM)',
      title: `Upgrade RAM to ${targetRam}`,
      expectedBenefit: 'Eliminates page-file disk swapping when switching between browser tabs, Zoom, and applications. Eliminates browser tab reloads and stutter.',
      estimatedCost: '$25 - $45 for an 8GB/16GB stick or dual-channel kit',
      compatibilityNote: isLaptop
        ? 'Check if your laptop has an open SO-DIMM RAM slot (some ultra-thin laptops have soldered RAM which cannot be upgraded).'
        : `Match your motherboard's generation (${specs.ramType}) and install in alternating slots (DIMM 2 & 4) for dual-channel bandwidth.`,
      worthItVerdict: 'High ROI (9/10). Dual-channel memory doubles memory bandwidth, especially beneficial for integrated graphics.',
      roiRating: 'exceptional',
    });
  } else if (has8GbRam && isSingleChannel && !hasLowRam) {
    upgrades.push({
      priority: 'medium',
      component: 'Memory (RAM Channel)',
      title: 'Add a Second Matching RAM Stick for Dual-Channel Mode',
      expectedBenefit: 'Doubles memory bandwidth. Grants up to 20-30% higher framerates on integrated graphics and smoother background multitasking.',
      estimatedCost: '$20 - $30',
      compatibilityNote: 'Buy an identical DDR generation, speed (e.g. DDR4-3200), and CL timing stick.',
      worthItVerdict: 'Great Value (8/10). Low cost for free throughput.',
      roiRating: 'good',
    });
  }

  // Case 3: Gaming Low FPS or 3D Rendering Stalls
  if (symptoms.slowdownType === 'gaming_low_fps' || symptoms.slowdownType === 'rendering_export') {
    if (isDesktop && (isIntegratedGpu || specs.gpuTier <= 1)) {
      upgrades.push({
        priority: 'high',
        component: 'Graphics Card (GPU)',
        title: 'Add a Dedicated GPU (e.g., GTX 1650, RX 6600, or RTX 3060)',
        expectedBenefit: 'Transforms gaming from unplayable 15-20 FPS slideshow into smooth 60-120+ FPS at 1080p. Unlocks hardware video encoding and Blender rendering.',
        estimatedCost: '$140 - $220 for budget/midrange card',
        compatibilityNote: 'Requires a desktop case with PCIe x16 slot and adequate Power Supply (PSU, 450W-550W) with 6-pin/8-pin PCIe power cable.',
        worthItVerdict: 'Essential for Gaming/3D. You cannot game comfortably without a discrete GPU.',
        roiRating: 'exceptional',
      });
    } else if (isLaptop && (isIntegratedGpu || specs.gpuTier <= 1)) {
      upgrades.push({
        priority: 'low',
        component: 'Graphics Card (GPU)',
        title: 'Laptop GPU cannot be upgraded internally',
        expectedBenefit: 'Laptop GPUs are permanently soldered to the motherboard.',
        estimatedCost: 'N/A (Requires laptop replacement)',
        compatibilityNote: 'External GPU (eGPU) enclosures require Thunderbolt 3/4 and cost $350+ without a card, making a new laptop a far better purchase.',
        worthItVerdict: 'Not Recommended. Invest money toward a new system instead.',
        roiRating: 'not_recommended',
      });
    } else if (isDesktop && specs.gpuTier === 2 && symptoms.budget !== 'under_50' && symptoms.budget !== 'free') {
      upgrades.push({
        priority: 'medium',
        component: 'Graphics Card (GPU)',
        title: 'Upgrade to Modern 8GB-12GB GPU (e.g. RTX 4060 or RX 7600)',
        expectedBenefit: 'Enables high/ultra settings in latest 2024-2026 AAA releases, DLSS 3 frame generation, and Ray Tracing.',
        estimatedCost: '$280 - $350',
        compatibilityNote: 'Check PC power supply wattage (500W+) and physical clearance inside case.',
        worthItVerdict: 'Worth it if you play modern AAA games and have the budget.',
        roiRating: 'good',
      });
    }
  }

  // Case 4: Ancient CPU platform bottleneck
  if (isAncientCpu) {
    if (specs.cpuScore < 3000) {
      shouldUpgradeNewPc = true;
      newPcReason = 'Your processor architecture is over 10-12 years old. Upgrading the CPU alone would require a new motherboard, new DDR4/DDR5 RAM, and likely a new power supply. A refurbished or budget modern mini-PC ($200-$350) will outperform this machine by 500% while using a fraction of the electricity.';
    } else {
      upgrades.push({
        priority: 'low',
        component: 'Processor / Motherboard Platform',
        title: 'Platform Overhaul (CPU + Motherboard + RAM)',
        expectedBenefit: 'Multiplies overall computational speed and snappiness.',
        estimatedCost: '$200 - $350 for modern budget CPU combo (e.g. Core i3-12100 / Ryzen 5 5600)',
        compatibilityNote: 'Requires disassembling the PC and reinstalling the OS.',
        worthItVerdict: 'Marginal as a patch; better to save for a full system refresh unless you enjoy custom PC building.',
        roiRating: 'marginal',
      });
    }
  }

  // Check if zero budget selected or no hardware bottlenecks detected
  let primaryVerdict = '';
  if (isMobile) {
    primaryVerdict = 'Smartphones and tablets feature integrated unified logic boards where RAM and processors cannot be upgraded internally. Focus on battery health, clearing heavy app caches, maintaining 15% free flash storage, or trading in if aging.';
  } else if (symptoms.budget === 'free') {
    primaryVerdict = 'Focus 100% on software optimization and maintenance. Do not spend money right now: clean startup services, check background tasks, and ensure storage free space.';
  } else if (isHdd) {
    primaryVerdict = 'Your single biggest problem is the mechanical hard drive (HDD). Replacing it with a solid-state drive (SSD) will solve 80% of your frustration for less than $40.';
  } else if (hasLowRam || (has8GbRam && symptoms.slowdownType === 'multitasking_tabs')) {
    primaryVerdict = 'Your system is running out of physical RAM and paging memory to disk. Upgrading memory to 16GB dual-channel is the highest ROI solution.';
  } else if (symptoms.slowdownType === 'gaming_low_fps' && isIntegratedGpu) {
    primaryVerdict = 'Your processor and memory are sufficient, but gaming demands dedicated graphics hardware (discrete GPU).';
  } else if (!isHdd && specs.ramGb >= 16 && specs.cpuScore >= 12000) {
    primaryVerdict = 'Your hardware is capable! The slowdown is very likely caused by software bloat, too many startup background tasks, or thermal throttling rather than outdated components.';
  } else {
    primaryVerdict = 'Targeted, modest component upgrades can significantly extend the usable lifespan of your computer.';
  }

  return {
    primaryVerdict,
    freeMaintenanceFixes: freeFixes,
    recommendedUpgrades: upgrades,
    shouldUpgradeNewPc,
    newPcReason,
  };
}
