import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import { internalMutation, internalQuery } from './_generated/server';
import { hashCanonicalContent } from './lib/events';

const reconciliationStatus = v.union(
  v.literal('pending'),
  v.literal('matched'),
  v.literal('conflict'),
  v.literal('verified'),
);
const targetEntity = v.union(
  v.literal('contacts'),
  v.literal('properties'),
  v.literal('leads'),
  v.literal('opportunities'),
);
const deploymentEnvironment = v.union(
  v.literal('development'),
  v.literal('preview'),
  v.literal('production'),
);
const reconciliationResult = v.object({
  outcome: v.union(v.literal('recorded'), v.literal('duplicate')),
  recordId: v.id('migrationReconciliation'),
});
const importResult = v.object({
  outcome: v.union(
    v.literal('imported'),
    v.literal('updated'),
    v.literal('verified-existing'),
    v.literal('duplicate'),
    v.literal('conflict'),
  ),
  recordId: v.id('migrationReconciliation'),
});

const contactPayload = v.object({
  companyId: v.optional(v.id('companies')),
  name: v.string(),
  displayName: v.optional(v.string()),
  emailAddress: v.optional(v.string()),
  phoneNumber: v.optional(v.string()),
  status: v.union(v.literal('active'), v.literal('archived')),
  createdAt: v.number(),
  updatedAt: v.number(),
});
const propertyPayload = v.object({
  companyId: v.id('companies'),
  name: v.string(),
  status: v.union(v.literal('active'), v.literal('archived')),
  createdAt: v.number(),
  updatedAt: v.number(),
});
const leadPayload = v.object({
  companyId: v.optional(v.id('companies')),
  source: v.string(),
  status: v.union(v.literal('new'), v.literal('qualified'), v.literal('converted'), v.literal('closed')),
  idempotencyKey: v.optional(v.string()),
  submittedAt: v.number(),
  updatedAt: v.number(),
});
const opportunityPayload = v.object({
  companyId: v.id('companies'),
  contactId: v.optional(v.id('contacts')),
  propertyId: v.optional(v.id('properties')),
  projectId: v.optional(v.id('projects')),
  name: v.string(),
  stage: v.union(v.literal('new'), v.literal('qualified'), v.literal('proposal'), v.literal('won'), v.literal('lost')),
  estimatedValueCents: v.optional(v.number()),
  amountCents: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});
const mappedOperation = v.union(
  v.object({ entity: v.literal('contacts'), canonicalId: v.string(), payload: contactPayload }),
  v.object({ entity: v.literal('properties'), canonicalId: v.string(), payload: propertyPayload }),
  v.object({ entity: v.literal('leads'), canonicalId: v.string(), payload: leadPayload }),
  v.object({ entity: v.literal('opportunities'), canonicalId: v.string(), payload: opportunityPayload }),
);
const opaqueCanonicalId = /^mig_[a-z0-9_-]+_[a-f0-9]{24}$/;

function requireImportText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function sameDetails(
  existing: { sourceSystem: string; sourceId: string; status: string; details?: unknown },
  expected: { sourceSystem: string; sourceId: string; status: string; details?: unknown },
): boolean {
  const left = existing.details as { sourceChecksum?: unknown; targetChecksum?: unknown; count?: unknown } | undefined;
  const right = expected.details as { sourceChecksum?: unknown; targetChecksum?: unknown; count?: unknown } | undefined;
  return existing.sourceSystem === expected.sourceSystem
    && existing.sourceId === expected.sourceId
    && existing.status === expected.status
    && left?.sourceChecksum === right?.sourceChecksum
    && left?.targetChecksum === right?.targetChecksum
    && left?.count === right?.count;
}

/**
 * Append one opaque reconciliation fact. `sourceId` must be a stable digest,
 * not an email, name, phone number, address, token, or other source PII.
 * The compound `by_run_canonical_id` index makes retries idempotent.
 */
export const recordReconciliation = internalMutation({
  args: {
    runId: v.string(),
    canonicalId: v.string(),
    sourceSystem: v.string(),
    sourceId: v.string(),
    status: reconciliationStatus,
    details: v.optional(v.object({ sourceChecksum: v.string(), targetChecksum: v.optional(v.string()), count: v.optional(v.number()) })),
  },
  returns: reconciliationResult,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('migrationReconciliation')
      .withIndex('by_run_canonical_id', (q) => q.eq('runId', args.runId).eq('canonicalId', args.canonicalId))
      .unique();
    if (existing) {
      if (!sameDetails(existing, args)) {
        throw new Error('Reconciliation key was reused with a different source, status, or checksum.');
      }
      return { outcome: 'duplicate' as const, recordId: existing._id };
    }

    const recordId = await ctx.db.insert('migrationReconciliation', { ...args, checkedAt: Date.now() });
    return { outcome: 'recorded' as const, recordId };
  },
});

/**
 * Applies one mapped CRM operation and its reconciliation fact in the same
 * transaction. The offline handoff checksum is recomputed before any write.
 */
export const importMappedRecord = internalMutation({
  args: {
    runId: v.string(),
    sourceSystem: v.union(v.literal('supabase'), v.literal('payload'), v.literal('directus')),
    sourceId: v.string(),
    checksum: v.string(),
    operation: mappedOperation,
  },
  returns: importResult,
  handler: async (ctx, args) => {
    const runId = requireImportText(args.runId, 'runId');
    const sourceId = requireImportText(args.sourceId, 'sourceId');
    const canonicalId = requireImportText(args.operation.canonicalId, 'canonicalId');
    if (!opaqueCanonicalId.test(sourceId) || !opaqueCanonicalId.test(canonicalId)) {
      throw new Error('Migration source and canonical IDs must be opaque stable IDs.');
    }
    const derivedChecksum = await hashCanonicalContent(args.operation);
    if (args.checksum !== derivedChecksum) throw new Error('Import operation checksum does not match its canonical content.');

    const findExisting = () => {
      switch (args.operation.entity) {
        case 'contacts':
          return ctx.db.query('contacts').withIndex('by_migrationCanonicalId', (q) => q.eq('migrationCanonicalId', canonicalId)).unique();
        case 'properties':
          return ctx.db.query('properties').withIndex('by_migrationCanonicalId', (q) => q.eq('migrationCanonicalId', canonicalId)).unique();
        case 'leads':
          return ctx.db.query('leads').withIndex('by_migrationCanonicalId', (q) => q.eq('migrationCanonicalId', canonicalId)).unique();
        case 'opportunities':
          return ctx.db.query('opportunities').withIndex('by_migrationCanonicalId', (q) => q.eq('migrationCanonicalId', canonicalId)).unique();
      }
    };
    const existing = await findExisting();
    const reconciliation = await ctx.db
      .query('migrationReconciliation')
      .withIndex('by_run_canonical_id', (q) => q.eq('runId', runId).eq('canonicalId', canonicalId))
      .unique();
    if (reconciliation) {
      const expectedStatus = reconciliation.status === 'conflict' ? 'conflict' : 'verified';
      const expectedDetails = {
        sourceChecksum: derivedChecksum,
        targetChecksum: expectedStatus === 'verified' ? derivedChecksum : existing?.migrationChecksum,
        count: 1,
      };
      if (!sameDetails(reconciliation, {
        sourceSystem: args.sourceSystem,
        sourceId,
        status: expectedStatus,
        details: expectedDetails,
      }) || (expectedStatus === 'verified' && (!existing || existing.migrationChecksum !== derivedChecksum))) {
        throw new Error('Import reconciliation key was reused with conflicting content.');
      }
      return { outcome: expectedStatus === 'conflict' ? 'conflict' as const : 'duplicate' as const, recordId: reconciliation._id };
    }
    const provenanceConflict = existing && (
      typeof existing.migrationChecksum !== 'string'
      || existing.sourceSystem !== args.sourceSystem
      || existing.sourceId !== sourceId
    );
    if (provenanceConflict) {
      const recordId = await ctx.db.insert('migrationReconciliation', {
        runId,
        canonicalId,
        sourceSystem: args.sourceSystem,
        sourceId,
        status: 'conflict',
        details: {
          sourceChecksum: derivedChecksum,
          ...(typeof existing.migrationChecksum === 'string' ? { targetChecksum: existing.migrationChecksum } : {}),
          count: 1,
        },
        checkedAt: Date.now(),
      });
      return { outcome: 'conflict' as const, recordId };
    }

    const provenance = {
      migrationCanonicalId: canonicalId,
      migrationChecksum: derivedChecksum,
      canonicalId,
      sourceSystem: args.sourceSystem,
      sourceId,
      sourceChecksum: derivedChecksum,
    };
    if (!existing) {
      switch (args.operation.entity) {
        case 'contacts':
          await ctx.db.insert('contacts', { ...args.operation.payload, ...provenance });
          break;
        case 'properties':
          await ctx.db.insert('properties', { ...args.operation.payload, ...provenance });
          break;
        case 'leads':
          await ctx.db.insert('leads', { ...args.operation.payload, ...provenance });
          break;
        case 'opportunities':
          await ctx.db.insert('opportunities', { ...args.operation.payload, ...provenance });
          break;
      }
    } else if (existing.migrationChecksum !== derivedChecksum) {
      switch (args.operation.entity) {
        case 'contacts':
        case 'properties':
        case 'leads':
        case 'opportunities':
          await ctx.db.patch(existing._id, { ...args.operation.payload, ...provenance });
          break;
      }
    }

    const recordId = await ctx.db.insert('migrationReconciliation', {
      runId,
      canonicalId,
      sourceSystem: args.sourceSystem,
      sourceId,
      status: 'verified',
      details: { sourceChecksum: derivedChecksum, targetChecksum: derivedChecksum, count: 1 },
      checkedAt: Date.now(),
    });
    return {
      outcome: !existing ? 'imported' as const
        : existing.migrationChecksum === derivedChecksum ? 'verified-existing' as const
          : 'updated' as const,
      recordId,
    };
  },
});

export const listRunReconciliation = internalQuery({
  args: { runId: v.string(), limit: v.optional(v.number()) },
  returns: v.array(v.object({
    canonicalId: v.string(),
    sourceSystem: v.string(),
    sourceId: v.string(),
    status: reconciliationStatus,
    details: v.optional(v.any()),
    checkedAt: v.number(),
  })),
  handler: async (ctx, { runId, limit }) => {
    const boundedLimit = Math.max(1, Math.min(500, Math.floor(limit ?? 100)));
    const rows = await ctx.db
      .query('migrationReconciliation')
      .withIndex('by_run_canonical_id', (q) => q.eq('runId', runId))
      .take(boundedLimit);
    return rows.map(({ canonicalId, sourceSystem, sourceId, status, details, checkedAt }) => ({
      canonicalId,
      sourceSystem,
      sourceId,
      status,
      details,
      checkedAt,
    }));
  },
});

/**
 * Bounded operator-only inventory. It emits no CRM payload or personal data.
 * Continue with `nextAfter` until it is null.
 */
export const targetInventoryPage = internalQuery({
  args: {
    entity: targetEntity,
    after: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    items: v.array(v.object({
      entity: targetEntity,
      canonicalId: v.string(),
      checksum: v.string(),
      status: v.union(v.literal('verified'), v.literal('conflict')),
    })),
    nextAfter: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(200, Math.floor(args.limit ?? 100)));
    const read = () => {
      switch (args.entity) {
        case 'contacts':
          return ctx.db.query('contacts').withIndex('by_migrationCanonicalId', (q) => args.after
            ? q.gt('migrationCanonicalId', args.after)
            : q.gte('migrationCanonicalId', 'mig_')).take(limit + 1);
        case 'properties':
          return ctx.db.query('properties').withIndex('by_migrationCanonicalId', (q) => args.after
            ? q.gt('migrationCanonicalId', args.after)
            : q.gte('migrationCanonicalId', 'mig_')).take(limit + 1);
        case 'leads':
          return ctx.db.query('leads').withIndex('by_migrationCanonicalId', (q) => args.after
            ? q.gt('migrationCanonicalId', args.after)
            : q.gte('migrationCanonicalId', 'mig_')).take(limit + 1);
        case 'opportunities':
          return ctx.db.query('opportunities').withIndex('by_migrationCanonicalId', (q) => args.after
            ? q.gt('migrationCanonicalId', args.after)
            : q.gte('migrationCanonicalId', 'mig_')).take(limit + 1);
      }
    };
    const rows = await read();
    const page = rows.slice(0, limit);
    const items = await Promise.all(page.map(async (row) => {
      const canonicalId = row.migrationCanonicalId!;
      let operation;
      switch (args.entity) {
        case 'contacts': {
          const contact = row as Doc<'contacts'>;
          operation = {
            entity: 'contacts' as const,
            canonicalId,
            payload: {
              ...(contact.companyId ? { companyId: contact.companyId } : {}),
              name: contact.name,
              ...(contact.displayName ? { displayName: contact.displayName } : {}),
              ...(contact.emailAddress ? { emailAddress: contact.emailAddress } : {}),
              ...(contact.phoneNumber ? { phoneNumber: contact.phoneNumber } : {}),
              status: contact.status,
              createdAt: contact.createdAt,
              updatedAt: contact.updatedAt,
            },
          };
          break;
        }
        case 'properties': {
          const property = row as Doc<'properties'>;
          operation = {
            entity: 'properties' as const,
            canonicalId,
            payload: {
              companyId: property.companyId,
              name: property.name,
              status: property.status,
              createdAt: property.createdAt,
              updatedAt: property.updatedAt,
            },
          };
          break;
        }
        case 'leads': {
          const lead = row as Doc<'leads'>;
          operation = {
            entity: 'leads' as const,
            canonicalId,
            payload: {
              ...(lead.companyId ? { companyId: lead.companyId } : {}),
              source: lead.source,
              status: lead.status,
              ...(lead.idempotencyKey ? { idempotencyKey: lead.idempotencyKey } : {}),
              submittedAt: lead.submittedAt,
              updatedAt: lead.updatedAt,
            },
          };
          break;
        }
        case 'opportunities': {
          const opportunity = row as Doc<'opportunities'>;
          operation = {
            entity: 'opportunities' as const,
            canonicalId,
            payload: {
              companyId: opportunity.companyId,
              ...(opportunity.contactId ? { contactId: opportunity.contactId } : {}),
              ...(opportunity.propertyId ? { propertyId: opportunity.propertyId } : {}),
              ...(opportunity.projectId ? { projectId: opportunity.projectId } : {}),
              name: opportunity.name,
              stage: opportunity.stage,
              ...(opportunity.estimatedValueCents !== undefined ? { estimatedValueCents: opportunity.estimatedValueCents } : {}),
              ...(opportunity.amountCents !== undefined ? { amountCents: opportunity.amountCents } : {}),
              createdAt: opportunity.createdAt,
              updatedAt: opportunity.updatedAt,
            },
          };
          break;
        }
      }
      const checksum = await hashCanonicalContent(operation);
      const sourceSystem = row.sourceSystem;
      const provenanceAgrees = ['supabase', 'payload', 'directus'].includes(sourceSystem ?? '')
        && row.canonicalId === canonicalId
        && row.sourceId === canonicalId
        && canonicalId.startsWith(`mig_${sourceSystem}_`)
        && row.sourceChecksum === checksum
        && row.migrationChecksum === checksum;
      return {
        entity: args.entity,
        canonicalId,
        checksum,
        status: provenanceAgrees ? 'verified' as const : 'conflict' as const,
      };
    }));
    return {
      items,
      nextAfter: rows.length > limit ? items[items.length - 1]?.canonicalId ?? null : null,
    };
  },
});

/** Fail-closed preflight used before any operator mutation or inventory export. */
export const deploymentIdentity = internalQuery({
  args: {},
  returns: v.object({ environment: deploymentEnvironment }),
  handler: async () => {
    const appEnvironment = process.env.NEXT_PUBLIC_APP_ENV;
    const issuerEnvironment = process.env.CLERK_JWT_ISSUER_ENV;
    if (!['development', 'preview', 'production'].includes(appEnvironment ?? '')
      || appEnvironment !== issuerEnvironment) {
      throw new Error('Convex deployment environment identity is missing or inconsistent.');
    }
    return { environment: appEnvironment as 'development' | 'preview' | 'production' };
  },
});
