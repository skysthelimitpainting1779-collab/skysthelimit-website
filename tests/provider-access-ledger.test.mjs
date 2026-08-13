import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const rootUrl = new URL('../', import.meta.url);
const ledgerUrl = new URL(
  '.agents/governance/provider-access-ledger.json',
  rootUrl,
);
const schemaUrl = new URL(
  '.agents/governance/provider-access-ledger.schema.json',
  rootUrl,
);
const validatorUrl = new URL(
  'scripts/verify-provider-access-ledger.mjs',
  rootUrl,
);

test('provider access ledger is present, secret-free, and independently verifiable', async () => {
  for (const [name, url] of [
    ['ledger', ledgerUrl],
    ['schema', schemaUrl],
    ['validator', validatorUrl],
  ]) {
    assert.equal(existsSync(url), true, `${name} contract is missing`);
  }

  const ledger = JSON.parse(readFileSync(ledgerUrl, 'utf8'));
  const schema = JSON.parse(readFileSync(schemaUrl, 'utf8'));
  const { validateProviderAccessLedger } = await import(validatorUrl);

  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.deepEqual(validateProviderAccessLedger(ledger), []);
  assert.equal(ledger.schemaVersion, '1.0.0');
  assert.equal(ledger.programId, 'stl-post-g20-sequential-tdd-v1');
  assert.match(ledger.capturedAt, /^\d{4}-\d{2}-\d{2}T/);

  const providerIds = ledger.providers.map(({ providerId }) => providerId);
  assert.deepEqual(
    providerIds,
    [
      'calcom',
      'clerk',
      'convex',
      'directus',
      'github',
      'google-business-profile',
      'payload',
      'resend',
      'sms',
      'stripe',
      'supabase',
      'turso',
      'vercel',
    ],
  );
  assert.equal(new Set(providerIds).size, providerIds.length);

  for (const provider of ledger.providers) {
    assert.ok(provider.account.id);
    assert.ok(provider.environments.length > 0);
    assert.ok(provider.permissions.length > 0);
    assert.ok(provider.evidence.length > 0);
    assert.equal(provider.secretMaterialStored, false);
  }

  const serialized = JSON.stringify(ledger);
  assert.doesNotMatch(
    serialized,
    /(?:token|password|credential|secret|private[_-]?key|api[_-]?key|signing[_-]?secret|client[_-]?secret|authorization)["']?\s*:/i,
  );
  assert.doesNotMatch(
    serialized,
    /(?:sk|pk)_(?:live|test)_[A-Za-z0-9]+|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/,
  );
  assert.doesNotMatch(serialized, /[A-Za-z]:[\\/]Users[\\/]/);

  const invalid = structuredClone(ledger);
  invalid.providers[0].secretMaterialStored = true;
  assert.match(
    validateProviderAccessLedger(invalid).join('\n'),
    /secretMaterialStored/,
  );

  const leakedCredential = structuredClone(ledger);
  leakedCredential.providers[0].credential = [
    'ghp',
    '0123456789abcdefghijklmnopqrstuvwxyz',
  ].join('_');
  assert.match(
    validateProviderAccessLedger(leakedCredential).join('\n'),
    /credential field|credential-shaped/,
  );

  const malformedResource = structuredClone(ledger);
  malformedResource.providers[2].resources[0] = { unexpected: true };
  assert.notDeepEqual(validateProviderAccessLedger(malformedResource), []);

  const productionContradiction = structuredClone(ledger);
  const convex = productionContradiction.providers.find(
    ({ providerId }) => providerId === 'convex',
  );
  convex.environments.find(({ name }) => name === 'production').verificationStatus =
    'verified';
  convex.permissions.push('production:write');
  assert.match(
    validateProviderAccessLedger(productionContradiction).join('\n'),
    /production/i,
  );

  const productionSubstringBypass = structuredClone(ledger);
  productionSubstringBypass.providers
    .find(({ providerId }) => providerId === 'convex')
    .permissions.push('production:write-unblocked');
  assert.match(
    validateProviderAccessLedger(productionSubstringBypass).join('\n'),
    /production mutation must be blocked/i,
  );

  const productionNegatedBlock = structuredClone(ledger);
  productionNegatedBlock.providers
    .find(({ providerId }) => providerId === 'convex')
    .permissions.push('production:write:not-blocked');
  assert.match(
    validateProviderAccessLedger(productionNegatedBlock).join('\n'),
    /production mutation must be blocked/i,
  );

  const shortBasicCredential = structuredClone(ledger);
  shortBasicCredential.providers[0].notes = 'Basic dXNlcjpwYXNz';
  assert.match(
    validateProviderAccessLedger(shortBasicCredential).join('\n'),
    /credential-shaped/i,
  );

  const benignBasicNote = structuredClone(ledger);
  benignBasicNote.providers[0].notes = 'Basic configuration metadata only.';
  assert.deepEqual(validateProviderAccessLedger(benignBasicNote), []);

  const benignDeliveryPermission = structuredClone(ledger);
  benignDeliveryPermission.providers[0].permissions.push('delivery:write');
  assert.deepEqual(validateProviderAccessLedger(benignDeliveryPermission), []);

  for (const permission of ['production:deployment', 'production:admin']) {
    const productionCapability = structuredClone(ledger);
    productionCapability.providers[0].permissions.push(permission);
    assert.match(
      validateProviderAccessLedger(productionCapability).join('\n'),
      /production mutation must be blocked/i,
    );
  }

  const productionRead = structuredClone(ledger);
  productionRead.providers[0].permissions.push('production:read');
  assert.deepEqual(validateProviderAccessLedger(productionRead), []);
});
