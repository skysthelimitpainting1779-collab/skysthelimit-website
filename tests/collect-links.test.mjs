// Unit tests for the AST-based collectStaticInternalLinks: only genuine
// TSX/data syntax positions are collected — href-looking text inside string
// literals (docs, error messages, analytics payloads) is not live navigation.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectStaticInternalLinks } from './helpers/collect-links.mjs';

const collect = (source) => collectStaticInternalLinks(source).sort();

test('collects genuine JSX href attributes in all static forms', () => {
  const source = [
    'export function C() {',
    '  return (<nav>',
    '    <a href="/plain">A</a>',
    "    <a href={'/braced'}>B</a>",
    '    <a href={`/template`}>C</a>',
    '    <Link to="/to-prop">D</Link>',
    '  </nav>);',
    '}',
  ].join('\n');

  assert.deepEqual(collect(source), ['/braced', '/plain', '/template', '/to-prop']);
});

test('collects data-literal navigation: object href props and [path, label] pairs', () => {
  const source = [
    'const items = [',
    "  { href: '/residential', label: 'Residential' },",
    "  { to: '/commercial', label: 'Commercial' },",
    '];',
    'const columns = [',
    "  ['/about', 'About'],",
    '];',
  ].join('\n');

  assert.deepEqual(collect(source), ['/about', '/commercial', '/residential']);
});

test('ignores href-looking text inside string literals', () => {
  // The thread-2 false-positive class: docs, error messages, and analytics
  // payloads that mention href="..." text without being navigation.
  const source = [
    'const doc = "see href=\\"/docs\\" for the API reference";',
    "const err = new Error('broken link: href=\"/not-a-link\" reported');",
    'const payload = JSON.stringify({ event: "click", ref: "href=\\"/track\\"" });',
    'export function C() { return <a href="/real">Go</a>; }',
  ].join('\n');

  assert.deepEqual(collect(source), ['/real']);
});

test('ignores href text inside template literal bodies', () => {
  const source = [
    'const note = `paste href="/docs" into the ticket`;',
    'export function C() { return <a href="/real">Go</a>; }',
  ].join('\n');

  assert.deepEqual(collect(source), ['/real']);
});

test('does not collect runtime-computed hrefs', () => {
  const source = [
    'export function C({ item }) {',
    '  return (<nav>',
    '    <Link href={item.href}>Dyn</Link>',
    '    <a href={`/areas/${item.slug}`}>Interp</a>',
    '    <a href="/static">Static</a>',
    '  </nav>);',
    '}',
  ].join('\n');

  assert.deepEqual(collect(source), ['/static']);
});

test('excludes protocol-relative URLs, schemes, and anchors', () => {
  const source = [
    'export function C() {',
    '  return (<nav>',
    '    <a href="//cdn.example.com/lib.js">Proto</a>',
    '    <a href="tel:+16514104196">Call</a>',
    '    <a href="mailto:a@b.com">Mail</a>',
    '    <a href="https://example.com">Ext</a>',
    '    <a href="#section">Anchor</a>',
    '    <a href="/real">Real</a>',
    '  </nav>);',
    '}',
  ].join('\n');

  assert.deepEqual(collect(source), ['/real']);
});

test('collects relative hrefs so they fail loudly downstream', () => {
  const source = [
    'const items = [{ href: "relative/path", label: "Rel" }];',
    'export function C() { return <a href="also/relative">Go</a>; }',
  ].join('\n');

  assert.deepEqual(collect(source), ['also/relative', 'relative/path']);
});

test('deduplicates repeated links', () => {
  const source = [
    'export function C() {',
    '  return (<nav><a href="/x">A</a><a href="/x">B</a></nav>);',
    '}',
  ].join('\n');

  assert.deepEqual(collect(source), ['/x']);
});
