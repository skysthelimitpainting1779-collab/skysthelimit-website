import type { EstimatorWorkspace } from './types';
import { createEmptyWorkspace, ESTIMATOR_STORAGE_KEY } from './seed';

function hasWorkspaceShape(value: unknown): value is Partial<EstimatorWorkspace> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function loadEstimatorWorkspace(): EstimatorWorkspace {
  if (typeof window === 'undefined') return createEmptyWorkspace();

  try {
    const raw = window.localStorage.getItem(ESTIMATOR_STORAGE_KEY);
    if (!raw) return createEmptyWorkspace();
    const parsed = JSON.parse(raw) as unknown;
    if (!hasWorkspaceShape(parsed)) return createEmptyWorkspace();

    const fallback = createEmptyWorkspace();
    return {
      customers: Array.isArray(parsed.customers) ? parsed.customers : fallback.customers,
      estimates: Array.isArray(parsed.estimates) ? parsed.estimates : fallback.estimates,
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : fallback.jobs,
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : fallback.invoices,
      priceCache: parsed.priceCache && typeof parsed.priceCache === 'object' ? parsed.priceCache : fallback.priceCache,
      contractorPrices: parsed.contractorPrices && typeof parsed.contractorPrices === 'object' ? parsed.contractorPrices : fallback.contractorPrices,
      settings: parsed.settings && typeof parsed.settings === 'object'
        ? { ...fallback.settings, ...parsed.settings, prepHours: { ...fallback.settings.prepHours, ...(parsed.settings as EstimatorWorkspace['settings']).prepHours } }
        : fallback.settings,
    };
  } catch {
    return createEmptyWorkspace();
  }
}

export function saveEstimatorWorkspace(workspace: EstimatorWorkspace): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ESTIMATOR_STORAGE_KEY, JSON.stringify(workspace));
}

export function clearEstimatorWorkspace(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ESTIMATOR_STORAGE_KEY);
}
