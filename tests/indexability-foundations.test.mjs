import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const canonicalOrigin = 'https://www.skysthelimitpaintingllc.com';

test('indexability artifacts use one stable HTTPS canonical origin', () => {
  for (const path of ['src/app/layout.tsx', 'src/app/robots.ts', 'src/app/sitemap.ts', 'src/lib/seo.ts']) {
    const source = read(path);
    assert.match(source, /CANONICAL_ORIGIN/);
  }

  const robots = read('public/robots.txt');
  const sitemap = read('public/sitemap.xml');
  assert.match(robots, new RegExp(`Sitemap: ${canonicalOrigin}/sitemap\\.xml`));
  assert.match(sitemap, new RegExp(`<loc>${canonicalOrigin}/`));
  assert.doesNotMatch(sitemap, /<loc>http:\/\//);
});

test('site-wide entity graph and the homepage WebPage are emitted as JSON-LD', () => {
  const seo = read('src/lib/seo.ts');
  const layout = read('src/app/layout.tsx');
  const home = read('src/app/page.tsx');

  assert.match(seo, /websiteSchema/);
  assert.match(seo, /'WebSite'/);
  assert.match(seo, /homePageSchema/);
  assert.match(seo, /'WebPage'/);
  assert.match(layout, /'HousePainter'/);
  assert.match(home, /JsonLd data=\{homePageSchema\}/);
});

test('the apex and HTTP canonical host are permanently redirected without redirecting previews', () => {
  const proxy = read('src/proxy.ts');
  assert.match(proxy, /APEX_HOST/);
  assert.match(proxy, /CANONICAL_HOST/);
  assert.match(proxy, /NextResponse\.redirect\(url, 308\)/);
  assert.match(proxy, /host === APEX_HOST/);
});
