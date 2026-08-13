export const ESTIMATE_MODEL_VERSION = '2026-07-29';

export type PrepLevel = 'standard' | 'premium';
export type EstimateProjectType = 'interior' | 'exterior' | 'cabinets';
export type ExteriorStories = '1 Story' | '2 Story' | '3+ Story';
export type ExteriorSiding =
  | 'Wood / LP SmartSide'
  | 'Stucco'
  | 'Vinyl / Aluminum'
  | 'Brick / Masonry';

type InteriorEstimateInput = {
  projectType: 'interior';
  prepLevel: PrepLevel;
  width: number;
  length: number;
  height: number;
  roomType?: string;
};

type ExteriorEstimateInput = {
  projectType: 'exterior';
  prepLevel: PrepLevel;
  stories: ExteriorStories;
  siding: ExteriorSiding;
};

type CabinetEstimateInput = {
  projectType: 'cabinets';
  prepLevel: PrepLevel;
  cabinetCount: number;
};

export type EstimateInput =
  | InteriorEstimateInput
  | ExteriorEstimateInput
  | CabinetEstimateInput;

export type EstimateRange = {
  currency: 'USD';
  high: number;
  low: number;
  modelVersion: typeof ESTIMATE_MODEL_VERSION;
};

export type EstimateIdempotencyState = {
  fingerprint: string;
  key: string;
};

function boundedNumber(
  name: string,
  value: number,
  minimum: number,
  maximum: number,
) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(
      `${name} must be a finite number from ${minimum} to ${maximum}.`,
    );
  }
  return value;
}

function roundToHundred(value: number) {
  return Math.round((value + 1e-7) / 100) * 100;
}

function allowedValue<const T extends string>(
  name: string,
  value: unknown,
  allowed: readonly T[],
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new RangeError(`${name} must be one of: ${allowed.join(', ')}.`);
  }
  return value as T;
}

export function calculateEstimate(input: EstimateInput): EstimateRange {
  const projectType = allowedValue('project type', input.projectType, [
    'interior',
    'exterior',
    'cabinets',
  ]);
  const prepLevel = allowedValue('prep level', input.prepLevel, [
    'standard',
    'premium',
  ]);
  let low: number;
  let high: number;

  if (projectType === 'interior' && input.projectType === 'interior') {
    const width = boundedNumber('width', input.width, 5, 40);
    const length = boundedNumber('length', input.length, 5, 40);
    const height = boundedNumber('height', input.height, 7, 20);
    const wallArea = 2 * (width + length) * height;
    const base = wallArea * 3.5;
    const total = base * (prepLevel === 'premium' ? 1.35 : 1) + 250;
    low = total * 0.9;
    high = total * 1.15;
  } else if (projectType === 'exterior' && input.projectType === 'exterior') {
    const baseByStories: Record<ExteriorStories, number> = {
      '1 Story': 3500,
      '2 Story': 5500,
      '3+ Story': 8500,
    };
    const multiplierBySiding: Record<ExteriorSiding, number> = {
      'Wood / LP SmartSide': 1,
      Stucco: 1.3,
      'Vinyl / Aluminum': 1,
      'Brick / Masonry': 1.4,
    };
    const stories = allowedValue(
      'stories',
      input.stories,
      Object.keys(baseByStories) as ExteriorStories[],
    );
    const siding = allowedValue(
      'siding',
      input.siding,
      Object.keys(multiplierBySiding) as ExteriorSiding[],
    );
    const total =
      baseByStories[stories] *
      multiplierBySiding[siding] *
      (prepLevel === 'premium' ? 1.3 : 1);
    low = total * 0.85;
    high = total * 1.2;
  } else if (projectType === 'cabinets' && input.projectType === 'cabinets') {
    const count = boundedNumber(
      'cabinet count',
      input.cabinetCount,
      5,
      60,
    );
    const total = count * (prepLevel === 'premium' ? 150 : 115);
    low = total * 0.9;
    high = total * 1.15;
  } else {
    throw new RangeError('project type does not match the estimate payload.');
  }

  return {
    currency: 'USD',
    high: roundToHundred(high),
    low: roundToHundred(low),
    modelVersion: ESTIMATE_MODEL_VERSION,
  };
}

export function selectEstimateIdempotency(
  previous: EstimateIdempotencyState | null,
  fingerprint: string,
  createKey: () => string,
): EstimateIdempotencyState {
  if (previous?.fingerprint === fingerprint) return previous;
  return { fingerprint, key: createKey() };
}

export function formatEstimateRange(range: EstimateRange) {
  const formatter = new Intl.NumberFormat('en-US', {
    currency: range.currency,
    maximumFractionDigits: 0,
    style: 'currency',
  });
  return `${formatter.format(range.low)} - ${formatter.format(range.high)}`;
}

export function buildEstimateLeadFields(
  input: EstimateInput,
  range: EstimateRange,
) {
  const details = [
    `Model: ${range.modelVersion}`,
    `Project: ${input.projectType}`,
    `Prep: ${input.prepLevel}`,
  ];

  if (input.projectType === 'interior') {
    details.push(
      `Room: ${input.roomType || 'Other'}`,
      `Dimensions: ${input.width}x${input.length}x${input.height} ft`,
    );
  } else if (input.projectType === 'exterior') {
    details.push(`Stories: ${input.stories}`, `Siding: ${input.siding}`);
  } else {
    details.push(`Cabinet doors/drawers: ${input.cabinetCount}`);
  }

  return {
    budget: formatEstimateRange(range),
    notes: details.join('\n'),
  };
}
