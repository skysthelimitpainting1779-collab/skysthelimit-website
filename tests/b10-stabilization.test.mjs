import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

import {
  buildIdempotentLeadId,
  verifyRequiredWebhookSecret,
} from '../src/lib/api/utils.ts';
import { gateStaffAccess } from '../src/lib/auth/portal.ts';
import { DEFAULT_ROUTES } from '../scripts/smoke-site.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('B10 revenue and security stabilization', () => {
  test('derives a stable lead id from the same idempotency key', () => {
    const first = buildIdempotentLeadId('website', 'request-123');
    const retry = buildIdempotentLeadId('website', 'request-123');
    const other = buildIdempotentLeadId('website', 'request-456');

    assert.equal(first, retry);
    assert.notEqual(first, other);
    assert.match(first, /^SKY-WEBSITE-[A-F0-9]{24}$/);
  });

  test('webhook authentication fails closed when its secret is absent', () => {
    assert.deepEqual(verifyRequiredWebhookSecret('', ''), {
      ok: false,
      status: 503,
      error: 'Webhook authentication is not configured.',
    });
    assert.equal(verifyRequiredWebhookSecret('expected', 'wrong').status, 401);
    assert.deepEqual(verifyRequiredWebhookSecret('expected', 'expected'), { ok: true });
  });

  test('lead persistence is required before delivery effects', () => {
    const source = read('src/app/api/leads/route.ts');
    assert.match(source, /await persistCanonicalLead\(lead\)/);
    assert.ok(
      source.indexOf('await persistCanonicalLead(lead)') <
        source.indexOf('Promise.allSettled'),
    );
    assert.match(source, /status: 503/);
  });

  test('ManyChat authenticates and persists before delivery effects', () => {
    const source = read('src/app/api/manychat/route.ts');
    assert.match(source, /verifyRequiredWebhookSecret/);
    assert.match(source, /await persistCanonicalLead\(lead\)/);
    assert.ok(
      source.indexOf('await persistCanonicalLead(lead)') <
        source.indexOf('Promise.allSettled'),
    );
  });

  test('delivery side effects require an atomic outbox claim and provider idempotency keys', () => {
    for (const file of ['src/app/api/leads/route.ts', 'src/app/api/manychat/route.ts']) {
      const source = read(file);
      assert.match(source, /executeLeadDeliveryEffect/);
      assert.match(source, /Idempotency-Key/);
      assert.match(source, /anyClaimed/);
      assert.match(source, /duplicate:\s*true/);
    }
    const migration = read('supabase/migrations/20260727000000_b10_security_stabilization.sql');
    assert.match(migration, /lead_delivery_outbox/);
    assert.match(migration, /claim_lead_delivery\(p_lead_id text,\s*p_effect text\)/i);
    assert.match(migration, /primary key \(lead_id,\s*effect\)/i);
    assert.match(read('src/lib/leads/persistence.ts'), /executeLeadDeliveryEffect/);
  });

  test('private upload contract exposes an opaque id, never a public URL', () => {
    const source = read('src/app/api/storage/upload-url/route.ts');
    assert.match(source, /fileId/);
    assert.doesNotMatch(source, /publicUrl/);
    assert.match(source, /contentType/);
    assert.match(source, /size/);
    assert.match(source, /private_file_intents/);
    const migration = read('supabase/migrations/20260727000000_b10_security_stabilization.sql');
    assert.match(migration, /UPDATE storage\.buckets[\s\S]*public = false/i);
    assert.match(migration, /allowed_mime_types/);
    assert.match(migration, /file_size_limit/);
  });

  test('missing dynamic routes emit explicit noindex metadata', () => {
    for (const file of [
      'src/app/(marketing)/painting-services/[slug]/page.tsx',
      'src/app/(marketing)/service-areas/[slug]/page.tsx',
    ]) {
      const source = read(file);
      assert.match(source, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false/s);
    }
  });

  test('legacy service slugs redirect to canonical landing pages', () => {
    const config = JSON.parse(read('vercel.json'));
    assert.ok(
      config.redirects.some(
        (item) =>
          item.source === '/painting-services/cabinet-refinishing' &&
          item.destination === '/painting-services/cabinet-painting',
      ),
    );
    assert.ok(
      config.redirects.some(
        (item) =>
          item.source === '/painting-services/commercial-repaints' &&
          item.destination === '/painting-services/commercial-painting',
      ),
    );
  });

  test('404 and portal login metadata are non-indexable and portal search params are suspended', () => {
    assert.match(read('src/app/not-found.tsx'), /index:\s*false/);
    assert.match(read('src/app/(protected)/portal/login/page.tsx'), /<Suspense/);
  });

  test('staff surfaces deny anonymous, customer, and disabled identities', () => {
    assert.equal(gateStaffAccess(null).authorized, false);
    assert.equal(
      gateStaffAccess({ id: 'customer', email: 'c@example.com', role: 'customer' }).authorized,
      false,
    );
    assert.equal(
      gateStaffAccess({ id: 'staff', email: 's@example.com', role: 'staff', disabled: true }).authorized,
      false,
    );
    assert.equal(
      gateStaffAccess({ id: 'owner', email: 'o@example.com', role: 'owner' }).authorized,
      true,
    );
    assert.match(read('src/proxy.ts'), /'\/manage\/:path\*'/);
    const migration = read('supabase/migrations/20260727000000_b10_security_stabilization.sql');
    assert.match(migration, /auth\.jwt\(\)[\s\S]*app_metadata[\s\S]*role/);
    assert.doesNotMatch(migration, /TO authenticated USING \(true\) WITH CHECK \(true\)/i);
    assert.match(migration, /Staff read all leads/);
    assert.match(migration, /Staff update leads/);
  });

  test('estimate submissions preserve journey-specific scope', () => {
    const source = read('src/views/Estimate.tsx');
    for (const field of ['roomType', 'width', 'length', 'height', 'stories', 'siding', 'cabinetCount']) {
      assert.match(source, new RegExp(`\\b${field}\\b`));
    }
    assert.doesNotMatch(source, /Light সংকট/);
  });

  test('production smoke covers canonical service journeys and a real 404', () => {
    for (const path of [
      '/painting-services/cabinet-painting',
      '/painting-services/commercial-painting',
      '/service-areas/inver-grove-heights',
    ]) {
      assert.ok(DEFAULT_ROUTES.some((route) => route.path === path));
    }
    assert.ok(
      DEFAULT_ROUTES.some(
        (route) => route.path === '/__smoke_missing_route__' && route.expectedStatus === 404,
      ),
    );
  });
});
