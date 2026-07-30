import { createClerkClient } from '@clerk/backend';
import { verifyWebhook } from '@clerk/backend/webhooks';
import { httpRouter } from 'convex/server';
import { ConvexError, type GenericId } from 'convex/values';

import { internal } from './_generated/api';
import { httpAction } from './_generated/server';
import {
  CalConfigurationError,
  CalContractError,
  buildCalWebhookEventId,
  calReconciliationStatuses,
  calWebhookContractVersion,
  calWebhookPayloadVersion,
  fetchCalOrganizationBookings,
  hasConfiguredCalWebhookSecret,
  listCalTenantMappings,
  parseCalWebhookEnvelope,
  resolveCalTenantCompanyId,
  verifyCalWebhookSignature,
} from './lib/cal';

export {
  buildCalWebhookEventId,
  calReconciliationStatuses,
  calWebhookPayloadVersion,
  fetchCalOrganizationBookings,
  hasConfiguredCalWebhookSecret,
  parseCalWebhookEnvelope,
  resolveCalTenantCompanyId,
  verifyCalWebhookSignature,
};

type ClerkUserData = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  primary_email_address_id?: string | null;
  email_addresses?: Array<{ id: string; email_address: string }>;
};

type ClerkInvitationData = {
  id?: string;
  email_address?: string;
};

type UserLifecycleType = 'user.created' | 'user.updated' | 'user.deleted';
type InvitationLifecycleType = 'invitation.accepted' | 'invitation.revoked';

const clerkWebhookSecretPattern =
  /^whsec_[A-Za-z0-9+/=_-]{24,}$/;
export const clerkWebhookContractVersion =
  'skys-limit-clerk-webhook-v1';

export function hasConfiguredClerkWebhookSecret(
  value: string | undefined,
): value is string {
  return Boolean(value && clerkWebhookSecretPattern.test(value));
}

function clerkWebhookResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: {
      'x-skys-limit-webhook-contract': clerkWebhookContractVersion,
    },
  });
}

function isUserLifecycleType(value: string): value is UserLifecycleType {
  return value === 'user.created' || value === 'user.updated' || value === 'user.deleted';
}

function isInvitationLifecycleType(value: string): value is InvitationLifecycleType {
  return value === 'invitation.accepted' || value === 'invitation.revoked';
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function calWebhookResponse(
  body: string,
  status: number,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'x-skys-limit-webhook-contract': calWebhookContractVersion,
      ...extraHeaders,
    },
  });
}

function verifyExactConfiguredSecret(
  expected: string | undefined,
  provided: string | null,
): 'ok' | 'not-configured' | 'unauthorized' {
  if (!hasConfiguredCalWebhookSecret(expected)) return 'not-configured';
  if (!provided || provided.length !== expected.length) return 'unauthorized';
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ provided.charCodeAt(index);
  }
  return difference === 0 ? 'ok' : 'unauthorized';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

type CalMutationContext = {
  runMutation(
    mutation: unknown,
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
};

type CalEnvironment = {
  CAL_WEBHOOK_SIGNING_SECRET?: string;
  CAL_TENANT_MAP_JSON?: string;
  CAL_RECONCILIATION_SECRET?: string;
};

function processCalEnvironment(): CalEnvironment {
  return {
    CAL_WEBHOOK_SIGNING_SECRET:
      process.env.CAL_WEBHOOK_SIGNING_SECRET,
    CAL_TENANT_MAP_JSON: process.env.CAL_TENANT_MAP_JSON,
    CAL_RECONCILIATION_SECRET:
      process.env.CAL_RECONCILIATION_SECRET,
  };
}

const clerkLifecycle = httpAction(async (ctx, request) => {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!hasConfiguredClerkWebhookSecret(signingSecret)) {
    return clerkWebhookResponse('Webhook not configured', 503);
  }

  const rawBody = await request.text();
  let event;
  try {
    event = await verifyWebhook(
      new Request(request.url, { method: request.method, headers: request.headers, body: rawBody }),
      { signingSecret },
    );
  } catch {
    return clerkWebhookResponse('Invalid signature', 400);
  }

  // Clerk documents instance invitation events even though some SDK webhook
  // unions lag those event names, so narrow the verified envelope explicitly.
  const eventType: string = event.type;
  const isUserLifecycle = isUserLifecycleType(eventType);
  const isInvitationLifecycle = isInvitationLifecycleType(eventType);
  if (!isUserLifecycle && !isInvitationLifecycle) {
    return new Response('Ignored', { status: 202 });
  }
  const providerOccurredAt = (event as { timestamp?: unknown }).timestamp;
  if (
    typeof providerOccurredAt !== 'number'
    || !Number.isFinite(providerOccurredAt)
    || providerOccurredAt < 0
  ) {
    return new Response('Missing Clerk event timestamp', { status: 400 });
  }
  const eventId = request.headers.get('svix-id') ?? (await sha256(rawBody));
  const payloadHash = await sha256(rawBody);
  const receivedAt = Date.now();

  if (isInvitationLifecycle) {
    const data = event.data as unknown as ClerkInvitationData;
    const clerkInvitationId = data.id?.trim();
    const emailAddress = data.email_address?.trim().toLowerCase();
    if (!clerkInvitationId || !emailAddress) {
      return new Response('Missing Clerk invitation identity', { status: 400 });
    }
    let acceptedClerkSubject: string | undefined;
    if (eventType === 'invitation.accepted') {
      const secretKey = process.env.CLERK_SECRET_KEY;
      if (!secretKey) {
        return new Response('Clerk identity lookup is not configured', { status: 503 });
      }
      const clerk = createClerkClient({ secretKey });
      const users = await clerk.users.getUserList({
        emailAddress: [emailAddress],
        limit: 2,
      });
      if (users.data.length !== 1) {
        return new Response('Accepted Clerk user is not uniquely resolvable', { status: 409 });
      }
      acceptedClerkSubject = users.data[0].id;
    }
    await ctx.runMutation(internal.invitationsInternal.applyVerifiedClerkLifecycle, {
      eventId,
      payloadHash,
      type: eventType,
      clerkInvitationId,
      emailAddress,
      acceptedClerkSubject,
      providerOccurredAt,
      receivedAt,
    });
    return new Response('Accepted', { status: 200 });
  }

  const data = event.data as unknown as ClerkUserData;
  const clerkSubject = data.id?.trim();
  if (!clerkSubject) return new Response('Missing Clerk user ID', { status: 400 });
  const primaryEmailAddress = data.email_addresses
    ?.find((email) => email.id === data.primary_email_address_id)
    ?.email_address.trim()
    .toLowerCase();
  const displayName = [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || undefined;

  await ctx.runMutation(internal.users.applyVerifiedClerkLifecycle, {
    eventId,
    payloadHash,
    type: eventType,
    clerkSubject,
    primaryEmailAddress,
    displayName,
    providerOccurredAt,
    receivedAt,
  });
  return new Response('Accepted', { status: 200 });
});

export async function handleCalWebhookRequest(
  ctx: CalMutationContext,
  request: Request,
  environment: CalEnvironment = processCalEnvironment(),
  now: () => number = Date.now,
): Promise<Response> {
  const signingSecret = environment.CAL_WEBHOOK_SIGNING_SECRET;
  if (!hasConfiguredCalWebhookSecret(signingSecret)) {
    return calWebhookResponse('Webhook not configured', 503);
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-cal-signature-256');
  if (!await verifyCalWebhookSignature(signingSecret, signature, rawBody)) {
    return calWebhookResponse('Invalid signature', 401);
  }
  if (
    request.headers.get('x-cal-webhook-version')
    !== calWebhookPayloadVersion
  ) {
    return calWebhookResponse('Unsupported Cal webhook version', 400);
  }

  try {
    const appointment = parseCalWebhookEnvelope(rawBody);
    const companyId = resolveCalTenantCompanyId(
      environment.CAL_TENANT_MAP_JSON,
      appointment.providerOrganizationId,
    ) as GenericId<'companies'>;
    const digest = await sha256(rawBody);
    const result = await ctx.runMutation(
      internal.appointments.applyVerifiedCalWebhook,
      {
        companyId,
        eventId: buildCalWebhookEventId(appointment),
        payloadHash: `sha256:${digest}`,
        receivedAt: now(),
        appointment,
      },
    );
    if (result.ok !== true) {
      throw new Error('Cal webhook mutation returned an invalid result.');
    }
    return calWebhookResponse(
      JSON.stringify({
        accepted: true,
        duplicate: result.duplicate,
        stale: result.stale,
      }),
      200,
      { 'Content-Type': 'application/json' },
    );
  } catch (error) {
    if (error instanceof CalConfigurationError) {
      return calWebhookResponse('Webhook tenant mapping is not configured', 503);
    }
    if (error instanceof CalContractError) {
      return calWebhookResponse('Invalid Cal webhook payload', 400);
    }
    if (
      error instanceof ConvexError
      && isRecord(error.data)
      && error.data.code === 'conflicting_webhook_identity'
    ) {
      return calWebhookResponse('Conflicting Cal webhook identity', 409);
    }
    throw error;
  }
}

const calWebhook = httpAction(async (ctx, request) =>
  handleCalWebhookRequest(
    ctx as unknown as CalMutationContext,
    request,
  ));

export async function handleCalReconciliationRequest(
  ctx: CalMutationContext,
  request: Request,
  environment: CalEnvironment = processCalEnvironment(),
  now: () => number = Date.now,
): Promise<Response> {
  const authentication = verifyExactConfiguredSecret(
    environment.CAL_RECONCILIATION_SECRET,
    request.headers.get('x-ops-secret'),
  );
  if (authentication === 'not-configured') {
    return calWebhookResponse('Reconciliation not configured', 503);
  }
  if (authentication !== 'ok') {
    return calWebhookResponse('Unauthorized', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return calWebhookResponse('Invalid reconciliation payload', 400);
  }
  if (
    !isRecord(body)
    || typeof body.runId !== 'string'
    || !body.runId.trim()
    || body.runId.length > 200
  ) {
    return calWebhookResponse('Invalid reconciliation payload', 400);
  }
  const runId = body.runId.trim();

  try {
    const targets = listCalTenantMappings(
      environment.CAL_TENANT_MAP_JSON,
    );
    const startedAt = now();
    const attempts = await Promise.allSettled(targets.map((target) =>
      ctx.runMutation(
        internal.appointments.startCalReconciliation,
        {
          companyId: target.companyId as GenericId<'companies'>,
          providerOrganizationId: target.providerOrganizationId,
          runId,
          now: startedAt,
        },
      )));
    const results = attempts.flatMap((attempt) =>
      attempt.status === 'fulfilled' ? [attempt.value] : []);
    const failed = attempts.length - results.length;
    if (failed > 0) {
      return calWebhookResponse(
        JSON.stringify({
          accepted: false,
          jobs: results.length,
          failed,
        }),
        503,
        { 'Content-Type': 'application/json' },
      );
    }
    return calWebhookResponse(
      JSON.stringify({
        accepted: true,
        jobs: results.length,
        created: results.filter((result) => result.created === true).length,
      }),
      202,
      { 'Content-Type': 'application/json' },
    );
  } catch (error) {
    if (error instanceof CalConfigurationError) {
      return calWebhookResponse('Reconciliation not configured', 503);
    }
    if (error instanceof CalContractError) {
      return calWebhookResponse('Cal reconciliation failed', 502);
    }
    throw error;
  }
}

const calReconciliation = httpAction(async (ctx, request) =>
  handleCalReconciliationRequest(
    ctx as unknown as CalMutationContext,
    request,
  ));

const http = httpRouter();
http.route({ path: '/clerk/lifecycle', method: 'POST', handler: clerkLifecycle });
http.route({ path: '/cal/webhook', method: 'POST', handler: calWebhook });
http.route({
  path: '/cal/reconciliation',
  method: 'POST',
  handler: calReconciliation,
});

export default http;
