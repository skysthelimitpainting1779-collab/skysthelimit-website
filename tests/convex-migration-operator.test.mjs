import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildConvexRunInvocation,
  executeImportHandoff,
  exportTargetInventory,
  runConvexOperatorCli,
  validateDeploymentSelection,
} from '../scripts/migrations/execute-convex.mjs';
import { canonicalId, contentChecksum } from '../scripts/migrations/inventory.mjs';
import { reconcileReports } from '../scripts/migrations/reconcile.mjs';
import { importMappedRecord, targetInventoryPage } from '../convex/migrations.ts';

const selection = {
  deployment: 'preview-migration-123',
  environment: 'preview',
  confirmDeployment: 'preview-migration-123',
};

test('Clerk Preview issuer derivation uses exclusive non-reparse scratch paths', () => {
  const agentScript = readFileSync(join(
    process.cwd(),
    '.agents/skills/convex-migration-operator/scripts/derive-clerk-preview-issuer.ps1',
  ), 'utf8');
  const githubScript = readFileSync(join(
    process.cwd(),
    '.github/skills/convex-migration-operator/scripts/derive-clerk-preview-issuer.ps1',
  ), 'utf8');
  assert.equal(agentScript, githubScript);
  assert.match(agentScript, /\[Guid\]::NewGuid\(\)/);
  assert.match(agentScript, /\[IO\.FileAttributes\]::ReparsePoint/);
  assert.match(agentScript, /\$scratchCreated/);
  assert.match(agentScript, /\$uri\.UserInfo/);
  assert.doesNotMatch(agentScript, /Get-Date -Format/);
  assert.doesNotMatch(agentScript, /New-Item -ItemType Directory -Force -Path \$scratch/);
});

function createMigrationContext() {
  const tables = new Map();
  let nextId = 0;
  return {
    db: {
      query(table) {
        return {
          withIndex(_index, build) {
            const predicates = [];
            build({
              eq(field, value) {
                predicates.push((row) => row[field] === value);
                return this;
              },
              gte(field, value) {
                predicates.push((row) => row[field] >= value);
                return this;
              },
              gt(field, value) {
                predicates.push((row) => row[field] > value);
                return this;
              },
            });
            return {
              async unique() {
                const matches = (tables.get(table) ?? []).filter((row) => predicates.every((predicate) => predicate(row)));
                assert.ok(matches.length <= 1);
                return matches[0] ?? null;
              },
              async take(limit) {
                return (tables.get(table) ?? []).filter((row) => predicates.every((predicate) => predicate(row))).slice(0, limit);
              },
            };
          },
        };
      },
      async insert(table, value) {
        const row = { _id: `${table}:${++nextId}`, ...value };
        const rows = tables.get(table) ?? [];
        rows.push(row);
        tables.set(table, rows);
        return row._id;
      },
      async patch(id, value) {
        for (const rows of tables.values()) {
          const row = rows.find((candidate) => candidate._id === id);
          if (row) {
            Object.assign(row, value);
            return;
          }
        }
        throw new Error(`Unknown record ${id}`);
      },
    },
    tables,
  };
}

function makeHandoff(count = 2) {
  const operations = Array.from({ length: count }, (_, index) => {
    const opaqueId = canonicalId('directus', 'people', index + 1);
    const operation = {
      entity: 'contacts',
      canonicalId: opaqueId,
      payload: {
        name: `Person ${index + 1}`,
        status: 'active',
        createdAt: 100 + index,
        updatedAt: 100 + index,
      },
    };
    return {
      runId: 'operator-fixture-001',
      sourceSystem: 'directus',
      sourceId: opaqueId,
      checksum: contentChecksum(operation),
      operation,
    };
  });
  return {
    version: 1,
    kind: 'convex-import-handoff',
    mode: 'offline-no-target-write',
    generatedAt: '2026-07-27T00:00:00.000Z',
    runId: 'operator-fixture-001',
    source: 'directus',
    operationCount: operations.length,
    checksum: contentChecksum(operations),
    operations,
  };
}

test('executor constructs documented no-push Convex CLI calls with explicit deployment selection', () => {
  const invocation = buildConvexRunInvocation(
    'migrations:importMappedRecord',
    makeHandoff(1).operations[0],
    selection,
    'win32',
  );
  assert.equal(invocation.file, 'npx.cmd');
  assert.deepEqual(invocation.args.slice(0, 4), ['--no-install', 'convex', 'run', 'migrations:importMappedRecord']);
  assert.equal(invocation.args[invocation.args.indexOf('--deployment') + 1], selection.deployment);
  assert.equal(invocation.args.includes('--push'), false);
  assert.equal(invocation.args.includes('--prod'), false);
  assert.throws(
    () => validateDeploymentSelection({ deployment: 'prod', environment: 'production' }),
    /allow-production/,
  );
  assert.deepEqual(
    validateDeploymentSelection({
      deployment: 'prod',
      environment: 'production',
      allowProduction: true,
      confirmDeployment: 'prod',
    }),
    { deployment: 'prod', environment: 'production' },
  );
});

test('handoff validation rejects source relabel attacks even when the attacker recomputes aggregate integrity', async () => {
  const handoff = makeHandoff(1);
  for (const mutate of [
    (value) => { value.source = 'payload'; },
    (value) => { value.operations[0].sourceSystem = 'payload'; },
    (value) => { value.operations[0].sourceId = canonicalId('payload', 'people', 1); },
  ]) {
    const relabeled = structuredClone(handoff);
    mutate(relabeled);
    relabeled.checksum = contentChecksum(relabeled.operations);
    await assert.rejects(
      () => executeImportHandoff(relabeled, { mode: 'dry-run', selection }),
      /source|opaque IDs/i,
    );
  }
});

test('executor handles imported and replay outcomes and stops on behavioral conflicts', async () => {
  const handoff = makeHandoff(2);
  const outcomes = ['imported', 'duplicate'];
  let calls = 0;
  const result = await executeImportHandoff(handoff, {
    mode: 'apply',
    confirmRunId: handoff.runId,
    selection,
    invoke: async (functionName) => functionName === 'migrations:deploymentIdentity'
      ? { environment: 'preview' }
      : { outcome: outcomes[calls++] },
  });
  assert.deepEqual(result.outcomes, { imported: 1, updated: 0, verifiedExisting: 0, duplicate: 1 });
  assert.equal(calls, 2);

  calls = 0;
  await assert.rejects(
    () => executeImportHandoff(handoff, {
      mode: 'apply',
      confirmRunId: handoff.runId,
      selection,
      invoke: async (functionName) => {
        if (functionName === 'migrations:deploymentIdentity') return { environment: 'preview' };
        calls += 1;
        return { outcome: 'conflict' };
      },
    }),
    /stopped on reconciliation conflict/,
  );
  assert.equal(calls, 1);
  await assert.rejects(
    () => executeImportHandoff(handoff, {
      mode: 'apply',
      confirmRunId: 'wrong-run',
      selection,
      invoke: async () => ({ environment: 'preview' }),
    }),
    /confirm-run-id/,
  );

  let mutationCalls = 0;
  await assert.rejects(
    () => executeImportHandoff(handoff, {
      mode: 'apply',
      confirmRunId: handoff.runId,
      selection,
      invoke: async (functionName) => {
        if (functionName === 'migrations:deploymentIdentity') return { environment: 'production' };
        mutationCalls += 1;
        return { outcome: 'imported' };
      },
    }),
    /reports production; expected preview/,
  );
  assert.equal(mutationCalls, 0);
});

test('Convex import mutation records a conflict instead of overwriting different source provenance', async () => {
  const context = createMigrationContext();
  const first = makeHandoff(1).operations[0];
  const imported = await importMappedRecord._handler(context, first);
  assert.equal(imported.outcome, 'imported');

  const conflictingSource = {
    ...first,
    runId: 'operator-fixture-002',
    sourceSystem: 'payload',
    sourceId: canonicalId('payload', 'people', 1),
  };
  const conflict = await importMappedRecord._handler(context, conflictingSource);
  assert.equal(conflict.outcome, 'conflict');
  assert.equal(context.tables.get('contacts')[0].sourceSystem, 'directus');
  assert.equal(context.tables.get('contacts')[0].sourceId, first.sourceId);
  assert.deepEqual(context.tables.get('migrationReconciliation').map(({ status }) => status), ['verified', 'conflict']);
});

test('target inventory recomputes current payload integrity and cannot false-pass after target mutation', async () => {
  const context = createMigrationContext();
  const handoff = makeHandoff(1);
  const item = handoff.operations[0];
  assert.equal((await importMappedRecord._handler(context, item)).outcome, 'imported');
  const original = await targetInventoryPage._handler(context, { entity: 'contacts', limit: 100 });
  assert.equal(original.items[0].status, 'verified');
  assert.equal(original.items[0].checksum, item.checksum);

  context.tables.get('contacts')[0].name = 'Mutated after import';
  const mutated = await targetInventoryPage._handler(context, { entity: 'contacts', limit: 100 });
  assert.equal(mutated.items[0].status, 'conflict');
  assert.notEqual(mutated.items[0].checksum, item.checksum);

  const target = await exportTargetInventory({
    selection,
    invoke: async (functionName, args) => {
      if (functionName === 'migrations:deploymentIdentity') return { environment: 'preview' };
      return targetInventoryPage._handler(context, args);
    },
  });
  const reconciliation = reconcileReports(handoff, target);
  assert.equal(reconciliation.summary.conflictEntities, 1);
  assert.equal(reconciliation.summary.checksumMismatches, 1);
});

test('target inventory exporter paginates opaque metadata only and feeds checksum reconciliation', async () => {
  const handoff = makeHandoff(2);
  const contactRecords = handoff.operations.map(({ operation, checksum }) => ({
    entity: 'contacts',
    canonicalId: operation.canonicalId,
    checksum,
    status: 'verified',
  }));
  const invocations = [];
  const target = await exportTargetInventory({
    selection,
    invoke: async (functionName, args) => {
      invocations.push({ functionName, args });
      if (functionName === 'migrations:deploymentIdentity') return { environment: 'preview' };
      if (args.entity !== 'contacts') return { items: [], nextAfter: null };
      if (!args.after) return { items: [contactRecords[0]], nextAfter: contactRecords[0].canonicalId };
      return { items: [contactRecords[1]], nextAfter: null };
    },
  });
  assert.equal(target.kind, 'convex-target-inventory');
  assert.deepEqual(target.entities.find(({ entity }) => entity === 'contacts').records, contactRecords.map(({ entity: _entity, ...record }) => record));
  assert.equal(invocations.filter(({ functionName, args }) => functionName === 'migrations:targetInventoryPage' && args.entity === 'contacts').length, 2);
  assert.doesNotMatch(JSON.stringify(target), /Person 1|email|phone/i);

  const matched = reconcileReports(handoff, target);
  assert.equal(matched.summary.conflictEntities, 0);
  assert.equal(matched.summary.checksumMismatches, 0);

  const changedTarget = structuredClone(target);
  const changedContacts = changedTarget.entities.find(({ entity }) => entity === 'contacts');
  changedContacts.records[0].checksum = `sha256:${'0'.repeat(64)}`;
  changedContacts.checksum = contentChecksum(changedContacts.records);
  const conflict = reconcileReports(handoff, changedTarget);
  assert.equal(conflict.summary.conflictEntities, 1);
  assert.equal(conflict.summary.checksumMismatches, 1);
  assert.deepEqual(conflict.entities[0].plannedActions[0], {
    canonicalId: handoff.operations[0].operation.canonicalId,
    action: 'update-if-approved',
  });
});

test('operator apply mode exports a real target inventory path without live calls in tests', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'stl-convex-operator-'));
  try {
    const handoff = makeHandoff(1);
    const handoffPath = join(directory, 'handoff.json');
    const targetPath = join(directory, 'target.json');
    writeFileSync(handoffPath, JSON.stringify(handoff), 'utf8');
    const result = await runConvexOperatorCli([
      '--apply',
      '--handoff', handoffPath,
      '--deployment', selection.deployment,
      '--environment', selection.environment,
      '--confirm-run-id', handoff.runId,
      '--confirm-deployment', selection.deployment,
      '--out', targetPath,
    ], {
      root: process.cwd(),
      invoke: async (functionName, args) => {
        if (functionName === 'migrations:deploymentIdentity') return { environment: 'preview' };
        if (functionName === 'migrations:importMappedRecord') return { outcome: 'imported' };
        if (args.entity === 'contacts') {
          const item = handoff.operations[0];
          return {
            items: [{
              entity: 'contacts',
              canonicalId: item.operation.canonicalId,
              checksum: item.checksum,
              status: 'verified',
            }],
            nextAfter: null,
          };
        }
        return { items: [], nextAfter: null };
      },
    });
    assert.equal(result.outcomes.imported, 1);
    assert.equal(JSON.parse(readFileSync(targetPath, 'utf8')).kind, 'convex-target-inventory');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
