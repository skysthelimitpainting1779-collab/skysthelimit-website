import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import Database from 'better-sqlite3';

const rootUrl = new URL('../', import.meta.url);
const moduleUrl = new URL(
  'scripts/execution/control-plane-ledgers.mjs',
  rootUrl,
);
const schemaUrl = new URL(
  '.agents/governance/control-plane-ledgers.schema.json',
  rootUrl,
);
const legacyApprovalTableSql = `
  CREATE TABLE lifecycle_approval_events (
    approval_event_id TEXT PRIMARY KEY,
    program_id TEXT NOT NULL,
    scope TEXT NOT NULL,
    environment TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    actor TEXT NOT NULL,
    commit_sha TEXT NOT NULL,
    exact_approval_text TEXT,
    production_mutation_authorized INTEGER NOT NULL,
    recorded_at TEXT NOT NULL,
    supersedes_event_id TEXT
  );
`;

test('control-plane ledgers project live execution state and explicit approvals', async () => {
  assert.equal(existsSync(moduleUrl), true, 'ledger module is missing');
  assert.equal(existsSync(schemaUrl), true, 'ledger schema is missing');

  const directory = mkdtempSync(join(tmpdir(), 'control-plane-ledgers-'));
  const databasePath = join(directory, 'graphify.db');
  const database = new Database(databasePath);
  try {
    database.exec(`
      CREATE TABLE execution_graph_imports (
        graph_id TEXT PRIMARY KEY,
        program_id TEXT NOT NULL UNIQUE,
        production_mutation_authorized INTEGER NOT NULL
      );
      CREATE TABLE lifecycle_writer_leases (
        program_id TEXT PRIMARY KEY,
        checkpoint_id TEXT NOT NULL,
        node_id TEXT NOT NULL,
        stage_id TEXT NOT NULL,
        actor TEXT NOT NULL,
        session_id TEXT NOT NULL,
        head_sha TEXT NOT NULL,
        acquired_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
      CREATE TABLE lifecycle_handoffs (
        handoff_id TEXT PRIMARY KEY,
        program_id TEXT NOT NULL,
        checkpoint_id TEXT NOT NULL,
        node_id TEXT NOT NULL,
        stage_id TEXT NOT NULL,
        from_actor TEXT NOT NULL,
        to_role TEXT,
        status TEXT NOT NULL,
        head_sha TEXT NOT NULL,
        next_node TEXT NOT NULL,
        next_stage TEXT NOT NULL,
        summary TEXT NOT NULL,
        blockers_json TEXT NOT NULL,
        evidence_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        accepted_by TEXT,
        accepted_session_id TEXT,
        accepted_at TEXT
      );
    `);
    database
      .prepare(
        'INSERT INTO execution_graph_imports VALUES (?, ?, ?)',
      )
      .run('program', 'test-program', 0);
    database
      .prepare(
        `INSERT INTO lifecycle_writer_leases
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        'test-program',
        'cp-test-001',
        'ORCH-002',
        'stage:ORCH-002:acquire_writer_mutex',
        'agent:orchestrator',
        'session:test',
        'a'.repeat(40),
        '2026-07-29T14:00:00Z',
        '2099-07-29T15:00:00Z',
      );
    database
      .prepare(
        `INSERT INTO lifecycle_handoffs
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        'handoff-test',
        'test-program',
        'cp-previous',
        'ORCH-001',
        'stage:ORCH-001:complete',
        'agent:orchestrator',
        'orchestrator',
        'accepted',
        'a'.repeat(40),
        'ORCH-002',
        'stage:ORCH-002:acquire_writer_mutex',
        'Continue sequential execution.',
        JSON.stringify(['Human merge approval required.']),
        '[]',
        '2026-07-29T13:59:00Z',
        'agent:orchestrator',
        'session:test',
        '2026-07-29T14:00:00Z',
      );
  } finally {
    database.close();
  }

  try {
    const {
      appendApprovalEvent,
      initializeApprovalLedger,
      projectControlPlaneLedgers,
      validateControlPlaneLedgers,
    } = await import(moduleUrl);

    initializeApprovalLedger(databasePath);
    const pending = appendApprovalEvent(databasePath, {
      approvalEventId: 'approval-production-required-001',
      programId: 'test-program',
      scope: 'production-mutation',
      environment: 'production',
      action: 'mutate',
      status: 'required',
      actor: 'policy:external-access',
      commitSha: 'a'.repeat(40),
      exactApprovalText: null,
      productionMutationAuthorized: false,
      recordedAt: '2026-07-29T14:01:00Z',
    });
    assert.equal(pending.status, 'required');

    assert.throws(
      () =>
        appendApprovalEvent(databasePath, {
          ...pending,
          approvalEventId: 'approval-production-invalid-001',
          status: 'granted',
          exactApprovalText: 'Broad approval',
        }),
      /explicit Production authorization/i,
    );
    assert.throws(
      () =>
        appendApprovalEvent(databasePath, {
          ...pending,
          approvalEventId: 'approval-preview-invalid-001',
          environment: 'preview',
          status: 'granted',
          exactApprovalText: 'Approve Preview only.',
          productionMutationAuthorized: true,
        }),
      /only Production grants may authorize Production mutation/i,
    );
    assert.throws(
      () =>
        appendApprovalEvent(databasePath, {
          ...pending,
          approvalEventId: 'approval-self-supersession-001',
          supersedesEventId: 'approval-self-supersession-001',
        }),
      /cannot supersede itself/i,
    );
    assert.throws(
      () =>
        appendApprovalEvent(databasePath, {
          ...pending,
          approvalEventId: 'approval-cross-program-001',
          programId: 'another-program',
          supersedesEventId: pending.approvalEventId,
        }),
      /same program/i,
    );

    const ledgers = projectControlPlaneLedgers(
      databasePath,
      'test-program',
    );
    assert.deepEqual(validateControlPlaneLedgers(ledgers), []);
    assert.equal(ledgers.execution.currentNode, 'ORCH-002');
    assert.equal(ledgers.execution.commitSha, 'a'.repeat(40));
    assert.equal(ledgers.execution.productionMutationAuthorized, false);
    assert.deepEqual(ledgers.execution.blockers, [
      'Human merge approval required.',
    ]);
    assert.equal(ledgers.execution.nextAction.nodeId, 'ORCH-002');
    assert.equal(ledgers.approvals.events.length, 1);
    assert.equal(
      ledgers.approvals.events[0].productionMutationAuthorized,
      false,
    );

    const direct = new Database(databasePath);
    try {
      assert.throws(
        () =>
          direct
            .prepare(
              `UPDATE lifecycle_approval_events
               SET status = 'granted',
                   production_mutation_authorized = 1
               WHERE approval_event_id = ?`,
            )
            .run(pending.approvalEventId),
        /append-only/i,
      );
      assert.throws(
        () =>
          direct
            .prepare(
              `SELECT rowid
               FROM lifecycle_approval_events
               WHERE approval_event_id = ?`,
            )
            .get(pending.approvalEventId),
        /rowid/i,
      );
      assert.throws(
        () =>
          direct
            .prepare(
              `INSERT INTO lifecycle_approval_events (
                rowid, approval_event_id, program_id, scope, environment,
                action, status, actor, commit_sha, exact_approval_text,
                production_mutation_authorized, recorded_at, supersedes_event_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .run(
              -1,
              'approval-negative-rowid-seed-001',
              'test-program',
              'production-mutation',
              'production',
              'mutate',
              'required',
              'agent:test',
              'a'.repeat(40),
              null,
              0,
              '2026-07-29T14:02:00Z',
              null,
            ),
        /rowid/i,
      );
      assert.throws(
        () =>
          direct
            .prepare(
              'DELETE FROM lifecycle_approval_events WHERE approval_event_id = ?',
            )
            .run(pending.approvalEventId),
        /append-only/i,
      );
      assert.throws(
        () =>
          direct
            .prepare(
              `INSERT INTO lifecycle_approval_events
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .run(
              'approval-preview-no-text-001',
              'test-program',
              'preview-change',
              'preview',
              'mutate',
              'granted',
              'reviewer:test',
              'a'.repeat(40),
              null,
              0,
              '2026-07-29T14:02:00Z',
              null,
            ),
        /exact approval text/i,
      );
      assert.throws(
        () =>
          direct
            .prepare(
              `INSERT OR REPLACE INTO lifecycle_approval_events
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .run(
              pending.approvalEventId,
              'test-program',
              'production-mutation',
              'production',
              'mutate',
              'granted',
              'reviewer:test',
              'a'.repeat(40),
              'Approve Production mutation.',
              1,
              '2026-07-29T14:02:00Z',
              null,
            ),
        /append-only/i,
      );
      direct
        .prepare(
          'UPDATE lifecycle_handoffs SET blockers_json = ? WHERE handoff_id = ?',
        )
        .run('[{"message":"blocked"}]', 'handoff-test');
    } finally {
      direct.close();
    }
    assert.throws(
      () => projectControlPlaneLedgers(databasePath, 'test-program'),
      /blockers_json must contain only non-empty strings/i,
    );

    const reset = new Database(databasePath);
    try {
      reset
        .prepare(
          'UPDATE lifecycle_handoffs SET blockers_json = ? WHERE handoff_id = ?',
        )
        .run('[]', 'handoff-test');
      reset.prepare('DELETE FROM lifecycle_writer_leases').run();
    } finally {
      reset.close();
    }
    assert.throws(
      () => projectControlPlaneLedgers(databasePath, 'test-program'),
      /no active lease or pending handoff/i,
    );

    const invalidDate = structuredClone(ledgers);
    invalidDate.execution.projectedAt = '2026-07-29';
    assert.match(
      validateControlPlaneLedgers(invalidDate).join('\n'),
      /projectedAt/,
    );
    invalidDate.execution.projectedAt = '2026-02-30T00:00:00Z';
    assert.match(
      validateControlPlaneLedgers(invalidDate).join('\n'),
      /projectedAt/,
    );

    const whitespaceApproval = structuredClone(ledgers);
    whitespaceApproval.approvals.events[0] = {
      ...whitespaceApproval.approvals.events[0],
      environment: 'production',
      status: 'granted',
      exactApprovalText: '   ',
      productionMutationAuthorized: true,
    };
    assert.match(
      validateControlPlaneLedgers(whitespaceApproval).join('\n'),
      /exactApprovalText/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('approval ledger safely migrates an empty legacy table', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'control-plane-migration-'));
  const databasePath = join(directory, 'graphify.db');
  const database = new Database(databasePath);
  database.exec('CREATE TABLE lifecycle_approval_events (id TEXT)');
  database.close();

  try {
    const { initializeApprovalLedger } = await import(moduleUrl);
    initializeApprovalLedger(databasePath);
    const migrated = new Database(databasePath, { readonly: true });
    try {
      const columns = migrated
        .prepare('PRAGMA table_info(lifecycle_approval_events)')
        .all()
        .map(({ name }) => name);
      assert.ok(columns.includes('approval_event_id'));
      assert.ok(columns.includes('program_id'));
      assert.ok(columns.includes('production_mutation_authorized'));
    } finally {
      migrated.close();
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('approval ledger rejects invalid rows from a prior all-column schema', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'control-plane-history-'));
  const databasePath = join(directory, 'graphify.db');
  const database = new Database(databasePath);
  database.exec(legacyApprovalTableSql);
  database
    .prepare(
      `INSERT INTO lifecycle_approval_events
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      'approval-invalid-history-001',
      'test-program',
      'preview-change',
      'preview',
      'mutate',
      'granted',
      'reviewer:test',
      'a'.repeat(40),
      null,
      1,
      '2026-07-29T14:02:00Z',
      null,
    );
  database.close();

  try {
    const { initializeApprovalLedger } = await import(moduleUrl);
    assert.throws(
      () => initializeApprovalLedger(databasePath),
      /existing approval ledger contains invalid event/i,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('approval ledger rejects cyclic and non-boolean legacy histories', async () => {
  const { initializeApprovalLedger } = await import(moduleUrl);
  for (const scenario of ['cycle', 'boolean-domain']) {
    const directory = mkdtempSync(
      join(tmpdir(), `control-plane-${scenario}-`),
    );
    const databasePath = join(directory, 'graphify.db');
    const database = new Database(databasePath);
    database.exec(legacyApprovalTableSql);
    const insert = database.prepare(
      `INSERT INTO lifecycle_approval_events
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    if (scenario === 'cycle') {
      insert.run(
        'approval-cycle-a',
        'test-program',
        'preview-change',
        'preview',
        'mutate',
        'required',
        'policy:test',
        'a'.repeat(40),
        null,
        0,
        '2026-07-29T14:02:00Z',
        'approval-cycle-b',
      );
      insert.run(
        'approval-cycle-b',
        'test-program',
        'preview-change',
        'preview',
        'mutate',
        'required',
        'policy:test',
        'a'.repeat(40),
        null,
        0,
        '2026-07-29T14:03:00Z',
        'approval-cycle-a',
      );
    } else {
      insert.run(
        'approval-invalid-boolean',
        'test-program',
        'production-mutation',
        'production',
        'mutate',
        'granted',
        'reviewer:test',
        'a'.repeat(40),
        'Approve Production mutation.',
        2,
        '2026-07-29T14:02:00Z',
        null,
      );
    }
    database.close();

    try {
      assert.throws(
        () => initializeApprovalLedger(databasePath),
        scenario === 'cycle'
          ? /supersession cycle/i
          : /boolean domain/i,
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});

test('approval ledger upgrades stale owned triggers', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'control-plane-triggers-'));
  const databasePath = join(directory, 'graphify.db');
  const database = new Database(databasePath);
  database.exec(`
    ${legacyApprovalTableSql}
    CREATE TRIGGER lifecycle_approval_events_validate_insert
      BEFORE INSERT ON lifecycle_approval_events
      BEGIN
        SELECT 1;
      END;
  `);
  database
    .prepare(
      `INSERT INTO lifecycle_approval_events
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      'approval-existing-001',
      'test-program',
      'preview-change',
      'preview',
      'mutate',
      'required',
      'policy:test',
      'a'.repeat(40),
      null,
      0,
      '2026-07-29T14:02:00Z',
      null,
    );
  database.close();

  try {
    const { initializeApprovalLedger } = await import(moduleUrl);
    initializeApprovalLedger(databasePath);
    const migrated = new Database(databasePath);
    try {
      assert.throws(
        () =>
          migrated
            .prepare(
              `INSERT OR REPLACE INTO lifecycle_approval_events
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .run(
              'approval-existing-001',
              'test-program',
              'production-mutation',
              'production',
              'mutate',
              'granted',
              'reviewer:test',
              'a'.repeat(40),
              'Approve Production mutation.',
              1,
              '2026-07-29T14:03:00Z',
              null,
            ),
        /append-only/i,
      );
    } finally {
      migrated.close();
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
