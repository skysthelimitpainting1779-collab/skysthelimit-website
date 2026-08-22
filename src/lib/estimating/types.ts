export type ProjectKind = 'interior' | 'exterior' | 'cabinets';
export type PropertyKind = 'residential' | 'commercial';
export type PrepLevel = 'light' | 'standard' | 'heavy';
export type PriceSource = 'channel3' | 'cache' | 'contractor' | 'manual';
export type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'revised';
export type JobStatus = 'accepted' | 'deposit_requested' | 'deposit_paid' | 'in_progress' | 'final_invoice' | 'paid' | 'closed';

export type Customer = {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type RoomMeasurement = {
  name: string;
  length: number;
  width: number;
  ceilingHeight: number;
  doors: number;
  doorWidth: number;
  doorHeight: number;
  windows: number;
  windowWidth: number;
  windowHeight: number;
};

export type MaterialSelection = {
  id: string;
  name: string;
  manufacturer?: string;
  sku?: string;
  finish?: string;
  coveragePerGallon: number;
  coats: number;
  wastePercent: number;
  unitSizeGallons: number;
  unitPrice: number;
  priceSource: PriceSource;
  supplier?: string;
  priceUpdatedAt?: string;
  manualPriceNotes?: string;
};

export type EstimatingSettings = {
  loadedLaborRate: number;
  wallProductionRate: number;
  ceilingProductionRate: number;
  doorLaborHours: number;
  windowLaborHours: number;
  crewSize: number;
  crewProductivityMultiplier: number;
  prepHours: Record<PrepLevel, number>;
  suppliesCost: number;
  equipmentCost: number;
  travelCost: number;
  fixedOverhead: number;
  overheadPercent: number;
  contingencyPercent: number;
  targetGrossMargin: number;
  aggressiveMarginIncrement: number;
  roundingIncrement: number;
  paymentDepositPercent: number;
  paymentProgressPercent: number;
  paymentFinalPercent: number;
};

export type EstimateDraft = {
  id: string;
  customerId?: string;
  customerName: string;
  jobName: string;
  propertyAddress?: string;
  projectKind: ProjectKind;
  propertyKind: PropertyKind;
  prepLevel: PrepLevel;
  room: RoomMeasurement;
  materials: MaterialSelection[];
  settings: EstimatingSettings;
  status: EstimateStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CalculationLine = {
  label: string;
  expression: string;
  value: number;
  unit: 'currency' | 'hours' | 'area' | 'quantity' | 'percent';
};

export type MaterialCalculation = {
  materialId: string;
  name: string;
  paintableArea: number;
  requiredGallons: number;
  purchaseUnits: number;
  unitCost: number;
  materialCost: number;
  priceSource: PriceSource;
};

export type EstimateCalculation = {
  wallArea: number;
  ceilingArea: number;
  floorArea: number;
  openingsArea: number;
  paintableWallArea: number;
  materialCalculations: MaterialCalculation[];
  materialCost: number;
  wallLaborHours: number;
  openingLaborHours: number;
  prepLaborHours: number;
  totalLaborHours: number;
  crewDurationHours: number;
  laborCost: number;
  suppliesAndEquipmentCost: number;
  directCost: number;
  overheadCost: number;
  contingencyCost: number;
  totalCost: number;
  minimumPrice: number;
  recommendedPrice: number;
  aggressivePrice: number;
  grossProfit: number;
  grossMargin: number;
  markup: number;
  audit: CalculationLine[];
};

export type PriceCandidate = {
  price: number;
  source: PriceSource;
  supplier?: string;
  product?: string;
  retrievedAt?: string;
  expiresAt?: string;
  enteredBy?: string;
  notes?: string;
};

export type PriceResolution = {
  selected?: PriceCandidate;
  reason: 'manual_override' | 'channel3' | 'cache' | 'contractor' | 'manual' | 'unavailable';
};

export type Job = {
  id: string;
  estimateId: string;
  customerId?: string;
  name: string;
  status: JobStatus;
  acceptedPrice: number;
  estimatedCost: number;
  actualLaborHours?: number;
  actualMaterialCost?: number;
  actualOtherCost?: number;
  createdAt: string;
  updatedAt: string;
};

export type Invoice = {
  id: string;
  jobId: string;
  status: 'draft' | 'sent' | 'paid';
  amount: number;
  dueDate?: string;
  createdAt: string;
};

export type EstimatorWorkspace = {
  customers: Customer[];
  estimates: EstimateDraft[];
  jobs: Job[];
  invoices: Invoice[];
  priceCache: Record<string, PriceCandidate>;
  contractorPrices: Record<string, PriceCandidate>;
  settings: EstimatingSettings;
};
