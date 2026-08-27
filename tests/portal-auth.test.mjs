/**
 * Portal auth gate — drives shipped helpers in src/lib/auth/portal.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

// Compile-free import of TS via tsx test runner (package.json test uses tsx --test)
const portalUrl = pathToFileURL(
  join(process.cwd(), 'src/lib/auth/portal.ts')
).href;

const {
  gatePortalAccess,
  isProtectedPortalPath,
  portalLoginUrl,
  mapLeadsForPortal,
  buildPortalOAuthOptions,
} = await import(portalUrl);

test('gatePortalAccess denies missing session', () => {
  const r = gatePortalAccess(null);
  assert.equal(r.authenticated, false);
  if (!r.authenticated) {
    assert.equal(r.reason, 'no_session');
    assert.equal(r.loginPath, '/portal/login');
  }
});

test('gatePortalAccess denies user without email', () => {
  const r = gatePortalAccess({ id: 'u1', email: '' });
  assert.equal(r.authenticated, false);
  if (!r.authenticated) assert.equal(r.reason, 'no_email');
});

test('gatePortalAccess accepts valid user', () => {
  const r = gatePortalAccess({ id: 'u1', email: 'Client@Example.com' });
  assert.equal(r.authenticated, true);
  if (r.authenticated) {
    assert.equal(r.user.id, 'u1');
    assert.equal(r.user.email, 'client@example.com');
  }
});

test('isProtectedPortalPath protects /portal but not login', () => {
  assert.equal(isProtectedPortalPath('/portal'), true);
  assert.equal(isProtectedPortalPath('/portal/settings'), true);
  assert.equal(isProtectedPortalPath('/portal?tab=billing'), true);
  assert.equal(isProtectedPortalPath('/portal#overview'), true);
  assert.equal(isProtectedPortalPath('/portal/login'), false);
  assert.equal(isProtectedPortalPath('/portal/login/extra'), false);
  assert.equal(isProtectedPortalPath('/portals'), false);
  assert.equal(isProtectedPortalPath('/portal-admin'), false);
  assert.equal(isProtectedPortalPath('/portal-malicious'), false);
  assert.equal(isProtectedPortalPath('/admin'), false);
  assert.equal(isProtectedPortalPath('/'), false);
});

test('portalLoginUrl encodes next path', () => {
  assert.equal(portalLoginUrl('/portal'), '/portal/login?next=%2Fportal');
  assert.equal(portalLoginUrl('/portal?tab=billing'), '/portal/login?next=%2Fportal%3Ftab%3Dbilling');
  assert.equal(portalLoginUrl('/portal#overview'), '/portal/login?next=%2Fportal%23overview');
  assert.equal(portalLoginUrl('/evil'), '/portal/login');
  assert.equal(portalLoginUrl('/portals'), '/portal/login');
  assert.equal(portalLoginUrl('/portal-admin'), '/portal/login');
  assert.equal(portalLoginUrl('/portal-malicious'), '/portal/login');
});

test('mapLeadsForPortal filters by email and strips empty ids', () => {
  const rows = [
    { lead_id: 'L1', email: 'a@b.com', status: 'new', name: 'A' },
    { lead_id: 'L2', email: 'other@b.com', status: 'won' },
    { lead_id: '', email: 'a@b.com', status: 'x' },
  ];
  const out = mapLeadsForPortal(rows, 'A@B.com');
  assert.equal(out.length, 1);
  assert.equal(out[0].lead_id, 'L1');
  assert.equal(out[0].status, 'new');
});

test('buildPortalOAuthOptions builds callback redirect for Google', () => {
  const o = buildPortalOAuthOptions('https://www.example.com', 'google', '/portal');
  assert.equal(o.provider, 'google');
  assert.match(o.options.redirectTo, /https:\/\/www\.example\.com\/auth\/callback\?next=/);
  assert.ok(o.options.redirectTo.includes(encodeURIComponent('/portal')));
});

test('buildPortalOAuthOptions preserves a valid portal query or fragment', () => {
  for (const nextPath of ['/portal?tab=billing', '/portal#overview']) {
    const o = buildPortalOAuthOptions('https://www.example.com', 'github', nextPath);
    const redirect = new URL(o.options.redirectTo);
    assert.equal(redirect.searchParams.get('next'), nextPath);
  }
});

test('buildPortalOAuthOptions rejects lookalike portal prefixes', () => {
  for (const nextPath of ['/portals', '/portal-admin', '/portal-malicious']) {
    const o = buildPortalOAuthOptions('https://www.example.com', 'github', nextPath);
    const redirect = new URL(o.options.redirectTo);
    assert.equal(redirect.searchParams.get('next'), '/portal');
  }
});
