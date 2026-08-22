import { DEFAULT_ESTIMATING_SETTINGS } from './calculations';
import type { EstimateDraft, EstimatorWorkspace, MaterialSelection } from './types';

export const ESTIMATOR_STORAGE_KEY = 'skys-the-limit-estimator-v1';

export function createId(prefix: string): string {
  const suffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${suffix}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function defaultMaterials(): MaterialSelection[] {
  return [
    {
      id: createId('material'),
      name: 'Interior Wall Paint',
      manufacturer: 'Contractor default',
      finish: 'Eggshell',
      coveragePerGallon: 375,
      coats: 2,
      wastePercent: 0.05,
      unitSizeGallons: 1,
      unitPrice: 42.99,
      priceSource: 'manual',
      supplier: 'Set a supplier',
      manualPriceNotes: 'Configurable starter value; replace with a live, saved, or manual supplier price before issuing a proposal.',
    },
    {
      id: createId('material'),
      name: 'Primer',
      manufacturer: 'Contractor default',
      finish: 'Flat',
      coveragePerGallon: 350,
      coats: 1,
      wastePercent: 0.05,
      unitSizeGallons: 1,
      unitPrice: 31.99,
      priceSource: 'manual',
      supplier: 'Set a supplier',
      manualPriceNotes: 'Configurable starter value.',
    },
  ];
}

export function createDraftEstimate(): EstimateDraft {
  const timestamp = nowIso();
  return {
    id: createId('estimate'),
    customerName: '',
    jobName: 'New interior estimate',
    projectKind: 'interior',
    propertyKind: 'residential',
    prepLevel: 'standard',
    room: {
      name: 'Bedroom',
      length: 10,
      width: 12,
      ceilingHeight: 8,
      doors: 1,
      doorWidth: 3,
      doorHeight: 7,
      windows: 1,
      windowWidth: 3,
      windowHeight: 4,
    },
    materials: defaultMaterials(),
    settings: { ...DEFAULT_ESTIMATING_SETTINGS, prepHours: { ...DEFAULT_ESTIMATING_SETTINGS.prepHours } },
    status: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createEmptyWorkspace(): EstimatorWorkspace {
  return {
    customers: [],
    estimates: [],
    jobs: [],
    invoices: [],
    priceCache: {},
    contractorPrices: {},
    settings: { ...DEFAULT_ESTIMATING_SETTINGS, prepHours: { ...DEFAULT_ESTIMATING_SETTINGS.prepHours } },
  };
}
