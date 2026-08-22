export type Channel3OfferSummary = {
  domain: string;
  url: string;
  price: number;
  currency: string;
  compareAtPrice?: number;
  availability: 'InStock' | 'OutOfStock';
};

export type Channel3ProductSummary = {
  id: string;
  title: string;
  brand?: string;
  imageUrl?: string;
  offers: Channel3OfferSummary[];
  lowestOffer?: Channel3OfferSummary;
};

export type Channel3Product = {
  id: string;
  title: string;
  brands?: Array<{ name: string }>;
  images?: Array<{ url: string; cleaned_url?: string | null; is_main_image?: boolean | null }>;
  offers?: Array<{
    domain: string;
    url: string;
    price: {
      price: number;
      currency: string;
      compare_at_price?: number | null;
    };
    availability: 'InStock' | 'OutOfStock';
  }>;
};

function normalizeOffer(offer: NonNullable<Channel3Product['offers']>[number]): Channel3OfferSummary {
  return {
    domain: offer.domain,
    url: offer.url,
    price: offer.price.price,
    currency: offer.price.currency,
    ...(offer.price.compare_at_price == null ? {} : { compareAtPrice: offer.price.compare_at_price }),
    availability: offer.availability,
  };
}

export function selectLowestInStockOffer(offers: Channel3OfferSummary[]): Channel3OfferSummary | undefined {
  return offers
    .filter((offer) => offer.availability === 'InStock')
    .sort((left, right) => left.price - right.price)[0];
}

export function normalizeProduct(product: Channel3Product): Channel3ProductSummary {
  const offers = (product.offers ?? []).map(normalizeOffer);
  const primaryImage = product.images?.find((image) => image.is_main_image) ?? product.images?.[0];
  const lowestOffer = selectLowestInStockOffer(offers);

  return {
    id: product.id,
    title: product.title,
    ...(product.brands?.[0]?.name ? { brand: product.brands[0].name } : {}),
    ...(primaryImage?.cleaned_url || primaryImage?.url ? { imageUrl: primaryImage.cleaned_url ?? primaryImage.url } : {}),
    offers,
    ...(lowestOffer ? { lowestOffer } : {}),
  };
}
