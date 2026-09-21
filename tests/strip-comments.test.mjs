// Unit tests for stripComments + collectStaticInternalLinks composition:
// commented-out hrefs must not be treated as live navigation links.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectStaticInternalLinks } from './helpers/collect-links.mjs';
import { stripComments } from './helpers/strip-comments.mjs';

const collect = (source) => collectStaticInternalLinks(stripComments(source));

test('hrefs inside line comments are ignored', () => {
  const source = [
    'export function Header() {',
    '  return (',
    '    <nav>',
    '      <a href="/live-link">Live</a>',
    '      // <a href="/commented-out-link">Old</a>',
    '    </nav>',
    '  );',
    '}',
  ].join('\n');

  const links = collect(source);

  assert.ok(links.includes('/live-link'), 'live link collected');
  assert.ok(!links.includes('/commented-out-link'), 'commented-out href is ignored');
});

test('hrefs inside block comments are ignored', () => {
  const source = [
    'export function Footer() {',
    '  return (',
    '    <footer>',
    '      {/* <a href="/commented-block-link">Old</a> */}',
    '      /*',
    '      <a href="/commented-multiline-link">Older</a>',
    '      */',
    '      <a href="/live-footer-link">Live</a>',
    '    </footer>',
    '  );',
    '}',
  ].join('\n');

  const links = collect(source);

  assert.ok(links.includes('/live-footer-link'), 'live link collected');
  assert.ok(!links.includes('/commented-block-link'), 'block-commented href is ignored');
  assert.ok(!links.includes('/commented-multiline-link'), 'multi-line block comment href is ignored');
});

test('a source whose only href is commented out contributes no links', () => {
  // Guards the non-empty coverage guard in internal-links.test.mjs: a
  // commented valid link must not fake it.
  const source = [
    'export function Header() {',
    '  // TODO: re-add <a href="/valid-but-commented">Promo</a> next month',
    '  return <nav>{/* <a href="/also-commented">X</a> */}</nav>;',
    '}',
  ].join('\n');

  assert.deepEqual(collect(source), [], 'commented-out links are invisible to the collector');
});

test('comment markers inside string literals are not treated as comments', () => {
  const source = [
    'const note = "see // details for the /* launch */ plan";',
    "const other = 'it\\'s // fine';",
    'export function C() { return <a href="/real-after-strings">Go</a>; }',
  ].join('\n');

  const links = collect(source);

  assert.deepEqual(links, ['/real-after-strings']);
});

test('comment markers inside template literals are preserved; ${} expressions still strip comments', () => {
  const source = [
    'const label = `price // per // sqft`;',
    'const path = `/x/${',
    '  // comment inside the expression',
    '  "y"',
    '}`;',
    'export function C() { return <a href="/after-template">Go</a>; }',
  ].join('\n');

  const links = collect(source);

  assert.ok(links.includes('/after-template'), 'href after template literal still collected');
  const stripped = stripComments(source);
  assert.ok(stripped.includes('price // per // sqft'), 'template literal text untouched');
  assert.ok(!stripped.includes('comment inside the expression'), 'comment inside ${} is stripped');
});

test('commented-out relative and template hrefs are ignored too', () => {
  const source = [
    '// <a href="relative/path">Rel</a>',
    '// <a href={`/commented-template`}>T</a>',
    'export function C() { return <a href="/live">Go</a>; }',
  ].join('\n');

  assert.deepEqual(collect(source), ['/live']);
});
