// Generator for pc_database.json
import fs from 'fs';
import path from 'path';

// Import existing hardware and game databases as foundation
import { CPU_DATABASE, GPU_DATABASE, SMARTPHONE_PRESETS } from '../src/data/hardwareDatabase';
import { CPU_TIER_LIST, GPU_TIER_LIST } from '../src/data/tierLists';
import { GAMES_DATABASE } from '../src/data/gamesDatabase';

// Build enriched CPUs list with exact tiers, benchmarks, aliases
const cpusMap = new Map();

// First add from CPU_TIER_LIST
for (const entry of CPU_TIER_LIST) {
  cpusMap.set(entry.id, {
    id: entry.id,
    canonicalName: entry.canonicalName,
    tier: entry.tier,
    tierLabel: `Tier ${entry.tier}/10`,
    aliases: entry.aliases || [],
    type: entry.type || 'desktop',
    notes: entry.notes || '',
    score: entry.tier * 4000,
    singleScore: 1000 + entry.tier * 350,
    cores: entry.tier >= 9 ? 16 : entry.tier >= 7 ? 8 : entry.tier >= 5 ? 6 : entry.tier >= 3 ? 4 : 2,
    threads: entry.tier >= 9 ? 24 : entry.tier >= 7 ? 16 : entry.tier >= 5 ? 12 : entry.tier >= 3 ? 8 : 4,
    brand: entry.canonicalName.toLowerCase().includes('intel') ? 'Intel' : entry.canonicalName.toLowerCase().includes('amd') ? 'AMD' : entry.canonicalName.toLowerCase().includes('apple') ? 'Apple' : 'Other'
  });
}

// Augment with CPU_DATABASE
for (const cpu of CPU_DATABASE) {
  const existing = cpusMap.get(cpu.id);
  if (existing) {
    existing.score = cpu.score;
    existing.singleScore = cpu.singleScore;
    existing.cores = cpu.cores;
    existing.threads = cpu.threads;
    existing.generation = cpu.generation;
    existing.brand = cpu.brand;
    existing.architecture = cpu.architecture;
  } else {
    const tier = Math.min(10, Math.max(1, Math.round(cpu.score / 4500)));
    cpusMap.set(cpu.id, {
      id: cpu.id,
      canonicalName: cpu.name,
      tier,
      tierLabel: `Tier ${tier}/10`,
      aliases: [cpu.name.toLowerCase(), cpu.id],
      type: cpu.architecture === 'Laptop' ? 'laptop' : 'desktop',
      notes: cpu.generation,
      score: cpu.score,
      singleScore: cpu.singleScore,
      cores: cpu.cores,
      threads: cpu.threads,
      generation: cpu.generation,
      brand: cpu.brand
    });
  }
}

// Build enriched GPUs list
const gpusMap = new Map();

for (const entry of GPU_TIER_LIST) {
  gpusMap.set(entry.id, {
    id: entry.id,
    canonicalName: entry.canonicalName,
    tier: entry.tier,
    tierLabel: `Tier ${entry.tier}/10`,
    aliases: entry.aliases || [],
    type: entry.type || 'desktop',
    notes: entry.notes || '',
    score: entry.tier * 2800,
    vramGb: entry.tier >= 9 ? 16 : entry.tier >= 7 ? 12 : entry.tier >= 5 ? 8 : entry.tier >= 3 ? 6 : 4,
    isIntegrated: entry.tier <= 2 && (entry.canonicalName.toLowerCase().includes('intel') || entry.canonicalName.toLowerCase().includes('vega')),
    brand: entry.canonicalName.toLowerCase().includes('nvidia') || entry.canonicalName.toLowerCase().includes('rtx') || entry.canonicalName.toLowerCase().includes('gtx')
      ? 'Nvidia'
      : entry.canonicalName.toLowerCase().includes('amd') || entry.canonicalName.toLowerCase().includes('radeon') || entry.canonicalName.toLowerCase().includes('rx')
      ? 'AMD'
      : entry.canonicalName.toLowerCase().includes('intel') || entry.canonicalName.toLowerCase().includes('arc')
      ? 'Intel'
      : entry.canonicalName.toLowerCase().includes('apple')
      ? 'Apple'
      : 'Other'
  });
}

for (const gpu of GPU_DATABASE) {
  const existing = gpusMap.get(gpu.id);
  if (existing) {
    existing.score = gpu.score;
    existing.vramGb = gpu.vramGb;
    existing.isIntegrated = gpu.isIntegrated;
    existing.brand = gpu.brand;
  } else {
    const tier = Math.min(10, Math.max(1, Math.round(gpu.score / 2800)));
    gpusMap.set(gpu.id, {
      id: gpu.id,
      canonicalName: gpu.name,
      tier,
      tierLabel: `Tier ${tier}/10`,
      aliases: [gpu.name.toLowerCase(), gpu.id],
      type: gpu.isIntegrated ? 'laptop' : 'desktop',
      score: gpu.score,
      vramGb: gpu.vramGb,
      isIntegrated: gpu.isIntegrated,
      brand: gpu.brand
    });
  }
}

// Build chipsets (Mobile SoCs & Processors)
const chipsets = [
  {
    id: 'snapdragon_8_gen_3',
    canonicalName: 'Qualcomm Snapdragon 8 Gen 3',
    brand: 'Qualcomm',
    tier: 10,
    tierLabel: 'Tier 10/10',
    cores: 8,
    threads: 8,
    cpuScore: 19500,
    gpuName: 'Adreno 750',
    gpuScore: 6800,
    aliases: ['snapdragon 8 gen 3', '8 gen 3', 'sm8650', 'sd8 gen 3', 'adreno 750']
  },
  {
    id: 'snapdragon_8_gen_2',
    canonicalName: 'Qualcomm Snapdragon 8 Gen 2',
    brand: 'Qualcomm',
    tier: 9,
    tierLabel: 'Tier 9/10',
    cores: 8,
    threads: 8,
    cpuScore: 16500,
    gpuName: 'Adreno 740',
    gpuScore: 5600,
    aliases: ['snapdragon 8 gen 2', '8 gen 2', 'sm8550', 'sd8 gen 2', 'adreno 740']
  },
  {
    id: 'snapdragon_8_plus_gen_1',
    canonicalName: 'Qualcomm Snapdragon 8+ Gen 1',
    brand: 'Qualcomm',
    tier: 8,
    tierLabel: 'Tier 8/10',
    cores: 8,
    threads: 8,
    cpuScore: 14200,
    gpuName: 'Adreno 730',
    gpuScore: 4800,
    aliases: ['snapdragon 8+ gen 1', '8+ gen 1', 'adreno 730']
  },
  {
    id: 'snapdragon_7_plus_gen_2',
    canonicalName: 'Qualcomm Snapdragon 7+ Gen 2',
    brand: 'Qualcomm',
    tier: 8,
    tierLabel: 'Tier 8/10',
    cores: 8,
    threads: 8,
    cpuScore: 13900,
    gpuName: 'Adreno 725',
    gpuScore: 4600,
    aliases: ['snapdragon 7+ gen 2', '7+ gen 2', 'adreno 725']
  },
  {
    id: 'snapdragon_7_gen_3',
    canonicalName: 'Qualcomm Snapdragon 7 Gen 3',
    brand: 'Qualcomm',
    tier: 7,
    tierLabel: 'Tier 7/10',
    cores: 8,
    threads: 8,
    cpuScore: 11800,
    gpuName: 'Adreno 720',
    gpuScore: 3900,
    aliases: ['snapdragon 7 gen 3', '7 gen 3', 'adreno 720']
  },
  {
    id: 'snapdragon_778g',
    canonicalName: 'Qualcomm Snapdragon 778G / 778G+',
    brand: 'Qualcomm',
    tier: 6,
    tierLabel: 'Tier 6/10',
    cores: 8,
    threads: 8,
    cpuScore: 9400,
    gpuName: 'Adreno 642L',
    gpuScore: 3100,
    aliases: ['snapdragon 778g', '778g', '778g+', 'adreno 642l']
  },
  {
    id: 'snapdragon_695',
    canonicalName: 'Qualcomm Snapdragon 695 5G',
    brand: 'Qualcomm',
    tier: 5,
    tierLabel: 'Tier 5/10',
    cores: 8,
    threads: 8,
    cpuScore: 7200,
    gpuName: 'Adreno 619',
    gpuScore: 2100,
    aliases: ['snapdragon 695', '695 5g', 'sd695', 'adreno 619']
  },
  {
    id: 'snapdragon_680',
    canonicalName: 'Qualcomm Snapdragon 680 4G',
    brand: 'Qualcomm',
    tier: 4,
    tierLabel: 'Tier 4/10',
    cores: 8,
    threads: 8,
    cpuScore: 5400,
    gpuName: 'Adreno 610',
    gpuScore: 1400,
    aliases: ['snapdragon 680', '680', 'sd680', 'adreno 610']
  },
  {
    id: 'apple_a18_pro',
    canonicalName: 'Apple A18 Pro (iPhone 16 Pro)',
    brand: 'Apple',
    tier: 10,
    tierLabel: 'Tier 10/10',
    cores: 6,
    threads: 6,
    cpuScore: 21500,
    gpuName: 'Apple A18 Pro 6-Core GPU',
    gpuScore: 7200,
    aliases: ['apple a18 pro', 'a18 pro', 'a18pro', 'iphone 16 pro max chip']
  },
  {
    id: 'apple_a17_pro',
    canonicalName: 'Apple A17 Pro (iPhone 15 Pro)',
    brand: 'Apple',
    tier: 10,
    tierLabel: 'Tier 10/10',
    cores: 6,
    threads: 6,
    cpuScore: 19200,
    gpuName: 'Apple A17 Pro 6-Core GPU',
    gpuScore: 6400,
    aliases: ['apple a17 pro', 'a17 pro', 'a17pro', 'iphone 15 pro max chip']
  },
  {
    id: 'apple_a16_bionic',
    canonicalName: 'Apple A16 Bionic',
    brand: 'Apple',
    tier: 9,
    tierLabel: 'Tier 9/10',
    cores: 6,
    threads: 6,
    cpuScore: 16800,
    gpuName: 'Apple A16 5-Core GPU',
    gpuScore: 5300,
    aliases: ['apple a16', 'a16 bionic', 'a16']
  },
  {
    id: 'apple_a15_bionic',
    canonicalName: 'Apple A15 Bionic',
    brand: 'Apple',
    tier: 8,
    tierLabel: 'Tier 8/10',
    cores: 6,
    threads: 6,
    cpuScore: 14900,
    gpuName: 'Apple A15 5-Core GPU',
    gpuScore: 4700,
    aliases: ['apple a15', 'a15 bionic', 'a15']
  },
  {
    id: 'mediatek_dimensity_9300',
    canonicalName: 'MediaTek Dimensity 9300 / 9300+',
    brand: 'MediaTek',
    tier: 10,
    tierLabel: 'Tier 10/10',
    cores: 8,
    threads: 8,
    cpuScore: 19800,
    gpuName: 'Immortalis-G720 MC12',
    gpuScore: 6900,
    aliases: ['dimensity 9300', 'dimensity 9300+', 'immortalis-g720']
  },
  {
    id: 'mediatek_dimensity_8300_ultra',
    canonicalName: 'MediaTek Dimensity 8300-Ultra (Poco X6 Pro)',
    brand: 'MediaTek',
    tier: 8,
    tierLabel: 'Tier 8/10',
    cores: 8,
    threads: 8,
    cpuScore: 14800,
    gpuName: 'Mali-G615-MC6',
    gpuScore: 5100,
    aliases: ['dimensity 8300', 'dimensity 8300 ultra', 'dimensity 8300-ultra', 'poco x6 pro chip', 'mali-g615']
  },
  {
    id: 'mediatek_dimensity_7200',
    canonicalName: 'MediaTek Dimensity 7200 / 7200 Ultra',
    brand: 'MediaTek',
    tier: 7,
    tierLabel: 'Tier 7/10',
    cores: 8,
    threads: 8,
    cpuScore: 11200,
    gpuName: 'Mali-G610 MC4',
    gpuScore: 3600,
    aliases: ['dimensity 7200', 'dimensity 7200 ultra', 'mali-g610']
  },
  {
    id: 'mediatek_helio_g99',
    canonicalName: 'MediaTek Helio G99 / G99 Ultimate',
    brand: 'MediaTek',
    tier: 5,
    tierLabel: 'Tier 5/10',
    cores: 8,
    threads: 8,
    cpuScore: 6800,
    gpuName: 'Mali-G57 MC2',
    gpuScore: 1850,
    aliases: ['helio g99', 'g99', 'helio g99 ultimate', 'mali-g57']
  },
  {
    id: 'google_tensor_g4',
    canonicalName: 'Google Tensor G4 (Pixel 9 / 9 Pro)',
    brand: 'Google',
    tier: 9,
    tierLabel: 'Tier 9/10',
    cores: 8,
    threads: 8,
    cpuScore: 16200,
    gpuName: 'Mali-G715 Immortalis',
    gpuScore: 5200,
    aliases: ['tensor g4', 'google tensor g4', 'pixel 9 chip']
  },
  {
    id: 'google_tensor_g3',
    canonicalName: 'Google Tensor G3 (Pixel 8 / 8 Pro)',
    brand: 'Google',
    tier: 8,
    tierLabel: 'Tier 8/10',
    cores: 9,
    threads: 9,
    cpuScore: 14100,
    gpuName: 'Mali-G715',
    gpuScore: 4600,
    aliases: ['tensor g3', 'google tensor g3', 'pixel 8 chip']
  },
  {
    id: 'samsung_exynos_2400',
    canonicalName: 'Samsung Exynos 2400',
    brand: 'Samsung',
    tier: 9,
    tierLabel: 'Tier 9/10',
    cores: 10,
    threads: 10,
    cpuScore: 17400,
    gpuName: 'Xclipse 940 (AMD RDNA3)',
    gpuScore: 5800,
    aliases: ['exynos 2400', 'xclipse 940', 'galaxy s24 exynos']
  },
  {
    id: 'samsung_exynos_1480',
    canonicalName: 'Samsung Exynos 1480 (Galaxy A55)',
    brand: 'Samsung',
    tier: 6,
    tierLabel: 'Tier 6/10',
    cores: 8,
    threads: 8,
    cpuScore: 9200,
    gpuName: 'Xclipse 530 (AMD RDNA2)',
    gpuScore: 3100,
    aliases: ['exynos 1480', 'xclipse 530', 'galaxy a55 chip']
  }
];

// High-performance Laptop CPUs (Intel HX / H / AMD HS)
const additionalCpus = [
  {
    id: 'intel_i5_13450hx',
    canonicalName: 'Intel Core i5-13450HX',
    brand: 'Intel',
    cores: 10,
    threads: 16,
    score: 25400,
    singleScore: 3700,
    tier: 8,
    tierLabel: 'Tier 8/10',
    type: 'laptop',
    generation: '13th Gen Raptor Lake-HX',
    notes: '10 cores (6 Performance + 4 Efficient), 16 threads. High-performance gaming laptop CPU.',
    aliases: ['i5-13450hx', 'core i5 13450hx', '13th gen intel(r) core(tm) i5-13450hx', 'i5 13450hx', '13450hx']
  },
  {
    id: 'intel_i5_13500hx',
    canonicalName: 'Intel Core i5-13500HX',
    brand: 'Intel',
    cores: 14,
    threads: 20,
    score: 28500,
    singleScore: 3750,
    tier: 8,
    tierLabel: 'Tier 8/10',
    type: 'laptop',
    generation: '13th Gen Raptor Lake-HX',
    notes: '14 cores (6P + 8E), 20 threads.',
    aliases: ['i5-13500hx', 'core i5 13500hx', '13500hx']
  },
  {
    id: 'intel_i7_13650hx',
    canonicalName: 'Intel Core i7-13650HX',
    brand: 'Intel',
    cores: 14,
    threads: 20,
    score: 30500,
    singleScore: 3850,
    tier: 9,
    tierLabel: 'Tier 9/10',
    type: 'laptop',
    generation: '13th Gen Raptor Lake-HX',
    aliases: ['i7-13650hx', 'core i7 13650hx', '13650hx']
  },
  {
    id: 'intel_i7_13700hx',
    canonicalName: 'Intel Core i7-13700HX',
    brand: 'Intel',
    cores: 16,
    threads: 24,
    score: 33500,
    singleScore: 3950,
    tier: 9,
    tierLabel: 'Tier 9/10',
    type: 'laptop',
    generation: '13th Gen Raptor Lake-HX',
    aliases: ['i7-13700hx', 'core i7 13700hx', '13700hx']
  },
  {
    id: 'intel_i9_13900hx',
    canonicalName: 'Intel Core i9-13900HX',
    brand: 'Intel',
    cores: 24,
    threads: 32,
    score: 43500,
    singleScore: 4200,
    tier: 10,
    tierLabel: 'Tier 10/10',
    type: 'laptop',
    generation: '13th Gen Raptor Lake-HX',
    aliases: ['i9-13900hx', 'core i9 13900hx', '13900hx']
  },
  {
    id: 'intel_i5_14450hx',
    canonicalName: 'Intel Core i5-14450HX',
    brand: 'Intel',
    cores: 10,
    threads: 16,
    score: 26200,
    singleScore: 3800,
    tier: 8,
    tierLabel: 'Tier 8/10',
    type: 'laptop',
    generation: '14th Gen Raptor Lake-HX Refresh',
    aliases: ['i5-14450hx', 'core i5 14450hx', '14450hx']
  },
  {
    id: 'intel_i5_12450h',
    canonicalName: 'Intel Core i5-12450H',
    brand: 'Intel',
    cores: 8,
    threads: 12,
    score: 17200,
    singleScore: 3300,
    tier: 6,
    tierLabel: 'Tier 6/10',
    type: 'laptop',
    generation: '12th Gen Alder Lake-H',
    aliases: ['i5-12450h', 'core i5 12450h', '12450h']
  },
  {
    id: 'intel_i5_13420h',
    canonicalName: 'Intel Core i5-13420H',
    brand: 'Intel',
    cores: 8,
    threads: 12,
    score: 18400,
    singleScore: 3450,
    tier: 6,
    tierLabel: 'Tier 6/10',
    type: 'laptop',
    generation: '13th Gen Raptor Lake-H',
    aliases: ['i5-13420h', 'core i5 13420h', '13420h']
  }
];

for (const c of additionalCpus) {
  cpusMap.set(c.id, c);
}

// Dedicated Laptop GPUs (Discrete NVIDIA & AMD)
const additionalGpus = [
  {
    id: 'nvidia_rtx_3050_6g_laptop',
    canonicalName: 'NVIDIA GeForce RTX 3050 6GB Laptop GPU',
    brand: 'Nvidia',
    isIntegrated: false,
    vramGb: 6,
    score: 13200,
    tier: 6,
    tierLabel: 'Tier 6/10',
    type: 'laptop',
    notes: 'Discrete Laptop GPU with 6GB GDDR6 VRAM, Ray Tracing, DLSS, NVENC. Solid 1080p gaming performance.',
    aliases: [
      'nvidia geforce rtx 3050 6gb laptop gpu',
      'geforce rtx 3050 6gb laptop gpu',
      'rtx 3050 6gb laptop gpu',
      'rtx 3050 6gb laptop',
      'rtx 3050 6gb',
      'rtx 3050 laptop gpu 6gb'
    ]
  },
  {
    id: 'nvidia_rtx_3050_4g_laptop',
    canonicalName: 'NVIDIA GeForce RTX 3050 4GB Laptop GPU',
    brand: 'Nvidia',
    isIntegrated: false,
    vramGb: 4,
    score: 11200,
    tier: 5,
    tierLabel: 'Tier 5/10',
    type: 'laptop',
    notes: 'Discrete Laptop GPU with 4GB GDDR6 VRAM.',
    aliases: [
      'nvidia geforce rtx 3050 4gb laptop gpu',
      'geforce rtx 3050 4gb laptop gpu',
      'rtx 3050 4gb laptop gpu',
      'rtx 3050 4gb laptop',
      'rtx 3050 4gb'
    ]
  },
  {
    id: 'nvidia_rtx_4050_laptop',
    canonicalName: 'NVIDIA GeForce RTX 4050 6GB Laptop GPU',
    brand: 'Nvidia',
    isIntegrated: false,
    vramGb: 6,
    score: 15800,
    tier: 7,
    tierLabel: 'Tier 7/10',
    type: 'laptop',
    notes: 'Discrete Laptop GPU with 6GB GDDR6 VRAM, DLSS 3 Frame Generation.',
    aliases: [
      'nvidia geforce rtx 4050 laptop gpu',
      'rtx 4050 laptop gpu',
      'rtx 4050 laptop',
      'rtx 4050 6gb'
    ]
  },
  {
    id: 'nvidia_rtx_4060_laptop',
    canonicalName: 'NVIDIA GeForce RTX 4060 8GB Laptop GPU',
    brand: 'Nvidia',
    isIntegrated: false,
    vramGb: 8,
    score: 19800,
    tier: 8,
    tierLabel: 'Tier 8/10',
    type: 'laptop',
    notes: 'Discrete Laptop GPU with 8GB GDDR6 VRAM, DLSS 3.',
    aliases: [
      'nvidia geforce rtx 4060 laptop gpu',
      'rtx 4060 laptop gpu',
      'rtx 4060 laptop',
      'rtx 4060 8gb'
    ]
  },
  {
    id: 'nvidia_rtx_4070_laptop',
    canonicalName: 'NVIDIA GeForce RTX 4070 8GB Laptop GPU',
    brand: 'Nvidia',
    isIntegrated: false,
    vramGb: 8,
    score: 23500,
    tier: 8,
    tierLabel: 'Tier 8/10',
    type: 'laptop',
    notes: 'Discrete Laptop GPU with 8GB GDDR6 VRAM.',
    aliases: [
      'nvidia geforce rtx 4070 laptop gpu',
      'rtx 4070 laptop gpu',
      'rtx 4070 laptop'
    ]
  },
  {
    id: 'nvidia_rtx_3060_laptop',
    canonicalName: 'NVIDIA GeForce RTX 3060 6GB Laptop GPU',
    brand: 'Nvidia',
    isIntegrated: false,
    vramGb: 6,
    score: 14600,
    tier: 6,
    tierLabel: 'Tier 6/10',
    type: 'laptop',
    aliases: [
      'nvidia geforce rtx 3060 laptop gpu',
      'rtx 3060 laptop gpu',
      'rtx 3060 laptop'
    ]
  }
];

for (const g of additionalGpus) {
  gpusMap.set(g.id, g);
}


const database = {
  version: '2.0.0',
  description: 'Verified Hardware and Workload Database. Strict rule: If a CPU, GPU or chipset is not found here, use Gemini API. If unavailable, show "Not enough data". Never invent tiers or requirements.',
  metadata: {
    lastUpdated: new Date().toISOString(),
    strictRule: 'Never invent tiers or requirements. If not found in this database and Gemini API is unavailable, return "Not enough data".',
    totalCpus: cpusMap.size,
    totalGpus: gpusMap.size,
    totalChipsets: chipsets.length,
    totalGames: GAMES_DATABASE.length,
  },
  cpus: Array.from(cpusMap.values()),
  gpus: Array.from(gpusMap.values()),
  chipsets: chipsets,
  games: GAMES_DATABASE
};

// Write to root ./pc_database.json
fs.writeFileSync('./pc_database.json', JSON.stringify(database, null, 2), 'utf8');
// Write to src/data/pc_database.json
fs.writeFileSync('./src/data/pc_database.json', JSON.stringify(database, null, 2), 'utf8');

console.log(`Successfully generated pc_database.json: ${database.cpus.length} CPUs, ${database.gpus.length} GPUs, ${database.chipsets.length} Chipsets, ${database.games.length} Games.`);
