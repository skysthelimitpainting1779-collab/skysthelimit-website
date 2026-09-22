import type {
  CalculationLine,
  EstimateCalculation,
  EstimateDraft,
  EstimatingSettings,
  MaterialCalculation,
  PriceCandidate,
  PriceResolution,
} from './types';

const cents = (value: number) => Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
const positive = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0);

export const DEFAULT_ESTIMATING_SETTINGS: EstimatingSettings = {
  loadedLaborRate: 42,
  wallProductionRate: 325,
  ceilingProductionRate: 300,
  doorLaborHours: 1.25,
  windowLaborHours: 0.5,
  crewSize: 2,
  crewProductivityMultiplier: 1,
  prepHours: { light: 1, standard: 3, heavy: 6 },
  suppliesCost: 85,
  equipmentCost: 35,
  travelCost: 30,
  fixedOverhead: 75,
  overheadPercent: 0.1,
  contingencyPercent: 0.05,
  targetGrossMargin: 0.4,
  aggressiveMarginIncrement: 0.05,
  roundingIncrement: 25,
  paymentDepositPercent: 0.3,
  paymentProgressPercent: 0.4,
  paymentFinalPercent: 0.3,
};

export function wallArea(length: number, width: number, ceilingHeight: number): number {
  return positive(2 * (positive(length) + positive(width)) * positive(ceilingHeight));
}

export function ceilingArea(length: number, width: number): number {
  return positive(length) * positive(width);
}

export function openingsArea(
  doors: number,
  doorWidth: number,
  doorHeight: number,
  windows: number,
  windowWidth: number,
  windowHeight: number,
): number {
  return positive(doors) * positive(doorWidth) * positive(doorHeight)
    + positive(windows) * positive(windowWidth) * positive(windowHeight);
}

export function paintableWallArea(room: EstimateDraft['room']): number {
  return Math.max(0, wallArea(room.length, room.width, room.ceilingHeight)
    - openingsArea(room.doors, room.doorWidth, room.doorHeight, room.windows, room.windowWidth, room.windowHeight));
}

export function requiredGallons(paintableArea: number, coats: number, coveragePerGallon: number, wastePercent: number): number {
  const coverage = positive(coveragePerGallon);
  if (coverage === 0) return 0;
  return positive(paintableArea) * Math.max(1, positive(coats)) / coverage * (1 + Math.max(0, wastePercent));
}

export function roundPurchaseUnits(required: number, unitSizeGallons: number): number {
  const size = positive(unitSizeGallons);
  if (size === 0) return 0;
  return Math.ceil(positive(required) / size);
}

export function roundPrice(value: number, increment: number): number {
  const safeIncrement = positive(increment);
  if (safeIncrement === 0) return cents(value);
  return Math.round(positive(value) / safeIncrement) * safeIncrement;
}

export function priceForMargin(totalCost: number, margin: number): number {
  const safeMargin = Math.min(0.95, Math.max(0, margin));
  if (safeMargin >= 1) return 0;
  return cents(positive(totalCost) / (1 - safeMargin));
}

export function resolvePrice({
  live,
  cached,
  contractor,
  manual,
  manualOverride,
}: {
  live?: PriceCandidate;
  cached?: PriceCandidate;
  contractor?: PriceCandidate;
  manual?: PriceCandidate;
  manualOverride?: PriceCandidate;
}): PriceResolution {
  if (manualOverride) return { selected: manualOverride, reason: 'manual_override' };
  if (live) return { selected: live, reason: 'channel3' };
  if (cached) return { selected: cached, reason: 'cache' };
  if (contractor) return { selected: contractor, reason: 'contractor' };
  if (manual) return { selected: manual, reason: 'manual' };
  return { reason: 'unavailable' };
}

export function calculateEstimate(estimate: EstimateDraft): EstimateCalculation {
  const { room, settings } = estimate;
  const walls = wallArea(room.length, room.width, room.ceilingHeight);
  const ceiling = ceilingArea(room.length, room.width);
  const floor = ceiling;
  const openings = openingsArea(room.doors, room.doorWidth, room.doorHeight, room.windows, room.windowWidth, room.windowHeight);
  const paintableWalls = Math.max(0, walls - openings);

  const materialCalculations: MaterialCalculation[] = estimate.materials.map((material) => {
    const gallons = requiredGallons(paintableWalls, material.coats, material.coveragePerGallon, material.wastePercent);
    const units = roundPurchaseUnits(gallons, material.unitSizeGallons);
    return {
      materialId: material.id,
      name: material.name,
      paintableArea: paintableWalls,
      requiredGallons: cents(gallons),
      purchaseUnits: units,
      unitCost: cents(material.unitPrice),
      materialCost: cents(units * material.unitPrice),
      priceSource: material.priceSource,
    };
  });

  const materialCost = cents(materialCalculations.reduce((sum, material) => sum + material.materialCost, 0));
  const wallLaborHours = paintableWalls / Math.max(1, settings.wallProductionRate);
  const openingLaborHours = room.doors * settings.doorLaborHours + room.windows * settings.windowLaborHours;
  const prepLaborHours = settings.prepHours[estimate.prepLevel] ?? 0;
  const totalLaborHours = cents(wallLaborHours + openingLaborHours + prepLaborHours);
  const crewDurationHours = cents(totalLaborHours / Math.max(1, settings.crewSize * settings.crewProductivityMultiplier));
  const laborCost = cents(totalLaborHours * settings.loadedLaborRate);
  const suppliesAndEquipmentCost = cents(settings.suppliesCost + settings.equipmentCost + settings.travelCost);
  const directCost = cents(materialCost + laborCost + suppliesAndEquipmentCost);
  const overheadCost = cents(settings.fixedOverhead + directCost * settings.overheadPercent);
  const contingencyCost = cents((directCost + overheadCost) * settings.contingencyPercent);
  const totalCost = cents(directCost + overheadCost + contingencyCost);
  const minimumPrice = roundPrice(totalCost, settings.roundingIncrement);
  const rawRecommendedPrice = priceForMargin(totalCost, settings.targetGrossMargin);
  const recommendedPrice = roundPrice(rawRecommendedPrice, settings.roundingIncrement);
  const aggressiveMargin = Math.min(0.9, settings.targetGrossMargin + settings.aggressiveMarginIncrement);
  const aggressivePrice = roundPrice(priceForMargin(totalCost, aggressiveMargin), settings.roundingIncrement);
  const grossProfit = cents(recommendedPrice - totalCost);
  const grossMargin = recommendedPrice > 0 ? grossProfit / recommendedPrice : 0;
  const markup = totalCost > 0 ? grossProfit / totalCost : 0;

  const audit: CalculationLine[] = [
    { label: 'Wall area', expression: '2 × (length + width) × ceiling height', value: walls, unit: 'area' },
    { label: 'Openings deducted', expression: 'doors + windows', value: openings, unit: 'area' },
    { label: 'Paintable wall area', expression: 'wall area − openings', value: paintableWalls, unit: 'area' },
    { label: 'Material cost', expression: 'purchase units × unit cost', value: materialCost, unit: 'currency' },
    { label: 'Labor hours', expression: 'surface ÷ production rate + openings + prep', value: totalLaborHours, unit: 'hours' },
    { label: 'Labor cost', expression: 'labor hours × loaded labor rate', value: laborCost, unit: 'currency' },
    { label: 'Direct cost', expression: 'materials + labor + supplies/equipment', value: directCost, unit: 'currency' },
    { label: 'Overhead', expression: 'fixed overhead + direct cost × overhead %', value: overheadCost, unit: 'currency' },
    { label: 'Contingency', expression: '(direct cost + overhead) × contingency %', value: contingencyCost, unit: 'currency' },
    { label: 'Recommended price', expression: 'total cost ÷ (1 − target gross margin)', value: recommendedPrice, unit: 'currency' },
  ];

  return {
    wallArea: walls,
    ceilingArea: ceiling,
    floorArea: floor,
    openingsArea: openings,
    paintableWallArea: paintableWalls,
    materialCalculations,
    materialCost,
    wallLaborHours: cents(wallLaborHours),
    openingLaborHours: cents(openingLaborHours),
    prepLaborHours,
    totalLaborHours,
    crewDurationHours,
    laborCost,
    suppliesAndEquipmentCost,
    directCost,
    overheadCost,
    contingencyCost,
    totalCost,
    minimumPrice,
    recommendedPrice,
    aggressivePrice,
    grossProfit,
    grossMargin,
    markup,
    audit,
  };
}
