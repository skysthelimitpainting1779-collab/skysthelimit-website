import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  requiredInvitationActorRoles,
  resolveTrustedInvitationRedirect,
} from '../convex/lib/invitationPolicy.ts';
import { decideUserLifecycleTransition } from '../convex/lib/userLifecycle.ts';

test('non-delete lifecycle events cannot reactivate a disabled user', () => {
  assert.deepEqual(
    decideUserLifecycleTransition(
      { status: 'disabled', lastLifecycleOccurredAt: 200 },
      { type: 'user.updated', providerOccurredAt: 300 },
    ),
    {
      apply: false,
      status: 'disabled',
      updateLifecycleCursor: false,
      reason: 'disabled-user',
    },
  );
});

test('stale profile events are ignored while deletion always removes access', () => {
  assert.equal(
    decideUserLifecycleTransition(
      { status: 'active', lastLifecycleOccurredAt: 200 },
      { type: 'user.updated', providerOccurredAt: 100 },
    ).apply,
    false,
  );
  assert.deepEqual(
    decideUserLifecycleTransition(
      { status: 'active', lastLifecycleOccurredAt: 200 },
      { type: 'user.deleted', providerOccurredAt: 100 },
    ),
    {
      apply: true,
      status: 'disabled',
      updateLifecycleCursor: false,
      reason: 'deletion-wins',
    },
  );
});

test('invitation persistence rechecks privileged access and compensates Clerk', async () => {
  const [internalSource, actionSource] = await Promise.all([
    readFile(new URL('../convex/invitationsInternal.ts', import.meta.url), 'utf8'),
    readFile(new URL('../convex/invitations.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(internalSource, /requireCompanyMembership\(ctx/);
  assert.equal(
    internalSource.match(/roles: requiredInvitationActorRoles\(args\.role\)/g)?.length,
    2,
  );
  assert.match(internalSource, /access\.user\._id !== args\.invitedByUserId/);
  assert.match(actionSource, /invitations\/\$\{encodeURIComponent\(invitation\.id\)\}\/revoke/);
  assert.match(actionSource, /Invitation authorization changed before persistence/);
});

test('staff cannot create privileged invitations and redirect origins are explicit', () => {
  assert.deepEqual(requiredInvitationActorRoles('customer'), ['staff', 'admin']);
  assert.deepEqual(requiredInvitationActorRoles('staff'), ['admin']);
  assert.deepEqual(requiredInvitationActorRoles('admin'), ['admin']);
  assert.equal(
    resolveTrustedInvitationRedirect(
      '/portal/welcome',
      ['https://www.skysthelimitpaintingllc.com'],
    ),
    'https://www.skysthelimitpaintingllc.com/portal/welcome',
  );
  assert.throws(
    () => resolveTrustedInvitationRedirect(
      'https://attacker.example/steal',
      ['https://www.skysthelimitpaintingllc.com'],
    ),
    /not an approved application origin/,
  );
});

test('revoked pending invite plus same-email user update never grants membership', async () => {
  const usersSource = await readFile(
    new URL('../convex/users.ts', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(usersSource, /query\(['"]invitations['"]\)/);
  assert.doesNotMatch(usersSource, /by_emailAddress_status/);
});

test('verified invitation lifecycle targets one exact provider invitation ID', async () => {
  const source = await readFile(
    new URL('../convex/invitationsInternal.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /applyVerifiedClerkLifecycle = internalMutation/);
  assert.match(source, /by_clerkInvitationId/);
  assert.match(source, /q\.eq\(['"]clerkInvitationId['"], args\.clerkInvitationId\)/);
  assert.match(source, /q\.eq\(['"]clerkSubject['"], acceptedClerkSubject\)/);
  assert.doesNotMatch(source, /by_primaryEmailAddress/);
  assert.match(source, /args\.type === ['"]invitation\.revoked['"]/);
  assert.match(source, /invitation\.status !== ['"]revoked['"]/);
  assert.match(source, /sourceInvitationId: invitation\._id/);
  assert.doesNotMatch(source, /by_emailAddress_status[\s\S]*\.first\(\)/);
});

test('multiple pending invitations cannot make acceptance selection ambiguous', async () => {
  const source = await readFile(
    new URL('../convex/invitationsInternal.ts', import.meta.url),
    'utf8',
  );
  const exactLookup = source.match(
    /\.withIndex\(['"]by_clerkInvitationId['"],[\s\S]*?\.unique\(\)/,
  );
  assert.ok(exactLookup);
  assert.match(exactLookup[0], /args\.clerkInvitationId/);
  assert.doesNotMatch(exactLookup[0], /emailAddress|\.first\(\)/);
});

test('invitation webhook arriving before local persistence forces provider retry', async () => {
  const source = await readFile(
    new URL('../convex/invitationsInternal.ts', import.meta.url),
    'utf8',
  );
  const missingGuard = source.indexOf('if (!invitation)');
  const receiptWrite = source.indexOf("await ctx.db.insert('webhookReceipts'");
  assert.ok(missingGuard >= 0);
  assert.ok(receiptWrite > missingGuard);
  assert.match(
    source.slice(missingGuard, receiptWrite),
    /Local invitation is not persisted yet; retry/,
  );
});
