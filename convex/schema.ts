import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const activeDisabled = v.union(v.literal('active'), v.literal('disabled'));
const membershipStatus = v.union(v.literal('active'), v.literal('disabled'), v.literal('revoked'));
const resourceGrantStatus = v.union(v.literal('active'), v.literal('revoked'));
const clerkLifecycleType = v.union(
  v.literal('user.created'),
  v.literal('user.updated'),
  v.literal('user.deleted'),
);
const estimateLineItem = v.object({
  description: v.string(),
  quantity: v.number(),
  unitPriceCents: v.number(),
  totalCents: v.number(),
});

export default defineSchema({
  users: defineTable({
    clerkSubject: v.string(),
    status: activeDisabled,
    displayName: v.optional(v.string()),
    primaryEmailAddress: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    disabledAt: v.optional(v.number()),
    lifecycleProvider: v.optional(v.literal('clerk')),
    lastLifecycleEventId: v.optional(v.string()),
    lastLifecycleEventType: v.optional(clerkLifecycleType),
    lastLifecycleOccurredAt: v.optional(v.number()),
    disabledSource: v.optional(
      v.union(v.literal('clerk'), v.literal('local'), v.literal('system')),
    ),
    disabledByEventId: v.optional(v.string()),
    disabledProviderOccurredAt: v.optional(v.number()),
  }).index('by_clerkSubject', ['clerkSubject']),

  companies: defineTable({
    name: v.string(),
    status: v.union(v.literal('active'), v.literal('archived')),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_status', ['status']),

  memberships: defineTable({
    userId: v.id('users'),
    companyId: v.id('companies'),
    role: v.union(v.literal('customer'), v.literal('staff'), v.literal('admin')),
    status: membershipStatus,
    admissionSource: v.union(v.literal('invitation'), v.literal('migration'), v.literal('system')),
    sourceInvitationId: v.optional(v.id('invitations')),
    invitedByUserId: v.optional(v.id('users')),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index('by_user_company', ['userId', 'companyId'])
    .index('by_user_status', ['userId', 'status'])
    .index('by_company_role', ['companyId', 'role']),

  invitations: defineTable({
    clerkInvitationId: v.string(),
    companyId: v.id('companies'),
    emailAddress: v.string(),
    role: v.union(v.literal('customer'), v.literal('staff'), v.literal('admin')),
    status: v.union(
      v.literal('pending'),
      v.literal('accepted'),
      v.literal('revoked'),
      v.literal('expired'),
    ),
    invitedByUserId: v.id('users'),
    acceptedByUserId: v.optional(v.id('users')),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastProviderEventId: v.optional(v.string()),
    lastProviderEventType: v.optional(
      v.union(v.literal('invitation.accepted'), v.literal('invitation.revoked')),
    ),
    lastProviderOccurredAt: v.optional(v.number()),
  })
    .index('by_clerkInvitationId', ['clerkInvitationId'])
    .index('by_emailAddress_status', ['emailAddress', 'status'])
    .index('by_company_status', ['companyId', 'status']),

  resourceGrants: defineTable({
    userId: v.id('users'),
    companyId: v.id('companies'),
    resourceType: v.union(v.literal('project'), v.literal('property')),
    resourceId: v.string(),
    role: v.optional(v.union(v.literal('viewer'), v.literal('editor'), v.literal('manager'))),
    permissions: v.array(v.string()),
    status: resourceGrantStatus,
    grantedByUserId: v.optional(v.id('users')),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index('by_user_resource', ['userId', 'resourceType', 'resourceId'])
    .index('by_company_resource', ['companyId', 'resourceType', 'resourceId']),

  leads: defineTable({
    migrationCanonicalId: v.optional(v.string()),
    migrationChecksum: v.optional(v.string()),
    canonicalId: v.optional(v.string()),
    sourceSystem: v.optional(v.string()),
    sourceId: v.optional(v.string()),
    sourceChecksum: v.optional(v.string()),
    companyId: v.optional(v.id('companies')),
    source: v.string(),
    status: v.union(v.literal('new'), v.literal('qualified'), v.literal('converted'), v.literal('closed')),
    idempotencyKey: v.optional(v.string()),
    submittedAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_migrationCanonicalId', ['migrationCanonicalId'])
    .index('by_canonicalId', ['canonicalId'])
    .index('by_sourceSystem_sourceId', ['sourceSystem', 'sourceId'])
    .index('by_company_status', ['companyId', 'status'])
    .index('by_idempotencyKey', ['idempotencyKey']),

  leadAssignments: defineTable({
    companyId: v.id('companies'),
    leadId: v.id('leads'),
    assigneeUserId: v.id('users'),
    status: v.union(
      v.literal('assigned'),
      v.literal('acknowledged'),
      v.literal('closed'),
    ),
    escalationStatus: v.union(
      v.literal('none'),
      v.literal('escalated'),
      v.literal('resolved'),
    ),
    routingVersion: v.literal('stable-hash-v1'),
    routingReason: v.string(),
    assignedAt: v.number(),
    firstResponseDueAt: v.number(),
    firstResponseAt: v.optional(v.number()),
    escalatedAt: v.optional(v.number()),
    requestId: v.string(),
    updatedAt: v.number(),
  })
    .index('by_lead', ['leadId'])
    .index('by_company_status_dueAt', [
      'companyId',
      'status',
      'firstResponseDueAt',
    ])
    .index('by_assignee_status', ['assigneeUserId', 'status']),

  contacts: defineTable({
    migrationCanonicalId: v.optional(v.string()),
    migrationChecksum: v.optional(v.string()),
    canonicalId: v.optional(v.string()),
    sourceSystem: v.optional(v.string()),
    sourceId: v.optional(v.string()),
    sourceChecksum: v.optional(v.string()),
    companyId: v.optional(v.id('companies')),
    clerkSubject: v.optional(v.string()),
    name: v.string(),
    displayName: v.optional(v.string()),
    emailAddress: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    status: v.union(v.literal('active'), v.literal('archived')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_migrationCanonicalId', ['migrationCanonicalId'])
    .index('by_canonicalId', ['canonicalId'])
    .index('by_sourceSystem_sourceId', ['sourceSystem', 'sourceId'])
    .index('by_company_status', ['companyId', 'status'])
    .index('by_clerkSubject', ['clerkSubject']),

  properties: defineTable({
    migrationCanonicalId: v.optional(v.string()),
    migrationChecksum: v.optional(v.string()),
    canonicalId: v.optional(v.string()),
    sourceSystem: v.optional(v.string()),
    sourceId: v.optional(v.string()),
    sourceChecksum: v.optional(v.string()),
    companyId: v.id('companies'),
    name: v.string(),
    status: v.union(v.literal('active'), v.literal('archived')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_migrationCanonicalId', ['migrationCanonicalId'])
    .index('by_canonicalId', ['canonicalId'])
    .index('by_sourceSystem_sourceId', ['sourceSystem', 'sourceId'])
    .index('by_company', ['companyId']),

  projects: defineTable({
    companyId: v.id('companies'),
    propertyId: v.optional(v.id('properties')),
    name: v.string(),
    status: v.union(v.literal('active'), v.literal('complete'), v.literal('archived')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_company_status', ['companyId', 'status'])
    .index('by_property', ['propertyId']),

  opportunities: defineTable({
    migrationCanonicalId: v.optional(v.string()),
    migrationChecksum: v.optional(v.string()),
    canonicalId: v.optional(v.string()),
    sourceSystem: v.optional(v.string()),
    sourceId: v.optional(v.string()),
    sourceChecksum: v.optional(v.string()),
    companyId: v.id('companies'),
    contactId: v.optional(v.id('contacts')),
    propertyId: v.optional(v.id('properties')),
    projectId: v.optional(v.id('projects')),
    name: v.string(),
    stage: v.union(
      v.literal('new'),
      v.literal('qualified'),
      v.literal('proposal'),
      v.literal('won'),
      v.literal('lost'),
    ),
    estimatedValueCents: v.optional(v.number()),
    amountCents: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_migrationCanonicalId', ['migrationCanonicalId'])
    .index('by_canonicalId', ['canonicalId'])
    .index('by_sourceSystem_sourceId', ['sourceSystem', 'sourceId'])
    .index('by_company_stage', ['companyId', 'stage'])
    .index('by_contact', ['contactId']),

  estimates: defineTable({
    companyId: v.id('companies'),
    opportunityId: v.id('opportunities'),
    title: v.string(),
    status: v.union(v.literal('draft'), v.literal('approved')),
    revision: v.number(),
    nextVersionNumber: v.number(),
    lineItems: v.array(estimateLineItem),
    subtotalCents: v.number(),
    discountCents: v.number(),
    taxCents: v.number(),
    totalCents: v.number(),
    assumptions: v.array(v.string()),
    latestApprovedVersionId: v.optional(v.id('estimateVersions')),
    approvedRevision: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_company', ['companyId'])
    .index('by_company_opportunity', ['companyId', 'opportunityId']),

  estimateVersions: defineTable({
    companyId: v.id('companies'),
    estimateId: v.id('estimates'),
    versionNumber: v.number(),
    status: v.literal('approved'),
    title: v.string(),
    lineItems: v.array(estimateLineItem),
    subtotalCents: v.number(),
    discountCents: v.number(),
    taxCents: v.number(),
    totalCents: v.number(),
    assumptions: v.array(v.string()),
    contentHash: v.string(),
    approvedByUserId: v.id('users'),
    approvedAt: v.number(),
    requestId: v.string(),
  })
    .index('by_estimate_versionNumber', ['estimateId', 'versionNumber'])
    .index('by_company_approvedAt', ['companyId', 'approvedAt']),

  appointments: defineTable({
    companyId: v.id('companies'),
    provider: v.literal('cal.com'),
    providerOrganizationId: v.string(),
    providerBookingUid: v.string(),
    providerBookingId: v.string(),
    providerEventTypeId: v.string(),
    title: v.string(),
    startsAt: v.number(),
    endsAt: v.number(),
    timeZone: v.string(),
    status: v.union(
      v.literal('scheduled'),
      v.literal('pending'),
      v.literal('cancelled'),
      v.literal('completed'),
      v.literal('rescheduled'),
    ),
    iCalUid: v.optional(v.string()),
    providerSequence: v.optional(v.number()),
    supersedesProviderBookingUid: v.optional(v.string()),
    supersededByProviderBookingUid: v.optional(v.string()),
    participantCount: v.number(),
    participantTimeZones: v.array(v.string()),
    stateHash: v.string(),
    lastSyncSource: v.union(
      v.literal('webhook'),
      v.literal('reconciliation'),
    ),
    lastProviderEventId: v.string(),
    lastPayloadHash: v.string(),
    lastProviderOccurredAt: v.number(),
    lastObservedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_company_provider_booking', ['companyId', 'provider', 'providerBookingUid'])
    .index('by_provider_organization_booking', ['provider', 'providerOrganizationId', 'providerBookingUid'])
    .index('by_company_supersedes_booking', ['companyId', 'provider', 'providerOrganizationId', 'supersedesProviderBookingUid'])
    .index('by_company_startsAt', ['companyId', 'startsAt'])
    .index('by_company_status', ['companyId', 'status']),

  calReconciliationJobs: defineTable({
    companyId: v.id('companies'),
    providerOrganizationId: v.string(),
    runId: v.string(),
    bookingStatus: v.union(
      v.literal('upcoming'),
      v.literal('recurring'),
      v.literal('past'),
      v.literal('cancelled'),
      v.literal('unconfirmed'),
    ),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('completed'),
      v.literal('failed'),
    ),
    cursor: v.optional(v.string()),
    pageNumber: v.number(),
    pageFailureCount: v.number(),
    leaseToken: v.optional(v.string()),
    leaseExpiresAt: v.optional(v.number()),
    nextAttemptAt: v.optional(v.number()),
    lastRequestId: v.optional(v.string()),
    totalApplied: v.number(),
    totalStale: v.number(),
    totalUnchanged: v.number(),
    totalAppointments: v.number(),
    totalPages: v.number(),
    startedAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_company_organization_run', ['companyId', 'providerOrganizationId', 'runId'])
    .index('by_status_nextAttemptAt', ['status', 'nextAttemptAt']),

  events: defineTable({
    eventId: v.string(),
    companyId: v.id('companies'),
    type: v.string(),
    aggregateType: v.string(),
    aggregateId: v.string(),
    payload: v.any(),
    requestHash: v.string(),
    occurredAt: v.number(),
  })
    .index('by_eventId', ['eventId'])
    .index('by_company_occurredAt', ['companyId', 'occurredAt'])
    .index('by_aggregate_occurredAt', ['aggregateType', 'aggregateId', 'occurredAt']),

  idempotencyKeys: defineTable({
    scope: v.string(),
    key: v.string(),
    companyId: v.id('companies'),
    aggregateType: v.string(),
    aggregateId: v.string(),
    requestHash: v.string(),
    status: v.union(v.literal('claimed'), v.literal('completed')),
    requestedAt: v.number(),
    result: v.optional(v.any()),
    resultHash: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  }).index('by_scope_key', ['scope', 'key']),

  webhookReceipts: defineTable({
    provider: v.string(),
    eventId: v.string(),
    companyId: v.optional(v.id('companies')),
    payloadHash: v.string(),
    verificationStatus: v.literal('verified'),
    processingStatus: v.union(v.literal('received'), v.literal('processing'), v.literal('succeeded'), v.literal('failed')),
    attemptCount: v.number(),
    leaseToken: v.optional(v.string()),
    leaseExpiresAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    receivedAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index('by_provider_eventId', ['provider', 'eventId'])
    .index('by_receivedAt', ['receivedAt']),

  auditFacts: defineTable({
    companyId: v.id('companies'),
    actorUserId: v.optional(v.id('users')),
    actorClerkSubject: v.optional(v.string()),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    requestId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    occurredAt: v.number(),
  })
    .index('by_company_occurredAt', ['companyId', 'occurredAt'])
    .index('by_entity_occurredAt', ['entityType', 'entityId', 'occurredAt']),

  migrationReconciliation: defineTable({
    runId: v.string(),
    canonicalId: v.string(),
    sourceSystem: v.string(),
    sourceId: v.string(),
    status: v.union(v.literal('pending'), v.literal('matched'), v.literal('conflict'), v.literal('verified')),
    details: v.optional(v.any()),
    checkedAt: v.number(),
  })
    .index('by_run_canonical_id', ['runId', 'canonicalId'])
    .index('by_run_status', ['runId', 'status']),
});
