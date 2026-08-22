import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  DEFAULT_ESTIMATING_SETTINGS,
  calculateEstimate,
  priceForMargin,
  requiredGallons,
  resolvePrice,
  roundPurchaseUnits,
  wallArea,
} from '../src/lib/estimating/calculations.ts';

describe('estimating calculations', () => {
  test('calculates 10 × 12 room wall and ceiling area correctly', () => {
    assert.equal(wallArea(10, 12, 8), 352);
  });

  test('deducts doors and windows from paintable wall area', () => {
    const calculation = calculateEstimate({
      id: 'estimate-1',
      customerName: 'Test Customer',
      jobName: 'Bedroom',
      projectKind: 'interior',
      propertyKind: 'residential',
      prepLevel: 'standard',
      room: { name: 'Bedroom', length: 10, width: 12, ceilingHeight: 8, doors: 1, doorWidth: 3, doorHeight: 7, windows: 2, windowWidth: 3, windowHeight: 4 },
      materials: [],
      settings: DEFAULT_ESTIMATING_SETTINGS,
      status: 'draft',
      createdAt: '2026-08-22T00:00:00.000Z',
      updatedAt: '2026-08-22T00:00:00.000Z',
    });

    assert.equal(calculation.wallArea, 352);
    assert.equal(calculation.ceilingArea, 120);
    assert.equal(calculation.openingsArea, 45);
    assert.equal(calculation.paintableWallArea, 307);
  });

  test('calculates paint quantity with coats, waste, and upward purchasing round', () => {
    const gallons = requiredGallons(2750, 2, 350, 0.05);
    assert.equal(Number(gallons.toFixed(2)), 16.5);
    assert.equal(roundPurchaseUnits(gallons, 1), 17);
  });

  test('calculates material cost from purchased units and unit price', () => {
    const calculation = calculateEstimate({
      id: 'estimate-2',
      customerName: 'Test Customer',
      jobName: 'Paint material',
      projectKind: 'interior',
      propertyKind: 'residential',
      prepLevel: 'light',
      room: { name: 'Room', length: 10, width: 12, ceilingHeight: 8, doors: 0, doorWidth: 3, doorHeight: 7, windows: 0, windowWidth: 3, windowHeight: 4 },
      materials: [{ id: 'paint', name: 'Paint', coveragePerGallon: 100, coats: 2, wastePercent: 0, unitSizeGallons: 1, unitPrice: 42.99, priceSource: 'manual' }],
      settings: DEFAULT_ESTIMATING_SETTINGS,
      status: 'draft',
      createdAt: '2026-08-22T00:00:00.000Z',
      updatedAt: '2026-08-22T00:00:00.000Z',
    });

    assert.equal(calculation.materialCalculations[0].purchaseUnits, 8);
    assert.equal(calculation.materialCost, 343.92);
  });

  test('uses the mathematically correct gross-margin formula', () => {
    assert.equal(priceForMargin(2000, 0.4), 3333.33);
  });

  test('falls back to cached, contractor, and manual prices when live pricing is unavailable', () => {
    const cached = { price: 42.99, source: 'cache', retrievedAt: '2026-08-20T00:00:00.000Z' };
    const contractor = { price: 44.5, source: 'contractor' };
    const manual = { price: 46, source: 'manual', enteredBy: 'Anthony' };

    assert.equal(resolvePrice({ cached, contractor, manual }).reason, 'cache');
    assert.equal(resolvePrice({ contractor, manual }).reason, 'contractor');
    assert.equal(resolvePrice({ manual }).reason, 'manual');
    assert.equal(resolvePrice({ manual, manualOverride: manual }).reason, 'manual_override');
  });
});
