import { SpecObject } from './specData';

export type QuestionField = 'deviceType' | 'cpu' | 'gpu' | 'ram' | 'storage' | 'os' | 'resolution';

export interface QuestionStep {
  id: string;
  field: QuestionField;
  stepNumber: number;
  title: string;
  description: string;
  deviceTypes: Array<'laptop' | 'desktop'>;
  placeholder?: string;
  options?: Array<{ label: string; value: any; subtext?: string }>;
  isAnswered: (spec: SpecObject) => boolean;
}

/**
 * Question flow configurations per device type.
 * Laptops and desktops have distinct diagnostic and questioning tracks.
 */
export const QUESTION_FLOW_CONFIG: QuestionStep[] = [
  // 1. Device Type
  {
    id: 'step_device_type',
    field: 'deviceType',
    stepNumber: 1,
    title: 'Confirm System Form Factor',
    description: 'Tell us if this is a portable laptop or a stationary desktop tower.',
    deviceTypes: ['laptop', 'desktop'],
    options: [
      { label: 'Laptop / Notebook', value: 'laptop', subtext: 'Battery powered, mobile thermal constraints' },
      { label: 'Desktop Tower', value: 'desktop', subtext: 'Wall powered, expandable desktop components' },
    ],
    isAnswered: (spec) => spec.deviceType !== 'unknown',
  },

  // 2. CPU - Laptop
  {
    id: 'step_laptop_cpu',
    field: 'cpu',
    stepNumber: 2,
    title: 'Confirm Laptop Processor (CPU)',
    description: 'Browser detection cannot read mobile CPU model names directly. Confirm your laptop chip.',
    deviceTypes: ['laptop'],
    placeholder: 'e.g. Intel Core i5-1135G7 or Ryzen 5 5600H',
    isAnswered: (spec) => spec.cpu.source === 'user' || (spec.cpu.source === 'detected' && spec.cpu.name !== 'Unknown'),
  },

  // 2. CPU - Desktop
  {
    id: 'step_desktop_cpu',
    field: 'cpu',
    stepNumber: 2,
    title: 'Confirm Desktop Processor (CPU)',
    description: 'Enter or confirm your desktop processor model.',
    deviceTypes: ['desktop'],
    placeholder: 'e.g. AMD Ryzen 5 5600X or Intel Core i7-12700K',
    isAnswered: (spec) => spec.cpu.source === 'user' || (spec.cpu.source === 'detected' && spec.cpu.name !== 'Unknown'),
  },

  // 3. GPU - Laptop
  {
    id: 'step_laptop_gpu',
    field: 'gpu',
    stepNumber: 3,
    title: 'Laptop Graphics Adapter (GPU)',
    description: 'Does your laptop use integrated processor graphics (Intel Iris / AMD Vega) or dedicated GeForce/Radeon?',
    deviceTypes: ['laptop'],
    isAnswered: (spec) => spec.gpu.name !== 'Unknown' && spec.gpu.source !== 'unknown',
  },

  // 3. GPU - Desktop
  {
    id: 'step_desktop_gpu',
    field: 'gpu',
    stepNumber: 3,
    title: 'Desktop Graphics Card (GPU)',
    description: 'Select or confirm the dedicated graphics card installed in your PCIe slot.',
    deviceTypes: ['desktop'],
    isAnswered: (spec) => spec.gpu.name !== 'Unknown' && spec.gpu.source !== 'unknown',
  },

  // 4. RAM
  {
    id: 'step_ram',
    field: 'ram',
    stepNumber: 4,
    title: 'Installed System Memory (RAM)',
    description: 'Browsers cap reported RAM at 8 GB for privacy. Confirm your true physical RAM capacity.',
    deviceTypes: ['laptop', 'desktop'],
    options: [
      { label: '8 GB', value: 8, subtext: 'Entry level / basic multitasking' },
      { label: '16 GB', value: 16, subtext: 'Recommended standard for gaming & modern tasks' },
      { label: '32 GB', value: 32, subtext: 'High capacity for creator workloads & heavy simulation' },
      { label: '64 GB+', value: 64, subtext: 'Enthusiast & workstation tier' },
    ],
    isAnswered: (spec) => spec.ram.source === 'user' || (spec.ram.source === 'detected' && spec.ram.gb !== null && spec.ram.gb > 8),
  },

  // 5. Storage
  {
    id: 'step_storage',
    field: 'storage',
    stepNumber: 5,
    title: 'Primary OS Drive Type',
    description: 'Browsers cannot access hard drive hardware info. Mechanical HDDs are the #1 source of PC sluggishness.',
    deviceTypes: ['laptop', 'desktop'],
    options: [
      { label: 'NVMe SSD', value: 'nvme_ssd', subtext: 'Ultra-fast M.2 solid state drive' },
      { label: 'SATA SSD', value: 'sata_ssd', subtext: 'Fast standard 2.5-inch solid state drive' },
      { label: 'Mechanical HDD', value: 'hdd', subtext: 'Spinning disk platter (common bottleneck)' },
    ],
    isAnswered: (spec) => spec.storage.source === 'user' || (spec.storage.source === 'detected' && spec.storage.type !== 'Unknown'),
  },
];

/**
 * Returns the active question steps for the selected device type,
 * automatically skipping questions that have already been answered or detected with high confidence.
 */
export function getActiveQuestions(
  deviceType: 'laptop' | 'desktop' | 'unknown',
  spec: SpecObject,
  skipAnswered: boolean = true
): QuestionStep[] {
  const targetType = deviceType === 'desktop' ? 'desktop' : 'laptop';
  const steps = QUESTION_FLOW_CONFIG.filter((q) => q.deviceTypes.includes(targetType));

  if (!skipAnswered) return steps;
  return steps.filter((q) => !q.isAnswered(spec));
}
