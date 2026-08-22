import 'server-only';

import { channel3Service, type Channel3ProductSummary } from '@/lib/channel3/service';
import { resolvePrice } from './calculations';
import type { PriceCandidate, PriceResolution } from './types';

const CACHE_TTL_MS = 30 * 60 * 1000;
const runtimePriceCache = new Map<string, PriceCandidate>();

function cacheKey(query: string): string {
  return query.trim().toLowerCase().replaceAll(/\s+/g, ' ');
}

function isCurrent(candidate: PriceCandidate): boolean {
  return !candidate.expiresAt || new Date(candidate.expiresAt).getTime() > Date.now();
}

function asLiveCandidate(product: Channel3ProductSummary): PriceCandidate | undefined {
  if (!product.lowestOffer) return undefined;
  const retrievedAt = new Date().toISOString();
  return {
    price: product.lowestOffer.price,
    source: 'channel3',
    supplier: product.lowestOffer.domain,
    product: product.title,
    retrievedAt,
    expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
  };
}

export type MaterialPriceResolution = {
  products: Channel3ProductSummary[];
  resolution: PriceResolution;
  livePricingError?: string;
};

export async function resolveMaterialPrice({
  query,
  cached,
  contractor,
  manual,
  manualOverride,
  productId,
}: {
  query: string;
  cached?: PriceCandidate;
  contractor?: PriceCandidate;
  manual?: PriceCandidate;
  manualOverride?: PriceCandidate;
  productId?: string;
}): Promise<MaterialPriceResolution> {
  const normalizedQuery = cacheKey(query);
  const currentCache = cached && isCurrent(cached) ? cached : runtimePriceCache.get(normalizedQuery);

  try {
    // A broad catalog search only proposes candidates. A live price is applied
    // only after the contractor explicitly selects a Channel3 product ID.
    const selectedProduct = productId ? await channel3Service.getProduct(productId) : undefined;
    const products = selectedProduct ? [selectedProduct] : await channel3Service.searchProducts(query, 6);
    const live = selectedProduct ? asLiveCandidate(selectedProduct) : undefined;
    if (live) {
      runtimePriceCache.set(normalizedQuery, live);
    }
    return {
      products,
      resolution: resolvePrice({ live, cached: currentCache, contractor, manual, manualOverride }),
    };
  } catch (error) {
    return {
      products: [],
      resolution: resolvePrice({ cached: currentCache, contractor, manual, manualOverride }),
      livePricingError: 'Live material pricing is unavailable. Use a cached, saved contractor, or manual price.',
    };
  }
}
