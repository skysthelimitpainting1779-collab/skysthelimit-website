import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const scripts = new URL('../.github/skills/impeccable/scripts/', import.meta.url);
const read = (path) => readFileSync(new URL(path, scripts), 'utf8');

test('poll timeout and lease values are strict bounded integers', async () => {
  const pollLanes = await import(new URL('live/poll-lanes.mjs', scripts));
  assert.equal(typeof pollLanes.parseBoundedIntegerParam, 'function');

  const options = { fallback: 30_000, min: 1, max: 600_000 };
  assert.equal(pollLanes.parseBoundedIntegerParam(null, options), 30_000);
  assert.equal(pollLanes.parseBoundedIntegerParam('270000', options), 270_000);
  assert.equal(pollLanes.parseBoundedIntegerParam('600000', options), 600_000);
  for (const value of ['-1', '1.5', '1e4', '9007199254740992', '600001']) {
    assert.equal(pollLanes.parseBoundedIntegerParam(value, options), null);
  }
});

test('basic HTML decoding cannot decode an entity twice', async () => {
  const evidence = await import(new URL('live-manual-edit-evidence.mjs', scripts));
  assert.equal(typeof evidence.decodeBasicHtml, 'function');
  assert.equal(
    evidence.decodeBasicHtml('&amp;lt;script&amp;gt;'),
    '&lt;script&gt;',
  );
});

test('browser helpers use Web Crypto, context-specific CSS escaping, and validated origins', async () => {
  delete globalThis.__IMPECCABLE_LIVE_DOM__;
  await import(new URL(`live-browser-dom.js?codeql=${Date.now()}`, scripts));
  const factory = globalThis.__IMPECCABLE_LIVE_DOM__?.createLiveBrowserDomHelpers;
  const resolveOrigin = globalThis.__IMPECCABLE_LIVE_DOM__?.resolveLiveServerOrigin;
  assert.equal(typeof factory, 'function');
  assert.equal(typeof resolveOrigin, 'function');

  const helpers = factory({
    prefix: 'test',
    document: { body: {}, head: {} },
    crypto: {
      getRandomValues(bytes) {
        bytes.set([0, 1, 254, 255]);
        return bytes;
      },
    },
  });
  assert.equal(helpers.id8(), '0001feff');
  assert.equal(helpers.escapeCssString('a"\\\0\n'), 'a\\"\\\\\uFFFD\\a ');
  assert.equal(helpers.jsxStylePropToCss('msTransform'), '-ms-transform');
  assert.equal(helpers.jsxStylePropToCss('backgroundColor'), 'background-color');

  assert.equal(
    resolveOrigin({
      scriptSrc: 'http://localhost:8400/live.js?token=secret',
      token: 'secret',
      port: 8400,
    }),
    'http://localhost:8400',
  );
  assert.equal(
    resolveOrigin({
      scriptSrc: 'https://live.example.com:8400/live.js?token=secret',
      token: 'secret',
      port: 8400,
    }),
    'https://live.example.com:8400',
  );
  for (const scriptSrc of [
    'http://evil.example:8400/live.js?token=secret',
    'http://localhost:8401/live.js?token=secret',
    'http://localhost:8400/other.js?token=secret',
    'http://localhost:8400/live.js?token=wrong',
    'http://user:pass@localhost:8400/live.js?token=secret',
  ]) {
    assert.throws(() => resolveOrigin({ scriptSrc, token: 'secret', port: 8400 }));
  }
});

test('variant selection treats command input as a literal attribute value', async () => {
  const { extractVariant } = await import(new URL('live-accept.mjs', scripts));
  const lines = ['<div data-impeccable-variant="2">wrong</div>'];

  assert.equal(extractVariant(lines, { start: 0, end: 0 }, '(?:1|2)'), null);
  assert.deepEqual(extractVariant(lines, { start: 0, end: 0 }, '2'), ['wrong']);
});

test('browser child scripts derive from the validated parent origin', () => {
  const browser = read('live-browser.js');

  assert.match(browser, /resolveLiveServerOrigin/);
  assert.match(browser, /new URL\(['"]\/modern-screenshot\.js['"], LIVE_SERVER_ORIGIN\)/);
  assert.match(browser, /new URL\(['"]\/detect\.js['"], LIVE_SERVER_ORIGIN\)/);
  assert.doesNotMatch(browser, /s\.src = ['"]http:\/\/localhost:/);
});

test('generated-file detection invokes Git without a command shell', () => {
  const generated = read('lib/is-generated.mjs');

  assert.match(generated, /execFileSync\(['"]git['"],\s*\[['"]check-ignore['"]/);
  assert.match(generated, /['"]--['"],\s*absPath/);
  assert.match(generated, /shell:\s*false/);
  assert.doesNotMatch(generated, /\bexecSync\b/);
});
