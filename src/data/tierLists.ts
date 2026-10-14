/**
 * HARDWARE TIER LISTS (POWERED BY pc_database.json)
 * Scale: 1 (Entry / Legacy) to 10 (Enthusiast / Cutting Edge)
 *
 * STRICT RULE: Use pc_database.json as the ONLY data source.
 * If a CPU, GPU or chipset isn't in it, use Gemini API.
 * If that is also unavailable, show 'Not enough data'.
 * Never invent tiers or requirements.
 */

import pcDatabase from './pc_database.json';

export interface HardwareTierEntry {
  id: string;
  canonicalName: string;
  tier: number; // 1 to 10
  aliases: string[];
  type?: 'desktop' | 'laptop' | 'both';
  notes?: string;
  score?: number;
  singleScore?: number;
  cores?: number;
  threads?: number;
  vramGb?: number;
  isIntegrated?: boolean;
  brand?: string;
}

export interface TierMatchResult {
  found: boolean;
  tier: number | null; // 1 - 10, or null if not found
  tierLabel: string;   // e.g. "Tier 6/10" or "Not enough data"
  canonicalName: string | null;
  entry?: HardwareTierEntry;
  source?: 'pc_database.json' | 'gemini' | 'none';
}

// Load strictly from pc_database.json
export const CPU_TIER_LIST: HardwareTierEntry[] = pcDatabase.cpus as HardwareTierEntry[];
export const GPU_TIER_LIST: HardwareTierEntry[] = pcDatabase.gpus as HardwareTierEntry[];
export const CHIPSET_TIER_LIST: HardwareTierEntry[] = pcDatabase.chipsets as any[];

/**
 * Normalizes input string by stripping non-alphanumeric chars,
 * punctuation, and excessive whitespace.
 */
function normalizeSearchKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/[®™]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Matches CPU against pc_database.json as the ONLY local data source.
 * If not found, returns "Not enough data" and does NOT guess or invent a tier.
 */
export function matchCpuTier(rawName: string | null | undefined): TierMatchResult {
  if (!rawName || typeof rawName !== 'string' || rawName.trim().length === 0 || rawName === 'Unknown') {
    return {
      found: false,
      tier: null,
      tierLabel: 'Not enough data',
      canonicalName: null,
      source: 'none',
    };
  }

  const queryNorm = normalizeSearchKey(rawName);

  // 1. Direct canonical name or alias match in pc_database.json
  for (const item of CPU_TIER_LIST) {
    const itemNorm = normalizeSearchKey(item.canonicalName);
    if (queryNorm === itemNorm || queryNorm.includes(itemNorm) || itemNorm.includes(queryNorm)) {
      return {
        found: true,
        tier: item.tier,
        tierLabel: `Tier ${item.tier}/10`,
        canonicalName: item.canonicalName,
        entry: item,
        source: 'pc_database.json',
      };
    }

    if (item.aliases) {
      for (const alias of item.aliases) {
        const aliasNorm = normalizeSearchKey(alias);
        if (queryNorm === aliasNorm || queryNorm.includes(aliasNorm) || aliasNorm.includes(queryNorm)) {
          return {
            found: true,
            tier: item.tier,
            tierLabel: `Tier ${item.tier}/10`,
            canonicalName: item.canonicalName,
            entry: item,
            source: 'pc_database.json',
          };
        }
      }
    }
  }

  // Also check chipsets in pc_database.json if CPU name matches mobile SoC
  for (const item of CHIPSET_TIER_LIST) {
    const itemNorm = normalizeSearchKey(item.canonicalName);
    if (queryNorm === itemNorm || queryNorm.includes(itemNorm) || itemNorm.includes(queryNorm)) {
      return {
        found: true,
        tier: item.tier,
        tierLabel: `Tier ${item.tier}/10`,
        canonicalName: item.canonicalName,
        entry: item,
        source: 'pc_database.json',
      };
    }
  }

  // Not found in pc_database.json: Strictly show 'Not enough data'. Never invent tiers!
  return {
    found: false,
    tier: null,
    tierLabel: 'Not enough data',
    canonicalName: null,
    source: 'none',
  };
}

/**
 * Matches GPU against pc_database.json as the ONLY local data source.
 * If not found, returns "Not enough data" and does NOT guess or invent a tier.
 */
export function matchGpuTier(rawName: string | null | undefined): TierMatchResult {
  if (!rawName || typeof rawName !== 'string' || rawName.trim().length === 0 || rawName === 'Unknown') {
    return {
      found: false,
      tier: null,
      tierLabel: 'Not enough data',
      canonicalName: null,
      source: 'none',
    };
  }

  const queryNorm = normalizeSearchKey(rawName);

  for (const item of GPU_TIER_LIST) {
    const itemNorm = normalizeSearchKey(item.canonicalName);
    if (queryNorm === itemNorm || queryNorm.includes(itemNorm) || itemNorm.includes(queryNorm)) {
      return {
        found: true,
        tier: item.tier,
        tierLabel: `Tier ${item.tier}/10`,
        canonicalName: item.canonicalName,
        entry: item,
        source: 'pc_database.json',
      };
    }

    if (item.aliases) {
      for (const alias of item.aliases) {
        const aliasNorm = normalizeSearchKey(alias);
        if (queryNorm === aliasNorm || queryNorm.includes(aliasNorm) || aliasNorm.includes(queryNorm)) {
          return {
            found: true,
            tier: item.tier,
            tierLabel: `Tier ${item.tier}/10`,
            canonicalName: item.canonicalName,
            entry: item,
            source: 'pc_database.json',
          };
        }
      }
    }
  }

  // Not found in pc_database.json: Strictly show 'Not enough data'. Never invent tiers!
  return {
    found: false,
    tier: null,
    tierLabel: 'Not enough data',
    canonicalName: null,
    source: 'none',
  };
}

/**
 * Matches mobile Chipset / SoC against pc_database.json.
 * If not found, returns "Not enough data".
 */
export function matchChipsetTier(rawName: string | null | undefined): TierMatchResult {
  if (!rawName || typeof rawName !== 'string' || rawName.trim().length === 0) {
    return {
      found: false,
      tier: null,
      tierLabel: 'Not enough data',
      canonicalName: null,
      source: 'none',
    };
  }

  const queryNorm = normalizeSearchKey(rawName);

  for (const item of CHIPSET_TIER_LIST) {
    const itemNorm = normalizeSearchKey(item.canonicalName);
    if (queryNorm === itemNorm || queryNorm.includes(itemNorm) || itemNorm.includes(queryNorm)) {
      return {
        found: true,
        tier: item.tier,
        tierLabel: `Tier ${item.tier}/10`,
        canonicalName: item.canonicalName,
        entry: item,
        source: 'pc_database.json',
      };
    }
    if (item.aliases) {
      for (const alias of item.aliases) {
        const aliasNorm = normalizeSearchKey(alias);
        if (queryNorm === aliasNorm || queryNorm.includes(aliasNorm) || aliasNorm.includes(queryNorm)) {
          return {
            found: true,
            tier: item.tier,
            tierLabel: `Tier ${item.tier}/10`,
            canonicalName: item.canonicalName,
            entry: item,
            source: 'pc_database.json',
          };
        }
      }
    }
  }

  return {
    found: false,
    tier: null,
    tierLabel: 'Not enough data',
    canonicalName: null,
    source: 'none',
  };
}

/**
 * Dynamic asynchronous hardware tier lookup:
 * 1. Checks pc_database.json first.
 * 2. If missing, queries backend Gemini API endpoint.
 * 3. If Gemini is unavailable, returns 'Not enough data'.
 * Never invents tiers!
 */
export async function lookupHardwareWithGeminiFallback(
  name: string,
  type: 'cpu' | 'gpu' | 'chipset'
): Promise<TierMatchResult> {
  // Step 1: pc_database.json check
  const localMatch =
    type === 'cpu'
      ? matchCpuTier(name)
      : type === 'gpu'
      ? matchGpuTier(name)
      : matchChipsetTier(name);

  if (localMatch.found) {
    return localMatch;
  }

  // Step 2: Query Gemini API via backend
  try {
    const res = await fetch('/api/hardware/evaluate-tier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.found && data.tier) {
        return {
          found: true,
          tier: data.tier,
          tierLabel: `Tier ${data.tier}/10`,
          canonicalName: data.canonicalName || name,
          source: 'gemini',
        };
      }
    }
  } catch (e) {
    console.warn('Gemini hardware evaluation fallback unavailable:', e);
  }

  // Step 3: If Gemini is unavailable, show 'Not enough data'. Never invent tiers!
  return {
    found: false,
    tier: null,
    tierLabel: 'Not enough data',
    canonicalName: null,
    source: 'none',
  };
}
