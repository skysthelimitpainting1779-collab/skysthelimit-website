import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

import { getEnv, ENV } from '../src/lib/env.ts';
import { businessEmail, businessPhone, phoneHref, buildEstimateMailto } from '../src/lib/contact.ts';
import { serviceSchema, breadcrumbSchema, localBusinessSchema } from '../src/lib/seo.ts';

// ---------------------------------------------------------------------------
// ENV module tests
// ---------------------------------------------------------------------------
describe('lib/env - Environment variable loading', () => {

  test('ENV object exports expected keys', () => {
    assert.ok('SITE_URL' in ENV);
    assert.ok('FORMSPREE_FORM_ID' in ENV);
    assert.ok('GOOGLE_BUSINESS_URL' in ENV);
  });

  test('getEnv returns correct value from process.env', () => {
    process.env.TEST_LIB_ENV_KEY = 'test-value';
    assert.equal(getEnv('TEST_LIB_ENV_KEY'), 'test-value');
    delete process.env.TEST_LIB_ENV_KEY;
  });

  test('getEnv falls back to NEXT_PUBLIC_ prefix', () => {
    process.env.NEXT_PUBLIC_SOME_KEY = 'next-value';
    assert.equal(getEnv('SOME_KEY'), 'next-value');
    delete process.env.NEXT_PUBLIC_SOME_KEY;
  });

  test('getEnv returns undefined when key is not set', () => {
    assert.equal(getEnv('NONEXISTENT_KEY_12345'), undefined);
  });
});

// ---------------------------------------------------------------------------
// Contact module tests
// ---------------------------------------------------------------------------
describe('lib/contact - Contact utilities', () => {

  test('businessEmail matches expected value', () => {
    assert.equal(businessEmail, 'skysthelimitpainting1779@gmail.com');
  });

  test('businessPhone matches expected value', () => {
    assert.equal(businessPhone, '651-410-4196');
  });

  test('phoneHref is the canonical E.164 tel: href (#284)', () => {
    assert.equal(phoneHref, 'tel:+16514104196');
    assert.ok(/^tel:\+\d+$/.test(phoneHref), 'phoneHref should be tel: + E.164 digits');
  });

  test('buildEstimateMailto generates valid mailto link', () => {
    const result = buildEstimateMailto({ Name: 'Jane Doe', Phone: '555-1234' });
    assert.ok(result.startsWith('mailto:skysthelimitpainting1779@gmail.com'));
    assert.ok(result.includes('subject='));
    assert.ok(result.includes('body='));
  });

  test('buildEstimateMailto encodes body with field labels', () => {
    const result = buildEstimateMailto({ Name: 'Alice', City: 'Eagan' });
    const bodyPart = result.match(/body=(.*)$/);
    assert.ok(bodyPart, 'should include body parameter');
    const decoded = decodeURIComponent(bodyPart[1]);
    assert.ok(decoded.includes('Name: Alice'));
    assert.ok(decoded.includes('City: Eagan'));
  });

  test('buildEstimateMailto filters empty fields', () => {
    const result = buildEstimateMailto({ Name: 'Bob', Empty: '   ', Phone: '555' });
    const bodyPart = result.match(/body=(.*)$/);
    const decoded = decodeURIComponent(bodyPart[1]);
    assert.ok(decoded.includes('Name: Bob'));
    assert.ok(decoded.includes('Phone: 555'));
    assert.ok(!decoded.includes('Empty'), 'blank values should be filtered');
  });
});

// ---------------------------------------------------------------------------
// SEO module tests
// ---------------------------------------------------------------------------
describe('lib/seo - Schema.org JSON-LD generation', () => {

  test('serviceSchema returns valid Service schema', () => {
    const result = serviceSchema('Interior Painting', 'Professional interior painting', '/painting-services/interior-painting');
    assert.equal(result['@context'], 'https://schema.org');
    assert.equal(result['@type'], 'Service');
    assert.equal(result.name, 'Interior Painting');
    assert.equal(result.description, 'Professional interior painting');
    assert.equal(result.areaServed, 'Minnesota');
    assert.ok(result.url.endsWith('/painting-services/interior-painting'));
  });

  test('breadcrumbSchema returns valid BreadcrumbList', () => {
    const items = [
      { name: 'Home', path: '/' },
      { name: 'Services', path: '/painting-services' },
      { name: 'Interior', path: '/painting-services/interior-painting' },
    ];
    const result = breadcrumbSchema(items);
    assert.equal(result['@context'], 'https://schema.org');
    assert.equal(result['@type'], 'BreadcrumbList');
    assert.equal(result.itemListElement.length, 3);
  });

  test('breadcrumbSchema items have correct type and absolute URLs', () => {
    const items = [{ name: 'Home', path: '/' }];
    const result = breadcrumbSchema(items);
    const first = result.itemListElement[0];
    assert.equal(first['@type'], 'ListItem');
    assert.equal(first.name, 'Home');
    assert.ok(first.item.startsWith('https://'), 'item URL should be absolute');
  });

  test('localBusinessSchema returns valid schema for a city', () => {
    const result = localBusinessSchema('Eagan', 'eagan');
    assert.equal(result['@context'], 'https://schema.org');
    assert.equal(result['@type'], 'HousePainter');
    assert.ok(result.name.includes('Eagan'));
    assert.ok(result.name.includes("Sky's the Limit Painting LLC"));
    assert.ok(result.url.includes('/service-areas/eagan'));
  });
});
