import { SpecObject } from './specData';
import { evaluateSpecAgainstGoals, GoalEvaluationResult } from './rules';

export interface TestCaseSample {
  id: string;
  label: string;
  spec: SpecObject;
  expected: {
    officeRating: 'Good' | 'Possible with limits' | 'Not recommended';
    esportsRating: 'Good' | 'Possible with limits' | 'Not recommended';
    aaaGamingRating: 'Good' | 'Possible with limits' | 'Not recommended';
    videoEditingRating: 'Good' | 'Possible with limits' | 'Not recommended';
    expectedBottlenecks?: Record<string, string>;
    expectedConfidence?: Record<string, string>;
  };
}

export const SAMPLE_PCS: TestCaseSample[] = [
  // 1. Old laptop with HDD
  {
    id: 'old_laptop_hdd',
    label: 'Old Budget Laptop with Mechanical HDD',
    spec: {
      deviceType: 'laptop',
      cpu: { name: 'Intel Celeron N4020', source: 'user' },
      gpu: { name: 'Intel HD Graphics 4000', source: 'user' },
      ram: { gb: 4, source: 'user' },
      storage: { type: 'hdd', freeGb: 20, source: 'user' },
      os: { name: 'Windows 10', source: 'user' },
      resolution: { w: 1366, h: 768, source: 'user' },
    },
    expected: {
      officeRating: 'Possible with limits',
      esportsRating: 'Not recommended',
      aaaGamingRating: 'Not recommended',
      videoEditingRating: 'Not recommended',
    },
  },

  // 2. Office PC
  {
    id: 'office_pc',
    label: 'Typical Office / School Desktop PC',
    spec: {
      deviceType: 'desktop',
      cpu: { name: 'Intel Core i3-10100', source: 'user' },
      gpu: { name: 'Intel UHD Graphics 630', source: 'user' },
      ram: { gb: 8, source: 'user' },
      storage: { type: 'sata_ssd', freeGb: 120, source: 'user' },
      os: { name: 'Windows 11', source: 'user' },
      resolution: { w: 1920, h: 1080, source: 'user' },
    },
    expected: {
      officeRating: 'Good',
      esportsRating: 'Not recommended',
      aaaGamingRating: 'Not recommended',
      videoEditingRating: 'Not recommended',
    },
  },

  // 3. Mid Gaming PC
  {
    id: 'mid_gaming_pc',
    label: 'Mid-Range 1080p Gaming Desktop',
    spec: {
      deviceType: 'desktop',
      cpu: { name: 'AMD Ryzen 5 3600', source: 'user' },
      gpu: { name: 'NVIDIA GeForce GTX 1660 Super', source: 'user' },
      ram: { gb: 16, source: 'user' },
      storage: { type: 'nvme_ssd', freeGb: 450, source: 'user' },
      os: { name: 'Windows 11', source: 'user' },
      resolution: { w: 1920, h: 1080, source: 'user' },
    },
    expected: {
      officeRating: 'Good',
      esportsRating: 'Good',
      aaaGamingRating: 'Possible with limits',
      videoEditingRating: 'Possible with limits',
    },
  },

  // 4. High-End PC
  {
    id: 'high_end_pc',
    label: 'High-End Enthusiast Rig',
    spec: {
      deviceType: 'desktop',
      cpu: { name: 'AMD Ryzen 7 7800X3D', source: 'user' },
      gpu: { name: 'NVIDIA GeForce RTX 4080', source: 'user' },
      ram: { gb: 32, source: 'user' },
      storage: { type: 'nvme_ssd', freeGb: 1500, source: 'user' },
      os: { name: 'Windows 11', source: 'user' },
      resolution: { w: 2560, h: 1440, source: 'user' },
    },
    expected: {
      officeRating: 'Good',
      esportsRating: 'Good',
      aaaGamingRating: 'Good',
      videoEditingRating: 'Good',
    },
  },

  // 5. Unknown / Incomplete Specs
  {
    id: 'unknown_incomplete_specs',
    label: 'Incomplete / Unknown Hardware Findings',
    spec: {
      deviceType: 'unknown',
      cpu: { name: 'Unknown', source: 'unknown' },
      gpu: { name: 'Unknown', source: 'unknown' },
      ram: { gb: null, source: 'unknown' },
      storage: { type: 'Unknown', freeGb: null, source: 'unknown' },
      os: { name: 'Unknown', source: 'unknown' },
      resolution: { w: null, h: null, source: 'unknown' },
    },
    expected: {
      officeRating: 'Good', // Base unconstrained, but confidence MUST be low!
      esportsRating: 'Good',
      aaaGamingRating: 'Good',
      videoEditingRating: 'Good',
    },
  },
];

export interface TestRunResult {
  passed: boolean;
  testCaseId: string;
  label: string;
  mismatches: string[];
  report: ReturnType<typeof evaluateSpecAgainstGoals>;
}

/**
 * Runs the pure logic engine against all 5 sample PCs and returns detailed findings.
 */
export function runAllTestCases(): {
  allPassed: boolean;
  results: TestRunResult[];
} {
  const results: TestRunResult[] = [];
  let allPassed = true;

  for (const tc of SAMPLE_PCS) {
    const report = evaluateSpecAgainstGoals(tc.spec, ['office', 'esports_gaming', 'aaa_gaming', 'video_editing']);
    const mismatches: string[] = [];

    const officeEval = report.evaluations.find((e) => e.goalId === 'office');
    const esportsEval = report.evaluations.find((e) => e.goalId === 'esports_gaming');
    const aaaEval = report.evaluations.find((e) => e.goalId === 'aaa_gaming');
    const videoEval = report.evaluations.find((e) => e.goalId === 'video_editing');

    if (officeEval && officeEval.rating !== tc.expected.officeRating) {
      mismatches.push(`Office rating: expected "${tc.expected.officeRating}", got "${officeEval.rating}"`);
    }

    if (esportsEval && esportsEval.rating !== tc.expected.esportsRating) {
      mismatches.push(`Esports rating: expected "${tc.expected.esportsRating}", got "${esportsEval.rating}"`);
    }

    if (aaaEval && aaaEval.rating !== tc.expected.aaaGamingRating) {
      mismatches.push(`AAA gaming rating: expected "${tc.expected.aaaGamingRating}", got "${aaaEval.rating}"`);
    }

    if (videoEval && videoEval.rating !== tc.expected.videoEditingRating) {
      mismatches.push(`Video editing rating: expected "${tc.expected.videoEditingRating}", got "${videoEval.rating}"`);
    }

    // Check unknown confidence for Case 5
    if (tc.id === 'unknown_incomplete_specs') {
      const anyNonLow = report.evaluations.some((e) => e.confidence !== 'low');
      if (anyNonLow) {
        mismatches.push('Incomplete specs test did not lower confidence to "low" across unknown evaluations');
      }
    }

    const passed = mismatches.length === 0;
    if (!passed) allPassed = false;

    results.push({
      passed,
      testCaseId: tc.id,
      label: tc.label,
      mismatches,
      report,
    });
  }

  return { allPassed, results };
}
