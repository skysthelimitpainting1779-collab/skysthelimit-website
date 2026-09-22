import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { normalizeProduct, selectLowestInStockOffer } from '../src/lib/channel3/normalizers.ts';

describe('Channel3 pricing service', () => {
  test('selectLowestInStockOffer ignores unavailable offers and returns the lowest live price', () => {
    const selected = selectLowestInStockOffer([
      { domain: 'unavailable.example', url: 'https://unavailable.example/item', price: 10, currency: 'USD', availability: 'OutOfStock' },
      { domain: 'high.example', url: 'https://high.example/item', price: 48.99, currency: 'USD', availability: 'InStock' },
      { domain: 'low.example', url: 'https://low.example/item', price: 42.99, currency: 'USD', availability: 'InStock' },
    ]);

    assert.equal(selected?.domain, 'low.example');
    assert.equal(selected?.price, 42.99);
  });

  test('normalizeProduct retains current offers and exposes a usable lowest in-stock offer', () => {
    const product = normalizeProduct({
      id: 'paint-123',
      title: 'Interior Wall Paint',
      brands: [{ name: 'Example Paint' }],
      images: [{ url: 'https://images.example/paint.jpg', cleaned_url: 'https://images.example/paint-clean.jpg', is_main_image: true }],
      offers: [
        {
          domain: 'merchant.example',
          url: 'https://merchant.example/paint',
          price: { price: 42.99, currency: 'USD', compare_at_price: 47.99 },
          availability: 'InStock',
        },
      ],
    });

    assert.equal(product.id, 'paint-123');
    assert.equal(product.brand, 'Example Paint');
    assert.equal(product.imageUrl, 'https://images.example/paint-clean.jpg');
    assert.equal(product.lowestOffer?.price, 42.99);
    assert.equal(product.lowestOffer?.compareAtPrice, 47.99);
  });
});
