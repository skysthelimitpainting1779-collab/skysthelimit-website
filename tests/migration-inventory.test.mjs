import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { canonicalId, contentChecksum, createInventoryReport, runInventoryCli } from '../scripts/migrations/inventory.mjs';
import { buildImportHandoff, runPrepareImportCli } from '../scripts/migrations/prepare-import.mjs';
import { reconcileReports } from '../scripts/migrations/reconcile.mjs';
import { hashCanonicalContent } from '../convex/lib/events.ts';

const root = process.cwd();

function tempDirectory() { return mkdtempSync(join(tmpdir(), 'stl-migration-')); }
function writeJson(path, value) { writeFileSync(path, JSON.stringify(value), 'utf8'); }

test('inventory requires an explicit offline config and reports blocked live evidence', () => {
  const directory = tempDirectory();
  try {
    const config = join(directory, 'directus.json');
    writeJson(config, { source: 'directus' });
    const report = createInventoryReport({ sourceConfigPath: config, root, now: '2026-07-27T00:00:00.000Z' });
    assert.equal(report.dryRun, true);
    assert.equal(report.access.liveNetworkAttempted, false);
    assert.equal(report.entities.length, 0);
    assert.match(report.blockedEvidence[0].reason, /live credentials and network export/i);
    assert.ok(report.capabilities.draftCapabilities.collections.includes('case_studies'));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('local manifests cover Supabase schema/media, Payload media/drafts, and Directus drafts/redirects', () => {
  const directory = tempDirectory();
  try {
    for (const source of ['supabase', 'payload', 'directus']) {
      const config = join(directory, `${source}.json`);
      writeJson(config, { source });
      const report = createInventoryReport({ sourceConfigPath: config, root });
      assert.equal(report.access.status, 'blocked-until-authorized-offline-snapshot-is-provided');
      assert.ok(report.capabilities.redirectCapabilities.redirects.length > 0);
      if (source === 'supabase') {
        assert.ok(report.capabilities.schemaArtifacts.migrations.length > 0);
        assert.ok(report.capabilities.mediaCapabilities.storageBuckets.includes('cms-assets'));
      }
      if (source === 'payload') {
        assert.ok(report.capabilities.mediaCapabilities.uploadCollections.includes('media'));
        assert.ok(report.capabilities.draftCapabilities.collections.includes('services'));
      }
      if (source === 'directus') assert.ok(report.capabilities.draftCapabilities.collections.includes('case_studies'));
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('snapshot inventory emits stable opaque IDs, checksums, duplicates, and retries without PII', () => {
  const directory = tempDirectory();
  try {
    const snapshot = join(directory, 'snapshot.json');
    const config = join(directory, 'payload.json');
    writeJson(snapshot, { source: 'payload', entities: { services: [
      { id: 'legacy-1', email: 'private@example.com', name: 'Private Name' },
      { id: 'legacy-1', migrationState: 'retry', phone: '555-555-5555' },
      { title: 'missing id' },
    ] } });
    writeJson(config, { source: 'payload', snapshotPath: 'snapshot.json' });
    const report = createInventoryReport({ sourceConfigPath: config, root, now: '2026-07-27T00:00:00.000Z' });
    const entity = report.entities[0];
    assert.equal(entity.sourceRecordCount, 3);
    assert.equal(entity.uniqueCanonicalCount, 1);
    assert.equal(entity.canonicalIds[0], canonicalId('payload', 'services', 'legacy-1'));
    assert.equal(entity.duplicateRecords.length, 1);
    assert.equal(entity.retryCandidates.length, 2);
    assert.deepEqual(report.dataSensitivity, {
      sourceClassification: 'restricted-personal-data',
      reportClassification: 'restricted-pseudonymous-personal-data',
      rawRecordsIncluded: false,
      personalDataIncluded: true,
      pseudonymousPersonalDataIncluded: true,
    });
    assert.doesNotMatch(JSON.stringify(report), /private@example|Private Name|555-555/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('credential-bearing configs fail before any inventory report is created', () => {
  const directory = tempDirectory();
  try {
    const config = join(directory, 'supabase.json');
    writeJson(config, { source: 'supabase', serviceRoleKey: 'do-not-use' });
    assert.throws(() => createInventoryReport({ sourceConfigPath: config, root }), /not allowed/i);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('source-specific runners reject a mismatched source config before writing', () => {
  const directory = tempDirectory();
  try {
    const config = join(directory, 'directus.json');
    const output = join(directory, 'report.json');
    writeJson(config, { source: 'directus' });
    assert.throws(
      () => runInventoryCli(['--dry-run', '--source-config', config, '--out', output], { root, expectedSources: ['supabase'] }),
      /only accepts/i,
    );
    assert.throws(() => readFileSync(output, 'utf8'), /ENOENT/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('reconciliation is dry-run idempotent and reports duplicate and retry exceptions', () => {
  const sourceId = canonicalId('directus', 'case_studies', 7);
  const targetId = canonicalId('directus', 'case_studies', 8);
  const source = { kind: 'legacy-inventory', source: 'directus', entities: [{ entity: 'case_studies', canonicalIds: [sourceId], duplicateRecords: [{ canonicalId: sourceId }], retryCandidates: [] }] };
  const target = { kind: 'legacy-inventory', source: 'convex', entities: [{ entity: 'case_studies', canonicalIds: [targetId], duplicateRecords: [], retryCandidates: [{ canonicalId: targetId, reason: 'retry' }] }] };
  const result = reconcileReports(source, target);
  assert.equal(result.dryRun, true);
  assert.equal(result.entities[0].matched, false);
  assert.deepEqual(result.entities[0].plannedActions, [{ canonicalId: sourceId, action: 'create-if-absent' }]);
  assert.equal(result.summary.duplicateRecords, 1);
  assert.equal(result.summary.retryCandidates, 1);
});

test('reconciliation rejects non-opaque IDs instead of copying possible PII into a report', () => {
  const source = { kind: 'legacy-inventory', source: 'directus', entities: [{ entity: 'case_studies', canonicalIds: ['person@example.com'] }] };
  const target = { kind: 'legacy-inventory', source: 'convex', entities: [] };
  assert.throws(() => reconcileReports(source, target), /non-opaque canonical ID/i);
});

test('reconciliation classifies sanitized output and rejects PII-bearing report metadata', () => {
  const sourceId = canonicalId('directus', 'contacts', 7);
  const source = { kind: 'legacy-inventory', source: 'directus', entities: [{ entity: 'contacts', canonicalIds: [sourceId] }] };
  const target = { kind: 'legacy-inventory', source: 'convex', entities: [] };
  const report = reconcileReports(source, target);
  assert.deepEqual(report.dataSensitivity, {
    sourceClassification: 'restricted-personal-data',
    reportClassification: 'restricted-pseudonymous-personal-data',
    rawRecordsIncluded: false,
    personalDataIncluded: true,
    pseudonymousPersonalDataIncluded: true,
  });
  assert.doesNotMatch(JSON.stringify(report), /private@example|Private Name|555-555/);
  assert.throws(
    () => reconcileReports({
      ...source,
      entities: [{ entity: 'person@example.com', canonicalIds: [sourceId] }],
    }, target),
    /safe entity name/i,
  );
  assert.throws(
    () => reconcileReports(source, target, { contacts: 'person@example.com' }),
    /safe entity name/i,
  );
});

test('legacy reconciliation skills classify sensitive data and prohibit repository PII', () => {
  const agentSkill = readFileSync(join(root, '.agents/skills/legacy-data-reconciliation/SKILL.md'), 'utf8');
  const githubSkill = readFileSync(join(root, '.github/skills/legacy-data-reconciliation/SKILL.md'), 'utf8');
  assert.equal(agentSkill, githubSkill);
  assert.match(agentSkill, /restricted personal data/i);
  assert.match(agentSkill, /raw exports, credentials, or PII/i);
  assert.match(agentSkill, /outside the repository/i);
  assert.match(agentSkill, /pseudonymous IDs, checksums, counts, and/i);
  assert.match(agentSkill, /stable\s+hashes can remain linkable/i);
});

test('Convex reconciliation mutation uses the reserved idempotency table and compound index', () => {
  const schema = readFileSync(join(root, 'convex/schema.ts'), 'utf8');
  const migration = readFileSync(join(root, 'convex/migrations.ts'), 'utf8');
  assert.match(schema, /migrationReconciliation:\s*defineTable/);
  assert.match(schema, /index\('by_run_canonical_id', \['runId', 'canonicalId'\]\)/);
  assert.match(migration, /internalMutation/);
  assert.match(migration, /query\('migrationReconciliation'\)/);
  assert.match(migration, /withIndex\('by_run_canonical_id'/);
  assert.match(migration, /outcome: 'duplicate'/);
  assert.match(migration, /importMappedRecord = internalMutation/);
  assert.match(migration, /Import operation checksum does not match its canonical content/);
  assert.match(migration, /Reconciliation key was reused with a different source, status, or checksum/);
  assert.match(migration, /ctx\.db\.patch\(existing\._id/);
  assert.match(migration, /'updated' as const/);
});

test('offline handoff maps real CRM payloads with deterministic checksums for idempotent Convex import', async () => {
  const directory = tempDirectory();
  try {
    const snapshot = join(directory, 'snapshot.json');
    const config = join(directory, 'payload.json');
    writeJson(snapshot, {
      source: 'payload',
      entities: {
        people: [{
          id: 'legacy-contact-1',
          fullName: 'Private Person',
          email: 'private@example.test',
          state: 'active',
          created: 100,
          updated: 110,
        }],
      },
    });
    writeJson(config, {
      source: 'payload',
      snapshotPath: 'snapshot.json',
      runId: 'fixture-import-001',
      mappings: {
        people: {
          target: 'contacts',
          fields: {
            name: 'fullName',
            emailAddress: 'email',
            status: 'state',
            createdAt: 'created',
            updatedAt: 'updated',
          },
        },
      },
    });

    const first = buildImportHandoff({ sourceConfigPath: config, now: '2026-07-27T00:00:00.000Z' });
    const replay = buildImportHandoff({ sourceConfigPath: config, now: '2026-07-27T00:00:00.000Z' });
    assert.deepEqual(replay, first);
    assert.equal(first.kind, 'convex-import-handoff');
    assert.equal(first.mode, 'offline-no-target-write');
    assert.equal(first.operationCount, 1);
    assert.equal(first.operations[0].operation.entity, 'contacts');
    assert.equal(first.operations[0].operation.payload.emailAddress, 'private@example.test');
    assert.equal(first.operations[0].checksum, contentChecksum(first.operations[0].operation));
    assert.equal(first.operations[0].checksum, await hashCanonicalContent(first.operations[0].operation));
    assert.match(first.operations[0].operation.canonicalId, /^mig_payload_people_[a-f0-9]{24}$/);

    const output = join(directory, 'handoff.json');
    const written = runPrepareImportCli(['--dry-run', '--source-config', config, '--out', output], { root });
    assert.equal(JSON.parse(readFileSync(output, 'utf8')).checksum, written.checksum);
    assert.throws(
      () => runPrepareImportCli(['--dry-run', '--source-config', config, '--out', output], { root }),
      /Refusing to overwrite/,
    );
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('offline handoff rejects duplicate source IDs, unsupported fields, and repository-local private output', () => {
  const directory = tempDirectory();
  try {
    const snapshot = join(directory, 'snapshot.json');
    const config = join(directory, 'directus.json');
    writeJson(snapshot, {
      source: 'directus',
      entities: {
        leads: [
          { id: 1, source: 'form', status: 'new', submittedAt: 1, updatedAt: 2 },
          { id: 1, source: 'form', status: 'new', submittedAt: 1, updatedAt: 2 },
        ],
      },
    });
    writeJson(config, {
      source: 'directus',
      snapshotPath: 'snapshot.json',
      runId: 'fixture-import-duplicate',
      mappings: {
        leads: {
          target: 'leads',
          fields: {
            source: 'source',
            status: 'status',
            submittedAt: 'submittedAt',
            updatedAt: 'updatedAt',
          },
        },
      },
    });
    assert.throws(() => buildImportHandoff({ sourceConfigPath: config }), /duplicate stable source ID/);

    writeJson(snapshot, { source: 'directus', entities: { leads: [{ id: 1, source: 'form', status: 'new', submittedAt: 1, updatedAt: 2 }] } });
    assert.throws(
      () => runPrepareImportCli(['--dry-run', '--source-config', config, '--out', join(root, 'private-handoff.json')], { root }),
      /outside the repository/,
    );
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('CLI rejects omitted dry-run and writes a new report only with explicit config', () => {
  const directory = tempDirectory();
  try {
    const config = join(directory, 'directus.json');
    const output = join(directory, 'report.json');
    writeJson(config, { source: 'directus' });
    assert.throws(() => execFileSync(process.execPath, ['scripts/migrations/inventory.mjs', '--source-config', config, '--out', output], { cwd: root, stdio: 'pipe' }), /--dry-run is required/);
    execFileSync(process.execPath, ['scripts/migrations/inventory.mjs', '--dry-run', '--source-config', config, '--out', output], { cwd: root, stdio: 'pipe' });
    assert.equal(JSON.parse(readFileSync(output, 'utf8')).source, 'directus');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
