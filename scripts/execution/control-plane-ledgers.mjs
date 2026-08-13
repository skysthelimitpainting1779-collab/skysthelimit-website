#!/usr/bin/env node
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const schema = JSON.parse(
  readFileSync(
    new URL(
      '../../.agents/governance/control-plane-ledgers.schema.json',
      import.meta.url,
    ),
    'utf8',
  ),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validateSchema = ajv.compile(schema);
const approvalColumns = [
  'approval_event_id',
  'program_id',
  'scope',
  'environment',
  'action',
  'status',
  'actor',
  'commit_sha',
  'exact_approval_text',
  'production_mutation_authorized',
  'recorded_at',
  'supersedes_event_id',
];

function runtimeDatabasePath() {
  if (process.env.SKY_DEV_RUNTIME) {
    return join(process.env.SKY_DEV_RUNTIME, 'graphify.db');
  }
  if (process.env.LOCALAPPDATA) {
    return join(
      process.env.LOCALAPPDATA,
      'SkyDevControlPlane',
      'graphify.db',
    );
  }
  return join(
    homedir(),
    '.local',
    'share',
    'sky-dev-control-plane',
    'graphify.db',
  );
}

function parseStringArray(value, field) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${field} must contain valid JSON`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`${field} must contain a JSON array`);
  }
  if (
    parsed.some(
      (item) => typeof item !== 'string' || !item.trim(),
    )
  ) {
    throw new Error(`${field} must contain only non-empty strings`);
  }
  if (new Set(parsed).size !== parsed.length) {
    throw new Error(`${field} must not contain duplicates`);
  }
  return parsed;
}

function mapApproval(row) {
  return {
    approvalEventId: row.approval_event_id,
    programId: row.program_id,
    scope: row.scope,
    environment: row.environment,
    action: row.action,
    status: row.status,
    actor: row.actor,
    commitSha: row.commit_sha,
    exactApprovalText: row.exact_approval_text,
    productionMutationAuthorized: Boolean(
      row.production_mutation_authorized,
    ),
    recordedAt: row.recorded_at,
    supersedesEventId: row.supersedes_event_id,
  };
}

function approvalValidationEnvelope(event) {
  return {
    execution: {
      schemaVersion: '1.0.0',
      programId: event.programId,
      checkpointId: 'cp-validation-only',
      currentNode: 'validation-only',
      currentStage: 'validation-only',
      status: 'active',
      commitSha: event.commitSha,
      blockers: [],
      nextAction: {
        nodeId: 'validation-only',
        stageId: 'validation-only',
        summary: 'Validate approval event.',
      },
      productionMutationAuthorized: false,
      projectedAt: event.recordedAt,
    },
    approvals: {
      schemaVersion: '1.0.0',
      programId: event.programId,
      events: [event],
    },
  };
}

function approvalTableSql(tableName, ifNotExists = false) {
  if (
    ![
      'lifecycle_approval_events',
      'lifecycle_approval_events_rowid_legacy',
    ].includes(tableName)
  ) {
    throw new Error(`unsupported approval ledger table name: ${tableName}`);
  }
  return `
    CREATE TABLE ${ifNotExists ? 'IF NOT EXISTS ' : ''}${tableName} (
      approval_event_id TEXT PRIMARY KEY,
      program_id TEXT NOT NULL,
      scope TEXT NOT NULL,
      environment TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL
        CHECK (status IN ('required', 'granted', 'denied', 'revoked', 'expired')),
      actor TEXT NOT NULL,
      commit_sha TEXT NOT NULL,
      exact_approval_text TEXT,
      production_mutation_authorized INTEGER NOT NULL
        CHECK (production_mutation_authorized IN (0, 1)),
      recorded_at TEXT NOT NULL,
      supersedes_event_id TEXT,
      FOREIGN KEY (supersedes_event_id)
        REFERENCES ${tableName}(approval_event_id)
    ) WITHOUT ROWID;
  `;
}

function auditApprovalLedger(database) {
  const rows = database
    .prepare(
      `SELECT *
       FROM lifecycle_approval_events
       ORDER BY recorded_at, approval_event_id`,
    )
    .all();
  const eventsById = new Map(
    rows.map((row) => [row.approval_event_id, row]),
  );
  for (const row of rows) {
    const event = mapApproval(row);
    const errors = validateControlPlaneLedgers(
      approvalValidationEnvelope(event),
    );
    if (![0, 1].includes(row.production_mutation_authorized)) {
      errors.push(
        'production_mutation_authorized is outside the boolean domain',
      );
    }
    const prior = row.supersedes_event_id
      ? eventsById.get(row.supersedes_event_id)
      : null;
    if (
      row.supersedes_event_id === row.approval_event_id ||
      (row.supersedes_event_id &&
        (!prior || prior.program_id !== row.program_id))
    ) {
      errors.push('supersession must target an event in the same program');
    }
    if (errors.length) {
      throw new Error(
        `existing approval ledger contains invalid event ${row.approval_event_id}: ${errors.join('; ')}`,
      );
    }
  }
  for (const row of rows) {
    const visited = new Set();
    let current = row;
    while (current?.supersedes_event_id) {
      if (visited.has(current.approval_event_id)) {
        throw new Error(
          `existing approval ledger contains supersession cycle at ${current.approval_event_id}`,
        );
      }
      visited.add(current.approval_event_id);
      current = eventsById.get(current.supersedes_event_id);
    }
  }
}

function migrateApprovalLedgerWithoutRowid(database) {
  const migrationTable = database
    .prepare(
      `SELECT name
       FROM sqlite_master
       WHERE type = 'table'
         AND name = 'lifecycle_approval_events_rowid_legacy'`,
    )
    .get();
  if (migrationTable) {
    throw new Error(
      'approval ledger migration table already exists; manual recovery is required',
    );
  }
  const migrate = database.transaction(() => {
    database.exec(`
      DROP TRIGGER IF EXISTS lifecycle_approval_events_no_update;
      DROP TRIGGER IF EXISTS lifecycle_approval_events_no_delete;
      DROP TRIGGER IF EXISTS lifecycle_approval_events_validate_insert;
      ALTER TABLE lifecycle_approval_events
        RENAME TO lifecycle_approval_events_rowid_legacy;
      ${approvalTableSql('lifecycle_approval_events')}
      INSERT INTO lifecycle_approval_events (${approvalColumns.join(', ')})
        SELECT ${approvalColumns.join(', ')}
        FROM lifecycle_approval_events_rowid_legacy;
      DROP TABLE lifecycle_approval_events_rowid_legacy;
    `);
  });
  migrate();
}

export function initializeApprovalLedger(databasePath = runtimeDatabasePath()) {
  const database = new Database(resolve(databasePath));
  try {
    let existing = database
      .prepare(
        `SELECT name, sql
         FROM sqlite_master
         WHERE type = 'table' AND name = 'lifecycle_approval_events'`,
      )
      .get();
    if (existing) {
      const columns = database
        .prepare('PRAGMA table_info(lifecycle_approval_events)')
        .all()
        .map(({ name }) => name);
      const currentSchema = approvalColumns.every((name) =>
        columns.includes(name),
      );
      if (!currentSchema) {
        const count = database
          .prepare(
            'SELECT COUNT(*) AS count FROM lifecycle_approval_events',
          )
          .get().count;
        if (count > 0) {
          throw new Error(
            'legacy lifecycle_approval_events contains rows; manual migration is required',
          );
        }
        database.exec('DROP TABLE lifecycle_approval_events');
        existing = null;
      }
    }
    if (existing) {
      auditApprovalLedger(database);
      if (!/\bWITHOUT\s+ROWID\b/i.test(existing.sql || '')) {
        migrateApprovalLedgerWithoutRowid(database);
      }
    }
    database.exec(`
      DROP TRIGGER IF EXISTS lifecycle_approval_events_no_update;
      DROP TRIGGER IF EXISTS lifecycle_approval_events_no_delete;
      DROP TRIGGER IF EXISTS lifecycle_approval_events_validate_insert;
      ${approvalTableSql('lifecycle_approval_events', true)}
      CREATE INDEX IF NOT EXISTS lifecycle_approval_events_program_recorded
        ON lifecycle_approval_events(program_id, recorded_at, approval_event_id);
      CREATE INDEX IF NOT EXISTS lifecycle_approval_events_scope
        ON lifecycle_approval_events(program_id, scope, environment, action);
      CREATE TRIGGER IF NOT EXISTS lifecycle_approval_events_no_update
        BEFORE UPDATE ON lifecycle_approval_events
        BEGIN
          SELECT RAISE(ABORT, 'lifecycle approval events are append-only');
        END;
      CREATE TRIGGER IF NOT EXISTS lifecycle_approval_events_no_delete
        BEFORE DELETE ON lifecycle_approval_events
        BEGIN
          SELECT RAISE(ABORT, 'lifecycle approval events are append-only');
        END;
      CREATE TRIGGER IF NOT EXISTS lifecycle_approval_events_validate_insert
        BEFORE INSERT ON lifecycle_approval_events
        BEGIN
          SELECT CASE
            WHEN EXISTS (
              SELECT 1
              FROM lifecycle_approval_events AS existing
              WHERE existing.approval_event_id = NEW.approval_event_id
            )
            THEN RAISE(
              ABORT,
              'lifecycle approval events are append-only'
            )
          END;
          SELECT CASE
            WHEN NEW.production_mutation_authorized = 1
              AND NOT (
                NEW.status = 'granted'
                AND lower(NEW.environment) IN ('production', 'live')
                AND NEW.exact_approval_text IS NOT NULL
                AND length(trim(NEW.exact_approval_text)) > 0
              )
            THEN RAISE(
              ABORT,
              'only explicit Production grants may authorize Production mutation'
            )
          END;
          SELECT CASE
            WHEN NEW.status = 'granted'
              AND (
                NEW.exact_approval_text IS NULL
                OR length(trim(NEW.exact_approval_text)) = 0
              )
            THEN RAISE(
              ABORT,
              'granted approvals require exact approval text'
            )
          END;
          SELECT CASE
            WHEN NEW.status = 'granted'
              AND lower(NEW.environment) IN ('production', 'live')
              AND (
                NEW.production_mutation_authorized != 1
                OR NEW.exact_approval_text IS NULL
                OR length(trim(NEW.exact_approval_text)) = 0
              )
            THEN RAISE(
              ABORT,
              'Production grants require explicit Production authorization'
            )
          END;
          SELECT CASE
            WHEN NEW.supersedes_event_id = NEW.approval_event_id
            THEN RAISE(ABORT, 'an approval event cannot supersede itself')
          END;
          SELECT CASE
            WHEN NEW.supersedes_event_id IS NOT NULL
              AND NOT EXISTS (
                SELECT 1
                FROM lifecycle_approval_events AS prior
                WHERE prior.approval_event_id = NEW.supersedes_event_id
                  AND prior.program_id = NEW.program_id
              )
            THEN RAISE(
              ABORT,
              'superseded approval event must exist in the same program'
            )
          END;
        END;
    `);
    auditApprovalLedger(database);
  } finally {
    database.close();
  }
  return { databasePath: resolve(databasePath), initialized: true };
}

export function appendApprovalEvent(
  databasePath = runtimeDatabasePath(),
  event,
) {
  const normalized = {
    approvalEventId: String(event?.approvalEventId || ''),
    programId: String(event?.programId || ''),
    scope: String(event?.scope || ''),
    environment: String(event?.environment || ''),
    action: String(event?.action || ''),
    status: String(event?.status || ''),
    actor: String(event?.actor || ''),
    commitSha: String(event?.commitSha || ''),
    exactApprovalText:
      event?.exactApprovalText === null
        ? null
        : String(event?.exactApprovalText || ''),
    productionMutationAuthorized:
      event?.productionMutationAuthorized === true,
    recordedAt: String(event?.recordedAt || new Date().toISOString()),
    supersedesEventId: event?.supersedesEventId
      ? String(event.supersedesEventId)
      : null,
  };

  const isProductionGrant =
    normalized.status === 'granted' &&
    /^(?:production|live)$/i.test(normalized.environment);
  if (
    isProductionGrant &&
    (!normalized.productionMutationAuthorized ||
      !normalized.exactApprovalText?.trim())
  ) {
    throw new Error(
      'Production grants require explicit Production authorization and exact approval text',
    );
  }
  if (
    normalized.productionMutationAuthorized &&
    !isProductionGrant
  ) {
    throw new Error(
      'only Production grants may authorize Production mutation',
    );
  }
  if (
    normalized.status === 'granted' &&
    !normalized.exactApprovalText?.trim()
  ) {
    throw new Error('granted approvals require exact approval text');
  }
  if (
    normalized.supersedesEventId === normalized.approvalEventId
  ) {
    throw new Error('an approval event cannot supersede itself');
  }

  const validationErrors = validateControlPlaneLedgers(
    approvalValidationEnvelope(normalized),
  );
  if (validationErrors.length) {
    throw new Error(validationErrors.join('; '));
  }

  initializeApprovalLedger(databasePath);
  const database = new Database(resolve(databasePath));
  try {
    if (normalized.supersedesEventId) {
      const prior = database
        .prepare(
          `SELECT program_id
           FROM lifecycle_approval_events
           WHERE approval_event_id = ?`,
        )
        .get(normalized.supersedesEventId);
      if (!prior || prior.program_id !== normalized.programId) {
        throw new Error(
          'superseded approval event must exist in the same program',
        );
      }
    }
    database
      .prepare(
        `INSERT INTO lifecycle_approval_events (
          approval_event_id, program_id, scope, environment, action, status,
          actor, commit_sha, exact_approval_text,
          production_mutation_authorized, recorded_at, supersedes_event_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        normalized.approvalEventId,
        normalized.programId,
        normalized.scope,
        normalized.environment,
        normalized.action,
        normalized.status,
        normalized.actor,
        normalized.commitSha,
        normalized.exactApprovalText,
        normalized.productionMutationAuthorized ? 1 : 0,
        normalized.recordedAt,
        normalized.supersedesEventId,
      );
  } finally {
    database.close();
  }
  return normalized;
}

export function projectControlPlaneLedgers(
  databasePath = runtimeDatabasePath(),
  programId,
) {
  initializeApprovalLedger(databasePath);
  const database = new Database(resolve(databasePath), { readonly: true });
  database.pragma('query_only = ON');
  try {
    const program = database
      .prepare(
        `SELECT production_mutation_authorized
         FROM execution_graph_imports
         WHERE program_id = ?`,
      )
      .get(programId);
    if (!program) throw new Error(`unknown execution program: ${programId}`);
    if (Boolean(program.production_mutation_authorized)) {
      throw new Error('execution graph unexpectedly authorizes Production mutation');
    }

    const lease = database
      .prepare(
        `SELECT *
         FROM lifecycle_writer_leases
         WHERE program_id = ?`,
      )
      .get(programId);
    const handoff = lease
      ? database
          .prepare(
            `SELECT *
             FROM lifecycle_handoffs
             WHERE program_id = ?
               AND next_node = ?
               AND status = 'accepted'
             ORDER BY created_at DESC, handoff_id DESC
             LIMIT 1`,
          )
          .get(programId, lease.node_id)
      : database
          .prepare(
            `SELECT *
             FROM lifecycle_handoffs
             WHERE program_id = ?
               AND status = 'pending'
             ORDER BY created_at DESC, handoff_id DESC
             LIMIT 1`,
          )
          .get(programId);
    if (!lease && !handoff) {
      throw new Error(
        `no active lease or pending handoff for program: ${programId}`,
      );
    }

    const active = Boolean(
      lease && Date.parse(lease.expires_at) > Date.now(),
    );
    const currentNode = lease?.node_id || handoff.next_node;
    const currentStage = lease?.stage_id || handoff.next_stage;
    const checkpointId = lease?.checkpoint_id || handoff.checkpoint_id;
    const commitSha = lease?.head_sha || handoff.head_sha;
    const blockers = handoff
      ? parseStringArray(handoff.blockers_json, 'blockers_json')
      : [];

    const events = database
      .prepare(
        `SELECT *
         FROM lifecycle_approval_events
         WHERE program_id = ?
         ORDER BY recorded_at, approval_event_id`,
      )
      .all(programId)
      .map(mapApproval);
    return {
      execution: {
        schemaVersion: '1.0.0',
        programId,
        checkpointId,
        currentNode,
        currentStage,
        status: lease
          ? active
            ? 'active'
            : 'lease-expired'
          : 'handoff-pending',
        commitSha,
        blockers,
        nextAction: {
          nodeId: currentNode,
          stageId: currentStage,
          summary: lease
            ? `Continue ${currentNode} under ${checkpointId}.`
            : handoff.summary,
        },
        productionMutationAuthorized: false,
        projectedAt: new Date().toISOString(),
      },
      approvals: {
        schemaVersion: '1.0.0',
        programId,
        events,
      },
    };
  } finally {
    database.close();
  }
}

export function validateControlPlaneLedgers(ledgers) {
  if (validateSchema(ledgers)) return [];
  return validateSchema.errors.map(
    ({ instancePath, message }) =>
      `${instancePath || '$'} ${message}`,
  );
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function main() {
  const command = process.argv[2] || 'query';
  const databasePath = argument('--database') || runtimeDatabasePath();
  if (command === 'init') {
    console.log(
      JSON.stringify(initializeApprovalLedger(databasePath), null, 2),
    );
    return;
  }
  if (command === 'record') {
    const input = argument('--input');
    if (!input) throw new Error('record requires --input <event.json>');
    const event = JSON.parse(readFileSync(resolve(input), 'utf8'));
    console.log(
      JSON.stringify(appendApprovalEvent(databasePath, event), null, 2),
    );
    return;
  }
  if (command !== 'query') {
    throw new Error(`unknown command: ${command}`);
  }
  const programId = argument('--program');
  if (!programId) throw new Error('query requires --program <program-id>');
  const ledgers = projectControlPlaneLedgers(databasePath, programId);
  const errors = validateControlPlaneLedgers(ledgers);
  if (errors.length) throw new Error(errors.join('; '));
  console.log(JSON.stringify(ledgers, null, 2));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    main();
  } catch (error) {
    console.error(`[Control Plane Ledgers] ${error.message}`);
    process.exitCode = 1;
  }
}
