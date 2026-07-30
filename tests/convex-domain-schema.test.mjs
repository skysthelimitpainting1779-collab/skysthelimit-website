import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Convex schema defines the CRM and operational foundation with access-path indexes', async () => {
  const schema = await readFile(new URL('../convex/schema.ts', import.meta.url), 'utf8');

  for (const table of [
    'users', 'companies', 'memberships', 'invitations', 'resourceGrants', 'leads',
    'contacts', 'properties', 'projects', 'opportunities',
    'appointments', 'calReconciliationJobs', 'events', 'idempotencyKeys',
    'webhookReceipts', 'auditFacts', 'migrationReconciliation',
  ]) {
    assert.match(schema, new RegExp(`${table}: defineTable`));
  }

  assert.match(schema, /\.index\(['"]by_clerkSubject['"], \[['"]clerkSubject['"]\]\)/);
  assert.match(schema, /\.index\(['"]by_user_company['"], \[['"]userId['"], ['"]companyId['"]\]\)/);
  assert.match(schema, /\.index\(['"]by_user_resource['"], \[['"]userId['"], ['"]resourceType['"], ['"]resourceId['"]\]\)/);
  assert.match(schema, /\.index\(['"]by_eventId['"], \[['"]eventId['"]\]\)/);
  assert.match(schema, /\.index\(['"]by_scope_key['"], \[['"]scope['"], ['"]key['"]\]\)/);
  assert.match(schema, /\.index\(['"]by_provider_eventId['"], \[['"]provider['"], ['"]eventId['"]\]\)/);
  assert.match(schema, /\.index\(['"]by_company_provider_booking['"], \[['"]companyId['"], ['"]provider['"], ['"]providerBookingUid['"]\]\)/);
  assert.match(schema, /\.index\(['"]by_provider_organization_booking['"], \[['"]provider['"], ['"]providerOrganizationId['"], ['"]providerBookingUid['"]\]\)/);
  assert.match(schema, /\.index\(['"]by_company_supersedes_booking['"], \[['"]companyId['"], ['"]provider['"], ['"]providerOrganizationId['"], ['"]supersedesProviderBookingUid['"]\]\)/);
  assert.match(schema, /\.index\(['"]by_company_organization_run['"], \[['"]companyId['"], ['"]providerOrganizationId['"], ['"]runId['"]\]\)/);
  assert.match(schema, /participantCount: v\.number\(\)/);
  assert.match(schema, /participantTimeZones: v\.array\(v\.string\(\)\)/);
  assert.doesNotMatch(schema, /participants: v\.array\(v\.object/);
  assert.match(schema, /\.index\(['"]by_run_canonical_id['"], \[['"]runId['"], ['"]canonicalId['"]\]\)/);
  assert.match(schema, /\.index\(['"]by_clerkInvitationId['"], \[['"]clerkInvitationId['"]\]\)/);
  assert.match(schema, /\.index\(['"]by_migrationCanonicalId['"], \[['"]migrationCanonicalId['"]\]\)/);
  assert.match(schema, /requestHash: v\.string\(\)/);
  assert.match(schema, /leaseExpiresAt: v\.optional\(v\.number\(\)\)/);
  assert.match(schema, /processingStatus: v\.union\(/);
  assert.doesNotMatch(schema, /mfaVerifiedAt/);
  assert.doesNotMatch(schema, /email[^\n]*ownership/i);
});
