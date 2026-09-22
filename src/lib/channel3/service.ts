import 'server-only';

import { Channel3 } from '@channel3/sdk';
import {
  normalizeProduct,
  type Channel3OfferSummary,
  type Channel3Product,
  type Channel3ProductSummary,
} from './normalizers';

export type { Channel3OfferSummary, Channel3Product, Channel3ProductSummary } from './normalizers';
export { normalizeProduct, selectLowestInStockOffer } from './normalizers';

export type Channel3Price = {
  productId: string;
  title: string;
  offer: Channel3OfferSummary;
  retrievedAt: string;
};

export class Channel3ConfigurationError extends Error {
  constructor() {
    super('CHANNEL3_API_KEY is not configured.');
    this.name = 'Channel3ConfigurationError';
  }
}

function createClient() {
  const apiKey = process.env.CHANNEL3_API_KEY;
  if (!apiKey) {
    throw new Channel3ConfigurationError();
  }

  return new Channel3({
    apiKey,
    country: 'US',
    currency: 'USD',
  });
}

export async function searchProducts(query: string, limit = 6): Promise<Channel3ProductSummary[]> {
  const client = createClient();
  const page = await client.products.search({
    query,
    limit,
    config: {
      country: 'US',
      currency: 'USD',
    },
  });

  return page.data.map((product) => normalizeProduct(product as Channel3Product));
}

export async function getProduct(productId: string): Promise<Channel3ProductSummary> {
  const client = createClient();
  const product = await client.products.retrieve({
    product_id: productId,
    country: 'US',
    currency: 'USD',
  });

  return normalizeProduct(product as Channel3Product);
}

export async function getPrice(productId: string): Promise<Channel3Price | undefined> {
  const product = await getProduct(productId);
  if (!product.lowestOffer) {
    return undefined;
  }

  return {
    productId: product.id,
    title: product.title,
    offer: product.lowestOffer,
    retrievedAt: new Date().toISOString(),
  };
}

export const channel3Service = {
  searchProducts,
  getProduct,
  getPrice,
};
